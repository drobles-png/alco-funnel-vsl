<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, type Directive } from 'vue'
import { useRouter } from 'vue-router'
import RegistrationModal from '@/components/RegistrationModal.vue'
import { captureFbParams } from '@/utils/fbclid'
import { BRAND } from '@/config/alco'
import alcoMark from '@/assets/logos/alco-mark.png'
import alcoWhite from '@/assets/logos/alco-wordmark-white.png'

const router = useRouter()
const modalOpen = ref(false)

const IS_DEV = window.location.hostname === 'localhost'

const openModal = () => {
  if (!IS_DEV) {
    const disqAt = localStorage.getItem('alco_disq_at')
    if (disqAt && Date.now() - Number(disqAt) < 24 * 60 * 60 * 1000) {
      router.push('/sin-espacio')
      return
    }
  }
  modalOpen.value = true
}

// ── Contenido: sale del guion del VSL de Fernando Alvear y de la ficha de ALCO.
// No inventar cifras, testimonios ni resultados.
const audience = [
  'Estudiaste agronomía',
  'Vienes de una familia de agricultores',
  'Buscas un negocio con demanda de verdad',
]

const crops = ['Banano', 'Arroz', 'Cacao', 'Maíz']

const needs = [
  {
    num: '01',
    icon: 'fa-helicopter',
    title: 'Un equipo confiable',
    text: 'Trabajamos con DJI Agras, la marca con la que trabaja la gran mayoría del mercado, y la tenemos en stock para que empieces cuanto antes.',
    tags: ['Agras T55', 'Agras T70P', 'Agras T100'],
  },
  {
    num: '02',
    icon: 'fa-seedling',
    title: 'Saber fumigar bien',
    text: 'Volar un dron es fácil; fumigar bien es otra cosa. En la Academia EAD aprendes qué producto, qué dosis y en qué momento aplicar, para que llegues a la finca de tu cliente con criterio profesional.',
    tags: ['Manejo agronómico', 'No es un curso de pilotaje'],
  },
  {
    num: '03',
    icon: 'fa-handshake',
    title: 'Saber hacer negocio',
    text: 'En la academia también aprendes a conseguir tus primeros clientes, a cobrar tu servicio y a hacer que tu dron trabaje para ti.',
    tags: ['Primeros clientes', 'Cómo cobrar'],
  },
]

const backing = [
  { icon: 'fa-boxes-stacked', title: 'Repuestos en stock', text: 'Para que un daño no te deje parado en plena temporada.' },
  { icon: 'fa-screwdriver-wrench', title: 'Mantenimiento preventivo', text: 'Tu equipo revisado antes de que falle, no después.' },
  { icon: 'fa-people-group', title: 'Equipo de apoyo', text: 'Para que nunca le quedes mal a un cliente.' },
  { icon: 'fa-route', title: 'Acompañamiento', text: 'Desde tu primer vuelo hasta que tu negocio esté andando, y después también.' },
]

const fit = [
  {
    yes: true,
    title: 'Sí es para ti',
    text: 'Si quieres dar servicio de fumigación con dron a los agricultores de tu zona y tomarlo como un negocio en serio.',
  },
  {
    yes: true,
    title: 'Sí es para ti',
    text: 'Si ya fumigas o tienes finca y quieres hacerlo con criterio agronómico y un equipo que no te deje botado.',
  },
  {
    yes: false,
    title: 'No es para ti',
    text: 'Si buscas un juguete para volar o una plata rápida sin aprender a fumigar bien.',
  },
]

const meetingTopics = [
  { icon: 'fa-location-dot', title: 'Tu zona', text: 'Dónde estás y qué cultivos tienes cerca.' },
  { icon: 'fa-users', title: 'Tus clientes', text: 'Si ya tienes o vas a empezar desde cero.' },
  { icon: 'fa-bullseye', title: 'Tu meta', text: 'Qué quieres lograr con tu negocio.' },
]

const showStickyCta = ref(false)
const onScroll = () => {
  showStickyCta.value = window.scrollY > 760
}

// ── Reveal on scroll (sutil, respeta prefers-reduced-motion) ────────────────
let revealObserver: IntersectionObserver | null = null
const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    if (!revealObserver) return
    el.classList.add('reveal')
    revealObserver.observe(el)
  },
}

if (
  typeof IntersectionObserver !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--in')
          revealObserver?.unobserve(entry.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )
}

