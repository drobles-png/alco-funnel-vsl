<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import CalendarModal from '@/components/CalendarModal.vue'
import { trackStage, generateEventId } from '@/utils/ghl'
import { sendCapiEvent } from '@/utils/capi'
import { useContactStore } from '@/stores/contact'
import { captureFbParams, getStoredFbParams } from '@/utils/fbclid'
import alcoLogo from '@/assets/logos/alco-wordmark-blue.png'
import { CTA_UNLOCK_SECONDS, WISTIA_MEDIA_ID } from '@/config/alco'

const loadWistiaEmbed = () => {
  if (!WISTIA_MEDIA_ID) return
  if (!document.querySelector('script[data-wistia-player]')) {
    const playerScript = document.createElement('script')
    playerScript.src = 'https://fast.wistia.com/player.js'
    playerScript.async = true
    playerScript.setAttribute('data-wistia-player', 'true')
    document.head.appendChild(playerScript)
  }
  if (!document.querySelector(`script[data-wistia-media="${WISTIA_MEDIA_ID}"]`)) {
    const mediaScript = document.createElement('script')
    mediaScript.src = `https://fast.wistia.com/embed/${WISTIA_MEDIA_ID}.js`
    mediaScript.async = true
    mediaScript.type = 'module'
    mediaScript.setAttribute('data-wistia-media', WISTIA_MEDIA_ID)
    document.head.appendChild(mediaScript)
  }
}

const contactStore = useContactStore()

// ── Calendar modal ────────────────────────────────────────────────────────────
const calendarOpen = ref(false)

// ── Contact capture guard ─────────────────────────────────────────────────────
const captureOpen = ref(false)
const captureForm = ref({ nombre: '', apellido: '', negocio: '', email: '', telefono: '' })
const captureErrors = ref<Record<string, string>>({})
const captureTouched = ref<Record<string, boolean>>({})
const captureSubmitting = ref(false)

const capturePhoneE164 = computed(() => {
  const raw = captureForm.value.telefono.trim()
  const parsed = raw.startsWith('+')
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, 'EC')
  return parsed?.isValid() ? parsed.format('E.164') : ''
})

const validateCapture = () => {
  const e: Record<string, string> = {}
  if (captureForm.value.nombre.trim().length < 2) e.nombre = 'Ingresa tu nombre'
  if (captureForm.value.apellido.trim().length < 2) e.apellido = 'Ingresa tu apellido'
  if (captureForm.value.negocio.trim().length < 2) e.negocio = 'Ingresa tu ciudad o cantón'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captureForm.value.email.trim())) e.email = 'Email inválido'
  if (!capturePhoneE164.value) e.telefono = 'Teléfono inválido'
  captureErrors.value = e
  return Object.keys(e).length === 0
}

const touchCapture = (field: keyof typeof captureTouched.value) => {
  captureTouched.value[field] = true
  validateCapture()
}

const submitCapture = async () => {
  captureTouched.value = {
    nombre: true,
    apellido: true,
    negocio: true,
    email: true,
    telefono: true,
  }
  if (!validateCapture()) return
  captureSubmitting.value = true

  contactStore.save({
    nombre: captureForm.value.nombre.trim(),
    apellido: captureForm.value.apellido.trim(),
    negocio: captureForm.value.negocio.trim(),
    email: captureForm.value.email.trim().toLowerCase(),
    telefono: capturePhoneE164.value,
  })

  const c = contactStore.get()
  const leadEventId = generateEventId('lead_video')

  trackStage('lead_capturado', {
    nombre: c.nombre,
    apellido: c.apellido,
    negocio: c.negocio,
    email: c.email,
    telefono: c.telefono,
    event_id: leadEventId,
    event_name: 'CompleteRegistration',
    qualification_status: 'pending',
    ...getStoredFbParams(),
  })
  ;(window as any).fbq?.(
    'track',
    'CompleteRegistration',
    { content_name: 'video-gate', qualification_status: 'pending' },
    { eventID: leadEventId },
  )
  sendCapiEvent(
    'CompleteRegistration',
    leadEventId,
    { email: c.email, phone: c.telefono },
    { content_name: 'video-gate', qualification_status: 'pending' },
  )
  await new Promise((r) => setTimeout(r, 600))
  const viewEventId = generateEventId('view_video')
  ;(window as any).fbq?.(
    'track',
    'ViewContent',
    { content_name: 'video-vsl' },
    { eventID: viewEventId },
  )
  sendCapiEvent(
    'ViewContent',
    viewEventId,
    { email: c.email, phone: c.telefono },
    { content_name: 'video-vsl' },
  )
  captureSubmitting.value = false
  captureOpen.value = false
  startTimer()
}

