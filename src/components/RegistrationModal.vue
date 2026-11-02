<script setup lang="ts">
import { useDialogFocus } from '@/composables/useDialogFocus'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  AsYouType,
} from 'libphonenumber-js'
import { useRouter } from 'vue-router'
import { getStoredFbParams } from '@/utils/fbclid'
import { sendCapiEvent } from '@/utils/capi'
import { buildNota } from '@/utils/ghl'
import { useContactStore } from '@/stores/contact'
import { GHL_CONTACT_WEBHOOK } from '@/config/alco'
const router = useRouter()
const contactStore = useContactStore()

const props = defineProps<{ open: boolean }>()
const rmodalEl = ref<HTMLElement | null>(null)
useDialogFocus(rmodalEl, () => props.open, '#r-nombre')
const emit = defineEmits<{ (e: 'close'): void }>()

// ── Países con emoji flag ─────────────────────────────────────────────────────
interface Country {
  code: string
  name: string
  dial: string
  flag: string
}

const flagEmoji = (code: string) =>
  [...code.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))).join('')

// Lista curada: LATAM primero, luego resto
const PRIORITY = [
  'EC',
  'CO',
  'PE',
  'MX',
  'AR',
  'CL',
  'VE',
  'BO',
  'PY',
  'UY',
  'GT',
  'HN',
  'SV',
  'CR',
  'PA',
  'DO',
  'CU',
  'US',
  'ES',
]

const nameMap: Record<string, string> = {
  EC: 'Ecuador',
  CO: 'Colombia',
  PE: 'Perú',
  MX: 'México',
  AR: 'Argentina',
  CL: 'Chile',
  VE: 'Venezuela',
  BO: 'Bolivia',
  PY: 'Paraguay',
  UY: 'Uruguay',
  GT: 'Guatemala',
  HN: 'Honduras',
  SV: 'El Salvador',
  CR: 'Costa Rica',
  PA: 'Panamá',
  DO: 'Rep. Dominicana',
  CU: 'Cuba',
  US: 'Estados Unidos',
  ES: 'España',
  BR: 'Brasil',
  PT: 'Portugal',
  FR: 'Francia',
  DE: 'Alemania',
  IT: 'Italia',
  GB: 'Reino Unido',
  CA: 'Canadá',
  AU: 'Australia',
  JP: 'Japón',
  CN: 'China',
  IN: 'India',
}

const allCountries: Country[] = getCountries().map((code) => ({
  code,
  name: nameMap[code] ?? code,
  dial: '+' + getCountryCallingCode(code),
  flag: flagEmoji(code),
}))

const priorityList = PRIORITY.map((code) => allCountries.find((c) => c.code === code)).filter(
  Boolean,
) as Country[]

const otherList = allCountries
  .filter((c) => !PRIORITY.includes(c.code))
  .sort((a, b) => a.name.localeCompare(b.name))

const countries = [
  ...priorityList,
  { code: '---', name: '─────────', dial: '', flag: '' },
  ...otherList,
]

// ── Estado del formulario ─────────────────────────────────────────────────────
const selectedCountry = ref<Country>(priorityList[0])
const dropdownOpen = ref(false)
const countrySearch = ref('')
const submitting = ref(false)

const form = ref({
  nombre: '',
  apellido: '',
  email: '',
  phone: '',
  ciudad: '',
})

const errors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})

// ── Phone formatter (AsYouType) ───────────────────────────────────────────────
const formattedPhone = computed(() => {
  if (!form.value.phone) return ''
  const formatter = new AsYouType(selectedCountry.value.code as any)
  return formatter.input(form.value.phone)
})

const phoneValid = computed(() => {
  const full = selectedCountry.value.dial + form.value.phone.replace(/\s/g, '')
  const parsed = parsePhoneNumberFromString(full, selectedCountry.value.code as any)
  return parsed?.isValid() ?? false
})

const parsedPhoneE164 = computed(() => {
  const full = selectedCountry.value.dial + form.value.phone.replace(/\s/g, '')
  const parsed = parsePhoneNumberFromString(full, selectedCountry.value.code as any)
  return parsed?.format('E.164') ?? ''
})

