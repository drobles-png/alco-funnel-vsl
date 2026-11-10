// ── Configuración central del funnel de ALCO ──────────────────────────────────
// Todo lo que cambia por integración vive aquí. Los valores vacíos están pendientes:
// mientras estén vacíos, el envío correspondiente se omite sin romper el flujo.

/** Meta Pixel de ALCO (el token de CAPI vive solo en la env var META_CAPI_TOKEN de Vercel). */
export const META_PIXEL_ID = '1791691808756260'

/** Media-id de Wistia del VSL de Fernando Alvear. */
export const WISTIA_MEDIA_ID = '5z93sk0i44'

/** En local (localhost o 127.0.0.1) no se envía Pixel ni CAPI, no hay guards y el CTA se libera a los 3 s. */
export const IS_LOCALHOST = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)

/** Webhook de GHL "obtener contacto" (registro completo/parcial y tracking de etapas). */
export const GHL_CONTACT_WEBHOOK =
  'https://services.leadconnectorhq.com/hooks/8udpWTKK6MRtnowbKO10/webhook-trigger/efKzehSaLad0hXOluJS4'

/** Webhook de GHL "obtener cualificación" (resultado del CalendarModal). */
export const GHL_QUALIFY_WEBHOOK =
  'https://services.leadconnectorhq.com/hooks/8udpWTKK6MRtnowbKO10/webhook-trigger/OqJuuzUQozzdvrm0PsYN'

/** Widget de calendario de GHL para agendar la reunión. */
export const GHL_BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/xp4vosuWnsv4JofyU2BY'

/** Segundos que el CTA de agendar queda bloqueado en /ver-video (el VSL dura 9:21). */
export const CTA_UNLOCK_SECONDS = 120

export const BRAND = {
  name: 'ALCO',
  legalName: 'ALCO',
  spokesperson: 'Fernando Alvear',
  academy: 'Academia EAD (Escuela de Agrodrones)',
  instagram: 'https://www.instagram.com/alcoagrotecnologia/',
  instagramHandle: '@alcoagrotecnologia',
  facebook: 'https://www.facebook.com/profile.php?id=100064036120272',
} as const

export async function postToWebhook(url: string, body: unknown): Promise<void> {
  if (!url) {
    if (IS_LOCALHOST) console.info('[ALCO] webhook sin configurar', body)
    return
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // silencioso — nunca bloquear la UX por un fallo de tracking
  }
}

/** Dominio público del funnel (canonical/og:url). Actualizar cuando se conecte el dominio final. */
export const SITE_URL = 'https://alco-landing.vercel.app'

/** Datos legales para las páginas de privacidad y aviso legal. PENDIENTE: confirmar con ALCO. */
export const LEGAL = {
  razonSocial: 'ALCO',
  ruc: 'Por confirmar',
  domicilio: 'Ecuador',
  email: 'Por confirmar',
  actividad:
    'Venta de drones de fumigación agrícola DJI Agras, servicio posventa (mantenimiento preventivo y correctivo) y capacitación a través de la Academia EAD (Escuela de Agrodrones).',
} as const
