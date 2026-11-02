# ALCO — Funnel VSL "Negocio de fumigación con drones"

## Proyecto
Landing / funnel de **ALCO** (drones de fumigación agrícola desde 2015, Ecuador).
Instagram: https://www.instagram.com/alcoagrotecnologia/ · Facebook: https://www.facebook.com/profile.php?id=100064036120272

Vende la idea de **arrancar un negocio de servicio de fumigación con drones en la Costa** con tres apoyos:
equipo DJI Agras (T55, T70P, T100) en stock, la **Academia EAD** (Escuela de Agrodrones: manejo agronómico
aplicado al dron + cómo hacer negocio) y el respaldo posventa de ALCO. Vocero del VSL: **Fernando Alvear**.
El CTA final es **agendar una reunión** (zona, clientes, qué quiere lograr).

Se armó desde la plantilla de funnel VSL de Bakano (vía la versión de DOX) y se rebrandeó por completo:
no debe quedar ninguna mención a Bakano ni a otro cliente.

## Stack
Vue 3 + Vite 7 + TypeScript · SCSS · Pinia · vue-router · GSAP (solo en BookedHero) · pnpm ·
Font Awesome 6 por CDN (sin emojis en la UI) · función serverless de Vercel `api/capi.ts` (Meta CAPI).

## Comandos
```bash
pnpm install
pnpm dev          # http://localhost:5173 (en localhost el CTA del video se libera a los 3 s y no hay guards)
pnpm type-check
pnpm build        # type-check + build
```

## Configuración central — `src/config/alco.ts`
Todo lo que cambia por integración vive ahí. Si un valor está vacío, ese envío se omite sin romper el flujo.
| Constante | Estado |
|---|---|
| `META_PIXEL_ID` | `1791691808756260` (también hardcodeado en `index.html` y `api/capi.ts`) |
| `WISTIA_MEDIA_ID` | **PENDIENTE** — mientras esté vacío, `/ver-video` muestra "El video se publica en breve" |
| `GHL_CONTACT_WEBHOOK` | "obtener contacto" (`…/efKzehSaLad0hXOluJS4`) — registro (completo/parcial) y `trackStage()` (lead_capturado, cita_agendada) |
| `GHL_QUALIFY_WEBHOOK` | "obtener cualificación" (`…/OqJuuzUQozzdvrm0PsYN`) — resultado de la calificación (CalendarModal) |
| `GHL_BOOKING_URL` | `widget/booking/xp4vosuWnsv4JofyU2BY` — se prellena con nombre/email/teléfono + fbclid/UTMs |
| `SITE_URL` | `https://alco-landing.vercel.app` (cambiar al conectar dominio; también en index.html, robots, sitemap) |
| `LEGAL` | RUC, domicilio y correo **por confirmar** con ALCO |

`META_CAPI_TOKEN` va solo en `.env.local` (local) y en las env vars de Vercel. Nunca en el código.

## Flujo
```
/ (FunnelView, alias /negocio-drones)   hero azul + tarjeta VSL → abre RegistrationModal
  ↓ RegistrationModal (nombre, apellido, email, teléfono, ciudad) → CompleteRegistration
/ver-video (VideoView)                   Wistia + CTA bloqueado CTA_UNLOCK_SECONDS → CalendarModal
  ↓ CalendarModal (5 preguntas + "qué quieres lograr") → Lead si califica
/agendar (BookingView)                   iframe GHL → Schedule al recibir msgsndr-booking-complete
/cita-confirmada (BookedView)
/sin-espacio (NoSpaceView)               no califica → manda a Instagram de ALCO
/politicas-privacidad · /aviso-legal     (LegalLayout)
```
El campo `negocio` del store de contacto guarda la **ciudad** (se mantuvo el nombre por compatibilidad).

## Calificación — `src/utils/qualification.ts` (fuente de verdad)
Preguntas: perfil, ¿ya tienes dron?, ¿ya tienes clientes?, zona, cómo piensas invertir. Descalifica solo
`perfil = solo_info` o `inversion = sin_presupuesto`. Zona y clientes no descalifican: son info para el asesor.
Las notas internas (`nota`) que van a GHL llevan emojis a propósito para leerlas rápido en el CRM.

## LocalStorage
`alco_contact`, `alco_qualification`, `alco_disq_at` (bloquea 24 h), `alco_booked_at`. SessionStorage: `alco_fb`.

## Marca
- Azul ALCO `#004784` (sale del logo) · azul noche `#0B1F33` · azul profundo `#00345F` · amarillo sol
  `#F5B301` (CTA sobre azul) · verde cultivo `#2E9B4F` (checks) · fondo `#F2F5F8`. Ver `src/styles/colorVariables.module.scss`.
- Tipografías de la ficha: **Oswald** (títulos, mayúsculas) y **Open Sans** (textos).
- Logos en `src/assets/logos/`: `alco-mark.png` (bloque azul oficial), `alco-wordmark-blue.png`,
  `alco-wordmark-white.png`. Originales en `brand/`.

## No hacer
- No inventar cifras, testimonios, casos de clientes ni escasez (cupos). El único testimonio es el halago
  común de la ficha: "Ustedes sí me han ayudado con soluciones".
- No usar emojis en la UI visible.
- No poner `META_CAPI_TEST_EVENT_CODE` en producción.
