<script setup lang="ts">
/**
 * BookedSteps.vue
 * Displays the list of next steps.
 */

interface StepItem {
  icon: string;
  title: string;
  body: string;
}

const props = defineProps({
  steps: {
    type: Array as () => StepItem[],
    required: true,
  },
});
</script>

<template>
  <section class="booked-steps">
    <h2 class="booked-steps__section-title">
      <i class="fa-solid fa-list-check"></i>
      Próximos pasos
    </h2>

    <ol class="steps-list">
      <li
        v-for="(step, idx) in props.steps"
        :key="idx"
        class="steps-item"
      >
        <!-- Contador de pasos -->
        <div class="steps-item__num">{{ idx + 1 }}</div>

        <!-- Icono representativo -->
        <div class="steps-item__icon-wrap">
          <i :class="`fa-${idx === 1 ? 'brands' : 'solid'} fa-${step.icon}`"></i>
        </div>

        <!-- Contenido textual -->
        <div class="steps-item__content">
          <strong class="steps-item__title">{{ step.title }}</strong>
          <p class="steps-item__body">{{ step.body }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.booked-steps {
  width: 100%;
  padding: 1.5rem 0;

  @media (min-width: 768px) {
    padding: 2.5rem 0;
  }

  &__section-title {
    @include fonts.heading-font(700);
    font-size: 1.1rem;
    color: colors.$ALCO-DARK;
    margin: 0 0 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i { color: colors.$ALCO-PRIMARY; }

    @media (min-width: 768px) {
      font-size: 1.25rem;
      margin-bottom: 2rem;
    }
  }
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 768px) {
    gap: 1.25rem;
  }
}

.steps-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: #f2f5f8;
  border: 1px solid rgba(11, 31, 51, 0.08);
  border-radius: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(colors.$ALCO-PRIMARY, 0.35);
    box-shadow: 0 12px 32px rgba(11, 31, 51, 0.08);

    .steps-item__icon-wrap {
      background: rgba(colors.$ALCO-PRIMARY, 0.2);
    }
  }

  @media (min-width: 768px) {
    gap: 1.5rem;
    padding: 1.75rem;
  }

  &__num {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: colors.$ALCO-PRIMARY;
    color: colors.$white;
    display: flex;
    align-items: center;
    justify-content: center;
    @include fonts.accent-font(700);
    font-size: 0.75rem;

    @media (min-width: 768px) {
      width: 32px;
      height: 32px;
      font-size: 0.9rem;
    }
  }

  &__icon-wrap {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: rgba(colors.$ALCO-PRIMARY, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(colors.$ALCO-PRIMARY, 0.2);
    transition: all 0.3s ease;

    i {
      font-size: 1rem;
      color: colors.$ALCO-PRIMARY;
    }

    @media (min-width: 768px) {
      width: 48px;
      height: 48px;
      i { font-size: 1.3rem; }
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: block;
    @include fonts.interface-font(700);
    font-size: 0.95rem;
    color: colors.$ALCO-DARK;
    margin-bottom: 0.35rem;

    @media (min-width: 768px) {
      font-size: 1.1rem;
    }
  }

  &__body {
    @include fonts.body-font(400);
    font-size: 0.9rem;
    color: rgba(11, 31, 51, 0.6);
    margin: 0;
    line-height: 1.6;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }
}
</style>
