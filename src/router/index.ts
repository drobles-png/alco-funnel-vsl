import { createRouter, createWebHistory, START_LOCATION, type RouteMeta } from 'vue-router'
import FunnelView from '../views/FunnelView.vue'
import VideoView from '../views/VideoView.vue'
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue'
import LegalNoticeView from '../views/LegalNoticeView.vue'
import BookingView from '../views/BookingView.vue'
import BookedView from '../views/BookedView.vue'
import NoSpaceView from '../views/NoSpaceView.vue'
import { SITE_URL } from '../config/alco'

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    description: string
    canonical: string
    ogTitle: string
    ogDescription: string
    ogUrl: string
    jsonLd?: object[]
  }
}

// ── Router ─────────────────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0, behavior: 'instant' }),
  routes: [
    {
      path: '/',
      alias: '/negocio-drones',
      name: 'funnel',
      component: FunnelView,
      meta: {
        title: 'ALCO | Arranca tu negocio de fumigación con drones en la Costa',
        description:
          'Te contamos cómo arrancar tu negocio de fumigación con drones DJI Agras: el equipo, la capacitación agronómica de la Academia EAD y el respaldo de ALCO desde 2015.',
        canonical: `${SITE_URL}/`,
        ogTitle: 'Arranca tu negocio de fumigación con drones | ALCO',
        ogDescription: 'Equipo DJI Agras en stock, Academia EAD y respaldo de ALCO para que des servicio de fumigación con drones en la Costa.',
        ogUrl: `${SITE_URL}/`,
      } satisfies RouteMeta,
    },
    {
      path: '/ver-video',
      name: 'video',
      component: VideoView,
      meta: {
        title: 'Mira el video | ALCO — Paso 1 de 2',
        description:
          'Fernando Alvear, de ALCO, te cuenta cómo funciona el negocio de fumigación con drones y qué necesitas para arrancar.',
        canonical: `${SITE_URL}/ver-video`,
        ogTitle: 'Mira el video | ALCO',
        ogDescription: 'Cómo arrancar tu negocio de fumigación con drones, sin adornos.',
        ogUrl: `${SITE_URL}/ver-video`,
      } satisfies RouteMeta,
    },
    {
      path: '/agendar',
      name: 'booking',
      component: BookingView,
      meta: {
        title: 'Agenda tu reunión | ALCO — Paso 2 de 2',
        description:
          'Elige el día y la hora para conversar con ALCO sobre tu negocio de fumigación con drones.',
        canonical: `${SITE_URL}/agendar`,
        ogTitle: 'Agenda tu reunión | ALCO',
        ogDescription: 'Elige tu horario y conversemos de tu caso.',
        ogUrl: `${SITE_URL}/agendar`,
      } satisfies RouteMeta,
    },
    {
      path: '/cita-confirmada',
      name: 'booked',
      component: BookedView,
      meta: {
        title: 'Reunión confirmada | ALCO',
        description:
          'Tu reunión con ALCO está confirmada. Revisa tu correo para ver los detalles.',
        canonical: `${SITE_URL}/cita-confirmada`,
        ogTitle: 'Reunión confirmada | ALCO',
        ogDescription: 'Tu reunión con ALCO está reservada. Te escribiremos pronto.',
        ogUrl: `${SITE_URL}/cita-confirmada`,
      } satisfies RouteMeta,
    },
    {
      path: '/sin-espacio',
      name: 'no-space',
      component: NoSpaceView,
      meta: {
        title: 'Todavía no es el momento | ALCO',
        description:
          'Por ahora no hay una reunión disponible para tu caso. Sigue aprendiendo con ALCO en Instagram.',
        canonical: `${SITE_URL}/sin-espacio`,
        ogTitle: 'Todavía no es el momento | ALCO',
        ogDescription: 'Sigue aprendiendo con ALCO mientras tanto.',
        ogUrl: `${SITE_URL}/sin-espacio`,
      } satisfies RouteMeta,
    },
    {
      path: '/politicas-privacidad',
      name: 'privacy-policy',
      component: PrivacyPolicyView,
      meta: {
        title: 'Política de Privacidad | ALCO',
        description:
          'Política de privacidad de ALCO conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador.',
        canonical: `${SITE_URL}/politicas-privacidad`,
        ogTitle: 'Política de Privacidad | ALCO',
        ogDescription: 'Política de privacidad de ALCO.',
        ogUrl: `${SITE_URL}/politicas-privacidad`,
      } satisfies RouteMeta,
    },
    {
      path: '/aviso-legal',
      name: 'legal-notice',
      component: LegalNoticeView,
      meta: {
        title: 'Aviso Legal | ALCO',
        description:
          'Aviso legal y condiciones de uso del sitio de ALCO.',
        canonical: `${SITE_URL}/aviso-legal`,
        ogTitle: 'Aviso Legal | ALCO',
        ogDescription: 'Aviso legal de ALCO.',
        ogUrl: `${SITE_URL}/aviso-legal`,
      } satisfies RouteMeta,
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// ── SEO dinámico por ruta ──────────────────────────────────────────────────────
const setMeta = (name: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

const setOgMeta = (property: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}

const setCanonical = (href: string) => {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

router.afterEach((to, from) => {
  // index.html ya dispara el PageView de la carga inicial; acá solo las navegaciones SPA
  if (from !== START_LOCATION && to.path !== from.path) {
    ;(window as any).fbq?.('track', 'PageView')
  }

  const meta = to.meta
  document.title = meta.title ?? 'ALCO'
  setMeta('description', meta.description ?? '')
  setOgMeta('og:title', meta.ogTitle ?? meta.title ?? '')
  setOgMeta('og:description', meta.ogDescription ?? meta.description ?? '')
  setOgMeta('og:url', meta.ogUrl ?? '')
  setOgMeta('twitter:title', meta.ogTitle ?? meta.title ?? '')
  setOgMeta('twitter:description', meta.ogDescription ?? meta.description ?? '')
  setCanonical(meta.canonical ?? '')
})

export default router
