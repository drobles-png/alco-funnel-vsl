<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'

const isComplete = ref(false)
const progress = ref(0)
const currentText = ref('Cargando...')
const phrases = ['Cargando...', 'Preparando...', 'Listo.']

const emit = defineEmits<{ (e: 'complete'): void }>()

let pageLoaded = false
let animProxy = { percent: 0 }
let slowTween: gsap.core.Tween | null = null
let resolved = false

const finish = () => {
  if (resolved) return
  resolved = true

  // Kill slow-phase tween and sprint to 100
  slowTween?.kill()
  gsap.to(animProxy, {
    percent: 100,
    duration: 0.4,
    ease: 'power2.out',
    onUpdate: () => {
      progress.value = Math.round(animProxy.percent)
      currentText.value = phrases[2]
    },
    onComplete: () => {
      gsap.to('.global-loader', {
        opacity: 0,
        duration: 0.55,
        ease: 'power2.inOut',
        onComplete: () => {
          isComplete.value = true
          emit('complete')
        },
      })
    },
  })
}

const onWindowLoad = () => {
  pageLoaded = true
  // Only finish if animation already reached 85%
  if (animProxy.percent >= 85) finish()
}

onMounted(() => {
  // Phase 1: animate 0 → 85% while page loads
  slowTween = gsap.to(animProxy, {
    percent: 85,
    duration: 2.2,
    ease: 'power1.inOut',
    onUpdate: () => {
      progress.value = Math.round(animProxy.percent)
      if (animProxy.percent > 55) currentText.value = phrases[1]
    },
    onComplete: () => {
      // Reached 85% — now wait for page load
      if (pageLoaded) finish()
      // else: onWindowLoad will call finish() when ready
    },
  })

  if (document.readyState === 'complete') {
    pageLoaded = true
  } else {
    window.addEventListener('load', onWindowLoad, { once: true })
  }
})

onUnmounted(() => {
  window.removeEventListener('load', onWindowLoad)
})
</script>

<template>
  <Transition name="loader-fade">
    <div v-if="!isComplete" class="global-loader" aria-live="polite" aria-label="Cargando">

      <!-- Número grande decorativo -->
      <div class="global-loader__bg-num" aria-hidden="true">{{ progress }}%</div>

      <!-- Barra de progreso -->
      <div class="global-loader__bar-wrap" aria-hidden="true">
        <div class="global-loader__bar" :style="{ width: progress + '%' }" />
      </div>

      <!-- Texto central -->
      <p class="global-loader__text">{{ currentText }}</p>

    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/styles/fonts.modules.scss' as fonts;
@use '@/styles/colorVariables.module.scss' as colors;

.global-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  overflow: hidden;

  &__bg-num {
    position: absolute;
    @include fonts.heading-font(800);
    font-size: clamp(10rem, 28vw, 38rem);
    color: rgba(11, 31, 51, 0.03);
    line-height: 1;
    letter-spacing: -0.05em;
    user-select: none;
    pointer-events: none;
  }

  &__text {
    position: relative;
    @include fonts.heading-font(700);
    font-size: clamp(1.8rem, 4vw, 3.2rem);
    color: colors.$ALCO-DARK;
    margin: 0;
    z-index: 2;
    letter-spacing: -0.01em;
  }

  &__bar-wrap {
    position: relative;
    z-index: 2;
    width: min(340px, 72vw);
    height: 3px;
    background: rgba(11, 31, 51, 0.08);
    border-radius: 99px;
    overflow: hidden;
  }

  &__bar {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, colors.$ALCO-PRIMARY, colors.$ALCO-ACCENT);
    transition: width 0.12s linear;
    box-shadow: 0 0 12px rgba(colors.$ALCO-PRIMARY, 0.6);
  }
}

.loader-fade-leave-active {
  transition: opacity 0.55s ease;
}
.loader-fade-leave-to {
  opacity: 0;
}
</style>
