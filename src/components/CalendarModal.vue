<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contact'
import { getStoredFbParams } from '@/utils/fbclid'
import { sendCapiEvent } from '@/utils/capi'
import { GHL_QUALIFY_WEBHOOK, postToWebhook } from '@/config/alco'
import {
  NURTURE_TAG,
  QUALIFIED_STATUS,
  QUALIFIED_TAG,
  QUESTIONS,
  emptyAnswers,
  labelFor,
  qualifies,
  type Answers,
} from '@/utils/qualification'

const contactStore = useContactStore()

const props = defineProps<{ open: boolean; nombre: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'done'): void }>()

const router = useRouter()
const submitting = ref(false)
const touched = ref(false)

// ── Wizard paso a paso: una pregunta por paso + paso final de texto ─────────
const step = ref(1)
const TOTAL_STEPS = QUESTIONS.length + 1
const modalEl = ref<HTMLElement | null>(null)
let advanceTimer: ReturnType<typeof setTimeout> | null = null

const scrollModalTop = () => {
  modalEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const answers = ref<Answers>(emptyAnswers())
const objetivo = ref('')
const consent = ref(false)

const pick = (key: keyof Answers, value: string) => {
  answers.value[key] = value
  if (advanceTimer) clearTimeout(advanceTimer)
  advanceTimer = setTimeout(() => {
    if (step.value < TOTAL_STEPS) {
      step.value += 1
      scrollModalTop()
    }
  }, 280)
}

const prevStep = () => {
  if (step.value <= 1) return
  if (advanceTimer) clearTimeout(advanceTimer)
  step.value -= 1
  scrollModalTop()
}

const nextStep = () => {
  step.value += 1
  scrollModalTop()
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const MIN_WORDS = 10

const currentQuestion = () => QUESTIONS[step.value - 1]
const currentStepHasValue = () => {
  const q = currentQuestion()
  return q ? !!answers.value[q.key] : false
}

const isValid = () =>
  QUESTIONS.every((q) => !!answers.value[q.key]) &&
  wordCount(objetivo.value) >= MIN_WORDS &&
  consent.value

const IS_DEV = window.location.hostname === 'localhost'

const handleSubmit = async () => {
  touched.value = true
  if (!isValid()) return
  submitting.value = true

  const contact = contactStore.get()
  const a = answers.value
  const califica = qualifies(a)
  const scheduleEventId = `schedule_${Date.now()}_${Math.random().toString(36).slice(2)}`

  const etiquetas = [
    'funnel-alco',
    'step-2-cualificacion',
    califica ? 'califica' : 'no-califica',
    califica ? QUALIFIED_TAG : NURTURE_TAG,
    ...QUESTIONS.map((q) => `${q.tagPrefix}-${a[q.key]}`),
  ]

  const nota = `${califica ? '✅ LEAD CALIFICADO' : '❌ NO CALIFICA'} — ALCO Funnel (negocio de fumigación con drones)
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${contact.nombre} ${contact.apellido}
🏙️ Ciudad: ${contact.negocio || '—'}
📧 ${contact.email}
📱 ${contact.telefono}
━━━━━━━━━━━━━━━━━━━━━━━━
${QUESTIONS.map((q) => `${q.noteLabel}: ${labelFor(q.key, a[q.key])}`).join('\n')}
🎯 Qué quiere lograr: ${objetivo.value}
━━━━━━━━━━━━━━━━━━━━━━━━
📊 Resultado: ${califica ? '🟢 AGENDA REUNIÓN' : '🔴 NUTRICIÓN'}
🕐 ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
🔑 event_id: ${scheduleEventId}`

  const payload = {
    nombre: contact.nombre || props.nombre,
    apellido: contact.apellido,
    ciudad: contact.negocio,
    email: contact.email,
    telefono: contact.telefono,
    ...a,
    // Versión legible de cada respuesta: es la que se mapea en los campos de GHL
    ...Object.fromEntries(QUESTIONS.map((q) => [`${q.key}_label`, labelFor(q.key, a[q.key])])),
    objetivo: objetivo.value,
    califica,
    qualification_status: califica ? QUALIFIED_STATUS : 'nurture',
    event_name: califica ? 'Lead' : 'QualificationCompleted',
    event_id: scheduleEventId,
    resultado: califica ? 'AGENDA' : 'NUTRICION',
    etiquetas,
    nota,
    timestamp: new Date().toISOString(),
    ...getStoredFbParams(),
  }
  if (IS_DEV) console.info('[ALCO Calificación]', payload)

  await postToWebhook(GHL_QUALIFY_WEBHOOK, payload)

  if (califica) {
    const customData = {
      content_name: QUALIFIED_TAG,
      perfil: a.perfil,
      zona: a.zona,
      inversion: a.inversion,
    }
    ;(window as any).fbq?.('track', 'Lead', customData, { eventID: scheduleEventId })
    sendCapiEvent('Lead', scheduleEventId, { email: contact.email, phone: contact.telefono }, customData)
  }

  localStorage.setItem(
    'alco_qualification',
    JSON.stringify({ ...a, califica, timestamp: Date.now() }),
  )

  submitting.value = false
  emit('close')
  if (califica) {
    router.push('/agendar')
  } else {
    if (!IS_DEV) localStorage.setItem('alco_disq_at', String(Date.now()))
    router.push('/sin-espacio')
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (advanceTimer) clearTimeout(advanceTimer)
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      step.value = 1
      touched.value = false
      submitting.value = false
      answers.value = emptyAnswers()
      objetivo.value = ''
      consent.value = false
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="cal-fade">
      <div
        v-if="props.open"
        class="cal-overlay"
        @click.self="$emit('close')"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cal-title"
      >
        <div ref="modalEl" class="cal-modal">
          <button class="cal-close" @click="$emit('close')" aria-label="Cerrar">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- ── CALIFICACIÓN ──────────────────────────────── -->
          <p class="cal-eyebrow">Paso final</p>
          <h2 id="cal-title" class="cal-title">
            Cuéntanos de<br />
            <span class="cal-accent">tu caso</span>
          </h2>
          <p class="cal-subtitle">Una pregunta a la vez. Te toma 60 segundos.</p>

          <!-- ── Progreso ─────────────────────────────────────── -->
          <div class="cal-progress">
            <p class="cal-progress__label">Pregunta {{ step }} de {{ TOTAL_STEPS }}</p>
            <div
              class="cal-progress__track"
              role="progressbar"
              :aria-valuenow="step"
              aria-valuemin="1"
              :aria-valuemax="TOTAL_STEPS"
            >
              <div
                class="cal-progress__fill"
                :style="{ width: `${(step / TOTAL_STEPS) * 100}%` }"
              />
            </div>
          </div>

          <form class="cal-form" @submit.prevent="handleSubmit" novalidate>
            <Transition name="cal-step" mode="out-in">
              <!-- Pasos de opción única (QUESTIONS en utils/qualification.ts) -->
              <fieldset
                v-if="step < TOTAL_STEPS"
                :key="`q${step}`"
                class="cal-fieldset"
              >
                <legend class="cal-legend">
                  <span class="cal-q-num">{{ String(step).padStart(2, '0') }}</span>
                  {{ QUESTIONS[step - 1]!.title }}
                </legend>
                <div class="cal-options">
                  <label
                    v-for="opt in QUESTIONS[step - 1]!.options"
                    :key="opt.value"
                    class="cal-option"
                    :class="{ selected: answers[QUESTIONS[step - 1]!.key] === opt.value }"
                  >
                    <input
                      type="radio"
                      :name="QUESTIONS[step - 1]!.key"
                      :value="opt.value"
                      :checked="answers[QUESTIONS[step - 1]!.key] === opt.value"
                      @change="pick(QUESTIONS[step - 1]!.key, opt.value)"
                      hidden
                    />
                    <span class="cal-option__radio" aria-hidden="true" />
                    <span class="cal-option__label">{{ opt.label }}</span>
                  </label>
                </div>
              </fieldset>

              <!-- Paso final: qué quiere lograr + consentimiento -->
              <fieldset
                v-else
                key="q-final"
                class="cal-fieldset"
                :class="{ 'has-error': touched && wordCount(objetivo) < MIN_WORDS }"
              >
                <legend class="cal-legend">
                  <span class="cal-q-num">{{ String(TOTAL_STEPS).padStart(2, '0') }}</span>
                  ¿Qué quieres lograr con tu negocio de fumigación?
                </legend>
                <div class="cal-textarea-wrap">
                  <textarea
                    v-model="objetivo"
                    class="cal-textarea"
                    :class="{ error: touched && wordCount(objetivo) < MIN_WORDS }"
                    placeholder="Por ejemplo: quiero dar servicio a fincas de banano en mi zona y recuperar la inversión del dron en el primer año..."
                    rows="4"
                    maxlength="1000"
                  />
                  <div class="cal-textarea-footer">
                    <span v-if="touched && wordCount(objetivo) < MIN_WORDS" class="cal-error">
                      Escribe al menos {{ MIN_WORDS }} palabras (llevas {{ wordCount(objetivo) }})
                    </span>
                    <span v-else class="cal-word-hint">
                      {{ wordCount(objetivo) }} palabra{{ wordCount(objetivo) !== 1 ? 's' : '' }}
                      <span v-if="wordCount(objetivo) >= MIN_WORDS" class="cal-word-ok">
                        <i class="fa-solid fa-circle-check" />
                      </span>
                    </span>
                  </div>
                </div>

                <!-- Consent -->
                <label class="cal-consent" :class="{ 'has-error': touched && !consent }">
                  <input type="checkbox" v-model="consent" hidden />
                  <span class="cal-consent__box" :class="{ checked: consent }" aria-hidden="true">
                    <svg
                      v-if="consent"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span class="cal-consent__text">
                    Acepto que ALCO me contacte para ayudarme a armar mi negocio y acepto su
                    <RouterLink to="/politicas-privacidad" target="_blank" class="cal-link"
                      >política de privacidad</RouterLink
                    >.
                  </span>
                </label>
              </fieldset>
            </Transition>

            <!-- ── Navegación ──────────────────────────────────── -->
            <div class="cal-nav">
              <div class="cal-nav-row">
                <button
                  type="button"
                  class="cal-back"
                  @click="prevStep"
                  :class="{ invisible: step <= 1 }"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Atrás
                </button>

                <button
                  v-if="step < TOTAL_STEPS && currentStepHasValue()"
                  type="button"
                  class="cal-next"
                  @click="nextStep"
                >
                  Siguiente
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <button
                v-if="step === TOTAL_STEPS"
                class="cal-btn"
                type="submit"
                :disabled="submitting"
              >
                <svg
                  v-if="submitting"
                  class="cal-spinner"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <template v-else>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </template>
                {{ submitting ? 'Verificando...' : 'VER HORARIOS DISPONIBLES' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

$bg: #ffffff;
$bg-alt: #f2f5f8;
$border: rgba(11, 31, 51, 0.1);
$text-muted: rgba(11, 31, 51, 0.5);
$text-body: rgba(11, 31, 51, 0.72);

// ── Overlay ──────────────────────────────────────────────────────────────────
.cal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(11, 31, 51, 0.5);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
.cal-modal {
  position: relative;
  width: 100%;
  max-width: 500px;
  background: $bg;
  border: 1px solid $border;
  border-radius: 24px;
  padding: 48px 36px 40px;
  box-shadow: 0 40px 100px rgba(11, 31, 51, 0.28);
  max-height: 92vh;
  overflow-y: auto;

  @media (max-width: 540px) {
    padding: 44px 20px 36px;
    border-radius: 20px;
  }
}

.cal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid $border;
  background: $bg-alt;
  color: $text-muted;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, color 0.2s;

  &:hover {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.4);
    color: colors.$ALCO-PRIMARY;
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
.cal-eyebrow {
  font-family: fonts.$font-accent;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: colors.$ALCO-PRIMARY;
  margin: 0 0 10px;
}

.cal-title {
  font-family: fonts.$font-principal;
  font-size: clamp(1.5rem, 3.5vw, 1.9rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: colors.$ALCO-DARK;
  margin: 0 0 8px;
}

.cal-accent {
  color: colors.$ALCO-PRIMARY;
}

.cal-subtitle {
  font-family: fonts.$font-secondary;
  font-size: 0.86rem;
  color: $text-muted;
  margin: 0 0 28px;
}

// ── Form ──────────────────────────────────────────────────────────────────────
.cal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cal-fieldset {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cal-legend {
  font-family: fonts.$font-interface;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(11, 31, 51, 0.75);
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.cal-q-num {
  font-family: fonts.$font-accent;
  font-size: 0.65rem;
  font-weight: 700;
  color: colors.$ALCO-PRIMARY;
  background: rgba(colors.$ALCO-PRIMARY, 0.1);
  border: 1px solid rgba(colors.$ALCO-PRIMARY, 0.2);
  border-radius: 4px;
  padding: 1px 6px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.cal-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cal-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid $border;
  background: $bg-alt;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;

  &:hover {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.35);
    background: rgba(colors.$ALCO-PRIMARY, 0.05);
  }

  &.selected {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.5);
    background: rgba(colors.$ALCO-PRIMARY, 0.09);

    .cal-option__radio {
      border-color: colors.$ALCO-PRIMARY;

      &::after {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
}

.cal-option__radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(11, 31, 51, 0.2);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.18s;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: colors.$ALCO-PRIMARY;
    opacity: 0;
    transform: scale(0.4);
    transition: opacity 0.18s, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.cal-option__label {
  font-family: fonts.$font-secondary;
  font-size: 0.86rem;
  color: $text-body;
  line-height: 1.4;
}

.cal-error {
  font-family: fonts.$font-interface;
  font-size: 0.7rem;
  color: #dc2626;
  padding-left: 2px;
}

.has-error .cal-option {
  border-color: rgba(220, 38, 38, 0.2);
}

// ── Consent ───────────────────────────────────────────────────────────────────
.cal-consent {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;

  &.has-error .cal-consent__box {
    border-color: rgba(220, 38, 38, 0.5);
  }
}

.cal-consent__box {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid rgba(11, 31, 51, 0.2);
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.18s, background 0.18s;
  color: colors.$white;

  &.checked {
    background: colors.$ALCO-PRIMARY;
    border-color: transparent;
  }
}

.cal-consent__text {
  font-family: fonts.$font-interface;
  font-size: 0.72rem;
  color: $text-muted;
  line-height: 1.55;
}

.cal-link {
  color: colors.$ALCO-PRIMARY;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s;

  &:hover {
    color: colors.$ALCO-DARK;
  }
}

// ── Button ────────────────────────────────────────────────────────────────────
.cal-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 24px;
  font-family: fonts.$font-interface;
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: colors.$white;
  background: colors.$ALCO-PRIMARY;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(colors.$ALCO-PRIMARY, 0.35);
  transition: transform 0.2s ease, box-shadow 0.25s ease, opacity 0.2s;
  text-decoration: none;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(colors.$ALCO-PRIMARY, 0.45);
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

// ── Textarea Q6 ───────────────────────────────────────────────────────────────
.cal-textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cal-textarea {
  width: 100%;
  resize: vertical;
  min-height: 100px;
  padding: 12px 14px;
  font-family: fonts.$font-secondary;
  font-size: 0.86rem;
  color: colors.$ALCO-DARK;
  background: $bg-alt;
  border: 1px solid $border;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.18s, background 0.18s;
  line-height: 1.55;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(11, 31, 51, 0.32);
  }

  &:focus {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.45);
    background: $bg;
  }

  &.error {
    border-color: rgba(220, 38, 38, 0.35);
  }
}

.cal-textarea-footer {
  display: flex;
  justify-content: flex-end;
  min-height: 16px;
}

.cal-word-hint {
  font-family: fonts.$font-interface;
  font-size: 0.7rem;
  color: $text-muted;
  display: flex;
  align-items: center;
  gap: 5px;
}

.cal-word-ok {
  color: colors.$ALCO-GREEN;
  font-size: 0.75rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.cal-spinner {
  animation: spin 0.8s linear infinite;
}

// ── Transición ────────────────────────────────────────────────────────────────
.cal-fade-enter-active {
  transition: opacity 0.28s ease;

  .cal-modal {
    transition: opacity 0.28s ease, transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
  }
}

.cal-fade-leave-active {
  transition: opacity 0.2s ease;

  .cal-modal {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
}

.cal-fade-enter-from {
  opacity: 0;

  .cal-modal {
    opacity: 0;
    transform: scale(0.92) translateY(20px);
  }
}

.cal-fade-leave-to {
  opacity: 0;

  .cal-modal {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
}

// ── Wizard: progreso ──────────────────────────────────────────────────────────
.cal-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 24px;
}

.cal-progress__label {
  font-family: fonts.$font-accent;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: colors.$ALCO-PRIMARY;
  margin: 0;
}

.cal-progress__track {
  height: 4px;
  background: $bg-alt;
  border-radius: 99px;
  overflow: hidden;
}

.cal-progress__fill {
  height: 100%;
  background: colors.$ALCO-PRIMARY;
  border-radius: 99px;
  transition: width 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
}

// ── Wizard: navegación ────────────────────────────────────────────────────────
.cal-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cal-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cal-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 8px 2px;
  font-family: fonts.$font-interface;
  font-size: 0.78rem;
  font-weight: 600;
  color: $text-muted;
  cursor: pointer;
  transition: color 0.2s;

  &:hover { color: colors.$ALCO-DARK; }
}

.cal-next {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-family: fonts.$font-interface;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: colors.$white;
  background: colors.$ALCO-PRIMARY;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active { transform: translateY(0); }
}

.invisible {
  visibility: hidden;
}

// ── Wizard: transición entre pasos ────────────────────────────────────────────
.cal-step-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.cal-step-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.cal-step-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.cal-step-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
