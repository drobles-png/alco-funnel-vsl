import { GHL_CONTACT_WEBHOOK, postToWebhook } from '@/config/alco'
import { getStoredFbParams } from './fbclid'

// Reutiliza el webhook de contacto: todos los webhooks de la subcuenta GHL
// actualizan el mismo contacto, así que un evento de tracking (etapa) es válido aquí.
export function generateEventId(prefix = 'evt'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const SEP = '━━━━━━━━━━━━━━━━━━━━━━━━'

/**
 * Nota legible para el CRM: datos del contacto, detalle de la etapa y atribución de Meta
 * (fbclid/UTMs), con fecha en hora de Ecuador y el event_id.
 * Se manda como `nota` y `notas` para que el workflow de GHL la tome con cualquiera de los dos.
 * Lleva emojis a propósito para leerla rápido en el CRM.
 *
 * @param titulo     primera línea completa (ej. "📅 CITA AGENDADA — ALCO Funnel (...)")
 * @param contacto   datos del contacto; `pais` es opcional
 * @param secciones  bloques de líneas ya formateadas, separados entre sí por una línea
 */
export function buildNota(
  titulo: string,
  contacto: {
    nombre?: string
    apellido?: string
    ciudad?: string
    email?: string
    telefono?: string
    pais?: string
  },
  secciones: string[][] = [],
  eventId = '',
): string {
  const fb = getStoredFbParams()
  const atribucion = [
    ['fbclid', fb.fbclid],
    ['utm_source', fb.utm_source],
    ['utm_medium', fb.utm_medium],
    ['utm_campaign', fb.utm_campaign],
    ['utm_content', fb.utm_content],
    ['utm_term', fb.utm_term],
    ['utm_id', fb.utm_id],
  ].filter(([, v]) => v)

  return [
    titulo,
    SEP,
    `👤 ${`${contacto.nombre ?? ''} ${contacto.apellido ?? ''}`.trim() || '—'}`,
    `🏙️ Ciudad: ${contacto.ciudad || '—'}`,
    `📧 ${contacto.email || '—'}`,
    `📱 ${contacto.telefono || '—'}`,
    ...(contacto.pais ? [`🌎 País: ${contacto.pais}`] : []),
    ...secciones.filter((s) => s.length).flatMap((s) => [SEP, ...s]),
    SEP,
    atribucion.length
      ? `📣 Origen: ${atribucion.map(([k, v]) => `${k}=${v}`).join(' · ')}`
      : '📣 Origen: directo / orgánico (sin fbclid ni UTM)',
    `🕐 ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`,
    ...(eventId ? [`🔑 event_id: ${eventId}`] : []),
  ].join('\n')
}

// Avance de etapa del mismo contacto por el webhook de contacto.
// Incluye siempre la atribución (fbclid/UTMs/fbc/fbp); lo que llegue en `data` tiene prioridad.
export async function trackStage(etapa: string, data: Record<string, unknown> & { event_id?: string }) {
  const event_id = data.event_id ?? generateEventId('view')
  await postToWebhook(GHL_CONTACT_WEBHOOK, { etapa, event_id, ...getStoredFbParams(), ...data })
}
