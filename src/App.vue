<script setup lang="ts">
</script>

<template>
  <RouterView />
</template>

<style lang="scss">
@use '@/styles/colorVariables.module.scss' as colors;

body {
  margin: 0;
  padding: 0;
  background-color: #ffffff;
}

// ── Transición de página ──────────────────────────────────────────────────────
.page-enter-active {
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.99);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(1.01);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: opacity 0.2s ease;
  }
  .page-enter-from,
  .page-leave-to {
    transform: none;
  }
}
</style>