// ── 2-minute countdown (3 s en localhost para testing) ───────────────────────
const IS_DEV = window.location.hostname === 'localhost'
const COUNTDOWN_SECONDS = IS_DEV ? 3 : CTA_UNLOCK_SECONDS
const secondsLeft = ref(COUNTDOWN_SECONDS)
const ctaUnlocked = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const formattedTime = () => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const startTimer = () => {
  timer = setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value--
    } else {
      ctaUnlocked.value = true
      if (timer) clearInterval(timer)
    }
  }, 1000)
}

onMounted(() => {
  loadWistiaEmbed()
  captureFbParams()
  const c = contactStore.get()
  const hasContact = !!c.email && !!c.nombre
  if (!IS_DEV && !hasContact) {
    captureOpen.value = true
  } else {
    const viewEventId = generateEventId('view_video')
    ;(window as any).fbq?.(
      'track',
      'ViewContent',
      { content_name: 'video-vsl' },
      { eventID: viewEventId },
    )
    sendCapiEvent(
      'ViewContent',
      viewEventId,
      { email: c.email, phone: c.telefono },
      { content_name: 'video-vsl' },
    )
    startTimer()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="vv-page">
    <!-- ── Top bar ──────────────────────────────────────────────────────────── -->
    <header class="vv-topbar">
      <img :src="alcoLogo" alt="ALCO" class="vv-topbar__logo" />
    </header>

    <!-- ── Main content ─────────────────────────────────────────────────────── -->
    <main class="vv-main">
      <!-- Progress stepper -->
      <div class="vv-stepper" aria-label="Paso 1 de 2">
        <span class="vv-stepper__pill">
          <span class="vv-stepper__dot vv-stepper__dot--active" aria-current="step"></span>
          <span class="vv-stepper__dot"></span>
          <span class="vv-stepper__label">Paso 1 de 2</span>
        </span>
      </div>

      <!-- Headline -->
      <section class="vv-headline">
        <p class="vv-eyebrow">Fernando Alvear · ALCO</p>
        <h1 class="vv-h1">
          Cómo arrancar tu negocio de
          <span class="vv-accent">fumigación con drones en la Costa</span>
        </h1>
        <p class="vv-subtitle">
          Mira el video completo. Te contamos cómo funciona el negocio, qué necesitas para arrancar
          y cómo te acompañamos, sin adornos.
        </p>
      </section>

      <!-- Video VSL (Wistia) -->
      <div class="vv-video-wrapper">
        <wistia-player
          v-if="WISTIA_MEDIA_ID"
          :media-id="WISTIA_MEDIA_ID"
          aspect="1.7777777777777777"
        ></wistia-player>
        <div v-else class="vv-video-pending">
          <i class="fa-solid fa-circle-play" aria-hidden="true"></i>
          <span>El video se publica en breve</span>
        </div>
      </div>

      <!-- CTA section -->
      <div class="vv-cta-section">
        <!-- Lock notice (visible while countdown active) -->
        <Transition name="lock-fade">
          <div v-if="!ctaUnlocked" class="vv-lock-notice">
            <i class="fa-solid fa-lock vv-lock-notice__icon" aria-hidden="true"></i>
            <span class="vv-lock-notice__text">
              El botón se habilita en
              <strong class="vv-lock-notice__timer">{{ formattedTime() }}</strong>
              &mdash; mira el video hasta el final
            </span>
          </div>
        </Transition>

        <!-- CTA button -->
        <button
          class="vv-cta-btn"
          :class="{ 'vv-cta-btn--active': ctaUnlocked, 'vv-cta-btn--locked': !ctaUnlocked }"
          :disabled="!ctaUnlocked"
          @click="ctaUnlocked && (calendarOpen = true)"
        >
          <i v-if="ctaUnlocked" class="fa-solid fa-calendar-check" aria-hidden="true"></i>
          <i v-else class="fa-solid fa-lock" aria-hidden="true"></i>
          <span v-if="ctaUnlocked">AGENDAR MI REUNIÓN CON ALCO</span>
          <span v-else>AGENDAR MI REUNIÓN</span>
        </button>

        <!-- Trust line -->
        <p class="vv-trust">
          <i class="fa-solid fa-lock" aria-hidden="true"></i>
          Reunión sin costo &middot; Cupos sujetos a calificación
        </p>
      </div>
    </main>

    <!-- ── Footer ────────────────────────────────────────────────────────────── -->
    <footer class="vv-footer">
      <p class="vv-footer__copy">
        &copy; {{ new Date().getFullYear() }} ALCO. Todos los derechos reservados.
      </p>
      <nav class="vv-footer__links" aria-label="Legal">
        <RouterLink to="/politicas-privacidad" class="vv-footer__link"
          >Política de privacidad</RouterLink
        >
        <span class="vv-footer__sep" aria-hidden="true">&middot;</span>
        <RouterLink to="/aviso-legal" class="vv-footer__link">Aviso Legal</RouterLink>
      </nav>
    </footer>
  </div>

  <!-- Calendar modal -->
  <CalendarModal :open="calendarOpen" nombre="" @close="calendarOpen = false" />

  <!-- ── Contact capture overlay ─────────────────────────────────────────────── -->
  <Transition name="capture-fade">
    <div
      v-if="captureOpen"
      class="cap-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cap-title"
    >
      <div class="cap-card">
        <div class="cap-icon-wrap">
          <i class="fa-solid fa-user-lock cap-icon" aria-hidden="true"></i>
        </div>

        <h2 id="cap-title" class="cap-h2">Antes de ver el video, déjanos tus datos</h2>
        <p class="cap-sub">Así un asesor de ALCO puede escribirte si tienes dudas</p>

        <form class="cap-form" @submit.prevent="submitCapture" novalidate>
          <div class="cap-row">
            <div
              class="cap-field"
              :class="{ 'cap-field--error': captureTouched.nombre && captureErrors.nombre }"
            >
              <label class="cap-label" for="cap-nombre">Nombre</label>
              <input
                id="cap-nombre"
                v-model="captureForm.nombre"
                type="text"
                class="cap-input"
                placeholder="Tu nombre"
                autocomplete="given-name"
                @blur="touchCapture('nombre')"
              />
              <span v-if="captureTouched.nombre && captureErrors.nombre" class="cap-error">{{
                captureErrors.nombre
              }}</span>
            </div>

            <div
              class="cap-field"
              :class="{ 'cap-field--error': captureTouched.apellido && captureErrors.apellido }"
            >
              <label class="cap-label" for="cap-apellido">Apellido</label>
              <input
                id="cap-apellido"
                v-model="captureForm.apellido"
                type="text"
                class="cap-input"
                placeholder="Tu apellido"
                autocomplete="family-name"
                @blur="touchCapture('apellido')"
              />
              <span v-if="captureTouched.apellido && captureErrors.apellido" class="cap-error">{{
                captureErrors.apellido
              }}</span>
            </div>
          </div>

          <div
            class="cap-field"
            :class="{ 'cap-field--error': captureTouched.negocio && captureErrors.negocio }"
          >
            <label class="cap-label" for="cap-negocio">Ciudad o cantón</label>
            <input
              id="cap-negocio"
              v-model="captureForm.negocio"
              type="text"
              class="cap-input"
              placeholder="Ej: Babahoyo"
              autocomplete="address-level2"
              @blur="touchCapture('negocio')"
            />
            <span v-if="captureTouched.negocio && captureErrors.negocio" class="cap-error">{{
              captureErrors.negocio
            }}</span>
          </div>

          <div
            class="cap-field"
            :class="{ 'cap-field--error': captureTouched.email && captureErrors.email }"
          >
            <label class="cap-label" for="cap-email">Email</label>
            <input
              id="cap-email"
              v-model="captureForm.email"
              type="email"
              class="cap-input"
              placeholder="tu@correo.com"
              autocomplete="email"
              @blur="touchCapture('email')"
            />
            <span v-if="captureTouched.email && captureErrors.email" class="cap-error">{{
              captureErrors.email
            }}</span>
          </div>

          <div
            class="cap-field"
            :class="{ 'cap-field--error': captureTouched.telefono && captureErrors.telefono }"
          >
            <label class="cap-label" for="cap-telefono">Teléfono / WhatsApp</label>
            <input
              id="cap-telefono"
              v-model="captureForm.telefono"
              type="tel"
              class="cap-input"
              placeholder="+593 99 999 9999"
              autocomplete="tel"
              @blur="touchCapture('telefono')"
            />
            <span v-if="captureTouched.telefono && captureErrors.telefono" class="cap-error">{{
              captureErrors.telefono
            }}</span>
          </div>

          <button type="submit" class="cap-submit" :disabled="captureSubmitting">
            <i v-if="!captureSubmitting" class="fa-solid fa-play" aria-hidden="true"></i>
            <i v-else class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            <span>{{ captureSubmitting ? 'Un momento...' : 'CONTINUAR AL VIDEO' }}</span>
          </button>
        </form>

        <p class="cap-privacy">
          <i class="fa-solid fa-lock" aria-hidden="true"></i>
          Tus datos están seguros &middot; No spam
        </p>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

$bg: #ffffff;
$bg-alt: #f2f5f8;
$border: rgba(11, 31, 51, 0.1);
$text-muted: rgba(11, 31, 51, 0.5);
$text-body: rgba(11, 31, 51, 0.72);

// ── Page shell ────────────────────────────────────────────────────────────────
.vv-page {
  min-height: 100vh;
  background: $bg;
  display: flex;
  flex-direction: column;
  color: colors.$ALCO-DARK;
}

// ── Top bar ───────────────────────────────────────────────────────────────────
.vv-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: rgba($bg, 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid $border;
}

.vv-topbar__logo {
  height: 26px;
  width: auto;
  display: block;
}

// ── Main ──────────────────────────────────────────────────────────────────────
.vv-main {
  flex: 1;
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
  padding: 48px 24px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;

  @media (max-width: 600px) {
    padding: 32px 16px 48px;
    gap: 28px;
  }
}

// ── Stepper ───────────────────────────────────────────────────────────────────
.vv-stepper {
  display: flex;
  justify-content: center;
}

.vv-stepper__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 10px;
  background: rgba(colors.$ALCO-PRIMARY, 0.08);
  border: 1px solid rgba(colors.$ALCO-PRIMARY, 0.22);
  border-radius: 100px;
}

.vv-stepper__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(11, 31, 51, 0.15);
  flex-shrink: 0;
  transition: background 0.2s;

  &--active {
    background: colors.$ALCO-PRIMARY;
    box-shadow: 0 0 8px rgba(colors.$ALCO-PRIMARY, 0.6);
  }
}

.vv-stepper__label {
  font-family: fonts.$font-accent;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: colors.$ALCO-PRIMARY;
  padding-left: 4px;
}

// ── Headline ──────────────────────────────────────────────────────────────────
.vv-headline {
  text-align: center;
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vv-eyebrow {
  font-family: fonts.$font-accent;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: colors.$ALCO-PRIMARY;
  margin: 0;
}

.vv-h1 {
  font-family: fonts.$font-principal;
  font-size: clamp(1.7rem, 4.5vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.18;
  color: colors.$ALCO-DARK;
  margin: 0;
}

.vv-accent {
  color: colors.$ALCO-PRIMARY;
}

.vv-subtitle {
  font-family: fonts.$font-secondary;
  font-size: clamp(0.92rem, 2vw, 1.05rem);
  color: $text-body;
  line-height: 1.6;
  margin: 0;
}

// ── Video (Wistia) ────────────────────────────────────────────────────────────
.vv-video-wrapper {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid $border;
  box-shadow: 0 24px 60px rgba(11, 31, 51, 0.12);

  wistia-player {
    display: block;
    width: 100%;
  }

  // Placeholder mientras carga el custom element de Wistia
  wistia-player:not(:defined) {
    display: block;
    padding-top: 56.25%;
    background: colors.$ALCO-DARK;
  }
}

// Mientras no haya media-id de Wistia configurado
.vv-video-pending {
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: colors.$ALCO-PRIMARY;
  color: rgba(255, 255, 255, 0.85);
  font-family: fonts.$font-principal;
  font-size: 1.05rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  i {
    font-size: 3.25rem;
    color: colors.$ALCO-SUN;
  }
}

.vv-video-el {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  background: colors.$ALCO-DARK;
  object-fit: contain;
}

// ── CTA section ───────────────────────────────────────────────────────────────
.vv-cta-section {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

// Lock notice
.vv-lock-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: $bg-alt;
  border: 1px solid $border;
  border-radius: 10px;
  width: 100%;
}

.vv-lock-notice__icon {
  font-size: 0.82rem;
  color: $text-muted;
  flex-shrink: 0;
}

.vv-lock-notice__text {
  font-family: fonts.$font-interface;
  font-size: 0.82rem;
  color: $text-body;
  line-height: 1.45;
}

.vv-lock-notice__timer {
  font-family: fonts.$font-accent;
  font-weight: 700;
  color: colors.$ALCO-PRIMARY;
}

// CTA button
.vv-cta-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px 28px;
  font-family: fonts.$font-accent;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: colors.$white;
  border: none;
  border-radius: 12px;
  cursor: not-allowed;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.3s ease, opacity 0.25s;

  i { font-size: 1rem; }

  // Locked state
  &--locked {
    background: rgba(11, 31, 51, 0.06);
    border: 1px solid rgba(11, 31, 51, 0.1);
    color: rgba(11, 31, 51, 0.32);
    cursor: not-allowed;

    i { color: rgba(11, 31, 51, 0.25); }
  }

  // Active / unlocked state
  &--active {
    background: colors.$ALCO-PRIMARY;
    box-shadow: 0 8px 32px rgba(colors.$ALCO-PRIMARY, 0.35), 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    animation: cta-pulse 2.8s ease-in-out infinite;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 44px rgba(colors.$ALCO-PRIMARY, 0.5), 0 4px 12px rgba(0, 0, 0, 0.1);
      animation: none;
    }

    &:active { transform: translateY(0); }
  }
}

@keyframes cta-pulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(colors.$ALCO-PRIMARY, 0.35), 0 2px 8px rgba(0, 0, 0, 0.08); }
  50% { box-shadow: 0 10px 44px rgba(colors.$ALCO-PRIMARY, 0.55), 0 2px 8px rgba(0, 0, 0, 0.08); }
}

