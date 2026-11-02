import { GHL_CONTACT_WEBHOOK, postToWebhook } from '@/config/alco'

// Reutiliza el webhook de contacto: todos los webhooks de la subcuenta GHL
// actualizan el mismo contacto, así que un evento de tracking (etapa) es válido aquí.
export function generateEventId(prefix = 'evt'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export async function trackStage(etapa: string, data: Record<string, string> & { event_id?: string }) {
  const event_id = data.event_id ?? generateEventId('view')
  await postToWebhook(GHL_CONTACT_WEBHOOK, { etapa, event_id, ...data })
}