// ── Validaciones ──────────────────────────────────────────────────────────────
const validators: Record<string, (v: string) => string | null> = {
  nombre: (v) => (v.trim().length < 2 ? 'Ingresa tu nombre' : null),
  apellido: (v) => (v.trim().length < 2 ? 'Ingresa tu apellido' : null),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Email inválido'),
  phone: () => (phoneValid.value ? null : 'Número inválido para el país seleccionado'),
  ciudad: (v) => (v.trim().length < 2 ? 'Ingresa tu ciudad o cantón' : null),
}

const validate = () => {
  const e: Record<string, string> = {}
  for (const [field, fn] of Object.entries(validators)) {
    const msg = fn(form.value[field as keyof typeof form.value])
    if (msg) e[field] = msg
  }
  errors.value = e
  return Object.keys(e).length === 0
}

const onBlur = (field: string) => {
  touched.value[field] = true
  const msg = validators[field]?.(form.value[field as keyof typeof form.value])
  if (msg) errors.value[field] = msg
  else delete errors.value[field]
}

const onPhoneInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/[^\d\s\-\(\)]/g, '')
  form.value.phone = raw
}

// ── Dropdown de país ──────────────────────────────────────────────────────────
const filteredCountries = computed(() => {
  const q = countrySearch.value.toLowerCase()
  if (!q) return countries
  return countries.filter(
    (c) =>
      c.code !== '---' &&
      (c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)),
  )
})

const selectCountry = (c: Country) => {
  if (c.code === '---') return
  selectedCountry.value = c
  dropdownOpen.value = false
  countrySearch.value = ''
  form.value.phone = ''
}

const handleClickOutside = (e: MouseEvent) => {
  const el = document.querySelector('.rmodal__phone-wrap')
  if (el && !el.contains(e.target as Node)) dropdownOpen.value = false
}

// ── Submit ────────────────────────────────────────────────────────────────────
const CONTACT_WEBHOOK = GHL_CONTACT_WEBHOOK

type EstadoRegistro = 'parcial' | 'completo'

// Nombres de campo en snake_case para mapearlos fácil en el webhook de GHL.
// telefonoDisplay/timestamp/qualification_status se mantienen porque el workflow actual ya los mapea.
const buildPayload = (estado: EstadoRegistro, eventId: string) => {
  const emailOk = !validators.email(form.value.email)
  const nombre = form.value.nombre.trim()
  const apellido = form.value.apellido.trim()
  const email = emailOk ? form.value.email.trim().toLowerCase() : ''
  const telefono = phoneValid.value ? parsedPhoneE164.value : ''
  const telefonoFormateado = telefono ? selectedCountry.value.dial + ' ' + formattedPhone.value : ''
  const ciudad = form.value.ciudad.trim()

  const notas = buildNota(
    `📝 ${estado === 'completo' ? 'NUEVO CONTACTO' : 'REGISTRO INCOMPLETO (abandonó el formulario)'} — ALCO Funnel`,
    { nombre, apellido, ciudad, email, telefono: telefonoFormateado, pais: selectedCountry.value.name },
    [],
    eventId,
  )

  return {
    nombre,
    apellido,
    nombre_completo: `${nombre} ${apellido}`.trim(),
    email,
    telefono,
    telefono_formateado: telefonoFormateado,
    telefonoDisplay: telefonoFormateado,
    codigo_pais: selectedCountry.value.dial,
    pais: selectedCountry.value.name,
    ciudad,
    notas,
    nota: notas,
    etapa: estado === 'completo' ? 'registro' : 'registro_parcial',
    tags: [
      'funnel-alco',
      estado === 'completo' ? 'step-1-registro' : 'step-1-registro-parcial',
    ],
    estado_registro: estado,
    origen: 'ALCO Funnel — Formulario de registro',
    url_pagina: window.location.href,
    fecha_registro: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    estado_calificacion: 'pendiente',
    qualification_status: 'pending',
    event_id: eventId,
    event_name: estado === 'completo' ? 'CompleteRegistration' : 'PartialRegistration',
    ...getStoredFbParams(),
  }
}

