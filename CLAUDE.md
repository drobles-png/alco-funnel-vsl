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
| `META_PIXEL_ID` | `1791691808756260` (también en `index.html`; `api/capi.ts` usa la env var `META_PIXEL_ID` y este valor como respaldo) |
| `WISTIA_MEDIA_ID` | `5z93sk0i44` (VSL de Fernando Alvear; si se vacía, `/ver-video` muestra "El video se publica en breve") |
| `IS_LOCALHOST` | `localhost` o `127.0.0.1`: sin Pixel/CAPI, sin guards, CTA a los 3 s y logs `[ALCO …]` en consola |
| `GHL_CONTACT_WEBHOOK` | "obtener contacto" (`…/efKzehSaLad0hXOluJS4`) — registro (completo/parcial) y `trackStage()` (lead_capturado, cita_agendada) |
| `GHL_QUALIFY_WEBHOOK` | "obtener cualificación" (`…/OqJuuzUQozzdvrm0PsYN`) — resultado de la calificación (CalendarModal) |
| `GHL_BOOKING_URL` | `widget/booking/xp4vosuWnsv4JofyU2BY` — se prellena con `first_name`/`last_name`/`email`/`phone` (+ `firstName`/`lastName` por compatibilidad) + fbclid/UTMs |
| `SITE_URL` | `https://alco-landing.vercel.app` (cambiar al conectar dominio; también en index.html, robots, sitemap) |
| `LEGAL` | RUC, domicilio y correo **por confirmar** con ALCO |

`META_CAPI_TOKEN` va solo en `.env.local` (local) y en las env vars de Vercel. Nunca en el código.
`META_CAPI_TEST_EVENT_CODE` solo se lee de env (nunca del body de la petición).

## Tracking
- **Localhost**: el Pixel de `index.html` no carga en `localhost`/`127.0.0.1` (el `<noscript>` se mantiene)
  y `sendCapiEvent()` retorna sin llamar a `/api/capi`. Las pruebas locales no ensucian los datos de ALCO.
- **CAPI** (`api/capi.ts`): Graph `v23.0`; hashea `em`, `ph` (solo dígitos), `fn`, `ln`. Los callers pasan
  `firstName`/`lastName` del contacto. Exige el mismo origen que la página (`Origin`/`Referer` = host; si no → 403),
  solo acepta `CompleteRegistration`, `ViewContent`, `Lead` y `Schedule` (otro → 400) y manda el token en el
  cuerpo, no en la URL.
- **Eventos** (Pixel + CAPI con el mismo `event_id`): `CompleteRegistration` (registro / gate de `/ver-video`),
  `ViewContent` (video), `Lead` (califica), `Schedule` (cita agendada).
- **Payloads GHL** — cambios solo aditivos: los workflows ya mapean los campos existentes (`etiquetas`,
  `estado_registro`, `qualification_status`, `resultado`, `*_label`, `telefonoDisplay`, etc.), no renombrar
  ni quitar ninguno. Todo envío lleva además:
  - `tags` (array; en la calificación = `etiquetas`) · `etapa` (`registro`, `registro_parcial`,
    `lead_capturado`, `cualificacion`, `cita_agendada`)
  - `nota` y `notas` con el mismo texto, armado por `buildNota()` (`src/utils/ghl.ts`): contacto, detalle del
    paso, línea "Origen" (fbclid/UTMs o "directo / orgánico"), fecha en America/Guayaquil y `event_id`
  - atribución de `getStoredFbParams()` (fbclid, fbc, fbp, utm_*). `trackStage()` la agrega siempre.
- **Calendario** (`/agendar`): carga `link.msgsndr.com/js/form_embed.js` una vez, el iframe tiene id
  `<calendarId>_<timestamp>` y ajusta el alto con `['highlevel.setHeight', {height}]` (y el formato viejo
  `booking-app`); al recibir el primer alto pasa a `scrolling="no"`.
- **SEO**: las rutas con `meta.noindex` (`/ver-video`, `/agendar`, `/cita-confirmada`, `/sin-espacio`) ponen
  `robots = noindex, nofollow` en `afterEach`; las públicas restauran `index, follow, max-image-preview:large`.

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
Las notas internas (`nota`/`notas`) que van a GHL llevan emojis a propósito para leerlas rápido en el CRM.

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
