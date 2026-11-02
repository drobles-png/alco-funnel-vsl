import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AlcoContact {
  nombre: string
  apellido: string
  negocio: string
  email: string
  telefono: string
  timestamp?: number
}

const STORAGE_KEY = 'alco_contact'

export const useContactStore = defineStore('contact', () => {
  const contact = ref<AlcoContact>({
    nombre: '',
    apellido: '',
    negocio: '',
    email: '',
    telefono: '',
  })

  // Hidrata desde localStorage al iniciar
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      Object.assign(contact.value, JSON.parse(stored))
    } catch { /* ignorar */ }
  }

  function save(data: Partial<AlcoContact>) {
    Object.assign(contact.value, data, { timestamp: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contact.value))
  }

  function get(): AlcoContact {
    return { ...contact.value }
  }

  function clear() {
    contact.value = { nombre: '', apellido: '', negocio: '', email: '', telefono: '' }
    localStorage.removeItem(STORAGE_KEY)
  }

  return { contact, save, get, clear }
})