// keepalive: el envío sobrevive aunque la persona cierre la pestaña o el navegador de Instagram
const postToGhl = (payload: ReturnType<typeof buildPayload>) =>
  !CONTACT_WEBHOOK
    ? Promise.resolve()
    : fetch(CONTACT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})

// ── Captura parcial ───────────────────────────────────────────────────────────
// Si la persona abandona (cierra el modal, cambia de app o cierra la página) con un email o
// teléfono válido, el lead se envía igual a GHL. Solo al abandonar, no en cada campo, para no
// disparar el workflow varias veces. GHL deduplica por email/teléfono: si vuelve y completa el
// registro, se actualiza el mismo contacto.
let completed = false
let lastPartialKey = ''

const capturePartial = () => {
  if (completed) return
  const payload = buildPayload('parcial', `partial_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  if (!payload.email && !payload.telefono) return
  const key = [payload.nombre, payload.apellido, payload.email, payload.telefono, payload.ciudad].join('|')
  if (key === lastPartialKey) return
  lastPartialKey = key
  if (window.location.hostname === 'localhost') console.info('[ALCO Registro parcial]', payload)
  postToGhl(payload)
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'hidden') capturePartial()
}

const handleSubmit = async () => {
  touched.value = { nombre: true, apellido: true, email: true, phone: true, ciudad: true }
  if (!validate()) return

  submitting.value = true
  completed = true

  // event_id compartido entre Pixel y CAPI para deduplicación
  const leadEventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const payload = buildPayload('completo', leadEventId)

  if (window.location.hostname === 'localhost') console.info('[ALCO Registro]', payload)

  await postToGhl(payload)

  // El contacto inicial todavía no es un lead calificado.
  ;(window as any).fbq?.(
    'track',
    'CompleteRegistration',
    { content_name: 'registro-inicial' },
    { eventID: leadEventId },
  )
  sendCapiEvent(
    'CompleteRegistration',
    leadEventId,
    {
      email: payload.email,
      phone: payload.telefono,
      firstName: payload.nombre,
      lastName: payload.apellido,
    },
    { content_name: 'registro-inicial' },
  )

  submitting.value = false
  contactStore.save({
    nombre: form.value.nombre.trim(),
    apellido: form.value.apellido.trim(),
    negocio: form.value.ciudad.trim(),
    email: form.value.email.trim().toLowerCase(),
    telefono: parsedPhoneE164.value,
  })
  emit('close')
  router.push('/ver-video')
}

// ── Keyboard trap ─────────────────────────────────────────────────────────────
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
    if (!val) capturePartial()
  },
)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', capturePartial)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', capturePartial)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  document.body.style.overflow = ''
})

watch(dropdownOpen, (open) => {
  if (open) {
    setTimeout(
      () => document.querySelector<HTMLInputElement>('.rmodal__country-search')?.focus(),
      50,
    )
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="rmodal-fade">
      <div
        v-if="props.open"
        class="rmodal-overlay"
        @click.self="$emit('close')"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rmodal-title"
      >
        <div ref="rmodalEl" class="rmodal">
          <!-- Close -->
          <button class="rmodal__close" @click="$emit('close')" aria-label="Cerrar">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- ── FORMULARIO ─────────────────────────────────── -->
          <p class="rmodal__eyebrow">Negocio de fumigación con drones</p>
          <h2 id="rmodal-title" class="rmodal__title">
            Mira el video completo<br /><span class="rmodal__title-accent">y arranca tu negocio</span>
          </h2>
          <p class="rmodal__subtitle">
            Déjanos tus datos para ver el video de Fernando Alvear y, si te hace sentido, agendar
            una reunión para armar tu camino.
          </p>

          <form class="rmodal__form" @submit.prevent="handleSubmit" novalidate>
            <!-- Nombre + Apellido -->
            <div class="rmodal__row">
              <div class="rmodal__field" :class="{ 'has-error': touched.nombre && errors.nombre }">
                <label for="r-nombre">Nombre</label>
                <input
                  id="r-nombre"
                  v-model="form.nombre"
                  type="text"
                  placeholder="Juan"
                  autocomplete="given-name"
                  @blur="onBlur('nombre')"
                />
                <span v-if="touched.nombre && errors.nombre" class="rmodal__error">{{
                  errors.nombre
                }}</span>
              </div>

              <div
                class="rmodal__field"
                :class="{ 'has-error': touched.apellido && errors.apellido }"
              >
                <label for="r-apellido">Apellido</label>
                <input
                  id="r-apellido"
                  v-model="form.apellido"
                  type="text"
                  placeholder="Pérez"
                  autocomplete="family-name"
                  @blur="onBlur('apellido')"
                />
                <span v-if="touched.apellido && errors.apellido" class="rmodal__error">{{
                  errors.apellido
                }}</span>
              </div>
            </div>

            <!-- Email -->
            <div class="rmodal__field" :class="{ 'has-error': touched.email && errors.email }">
              <label for="r-email">Correo electrónico</label>
              <input
                id="r-email"
                v-model="form.email"
                type="email"
                placeholder="juan@correo.com"
                autocomplete="email"
                @blur="onBlur('email')"
              />
              <span v-if="touched.email && errors.email" class="rmodal__error">{{
                errors.email
              }}</span>
            </div>

            <!-- Teléfono con selector de país -->
            <div class="rmodal__field" :class="{ 'has-error': touched.phone && errors.phone }">
              <label>Teléfono</label>
              <div class="rmodal__phone-wrap">
                <!-- Selector de país -->
                <button
                  type="button"
                  class="rmodal__country-trigger"
                  :aria-expanded="dropdownOpen"
                  aria-haspopup="listbox"
                  @click="dropdownOpen = !dropdownOpen"
                >
                  <span class="rmodal__flag">{{ selectedCountry.flag }}</span>
                  <span class="rmodal__dial">{{ selectedCountry.dial }}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    class="rmodal__chevron"
                    :class="{ open: dropdownOpen }"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <!-- Dropdown -->
                <Transition name="dropdown">
                  <div v-if="dropdownOpen" class="rmodal__country-dropdown" role="listbox">
                    <input
                      type="text"
                      class="rmodal__country-search"
                      v-model="countrySearch"
                      placeholder="Buscar país..."
                      aria-label="Buscar país"
                    />
                    <ul>
                      <li
                        v-for="c in filteredCountries"
                        :key="c.code"
                        :class="[
                          'rmodal__country-item',
                          { separator: c.code === '---', active: c.code === selectedCountry.code },
                        ]"
                        role="option"
                        :aria-selected="c.code === selectedCountry.code"
                        @click="selectCountry(c)"
                      >
                        <template v-if="c.code !== '---'">
                          <span class="rmodal__flag">{{ c.flag }}</span>
                          <span class="rmodal__country-name">{{ c.name }}</span>
                          <span class="rmodal__country-dial">{{ c.dial }}</span>
                        </template>
                        <template v-else>
                          <span class="rmodal__sep-line" aria-hidden="true" />
                        </template>
                      </li>
                    </ul>
                  </div>
                </Transition>

                <!-- Input numérico -->
                <input
                  class="rmodal__phone-input"
                  type="tel"
                  :value="form.phone"
                  placeholder="99 999 9999"
                  autocomplete="tel-national"
                  inputmode="tel"
                  @input="onPhoneInput"
                  @blur="onBlur('phone')"
                />

                <!-- Indicador de validez -->
                <span
                  class="rmodal__phone-status"
                  :class="{
                    valid: phoneValid,
                    invalid: touched.phone && !phoneValid && form.phone,
                  }"
                  aria-hidden="true"
                >
                  <svg
                    v-if="phoneValid"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <svg
                    v-else-if="touched.phone && !phoneValid && form.phone"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              </div>
              <span v-if="touched.phone && errors.phone" class="rmodal__error">{{
                errors.phone
              }}</span>
              <span v-if="phoneValid && parsedPhoneE164" class="rmodal__phone-preview">
                {{ selectedCountry.flag }} {{ selectedCountry.dial }} {{ formattedPhone }} · E.164:
                {{ parsedPhoneE164 }}
              </span>
            </div>

            <!-- Ciudad -->
            <div class="rmodal__field" :class="{ 'has-error': touched.ciudad && errors.ciudad }">
              <label for="r-ciudad">¿En qué ciudad o cantón estás?</label>
              <input
                id="r-ciudad"
                v-model="form.ciudad"
                type="text"
                placeholder="Babahoyo"
                autocomplete="address-level2"
                @blur="onBlur('ciudad')"
              />
              <span v-if="touched.ciudad && errors.ciudad" class="rmodal__error">{{
                errors.ciudad
              }}</span>
            </div>

            <!-- Submit -->
            <button class="rmodal__submit" type="submit" :disabled="submitting">
              <svg
                v-if="submitting"
                class="rmodal__spinner"
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
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </template>
              {{ submitting ? 'Enviando...' : 'VER EL VIDEO COMPLETO' }}
            </button>

            <p class="rmodal__legal">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Solicitudes sujetas a calificación · Tus datos están seguros
            </p>
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
$input-bg: #f2f5f8;
$text-muted: rgba(11, 31, 51, 0.66);
$text-body: rgba(11, 31, 51, 0.72);

// ── Overlay ──────────────────────────────────────────────────────────────────
.rmodal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(11, 31, 51, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

// ── Modal box ─────────────────────────────────────────────────────────────────
.rmodal {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: $bg;
  border: 1px solid $border;
  border-radius: 24px;
  padding: 48px 40px 40px;
  box-shadow: 0 40px 100px rgba(11, 31, 51, 0.25);
  max-height: 92vh;
  overflow-y: auto;

  @media (max-width: 560px) {
    padding: 44px 20px 32px;
    border-radius: 20px;
  }
}

// ── Close ─────────────────────────────────────────────────────────────────────
.rmodal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid $border;
  background: $bg-alt;
  color: $text-muted;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, color 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.4);
    color: colors.$ALCO-PRIMARY;
    background: rgba(colors.$ALCO-PRIMARY, 0.06);
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
.rmodal__eyebrow {
  font-family: fonts.$font-accent;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: colors.$ALCO-PRIMARY;
  margin: 0 0 12px;
}

.rmodal__title {
  font-family: fonts.$font-principal;
  font-size: clamp(1.7rem, 4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.18;
  color: colors.$ALCO-DARK;
  margin: 0 0 8px;
}

.rmodal__title-accent {
  color: colors.$ALCO-PRIMARY;
}

.rmodal__subtitle {
  font-family: fonts.$font-secondary;
  font-size: 0.88rem;
  color: $text-muted;
  margin: 0 0 28px;
}

// ── Form ──────────────────────────────────────────────────────────────────────
.rmodal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rmodal__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
}

.rmodal__field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-family: fonts.$font-interface;
    font-size: 0.74rem;
    font-weight: 600;
    color: rgba(11, 31, 51, 0.72);
    letter-spacing: 0.5px;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    background: $input-bg;
    border: 1px solid $border;
    border-radius: 10px;
    padding: 11px 14px;
    font-family: fonts.$font-secondary;
    font-size: 0.92rem;
    color: colors.$ALCO-DARK;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;

    &::placeholder {
      color: rgba(11, 31, 51, 0.3);
    }

    &:focus {
      border-color: rgba(colors.$ALCO-PRIMARY, 0.5);
      background: $bg;
      box-shadow: 0 0 0 3px rgba(colors.$ALCO-PRIMARY, 0.08);
    }
  }

  &.has-error input {
    border-color: rgba(220, 38, 38, 0.5);
  }
}

.rmodal__error {
  font-family: fonts.$font-interface;
  font-size: 0.72rem;
  color: #dc2626;
}

// ── Phone ─────────────────────────────────────────────────────────────────────
.rmodal__phone-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  background: $input-bg;
  border: 1px solid $border;
  border-radius: 10px;
  overflow: visible;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.5);
    box-shadow: 0 0 0 3px rgba(colors.$ALCO-PRIMARY, 0.08);
  }

  .has-error & {
    border-color: rgba(220, 38, 38, 0.5);
  }
}

.rmodal__country-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 10px 11px 14px;
  background: none;
  border: none;
  border-right: 1px solid $border;
  cursor: pointer;
  color: colors.$ALCO-DARK;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s;
  border-radius: 10px 0 0 10px;

  &:hover {
    background: rgba(11, 31, 51, 0.04);
  }
}

.rmodal__flag {
  font-size: 1.1rem;
  line-height: 1;
}

.rmodal__dial {
  font-family: fonts.$font-accent;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(11, 31, 51, 0.75);
}

.rmodal__chevron {
  opacity: 0.4;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
    opacity: 0.7;
  }
}

// ── Country dropdown ──────────────────────────────────────────────────────────
.rmodal__country-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 200;
  width: 280px;
  max-height: 240px;
  overflow: hidden;
  background: $bg;
  border: 1px solid $border;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(11, 31, 51, 0.18);
  display: flex;
  flex-direction: column;

  @media (max-width: 560px) {
    width: 240px;
  }
}

.rmodal__country-search {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  background: $bg-alt;
  border: none;
  border-bottom: 1px solid $border;
  color: colors.$ALCO-DARK;
  font-family: fonts.$font-secondary;
  font-size: 0.84rem;
  outline: none;
  border-radius: 12px 12px 0 0;

  &::placeholder {
    color: rgba(11, 31, 51, 0.3);
  }
}

.rmodal__country-dropdown ul {
  list-style: none;
  padding: 4px;
  margin: 0;
  overflow-y: auto;
  max-height: 190px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(11, 31, 51, 0.15);
    border-radius: 99px;
  }
}

.rmodal__country-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(.separator) {
    background: rgba(colors.$ALCO-PRIMARY, 0.08);
  }

  &.active {
    background: rgba(colors.$ALCO-PRIMARY, 0.12);
  }

  &.separator {
    padding: 4px 10px;
    cursor: default;
  }
}

.rmodal__sep-line {
  display: block;
  height: 1px;
  width: 100%;
  background: $border;
}

.rmodal__country-name {
  font-family: fonts.$font-secondary;
  font-size: 0.82rem;
  color: rgba(11, 31, 51, 0.8);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rmodal__country-dial {
  font-family: fonts.$font-accent;
  font-size: 0.75rem;
  color: rgba(11, 31, 51, 0.4);
  flex-shrink: 0;
}

// ── Phone input + status ──────────────────────────────────────────────────────
.rmodal__phone-input {
  flex: 1;
  min-width: 0;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 11px 40px 11px 12px !important;
  font-family: fonts.$font-secondary;
  font-size: 0.92rem;
  color: colors.$ALCO-DARK;
  outline: none !important;
  box-shadow: none !important;

  &::placeholder {
    color: rgba(11, 31, 51, 0.3);
  }
}

.rmodal__phone-status {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.valid {
    background: rgba(colors.$ALCO-GREEN, 0.15);
    color: colors.$ALCO-GREEN;
  }

  &.invalid {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }
}

.rmodal__phone-preview {
  font-family: fonts.$font-interface;
  font-size: 0.68rem;
  color: colors.$ALCO-GREEN;
  padding: 2px 0;
}

// ── Submit ─────────────────────────────────────────────────────────────────────
.rmodal__submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
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
  box-shadow: 0 8px 28px rgba(colors.$ALCO-PRIMARY, 0.3);
  transition: transform 0.2s ease, box-shadow 0.25s ease, opacity 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(colors.$ALCO-PRIMARY, 0.4);
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.rmodal__spinner {
  animation: spin 0.8s linear infinite;
}

.rmodal__legal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: fonts.$font-interface;
  font-size: 0.7rem;
  color: $text-muted;
  margin: 4px 0 0;

  svg { opacity: 0.5; flex-shrink: 0; }
}

// ── Transiciones ──────────────────────────────────────────────────────────────
.rmodal-fade-enter-active {
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;

  .rmodal {
    transition: opacity 0.3s ease, transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.rmodal-fade-leave-active {
  transition: opacity 0.22s ease;

  .rmodal {
    transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.55, 0, 1, 0.45);
  }
}

.rmodal-fade-enter-from {
  opacity: 0;

  .rmodal {
    opacity: 0;
    transform: scale(0.92) translateY(24px);
  }
}

.rmodal-fade-leave-to {
  opacity: 0;

  .rmodal {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}

.dropdown-enter-active {
  transition: opacity 0.18s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