onMounted(() => {
  captureFbParams()
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  revealObserver?.disconnect()
})
</script>

<template>
  <div class="funnel">
    <!-- ══════════════ TOP BAR ══════════════ -->
    <header class="topbar">
      <div class="wrap topbar__inner">
        <img :src="alcoMark" alt="ALCO" class="topbar__logo" width="68" height="40" />
        <span class="topbar__tag">Drones de fumigación · Desde 2015</span>
      </div>
    </header>

    <!-- ══════════════ HERO ══════════════ -->
    <section class="hero" aria-labelledby="funnel-headline">
      <div class="hero__rows" aria-hidden="true" />
      <div class="wrap hero__inner">
        <ul class="hero__audience" role="list">
          <li v-for="a in audience" :key="a">
            <i class="fa-solid fa-check" aria-hidden="true"></i>{{ a }}
          </li>
        </ul>

        <h1 id="funnel-headline" class="hero__headline">
          Arranca tu negocio de
          <span class="hero__headline-hl">fumigación con drones</span>
          en la Costa
        </h1>

        <p class="hero__sub">
          Un negocio que está creciendo y que muy poca gente está aprovechando bien. Fernando
          Alvear te cuenta cómo funciona, sin adornos.
        </p>

        <div
          class="vsl"
          role="button"
          tabindex="0"
          aria-label="Ver el video completo"
          @click="openModal()"
          @keydown.enter="openModal()"
          @keydown.space.prevent="openModal()"
        >
          <div class="vsl__screen">
            <img :src="alcoWhite" alt="" class="vsl__brand" aria-hidden="true" />
            <span class="vsl__play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
            <span class="vsl__caption">
              <strong>Fernando Alvear</strong>
              <span>ALCO · Video de 6 minutos</span>
            </span>
            <span class="vsl__sound" aria-hidden="true">
              <i class="fa-solid fa-volume-high"></i> Sube el volumen
            </span>
          </div>
        </div>

        <div class="hero__cta">
          <button class="btn btn--sun btn--lg" @click="openModal()">
            <i class="fa-solid fa-play" aria-hidden="true"></i>
            Ver el video completo
          </button>
          <p class="hero__note">
            <i class="fa-solid fa-lock" aria-hidden="true"></i>
            Sin costo · Solo te pedimos tus datos para mostrártelo
          </p>
        </div>
      </div>
    </section>

    <!-- ══════════════ CULTIVOS ══════════════ -->
    <section class="crops" aria-label="Cultivos que necesitan fumigación">
      <div class="wrap crops__inner">
        <p class="crops__label">Lo que se fumiga en la Costa</p>
        <ul class="crops__list" role="list">
          <li v-for="c in crops" :key="c">{{ c }}</li>
        </ul>
      </div>
    </section>

    <!-- ══════════════ LA OPORTUNIDAD ══════════════ -->
    <section class="section" aria-labelledby="opp-heading">
      <div class="wrap">
        <header v-reveal class="head">
          <span class="eyebrow">La oportunidad</span>
          <h2 id="opp-heading" class="h2">
            Los agricultores esperan.
            <span class="hl">Los que fumigan no alcanzan.</span>
          </h2>
        </header>

        <div class="opp">
          <article v-reveal class="opp__card">
            <span class="opp__icon" aria-hidden="true"><i class="fa-solid fa-tractor"></i></span>
            <h3 class="opp__title">Miles de fincas, poco servicio</h3>
            <p>
              En la Costa hay miles de agricultores pequeños y medianos que necesitan fumigar
              varias veces por temporada. La mayoría no tiene su propio equipo y depende de alguien
              que le preste el servicio.
            </p>
          </article>
          <article v-reveal class="opp__card">
            <span class="opp__icon" aria-hidden="true"><i class="fa-solid fa-hourglass-half"></i></span>
            <h3 class="opp__title">Ahí está tu espacio</h3>
            <p>
              Los que hoy prestan servicio no alcanzan: los agricultores esperan, se cansan y
              buscan a otro. Ese "otro" puedes ser tú.
            </p>
          </article>
        </div>

        <aside v-reveal class="nino">
          <span class="nino__icon" aria-hidden="true"><i class="fa-solid fa-cloud-showers-heavy"></i></span>
          <div>
            <strong class="nino__title">Y la demanda va a crecer</strong>
            <p>
              Con El Niño vienen más lluvia, más hongos y más plagas. Todos van a necesitar
              fumigar al mismo tiempo, y los que tengan dron y sepan usarlo bien van a tener
              trabajo.
            </p>
          </div>
        </aside>
      </div>
    </section>

    <!-- ══════════════ LO QUE NECESITAS ══════════════ -->
    <section class="section section--alt" aria-labelledby="needs-heading">
      <div class="wrap">
        <header v-reveal class="head head--center">
          <span class="eyebrow">Para arrancar</span>
          <h2 id="needs-heading" class="h2">
            Necesitas <span class="hl">tres cosas.</span> Te ayudamos con las tres.
          </h2>
        </header>

        <div class="needs">
          <article v-for="n in needs" :key="n.num" v-reveal class="need">
            <div class="need__top">
              <span class="need__num" aria-hidden="true">{{ n.num }}</span>
              <span class="need__icon" aria-hidden="true"><i :class="['fa-solid', n.icon]"></i></span>
            </div>
            <h3 class="need__title">{{ n.title }}</h3>
            <p class="need__text">{{ n.text }}</p>
            <ul class="need__tags" role="list">
              <li v-for="t in n.tags" :key="t">{{ t }}</li>
            </ul>
          </article>
        </div>

        <p v-reveal class="needs__note">
          <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>
          La capacitación es en la {{ BRAND.academy }}. Tú decides si la tomas.
        </p>

        <div v-reveal class="center-cta">
          <button class="btn" @click="openModal()">
            Quiero ver cómo arrancar
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- ══════════════ RESPALDO ALCO ══════════════ -->
    <section class="section section--blue" aria-labelledby="backing-heading">
      <div class="wrap">
        <header v-reveal class="head">
          <span class="eyebrow eyebrow--light">El respaldo de ALCO</span>
          <h2 id="backing-heading" class="h2 h2--light">
            Cuando das servicio, <span class="hl hl--sun">cada día de trabajo cuenta.</span>
          </h2>
          <p class="lead lead--light">
            Por eso, como valor agregado, te damos respaldo para tu equipo.
          </p>
        </header>

        <div class="backing">
          <div v-for="b in backing" :key="b.title" v-reveal class="backing__item">
            <i :class="['fa-solid', b.icon]" aria-hidden="true"></i>
            <strong>{{ b.title }}</strong>
            <span>{{ b.text }}</span>
          </div>
        </div>

        <blockquote v-reveal class="quote">
          <p>Ustedes sí me han ayudado con soluciones.</p>
          <footer>Lo que más nos dicen nuestros clientes</footer>
        </blockquote>

        <p v-reveal class="backing__close">
          Somos un equipo pequeño y ágil, pioneros en drones de fumigación desde 2015.
          <strong>Cuando a ti te va bien, nos va bien a todos.</strong>
        </p>
      </div>
    </section>

    <!-- ══════════════ ¿ES PARA TI? ══════════════ -->
    <section class="section" aria-labelledby="fit-heading">
      <div class="wrap">
        <header v-reveal class="head head--center">
          <span class="eyebrow">Antes de seguir</span>
          <h2 id="fit-heading" class="h2">¿Es <span class="hl">para ti?</span></h2>
        </header>

        <div class="fit">
          <div
            v-for="(f, i) in fit"
            :key="i"
            v-reveal
            :class="['fit__item', { 'fit__item--no': !f.yes }]"
          >
            <span class="fit__mark" aria-hidden="true">
              <i :class="['fa-solid', f.yes ? 'fa-check' : 'fa-xmark']"></i>
            </span>
            <h3 class="fit__title">{{ f.title }}</h3>
            <p class="fit__text">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════ CIERRE ══════════════ -->
    <section class="closing" aria-labelledby="closing-heading">
      <div class="wrap closing__inner">
        <div v-reveal class="closing__head">
          <span class="eyebrow eyebrow--light">Siguiente paso</span>
          <h2 id="closing-heading" class="closing__title">
            Mira el video y agendemos una reunión
          </h2>
          <p class="closing__sub">
            Conocemos tu caso y te armamos el camino: el equipo, el curso de la academia y el
            acompañamiento hasta que tu negocio esté andando.
          </p>
        </div>

        <ol v-reveal class="topics" role="list">
          <li v-for="t in meetingTopics" :key="t.title" class="topics__item">
            <i :class="['fa-solid', t.icon]" aria-hidden="true"></i>
            <strong>{{ t.title }}</strong>
            <span>{{ t.text }}</span>
          </li>
        </ol>

        <div v-reveal class="closing__cta">
          <button class="btn btn--sun btn--lg" @click="openModal()">
            <i class="fa-solid fa-play" aria-hidden="true"></i>
            Ver el video completo
          </button>
          <p class="closing__note">
            El campo necesita gente que sepa hacerlo bien. Nosotros te ayudamos a ser una de ellas.
          </p>
        </div>
      </div>
    </section>

    <!-- ══════════════ STICKY CTA ══════════════ -->
    <Transition name="sticky">
      <div v-if="showStickyCta && !modalOpen" class="sticky" role="region" aria-label="Ver el video">
        <div class="sticky__copy">
          <strong>Negocio de fumigación con drones</strong>
          <span>Video de Fernando Alvear · 6 min</span>
        </div>
        <button class="sticky__btn" @click="openModal()">
          Ver video
          <i class="fa-solid fa-play" aria-hidden="true"></i>
        </button>
      </div>
    </Transition>

    <RegistrationModal :open="modalOpen" @close="modalOpen = false" />

    <!-- ══════════════ FOOTER ══════════════ -->
    <footer class="footer" aria-label="Pie de página">
      <div class="wrap">
        <img :src="alcoMark" alt="ALCO" class="footer__logo" width="68" height="40" />
        <nav class="footer__links" aria-label="Redes y legal">
          <a :href="BRAND.instagram" target="_blank" rel="noopener noreferrer">
            <i class="fa-brands fa-instagram" aria-hidden="true"></i> Instagram
          </a>
          <a :href="BRAND.facebook" target="_blank" rel="noopener noreferrer">
            <i class="fa-brands fa-facebook" aria-hidden="true"></i> Facebook
          </a>
          <RouterLink to="/politicas-privacidad">Política de privacidad</RouterLink>
          <RouterLink to="/aviso-legal">Aviso legal</RouterLink>
        </nav>
        <p class="footer__copy">© {{ new Date().getFullYear() }} ALCO. Todos los derechos reservados.</p>
        <p class="footer__disclaimer">
          Esta página es operada por <strong>ALCO</strong>. DJI y Agras son marcas de sus
          respectivos dueños. Los resultados de cada negocio dependen de la zona, los clientes y
          el trabajo de cada persona. Este sitio no está respaldado por Meta Platforms, Inc. ni
          forma parte de Facebook.
        </p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;
