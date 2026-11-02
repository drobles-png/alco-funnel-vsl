<script setup lang="ts">
import { onMounted, ref } from 'vue';
import gsap from 'gsap';

/**
 * BookedHero.vue
 * Displays the success confirmation with GSAP entry animations.
 */

const props = defineProps({
  contactName: {
    type: String,
    required: false,
    default: '',
  },
});

const heroContent = ref<HTMLElement | null>(null);
const checkIcon = ref<HTMLElement | null>(null);

onMounted(() => {
  if (heroContent.value && checkIcon.value) {
    const tl = gsap.timeline();

    // Animar el icono de check
    tl.fromTo(checkIcon.value,
      { scale: 0, rotation: -45, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
    );

    // Animar el texto con stagger
    tl.fromTo(heroContent.value.querySelectorAll('.animate-up'),
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out' },
      '-=0.4'
    );
  }
});
</script>

<template>
  <section class="booked-hero" ref="heroContent">
    <div class="booked-hero__icon-wrap" ref="checkIcon">
      <i class="fa-solid fa-circle-check booked-hero__check-icon"></i>
    </div>

    <h1 class="booked-hero__title animate-up">
      <template v-if="props.contactName">¡Listo, {{ props.contactName }}!</template>
      <template v-else>¡Tu reunión está confirmada!</template>
    </h1>

    <p class="booked-hero__subtitle animate-up">
      En breve recibirás un correo con todos los detalles. Un miembro del equipo de
      ALCO te escribirá para preparar la reunión y armar el camino de tu negocio.
    </p>
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.booked-hero {
  text-align: center;
  padding: 2.5rem 0 1.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;

  @media (min-width: 768px) {
    padding: 4.5rem 0 2.5rem;
    gap: 1.75rem;
  }

  &__icon-wrap {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(colors.$ALCO-GREEN, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(colors.$ALCO-GREEN, 0.3);
    margin-bottom: 0.5rem;

    @media (min-width: 768px) {
      width: 90px;
      height: 90px;
      margin-bottom: 0.75rem;
    }
  }

  &__check-icon {
    font-size: 2.25rem;
    color: colors.$ALCO-GREEN;

    @media (min-width: 768px) {
      font-size: 3.25rem;
    }
  }

  &__title {
    @include fonts.heading-font(800);
    font-size: clamp(1.85rem, 8vw, 3.5rem);
    line-height: 1.1;
    margin: 0;
    color: colors.$ALCO-DARK;
  }

  &__subtitle {
    @include fonts.body-font(400);
    font-size: 0.95rem;
    color: rgba(11, 31, 51, 0.68);
    margin: 0;
    line-height: 1.6;
    max-width: 540px;

    @media (min-width: 768px) {
      font-size: 1.15rem;
      line-height: 1.7;
    }
  }
}
</style>
