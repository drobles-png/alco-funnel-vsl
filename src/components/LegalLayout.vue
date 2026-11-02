<script setup lang="ts">
import { onMounted } from 'vue'
import alcoLogo from '@/assets/logos/alco-wordmark-blue.png'

defineProps<{ title: string; updated: string }>()

onMounted(() => window.scrollTo({ top: 0 }))
</script>

<template>
  <div class="legal">
    <header class="legal__topbar">
      <RouterLink to="/" aria-label="Volver al inicio">
        <img :src="alcoLogo" alt="ALCO" class="legal__logo" />
      </RouterLink>
    </header>

    <main class="legal__main">
      <h1 class="legal__title">{{ title }}</h1>
      <p class="legal__updated">Última actualización: {{ updated }}</p>
      <div class="legal__body">
        <slot />
      </div>
      <RouterLink to="/" class="legal__back">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver al inicio
      </RouterLink>
    </main>

    <footer class="legal__footer">
      <RouterLink to="/politicas-privacidad">Política de privacidad</RouterLink>
      <span aria-hidden="true">·</span>
      <RouterLink to="/aviso-legal">Aviso legal</RouterLink>
      <p>© {{ new Date().getFullYear() }} ALCO. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.legal {
  min-height: 100vh;
  background: colors.$ALCO-LIGHT;
  color: colors.$ALCO-DARK;
  font-family: fonts.$font-secondary;

  &__topbar {
    background: #fff;
    border-bottom: 1px solid rgba(11, 31, 51, 0.1);
    padding: 16px 20px;
    display: flex;
    justify-content: center;
  }

  &__logo {
    height: 28px;
    width: auto;
    display: block;
  }

  &__main {
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 20px 64px;
  }

  &__title {
    font-family: fonts.$font-principal;
    font-weight: 700;
    text-transform: uppercase;
    font-size: clamp(2rem, 6vw, 2.8rem);
    line-height: 1.05;
    margin: 0 0 8px;
  }

  &__updated {
    margin: 0 0 32px;
    font-size: 0.85rem;
    color: rgba(11, 31, 51, 0.55);
  }

  &__body {
    background: #fff;
    border-radius: 10px;
    padding: 28px 24px;
    border: 1px solid rgba(11, 31, 51, 0.08);
    line-height: 1.7;
    color: rgba(11, 31, 51, 0.8);

    @media (min-width: 640px) {
      padding: 40px;
    }

    :deep(h2) {
      font-family: fonts.$font-principal;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 1.3rem;
      color: colors.$ALCO-PRIMARY;
      margin: 32px 0 10px;

      &:first-child {
        margin-top: 0;
      }
    }

    :deep(p) {
      margin: 0 0 12px;
    }

    :deep(ul) {
      margin: 0 0 12px;
      padding-left: 20px;
    }

    :deep(li) {
      margin-bottom: 6px;
    }

    :deep(strong) {
      color: colors.$ALCO-DARK;
    }
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 28px;
    color: colors.$ALCO-PRIMARY;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__footer {
    text-align: center;
    padding: 24px 20px 40px;
    font-size: 0.85rem;
    color: rgba(11, 31, 51, 0.6);

    a {
      color: colors.$ALCO-DARK;
      margin: 0 6px;
    }

    p {
      margin: 10px 0 0;
    }
  }
}
</style>