@use 'sass:color';

$blue: colors.$ALCO-PRIMARY;
$deep: colors.$ALCO-DEEP;
$ink: colors.$ALCO-DARK;
$sun: colors.$ALCO-SUN;
$green: colors.$ALCO-GREEN;
$bg-alt: colors.$ALCO-LIGHT;
$line: rgba($ink, 0.12);
$body: rgba($ink, 0.74);
$ease: cubic-bezier(0.23, 1, 0.32, 1);

.funnel {
  font-family: fonts.$font-secondary;
  color: $ink;
  background: #fff;
  overflow-x: clip;
}

.wrap {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 20px;

  @media (min-width: 768px) {
    padding: 0 32px;
  }
}

// ── Tipografía ───────────────────────────────────────────────────────────────
.eyebrow {
  display: inline-block;
  font-family: fonts.$font-principal;
  font-weight: 500;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: $blue;
  margin-bottom: 14px;

  &--light {
    color: $sun;
  }
}

.h2 {
  font-family: fonts.$font-principal;
  font-weight: 700;
  font-size: clamp(2rem, 5.4vw, 3.4rem);
  line-height: 1.04;
  text-transform: uppercase;
  letter-spacing: -0.005em;
  margin: 0;
  text-wrap: balance;

  &--light {
    color: #fff;
  }
}

