<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { buildNota, generateEventId, trackStage } from '@/utils/ghl'
import { getStoredFbParams, type FbParams } from '@/utils/fbclid'
import { sendCapiEvent } from '@/utils/capi'
import alcoLogo from '@/assets/logos/alco-wordmark-blue.png'
import { GHL_BOOKING_URL } from '@/config/alco'
import { QUALIFIED_STATUS } from '@/utils/qualification'

const router = useRouter()
const iframeEl = ref<HTMLIFrameElement | null>(null)
const iframeHeight = ref(1100)
// Mientras el widget no avise su alto, el iframe conserva su scroll interno
const autoHeight = ref(false)
let bookingHandled = false

const BASE_URL = GHL_BOOKING_URL
// id con el formato del código de inserción de GHL (<calendarId>_<timestamp>):
// form_embed.js lo usa para ajustar el alto del iframe
const CALENDAR_ID = GHL_BOOKING_URL.split('?')[0].split('/').filter(Boolean).pop() ?? 'alco-calendar'
const FRAME_ID = `${CALENDAR_ID}_${Date.now()}`
const EMBED_SCRIPT = 'https://link.msgsndr.com/js/form_embed.js'

// Pre-fill calendar with stored contact data + atribución de Meta (fbclid/UTMs).
// first_name/last_name es el formato actual de GHL; firstName/lastName se mantienen por compatibilidad.
const calendarUrl = computed(() => {
  const params = new URLSearchParams()
  try {
    const stored = localStorage.getItem('alco_contact')
    if (stored) {
      const { nombre, apellido, email, telefono, phone } = JSON.parse(stored)
      if (nombre) {
        params.set('first_name', nombre)
        params.set('firstName', nombre)
      }
      if (apellido) {
        params.set('last_name', apellido)
        params.set('lastName', apellido)
      }
      if (email) params.set('email', email)
      if (telefono || phone) params.set('phone', telefono || phone)
    }
  } catch {
    /* ignorar */
  }

  const fb = getStoredFbParams()
  const fbFields: Array<keyof FbParams> = [
    'fbclid',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'utm_id',
  ]
  for (const key of fbFields) {
    if (fb[key]) params.set(key, fb[key])
  }

  const qs = params.toString()
  return qs ? `${BASE_URL}?${qs}` : BASE_URL
})

function onMessage(event: MessageEvent) {
  if (!event.data || event.source !== iframeEl.value?.contentWindow) return
  const data = event.data as unknown

  // Alto dinámico del widget, formato actual: ['highlevel.setHeight', { height }]
  if (Array.isArray(data) && data[0] === 'highlevel.setHeight' && data[1]?.height) {
    iframeHeight.value = Math.max(640, Number(data[1].height) + 8)
    autoHeight.value = true
    return
  }

  // Formato anterior del widget: { type: 'booking-app', height }
  if (
    typeof data === 'object' &&
    !Array.isArray(data) &&
    (data as { type?: string }).type === 'booking-app' &&
    (data as { height?: number }).height
  ) {
    iframeHeight.value = Math.max(900, (data as { height: number }).height + 120)
    autoHeight.value = true
    return
  }

  // GHL booking confirmed — exact event: ['msgsndr-booking-complete', {...}]
  if (Array.isArray(data) && data[0] === 'msgsndr-booking-complete') {
    if (bookingHandled) return
    let qualification: { califica?: boolean } = {}
    try {
      qualification = JSON.parse(localStorage.getItem('alco_qualification') ?? '{}')
    } catch { /* ignorar */ }
    if (!qualification.califica) return
    bookingHandled = true

    const scheduleEventId = generateEventId('schedule')
    let contact = { nombre: '', apellido: '', negocio: '', email: '', telefono: '' }
    try {
      contact = { ...contact, ...JSON.parse(localStorage.getItem('alco_contact') ?? '{}') }
    } catch {
      /* ignorar */
    }

    const notas = buildNota(
      '📅 CITA AGENDADA — ALCO Funnel (reunión negocio de fumigación)',
      {
        nombre: contact.nombre,
        apellido: contact.apellido,
        ciudad: contact.negocio,
        email: contact.email,
        telefono: contact.telefono,
      },
      [],
      scheduleEventId,
    )

    trackStage('cita_agendada', {
      ...contact,
      ciudad: contact.negocio,
      tags: ['funnel-alco', 'step-3-cita-agendada'],
      notas,
      nota: notas,
      event_id: scheduleEventId,
      event_name: 'Schedule',
      qualification_status: QUALIFIED_STATUS,
      ...getStoredFbParams(),
    })
    ;(window as any).fbq?.(
      'track',
      'Schedule',
      { content_name: 'reunion-negocio-fumigacion' },
      { eventID: scheduleEventId },
    )
    sendCapiEvent(
      'Schedule',
      scheduleEventId,
      {
        email: contact.email,
        phone: contact.telefono,
        firstName: contact.nombre,
        lastName: contact.apellido,
      },
      { content_name: 'reunion-negocio-fumigacion' },
    )
    localStorage.setItem('alco_booked_at', String(Date.now()))
    router.push('/cita-confirmada')
  }
}

