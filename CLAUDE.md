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
pnpm dev --port 5174 --strictPort   # en localhost el CTA del video se libera a los 3 s, no hay guards y GHL va a consola ([GHL stub]; ?ghl=1 para enviar de verdad)
pnpm type-check
pnpm build        # type-check + build
# e2e (modo stub: nada sale a GHL ni a Meta). Usa los data-field / data-cta del formulario.
python3 ~/.claude/skills/landings-vsl/scripts/e2e_funnel.py --base http://localhost:5174 --steps e2e/agenda.json
```
Deploy: Vercel, equipo **Proyectos de Diego** (`proyectos-de-diego`), proyecto `alco-landing`. Cada push a `main` publica solo.

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
  ↓ RegistrationModal (nombre, apellido, email, teléfono, provincia, cantón) → CompleteRegistration
/ver-video (VideoView)                   Wistia + CTA bloqueado CTA_UNLOCK_SECONDS → CalendarModal
  ↓ CalendarModal (3-5 preguntas según perfil + "qué quieres lograr") → Lead si califica
/agendar (BookingView)                   iframe GHL → Schedule al recibir msgsndr-booking-complete
/cita-confirmada (BookedView)
/sin-espacio (NoSpaceView)               no califica → manda a Instagram de ALCO
/politicas-privacidad · /aviso-legal     (LegalLayout)
```
El campo `negocio` del store de contacto guarda el **cantón** (se manda como `ciudad` y `canton`; se mantuvo el nombre
por compatibilidad) y `provincia` guarda el valor de `PROVINCIAS`.

## Calificación — `src/utils/qualification.ts` (fuente de verdad)
Preguntas (pedido de ALCO, 2026-11-19): perfil (productor / prestador / ambos), cultivo principal (solo
productor o ambos; "Otro" abre un campo para escribirlo ahí mismo → `cultivo_otro`), ¿ya tienes dron?, ¿ya tienes clientes? (solo
prestador o ambos), cómo piensas invertir. Descalifica **solo** `inversion = sin_presupuesto`: productor y prestador
agendan igual. Provincia (lista) y cantón (texto, dato para el asesor) se piden en el registro. La zona ya no se
pregunta: `zona`/`zona_label` se calculan de la provincia (`zonaFromProvincia`) porque GHL ya los mapea.
Campos nuevos en GHL: `provincia`, `canton`, `cultivo`, `cultivo_label`, `cultivo_otro`; tags `provincia-*`,
`cultivo-*`, `zona-*`. Los valores viejos de `perfil` (agronomo, solo_info…) ya no llegan.
Las notas internas (`nota`/`notas`) que van a GHL llevan emojis a propósito para leerlas rápido en el CRM.

## LocalStorage
`alco_contact`, `alco_qualification`, `alco_disq_at` (bloquea 24 h), `alco_booked_at`. SessionStorage: `alco_fb`.

## Marca
- Azul ALCO `#004784` (sale del logo) · azul noche `#0B1F33` · azul profundo `#00345F` · amarillo sol
  `#F5B301` (CTA sobre azul) · verde cultivo `#2E9B4F` (checks) · fondo `#F2F5F8`. Ver `src/styles/colorVariables.module.scss`.
- Tipografías de la ficha: **Oswald** (títulos, mayúsculas) y **Open Sans** (textos).
- Logos en `src/assets/logos/`: `alco-mark.png` (bloque azul oficial), `alco-wordmark-blue.png`,
  `alco-wordmark-white.png`. Originales en `brand/`.

## Pendientes (2026-11-20)
- **Datos legales** (`LEGAL` en `src/config/alco.ts`): RUC, razón social, domicilio y correo → los manda ALCO.
  Bloquea la pauta: la política de privacidad muestra "Por confirmar".
- **Mapeo en GHL**: los campos `provincia`, `canton`, `cultivo_label` y `cultivo_otro` existen pero los workflows
  todavía no los llenan (acción "Crear / actualizar contacto", valor `{{inboundWebhookRequest.<campo>}}`).
- **Verificar deduplicación Pixel + CAPI** con el e2e en modo `meta` contra producción, con un código de prueba
  nuevo en `META_CAPI_TEST_EVENT_CODE` (y quitarlo al terminar).
- **Dominio**: la regla de Bakano es un solo dominio `alco-lng.vercel.app`; hoy está en `alco-landing.vercel.app`.
- **Meta**: confirmar los dominios `alco-landing.vercel.app` y `alco-funnel.vercel.app` (no `arlogs-lng`, que
  usaba el Pixel de ALCO por error; ya corregido en ARLOGS).

## No hacer
- No inventar cifras, testimonios, casos de clientes ni escasez (cupos). El único testimonio es el halago
  común de la ficha: "Ustedes sí me han ayudado con soluciones".
- No usar emojis en la UI visible.
- No poner `META_CAPI_TEST_EVENT_CODE` en producción.
