<script setup lang="ts">
/**
 * BookedHeader.vue
 * Dedicated top bar for the confirmation page.
 */
import alcoLogo from '@/assets/logos/alco-wordmark-blue.png'
</script>

<template>
  <header class="booked-header">
    <img :src="alcoLogo" alt="ALCO" class="booked-header__logo" />
  </header>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;

.booked-header {
  width: 100%;
  padding: 1rem 1rem;
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(11, 31, 51, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  &__logo {
    height: 26px;
    width: auto;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    @media (min-width: 768px) {
      height: 40px;
    }
  }
}
</style>