.hl {
  color: $blue;

  &--sun {
    color: $sun;
  }
}

.lead {
  font-size: 1.08rem;
  line-height: 1.65;
  color: $body;
  margin: 16px 0 0;
  max-width: 620px;

  &--light {
    color: rgba(255, 255, 255, 0.8);
  }
}

.head {
  margin-bottom: 40px;
  max-width: 820px;

  &--center {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }
}

// ── Botones ──────────────────────────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 28px;
  border: 0;
  border-radius: 6px;
  background: $blue;
  color: #fff;
  font-family: fonts.$font-principal;
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform 160ms $ease,
    background-color 200ms ease,
    box-shadow 200ms ease;
  box-shadow: 0 6px 0 $deep;

  &:hover {
    background: color.adjust($blue, $lightness: 4%);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 $deep;
  }

  &:focus-visible {
    outline: 3px solid $sun;
    outline-offset: 3px;
  }

  &--sun {
    background: $sun;
    color: $ink;
    box-shadow: 0 6px 0 color.adjust($sun, $lightness: -16%);

    &:hover {
      background: color.adjust($sun, $lightness: 6%);
    }

    &:active {
      box-shadow: 0 2px 0 color.adjust($sun, $lightness: -16%);
    }

    &:focus-visible {
      outline-color: #fff;
    }
  }

  &--lg {
    padding: 19px 34px;
    font-size: 1.15rem;
    width: 100%;
    max-width: 440px;
  }
}

