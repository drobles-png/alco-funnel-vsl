import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AlcoContact {
  nombre: string
  apellido: string
  /** Guarda el cantón (antes ciudad); se mantuvo el nombre por compatibilidad. */
  negocio: string
  /** Valor de PROVINCIAS (utils/qualification.ts). */
  provincia: string
  email: string
  telefono: string
  timestamp?: number
}

const PIXEL_ID = '1791691808756260' // el mismo de index.html

/**
 * Coincidencias avanzadas manuales del Pixel: re-inicia el pixel con los datos del contacto
 * (el Pixel los normaliza y cifra con SHA-256 antes de enviarlos). Llamar ANTES del fbq('track').
 */
export function pixelUserData(c: { email?: string; telefono?: string; nombre?: string; apellido?: string }) {
  const w = window as unknown as { fbq?: (...a: unknown[]) => void }
  if (!w.fbq || !c.email) return
  const data: Record<string, string> = { em: c.email.trim().toLowerCase() }
  const ph = (c.telefono ?? '').replace(/\D/g, '')
  if (ph) data.ph = ph
  if (c.nombre) data.fn = c.nombre.trim().toLowerCase()
  if (c.apellido) data.ln = c.apellido.trim().toLowerCase()
  w.fbq('init', PIXEL_ID, data)
}

const STORAGE_KEY = 'alco_contact'

export const useContactStore = defineStore('contact', () => {
  const contact = ref<AlcoContact>({
    nombre: '',
    apellido: '',
    negocio: '',
    provincia: '',
    email: '',
    telefono: '',
  })

  // Hidrata desde localStorage al iniciar
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      Object.assign(contact.value, JSON.parse(stored))
      pixelUserData(contact.value)
    } catch { /* ignorar */ }
  }

  function save(data: Partial<AlcoContact>) {
    Object.assign(contact.value, data, { timestamp: Date.now() })
    pixelUserData(contact.value)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contact.value))
  }

  function get(): AlcoContact {
    return { ...contact.value }
  }

  function clear() {
    contact.value = { nombre: '', apellido: '', negocio: '', provincia: '', email: '', telefono: '' }
    localStorage.removeItem(STORAGE_KEY)
  }

  return { contact, save, get, clear }
})
