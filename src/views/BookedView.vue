<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IS_LOCALHOST } from '@/config/alco'
import BookedHeader from '@/components/booked/BookedHeader.vue'
import BookedHero from '@/components/booked/BookedHero.vue'
import BookedSteps from '@/components/booked/BookedSteps.vue'
import BookedFooter from '@/components/booked/BookedFooter.vue'

const router = useRouter()

onMounted(() => {
  const bookedAt = Number(localStorage.getItem('alco_booked_at'))
  const hasRecentBooking = bookedAt > 0 && Date.now() - bookedAt < 24 * 60 * 60 * 1000
  if (!IS_LOCALHOST && !hasRecentBooking) router.replace('/')
})

/**
 * BookedView.vue
 * Orquestador de la página de confirmación de cita.
 */

const contactName = computed(() => {
  try {
    const stored = localStorage.getItem('alco_contact')
    if (!stored) return ''
    return JSON.parse(stored).nombre ?? ''
  } catch {
    return ''
  }
})

const nextSteps = [
  {
    icon: 'envelope',
    title: 'Revisa tu correo',
    body: 'Ahí tienes los detalles de la reunión: fecha, hora y enlace confirmados.',
  },
  {
    icon: 'whatsapp',
    title: 'Un asesor de ALCO te escribirá por WhatsApp',
    body: 'Te escribimos para confirmar la reunión y resolver cualquier duda antes.',
  },
  {
    icon: 'seedling',
    title: 'Piensa en tu zona y tus clientes',
    body: 'Qué cultivos hay cerca (banano, arroz, cacao, maíz), si ya tienes agricultores que te pidan el servicio y qué quieres lograr. Con eso te armamos el camino.',
  },
]
</script>

<template>
  <main class="booked-view">
    <!-- ESTRUCTURA DE COMPONENTES -->
    <BookedHeader />

    <div class="booked-view__content">
      <!-- CONTENEDOR CENTRAL: Gestiona el ancho máximo y el padding lateral -->
      <div class="booked-view__container">
        <!-- Sección Hero: Confirmación Visual -->
        <BookedHero :contact-name="contactName" />

        <!-- Sección Pasos: Guía de Usuario -->
        <BookedSteps :steps="nextSteps" />

        <!-- DISCLAIMER (Nota de responsabilidad) -->
        <section class="booked-view__disclaimer">
          <div class="disclaimer-icon">
            <i class="fa-solid fa-circle-info"></i>
          </div>
          <p>
            Cada caso es distinto: el equipo, la capacitación y el acompañamiento se arman según tu
            zona, tus clientes y lo que quieres lograr. En la reunión lo vemos contigo.
          </p>
        </section>
      </div>
    </div>

    <!-- PIE DE PÁGINA -->
    <BookedFooter />
  </main>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.booked-view {
  position: relative;
  min-height: 100vh;
  background-color: #ffffff;
  color: colors.$ALCO-DARK;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;

  &__content {
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }

  &__container {
    width: 100%;
    max-width: 720px;
    padding: 0 1.5rem; // Gutter lateral uniforme en mobile
    box-sizing: border-box; // Garantiza que el padding se reste del 100% de la pantalla
    display: flex;
    flex-direction: column;
    align-items: center;

    @media (min-width: 768px) {
      padding: 0 2rem; // Mayor respiro en tablets/desktop
    }
  }

  &__disclaimer {
    width: 100%; // Toma el 100% del container (que ya tiene padding)
    padding: 1.25rem 1.5rem;
    margin: 1.5rem 0 3.5rem;
    background: #f2f5f8;
    border: 1px solid rgba(11, 31, 51, 0.08);
    border-radius: 20px;
    display: flex;
    gap: 1rem;
    align-items: flex-start;

    .disclaimer-icon {
      flex-shrink: 0;
      color: rgba(colors.$ALCO-PRIMARY, 0.7);
      font-size: 1.1rem;
      margin-top: 0.1rem;
    }

    p {
      @include fonts.body-font(400);
      font-size: 0.82rem;
      color: rgba(11, 31, 51, 0.5);
      margin: 0;
      line-height: 1.7;
    }

    @media (min-width: 768px) {
      margin-bottom: 6rem;
      padding: 1.75rem 2.25rem;
      gap: 1.25rem;

      p {
        font-size: 0.9rem;
      }
    }
  }
}
</style>