// ── Top bar ──────────────────────────────────────────────────────────────────
.topbar {
  background: #fff;
  border-bottom: 1px solid $line;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 64px;
  }

  &__logo {
    height: 40px;
    width: auto;
    display: block;
  }

  &__tag {
    font-family: fonts.$font-principal;
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba($ink, 0.72);
    text-align: right;
  }
}

// ── Hero ─────────────────────────────────────────────────────────────────────
.hero {
  position: relative;
  background: $blue;
  color: #fff;
  padding: 44px 0 64px;
  isolation: isolate;

  @media (min-width: 768px) {
    padding: 64px 0 88px;
  }

  // Surcos de cultivo vistos desde el aire (lo que ve el dron)
  &__rows {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: repeating-linear-gradient(
      -62deg,
      rgba(255, 255, 255, 0.045) 0 2px,
      transparent 2px 26px
    );
    mask-image: linear-gradient(180deg, transparent 0%, #000 35%, #000 70%, transparent 100%);
  }

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__audience {
    list-style: none;
    margin: 0 0 24px;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 18px;
    font-size: 0.92rem;
    color: rgba(255, 255, 255, 0.85);

    li {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    i {
      color: $sun;
      font-size: 0.8rem;
    }
  }

  &__headline {
    font-family: fonts.$font-principal;
    font-weight: 700;
    text-transform: uppercase;
    font-size: clamp(2.5rem, 8.6vw, 5.4rem);
    line-height: 0.98;
    letter-spacing: -0.01em;
    margin: 0;
    max-width: 980px;
    text-wrap: balance;
  }

  &__headline-hl {
    color: $sun;
  }

  &__sub {
    font-size: clamp(1.02rem, 2.4vw, 1.2rem);
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.82);
    max-width: 640px;
    margin: 22px 0 36px;
  }

  &__cta {
    margin-top: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 100%;
  }

  &__note {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);

    i {
      margin-right: 6px;
    }
  }
}

