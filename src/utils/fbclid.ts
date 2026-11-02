/**
 * Captura fbclid, UTMs, _fbc y _fbp para atribución completa de Meta Ads.
 *
 * fbclid       → generado por Meta al hacer click en un anuncio
 * fbc          → cookie estándar Meta: fb.1.{ts}.{fbclid}
 * fbp          → cookie de browser ID de Meta (generada por el Pixel)
 * utm_source   → ej. "facebook", "meta"
 * utm_medium   → ej. "paid_ad", "paid"
 * utm_campaign → ej. "alco-tofu-lead"
 * utm_content  → ID o nombre del anuncio
 * utm_term     → ID del adset (opcional)
 * utm_id       → ID numérico de la campaña (opcional)
 */

const STORAGE_KEY = 'alco_fb'

export interface FbParams {
  fbclid: string
  fbc: string
  fbp: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  utm_id: string
}

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

function buildFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`
}

/**
 * Llama esto en el onMounted de FunnelView y VideoView.
 * Captura fbclid + UTMs de la URL y los persiste en sessionStorage. Fusiona con lo
 * ya guardado: un campo solo se reemplaza si llega en la URL actual, así pasar a
 * /ver-video (sin query) no borra los UTMs de la llegada.
 */
export function captureFbParams(): void {
  const params = new URLSearchParams(window.location.search)
  const fbclid = params.get('fbclid') ?? ''

  const existing = getStoredFbParams()
  const fromUrl = (key: keyof FbParams) => params.get(key) || existing[key]

  const data: FbParams = {
    fbclid: fbclid || existing.fbclid,
    fbc: fbclid ? buildFbc(fbclid) : existing.fbc,
    fbp: existing.fbp,
    utm_source:   fromUrl('utm_source'),
    utm_medium:   fromUrl('utm_medium'),
    utm_campaign: fromUrl('utm_campaign'),
    utm_content:  fromUrl('utm_content'),
    utm_term:     fromUrl('utm_term'),
    utm_id:       fromUrl('utm_id'),
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * Retorna todos los parámetros de atribución almacenados en esta sesión.
 * fbp/fbc se completan con las cookies vivas: el Pixel carga async y en la
 * primera captura la cookie _fbp todavía no existe.
 */
export function getStoredFbParams(): FbParams {
  let stored: FbParams = {
    fbclid: '', fbc: '', fbp: '',
    utm_source: '', utm_medium: '', utm_campaign: '',
    utm_content: '', utm_term: '', utm_id: '',
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) stored = { ...stored, ...(JSON.parse(raw) as Partial<FbParams>) }
  } catch { /* ignorar */ }
  return {
    ...stored,
    fbc: stored.fbc || getCookie('_fbc'),
    fbp: stored.fbp || getCookie('_fbp'),
  }
}
