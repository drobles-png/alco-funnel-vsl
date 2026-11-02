import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'crypto'

// Conversions API server-side de Meta — espeja los eventos del Pixel del navegador
// para mejorar el match rate y sobrevivir a bloqueadores de anuncios / ITP.
// El access token vive solo en env vars de Vercel, nunca en el bundle del cliente.
const PIXEL_ID = '1791691808756260'
const GRAPH_VERSION = 'v21.0'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

interface CapiRequestBody {
  event_name?: string
  event_id?: string
  event_source_url?: string
  user_data?: {
    email?: string
    phone?: string
    fbc?: string
    fbp?: string
  }
  custom_data?: Record<string, unknown>
  // Solo para pruebas manuales en Events Manager → Probar eventos; la app nunca lo envía
  test_event_code?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const token = process.env.META_CAPI_TOKEN
  if (!token) {
    // Token no configurado todavía — no bloquear al cliente, solo omitir el envío.
    res.status(200).json({ skipped: true })
    return
  }

  const { event_name, event_id, event_source_url, user_data = {}, custom_data = {}, test_event_code } =
    (req.body ?? {}) as CapiRequestBody
  const testEventCode = test_event_code || process.env.META_CAPI_TEST_EVENT_CODE

  if (!event_name || !event_id) {
    res.status(400).json({ error: 'event_name y event_id son requeridos' })
    return
  }

  const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)
    ?.split(',')[0]
    ?.trim()

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        event_source_url,
        action_source: 'website',
        user_data: {
          em: user_data.email ? [sha256(user_data.email)] : undefined,
          ph: user_data.phone ? [sha256(normalizePhone(user_data.phone))] : undefined,
          fbc: user_data.fbc || undefined,
          fbp: user_data.fbp || undefined,
          client_ip_address: forwardedFor,
          client_user_agent: req.headers['user-agent'],
        },
        custom_data,
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
    const json = await metaRes.json()
    res.status(metaRes.ok ? 200 : 502).json(json)
  } catch {
    res.status(502).json({ error: 'CAPI request failed' })
  }
}