// ── VSL (tarjeta que abre el registro) ───────────────────────────────────────
.vsl {
  width: 100%;
  max-width: 880px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 30px 60px rgba(0, 0, 0, 0.35);
  transition: transform 220ms $ease;

  &:hover {
    transform: translateY(-3px);
  }

  &:hover .vsl__play {
    transform: scale(1.06);
  }

  &:focus-visible {
    outline: 3px solid $sun;
    outline-offset: 4px;
  }

  &__screen {
    position: relative;
    aspect-ratio: 16 / 9;
    background:
      radial-gradient(120% 90% at 50% 110%, rgba($sun, 0.16), transparent 60%),
      linear-gradient(160deg, $deep 0%, $ink 100%);
    display: grid;
    place-items: center;
  }

  &__brand {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 62%;
    transform: translate(-50%, -50%);
    opacity: 0.08;
    pointer-events: none;
  }

  &__play {
    position: relative;
    width: clamp(68px, 13vw, 96px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: $sun;
    color: $ink;
    display: grid;
    place-items: center;
    font-size: clamp(1.4rem, 3vw, 2rem);
    box-shadow: 0 0 0 10px rgba($sun, 0.18);
    transition: transform 220ms $ease;

    i {
      margin-left: 5px;
    }
  }

  &__caption {
    position: absolute;
    left: 18px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    line-height: 1.3;

    strong {
      font-family: fonts.$font-principal;
      font-weight: 600;
      font-size: 1.05rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    span {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  &__sound {
    position: absolute;
    right: 16px;
    top: 14px;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.75);
    background: rgba(0, 0, 0, 0.3);
    padding: 6px 10px;
    border-radius: 999px;
  }
}

// ── Cultivos ─────────────────────────────────────────────────────────────────
.crops {
  background: $ink;
  color: #fff;
  padding: 18px 0;

  &__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px 28px;
  }

  &__label {
    margin: 0;
    font-size: 0.8rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 22px;

    li {
      font-family: fonts.$font-principal;
      font-weight: 600;
      font-size: 1.3rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;

      &:not(:last-child)::after {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: $sun;
        margin-left: 22px;
        vertical-align: middle;
      }
    }
  }
}

// ── Secciones ────────────────────────────────────────────────────────────────
.section {
  padding: 72px 0;

  @media (min-width: 768px) {
    padding: 104px 0;
  }

  &--alt {
    background: $bg-alt;
  }

  &--blue {
    background: $blue;
    color: #fff;
  }
}

.center-cta {
  margin-top: 44px;
  display: flex;
  justify-content: center;
}

// ── Oportunidad ──────────────────────────────────────────────────────────────
.opp {
  display: grid;
  gap: 16px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  &__card {
    border: 1px solid $line;
    border-radius: 10px;
    padding: 28px;
    background: #fff;

    p {
      margin: 0;
      line-height: 1.65;
      color: $body;
    }
  }

  &__icon {
    display: inline-grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 8px;
    background: rgba($blue, 0.08);
    color: $blue;
    font-size: 1.2rem;
    margin-bottom: 18px;
  }

  &__title {
    font-family: fonts.$font-principal;
    font-weight: 600;
    font-size: 1.45rem;
    text-transform: uppercase;
    margin: 0 0 10px;
  }
}

.nino {
  margin-top: 24px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 26px 28px;
  border-radius: 10px;
  background: $ink;
  color: #fff;

  &__icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba($sun, 0.14);
    font-size: 1.3rem;
    color: $sun;
  }

  &__title {
    display: block;
    font-family: fonts.$font-principal;
    font-weight: 600;
    font-size: 1.35rem;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  p {
    margin: 0;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.8);
  }
}

// ── Lo que necesitas ─────────────────────────────────────────────────────────
.needs {
  display: grid;
  gap: 16px;

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  &__note {
    margin: 28px auto 0;
    text-align: center;
    color: $body;
    font-size: 0.95rem;

    i {
      color: $blue;
      margin-right: 8px;
    }
  }
}

.need {
  background: #fff;
  border-radius: 10px;
  padding: 28px;
  box-shadow: 0 1px 0 $line, 0 14px 30px rgba($ink, 0.06);
  display: flex;
  flex-direction: column;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  &__num {
    font-family: fonts.$font-principal;
    font-weight: 700;
    font-size: 2.6rem;
    line-height: 1;
    color: rgba($blue, 0.18);
  }

  &__icon {
    color: $blue;
    font-size: 1.5rem;
  }

  &__title {
    font-family: fonts.$font-principal;
    font-weight: 600;
    font-size: 1.5rem;
    text-transform: uppercase;
    margin: 0 0 12px;
  }

  &__text {
    margin: 0 0 20px;
    line-height: 1.65;
    color: $body;
    flex: 1;
  }

  &__tags {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    li {
      font-size: 0.78rem;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 4px;
      background: rgba($blue, 0.08);
      color: $blue;
    }
  }
}

// ── Respaldo ─────────────────────────────────────────────────────────────────
.backing {
  display: grid;
  gap: 1px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  overflow: hidden;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: 1000px) {
    grid-template-columns: repeat(4, 1fr);
  }

  &__item {
    background: $blue;
    padding: 26px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    i {
      color: $sun;
      font-size: 1.4rem;
      margin-bottom: 6px;
    }

    strong {
      font-family: fonts.$font-principal;
      font-weight: 600;
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    span {
      color: rgba(255, 255, 255, 0.78);
      line-height: 1.55;
      font-size: 0.95rem;
    }
  }

  &__close {
    margin: 28px 0 0;
    max-width: 720px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.82);

    strong {
      color: #fff;
    }
  }
}