// Trust line
.vv-trust {
  font-family: fonts.$font-interface;
  font-size: 0.74rem;
  color: $text-muted;
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;

  i { font-size: 0.65rem; }
}

// Lock notice transition
.lock-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.lock-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// ── Footer ────────────────────────────────────────────────────────────────────
.vv-footer {
  padding: 24px 24px 32px;
  border-top: 1px solid $border;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.vv-footer__copy {
  font-family: fonts.$font-interface;
  font-size: 0.7rem;
  color: $text-muted;
  margin: 0;
  text-align: center;
}

.vv-footer__links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.vv-footer__link {
  font-family: fonts.$font-interface;
  font-size: 0.7rem;
  color: rgba(11, 31, 51, 0.4);
  text-decoration: none;
  transition: color 0.2s;

  &:hover { color: colors.$ALCO-DARK; }
}

.vv-footer__sep {
  color: $text-muted;
  font-size: 0.7rem;
}

// ── Contact capture overlay ───────────────────────────────────────────────────
.cap-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(11, 31, 51, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
}

.cap-card {
  width: 100%;
  max-width: 460px;
  background: $bg;
  border: 1px solid $border;
  border-radius: 20px;
  padding: 40px 36px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  box-shadow: 0 32px 80px rgba(11, 31, 51, 0.22);

  @media (max-width: 480px) {
    padding: 32px 22px 28px;
  }
}

.cap-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(colors.$ALCO-PRIMARY, 0.1);
  border: 1px solid rgba(colors.$ALCO-PRIMARY, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.cap-icon {
  font-size: 1.8rem;
  color: colors.$ALCO-PRIMARY;
}

.cap-h2 {
  font-family: fonts.$font-principal;
  font-size: clamp(1.2rem, 4vw, 1.45rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: colors.$ALCO-DARK;
  text-align: center;
  margin: 0 0 10px;
}

.cap-sub {
  font-family: fonts.$font-secondary;
  font-size: 0.88rem;
  color: $text-body;
  text-align: center;
  line-height: 1.5;
  margin: 0 0 28px;
}

.cap-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cap-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
}

.cap-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &--error .cap-input {
    border-color: rgba(220, 38, 38, 0.5);
    background: rgba(220, 38, 38, 0.04);
  }
}

.cap-label {
  font-family: fonts.$font-interface;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(11, 31, 51, 0.55);
}

.cap-input {
  width: 100%;
  padding: 12px 16px;
  background: $bg-alt;
  border: 1px solid $border;
  border-radius: 10px;
  color: colors.$ALCO-DARK;
  font-family: fonts.$font-secondary;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(11, 31, 51, 0.3);
  }

  &:focus {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.5);
    background: colors.$white;
  }
}

.cap-error {
  font-family: fonts.$font-interface;
  font-size: 0.74rem;
  color: #dc2626;
}

.cap-submit {
  margin-top: 6px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  background: colors.$ALCO-PRIMARY;
  border: none;
  border-radius: 12px;
  color: colors.$white;
  font-family: fonts.$font-accent;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s;
  box-shadow: 0 8px 28px rgba(colors.$ALCO-PRIMARY, 0.3);

  i { font-size: 0.95rem; }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 36px rgba(colors.$ALCO-PRIMARY, 0.4);
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.cap-privacy {
  margin-top: 18px;
  font-family: fonts.$font-interface;
  font-size: 0.72rem;
  color: $text-muted;
  display: flex;
  align-items: center;
  gap: 6px;

  i { font-size: 0.62rem; }
}

// Overlay transition
.capture-fade-enter-active,
.capture-fade-leave-active {
  transition: opacity 0.3s ease;
}
.capture-fade-enter-from,
.capture-fade-leave-to {
  opacity: 0;
}
</style>