onMounted(() => {
  const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  let qualification: { califica?: boolean } = {}
  try {
    qualification = JSON.parse(localStorage.getItem('alco_qualification') ?? '{}')
  } catch { /* ignorar */ }

  if (!isDev && !qualification.califica) {
    router.replace('/')
    return
  }
  window.addEventListener('message', onMessage)

  // Script oficial de GHL: redimensiona el iframe al elegir fecha/horario. Se carga una sola vez.
  if (BASE_URL && !document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) {
    const s = document.createElement('script')
    s.src = EMBED_SCRIPT
    s.async = true
    document.body.appendChild(s)
  }
})
onUnmounted(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <div class="booking">
    <!-- TOP BAR -->
    <header class="booking__topbar">
      <img :src="alcoLogo" alt="ALCO" class="booking__logo" />
    </header>

    <!-- STEPPER -->
    <div class="booking__stepper">
      <div class="stepper__track">
        <div class="stepper__step stepper__step--done">
          <span class="stepper__num"><i class="fa-solid fa-check"></i></span>
          <span class="stepper__label">Registro</span>
        </div>
        <div class="stepper__line stepper__line--done"></div>
        <div class="stepper__step stepper__step--active">
          <span class="stepper__num">2</span>
          <span class="stepper__label">Agenda tu reunión</span>
        </div>
      </div>
      <p class="stepper__caption">Paso 2 de 2</p>
    </div>

    <!-- HEADING -->
    <section class="booking__hero">
      <h1 class="booking__title">Selecciona tu horario</h1>
      <p class="booking__subtitle">
        Elige el día y la hora para conversar de tu caso: tu zona, tus clientes y qué quieres lograr. Sin costo.
      </p>
    </section>

    <!-- CALENDAR EMBED -->
    <section class="booking__calendar">
      <div class="calendar__wrapper">
        <iframe
          v-if="BASE_URL"
          :id="FRAME_ID"
          ref="iframeEl"
          :src="calendarUrl"
          :style="{ height: iframeHeight + 'px' }"
          title="Agenda tu reunión con ALCO"
          class="calendar__iframe"
          frameborder="0"
          :scrolling="autoHeight ? 'no' : 'yes'"
        ></iframe>
        <div v-else class="calendar__pending">
          <i class="fa-regular fa-calendar" aria-hidden="true"></i>
          <p>Estamos habilitando el calendario. Un asesor de ALCO te escribirá por WhatsApp para coordinar tu reunión.</p>
        </div>
      </div>

    </section>

    <!-- FOOTER -->
    <footer class="booking__footer">
      <div class="footer__links">
        <RouterLink to="/politicas-privacidad">Política de Privacidad</RouterLink>
        <span class="footer__sep">·</span>
        <RouterLink to="/aviso-legal">Aviso Legal</RouterLink>
      </div>
      <p class="footer__copy">
        © {{ new Date().getFullYear() }} ALCO. Todos los derechos reservados.
      </p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.booking {
  min-height: 100vh;
  background-color: #ffffff;
  color: colors.$ALCO-DARK;
  display: flex;
  flex-direction: column;
  align-items: center;

  // ── TOP BAR ──────────────────────────────────────────
  &__topbar {
    width: 100%;
    padding: 1rem 2rem;
    display: flex;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid rgba(11, 31, 51, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  &__logo {
    height: 26px;
    width: auto;
  }

  // ── STEPPER ──────────────────────────────────────────
  &__stepper {
    padding: 2rem 1rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  // ── HERO ─────────────────────────────────────────────
  &__hero {
    text-align: center;
    padding: 1.5rem 1.5rem 0.5rem;
    max-width: 600px;
  }

  &__title {
    font-family: fonts.$font-principal;
    font-weight: 800;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    line-height: 1.15;
    margin: 0 0 0.75rem;
    color: colors.$ALCO-DARK;
  }

  &__subtitle {
    font-family: fonts.$font-secondary;
    font-size: 1.05rem;
    color: rgba(11, 31, 51, 0.65);
    margin: 0;
    line-height: 1.6;
  }

  // ── CALENDAR ─────────────────────────────────────────
  &__calendar {
    width: 100%;
    max-width: 860px;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  // ── FOOTER ───────────────────────────────────────────
  &__footer {
    margin-top: auto;
    width: 100%;
    padding: 2rem 1.5rem;
    text-align: center;
    border-top: 1px solid rgba(11, 31, 51, 0.1);
  }
}

// ── STEPPER INTERNALS ─────────────────────────────────
.stepper {
  &__track {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  &__num {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: fonts.$font-accent;
    font-weight: 700;
    font-size: 0.9rem;
    border: 2px solid rgba(11, 31, 51, 0.2);
    color: rgba(11, 31, 51, 0.4);
    transition: all 0.3s ease;

    .stepper__step--done & {
      background: colors.$ALCO-GREEN;
      border-color: colors.$ALCO-GREEN;
      color: colors.$white;
    }

    .stepper__step--active & {
      background: colors.$ALCO-PRIMARY;
      border-color: colors.$ALCO-PRIMARY;
      color: colors.$white;
    }
  }

  &__label {
    font-family: fonts.$font-interface;
    font-size: 0.72rem;
    font-weight: 600;
    color: rgba(11, 31, 51, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.04em;

    .stepper__step--done & {
      color: colors.$ALCO-GREEN;
    }
    .stepper__step--active & {
      color: colors.$ALCO-DARK;
    }
  }

  &__line {
    width: 48px;
    height: 2px;
    background: rgba(11, 31, 51, 0.15);
    border-radius: 2px;

    &--done {
      background: colors.$ALCO-GREEN;
    }
  }

  &__caption {
    font-family: fonts.$font-interface;
    font-size: 0.8rem;
    color: rgba(11, 31, 51, 0.4);
    margin: 0;
  }
}

// ── CALENDAR INTERNALS ────────────────────────────────
.calendar {
  &__wrapper {
    width: 100%;
    border-radius: 16px;
    overflow: visible;
    border: 1px solid rgba(11, 31, 51, 0.12);
    background: #f2f5f8;
  }

  &__iframe {
    width: 100%;
    border: none;
    display: block;
    border-radius: 16px;
    background: #fff;
    -webkit-overflow-scrolling: touch;
  }
}

// ── FOOTER INTERNALS ──────────────────────────────────
.footer {
  &__links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;

    a {
      font-family: fonts.$font-interface;
      font-size: 0.8rem;
      color: rgba(11, 31, 51, 0.4);
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: colors.$ALCO-DARK;
      }
    }
  }

  &__sep {
    color: rgba(11, 31, 51, 0.2);
  }

  &__copy {
    font-family: fonts.$font-interface;
    font-size: 0.75rem;
    color: rgba(11, 31, 51, 0.35);
    margin: 0;
  }
}
.calendar__pending {
  padding: 64px 24px;
  text-align: center;
  font-family: fonts.$font-secondary;
  color: rgba(11, 31, 51, 0.72);
  line-height: 1.6;

  i {
    font-size: 2.5rem;
    color: colors.$ALCO-PRIMARY;
    margin-bottom: 16px;
  }

  p {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>