.quote {
  margin: 48px 0 0;
  padding: 0;

  &::before {
    content: 'C';
    display: block;
    font-family: fonts.$font-principal;
    font-size: 4.5rem;
    line-height: 0.6;
    color: $sun;
    margin-bottom: 8px;
  }

  p {
    margin: 0;
    font-family: fonts.$font-principal;
    font-weight: 500;
    font-size: clamp(1.6rem, 4vw, 2.3rem);
    line-height: 1.15;
    text-transform: uppercase;
  }

  footer {
    margin-top: 10px;
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.65);
  }
}

// ── ¿Es para ti? ─────────────────────────────────────────────────────────────
.fit {
  display: grid;
  gap: 16px;

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  &__item {
    border: 1px solid $line;
    border-radius: 10px;
    padding: 26px;

    &--no {
      background: $bg-alt;
    }
  }

  &__mark {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba($green, 0.12);
    color: $green;
    margin-bottom: 14px;

    .fit__item--no & {
      background: rgba(#c0392b, 0.1);
      color: #b23a2c;
    }
  }

  &__title {
    font-family: fonts.$font-principal;
    font-weight: 600;
    font-size: 1.3rem;
    text-transform: uppercase;
    margin: 0 0 8px;
  }

  &__text {
    margin: 0;
    line-height: 1.6;
    color: $body;
  }
}

// ── Cierre ───────────────────────────────────────────────────────────────────
.closing {
  background: $ink;
  color: #fff;
  padding: 80px 0 96px;

  @media (min-width: 768px) {
    padding: 112px 0 120px;
  }

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__head {
    max-width: 780px;
  }

  &__title {
    font-family: fonts.$font-principal;
    font-weight: 700;
    text-transform: uppercase;
    font-size: clamp(2.2rem, 6.4vw, 4rem);
    line-height: 1;
    margin: 0;
    text-wrap: balance;
  }

  &__sub {
    margin: 20px auto 0;
    max-width: 620px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.78);
    font-size: 1.05rem;
  }

  &__cta {
    margin-top: 44px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  &__note {
    margin: 0;
    max-width: 460px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.92rem;
    line-height: 1.55;
  }
}

.topics {
  list-style: none;
  margin: 44px 0 0;
  padding: 0;
  width: 100%;
  max-width: 900px;
  display: grid;
  gap: 12px;

  @media (min-width: 720px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 24px 18px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);

    i {
      color: $sun;
      font-size: 1.3rem;
      margin-bottom: 6px;
    }

    strong {
      font-family: fonts.$font-principal;
      font-weight: 600;
      font-size: 1.2rem;
      text-transform: uppercase;
    }

    span {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.92rem;
      line-height: 1.5;
    }
  }
}

// ── Sticky CTA ───────────────────────────────────────────────────────────────
.sticky {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px 10px 18px;
  border-radius: 10px;
  background: $ink;
  color: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  max-width: 640px;
  margin: 0 auto;

  &__copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;

    strong {
      font-family: fonts.$font-principal;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    span {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.65);
    }
  }

  &__btn {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 6px;
    padding: 12px 18px;
    background: $sun;
    color: $ink;
    font-family: fonts.$font-principal;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: transform 160ms $ease;

    &:active {
      transform: scale(0.97);
    }
  }
}

.sticky-enter-active,
.sticky-leave-active {
  transition:
    transform 260ms $ease,
    opacity 200ms ease;
}

.sticky-enter-from,
.sticky-leave-to {
  transform: translateY(16px);
  opacity: 0;
}

// ── Footer ───────────────────────────────────────────────────────────────────
.footer {
  background: #fff;
  border-top: 1px solid $line;
  padding: 44px 0 110px;
  text-align: center;

  &__logo {
    height: 40px;
    width: auto;
    margin: 0 auto 20px;
    display: block;
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 18px;
    margin-bottom: 10px;

    a {
      color: $ink;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      font-size: 0.9rem;
      font-weight: 600;

      &:hover {
        color: $blue;
        text-decoration: underline;
      }
    }
  }

  &__copy {
    margin: 0 0 12px;
    font-size: 0.85rem;
    color: rgba($ink, 0.72);
  }

  &__disclaimer {
    margin: 0 auto;
    max-width: 680px;
    font-size: 0.76rem;
    line-height: 1.6;
    color: rgba($ink, 0.66);
  }
}

// ── Reveal ───────────────────────────────────────────────────────────────────
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 600ms ease,
    transform 700ms $ease;
}

.reveal--in {
  opacity: 1;
  transform: none;
}
</style>
