<script setup lang="ts">
import { ref, onMounted } from 'vue'
import alcoLogo from '@/assets/logos/alco-wordmark-blue.png'
import { BRAND } from '@/config/alco'

const hoursLeft = ref(0)

onMounted(() => {
  const disqAt = localStorage.getItem('alco_disq_at')
  if (disqAt) {
    const elapsed = Date.now() - Number(disqAt)
    const remaining = 24 * 60 * 60 * 1000 - elapsed
    if (remaining > 0) {
      hoursLeft.value = Math.ceil(remaining / 3_600_000)
    }
  }
})
</script>

<template>
  <div class="nospace">

    <!-- TOP BAR -->
    <header class="nospace__topbar">
      <img :src="alcoLogo" alt="ALCO" class="nospace__logo" />
    </header>

    <!-- MAIN CONTENT -->
    <main class="nospace__main">

      <!-- COOLDOWN BANNER -->
      <div v-if="hoursLeft > 0" class="nospace__cooldown-banner">
        <i class="fa-solid fa-clock"></i>
        Ya enviaste una solicitud. Podrás intentarlo de nuevo en {{ hoursLeft }}h
      </div>

      <!-- ICON -->
      <div class="nospace__icon-wrap">
        <i class="fa-solid fa-heart nospace__heart-icon"></i>
      </div>

      <!-- HEADING -->
      <h1 class="nospace__title">Todavía no es el momento, y está bien</h1>

      <p class="nospace__subtitle">
        Las reuniones de este programa son para quienes ya están listos para invertir en su
        equipo y arrancar a dar servicio de fumigación. Por lo que nos contaste, hoy todavía no
        es tu momento.
        <br /><br />
        Eso no significa que no podamos ayudarte más adelante. Cuando estés listo, aquí estamos.
      </p>

      <!-- RECURSOS CARD -->
      <div class="nospace__resources-card">
        <div class="nospace__resources-badge">
          <i class="fa-solid fa-seedling"></i>
          Mientras tanto
        </div>

        <h2 class="nospace__resources-title">
          Aprende con ALCO mientras tanto
        </h2>

        <p class="nospace__resources-body">
          Síguenos en Instagram: compartimos cómo se fumiga bien con dron, qué equipos DJI Agras
          tenemos y lo que se enseña en la Academia EAD.
        </p>

        <a :href="BRAND.instagram" target="_blank" rel="noopener noreferrer" class="btn btn--primary">
          <i class="fa-brands fa-instagram"></i>
          Ver {{ BRAND.instagramHandle }}
        </a>
      </div>

      <!-- BACK LINK -->
      <RouterLink to="/" class="btn btn--ghost">
        <i class="fa-solid fa-arrow-left"></i>
        Volver al inicio
      </RouterLink>

    </main>

    <!-- FOOTER -->
    <footer class="nospace__footer">
      <div class="footer__links">
        <RouterLink to="/politicas-privacidad">Política de Privacidad</RouterLink>
        <span class="footer__sep">·</span>
        <RouterLink to="/aviso-legal">Aviso Legal</RouterLink>
      </div>
      <p class="footer__copy">© {{ new Date().getFullYear() }} ALCO. Todos los derechos reservados.</p>
    </footer>

  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.nospace {
  min-height: 100vh;
  background-color: #ffffff;
  color: colors.$ALCO-DARK;
  display: flex;
  flex-direction: column;
  align-items: center;

  // ── TOP BAR ──────────────────────────────────────────
  &__topbar {
    width: 100%;
    padding: 1rem 2rem;
    display: flex;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid rgba(11, 31, 51, 0.1);
  }

  &__logo {
    height: 26px;
    width: auto;
  }

  // ── MAIN ─────────────────────────────────────────────
  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4rem 1.5rem 3rem;
    max-width: 640px;
    width: 100%;
    gap: 1.25rem;
  }

  // ── COOLDOWN BANNER ───────────────────────────────────
  &__cooldown-banner {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.6rem 1.25rem;
    border-radius: 999px;
    background: rgba(colors.$ALCO-PRIMARY, 0.08);
    border: 1px solid rgba(colors.$ALCO-PRIMARY, 0.3);
    font-family: fonts.$font-interface;
    font-size: 0.85rem;
    font-weight: 600;
    color: colors.$ALCO-PRIMARY;
    letter-spacing: 0.01em;

    i { font-size: 0.85rem; }
  }

  // ── ICON ─────────────────────────────────────────────
  &__icon-wrap {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: #f2f5f8;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid rgba(11, 31, 51, 0.12);
    margin-bottom: 0.5rem;
  }

  &__heart-icon {
    font-size: 2.75rem;
    color: rgba(11, 31, 51, 0.55);
    line-height: 1;
  }

  // ── HEADING ──────────────────────────────────────────
  &__title {
    font-family: fonts.$font-principal;
    font-weight: 800;
    font-size: clamp(1.6rem, 4vw, 2.25rem);
    line-height: 1.2;
    margin: 0;
    color: colors.$ALCO-DARK;
  }

  &__subtitle {
    font-family: fonts.$font-secondary;
    font-size: 1.05rem;
    color: rgba(11, 31, 51, 0.62);
    margin: 0;
    line-height: 1.7;
  }

  // ── RESOURCES CARD ─────────────────────────────────────
  &__resources-card {
    width: 100%;
    background: #f2f5f8;
    border: 1.5px solid rgba(11, 31, 51, 0.1);
    border-radius: 16px;
    padding: 2rem 1.75rem 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
    margin-top: 0.5rem;
  }

  &__resources-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    background: rgba(colors.$ALCO-PRIMARY, 0.1);
    border: 1px solid rgba(colors.$ALCO-PRIMARY, 0.25);
    font-family: fonts.$font-interface;
    font-size: 0.75rem;
    font-weight: 700;
    color: colors.$ALCO-PRIMARY;
    letter-spacing: 0.04em;
    text-transform: uppercase;

    i { font-size: 0.75rem; }
  }

  &__resources-title {
    font-family: fonts.$font-principal;
    font-weight: 800;
    font-size: clamp(1.2rem, 3vw, 1.55rem);
    color: colors.$ALCO-DARK;
    margin: 0;
    line-height: 1.25;
  }

  &__resources-body {
    font-family: fonts.$font-secondary;
    font-size: 0.95rem;
    color: rgba(11, 31, 51, 0.6);
    margin: 0;
    line-height: 1.75;

    strong {
      color: colors.$ALCO-DARK;
      font-weight: 600;
    }
  }

  // ── FOOTER ───────────────────────────────────────────
  &__footer {
    width: 100%;
    padding: 2rem 1.5rem;
    text-align: center;
    border-top: 1px solid rgba(11, 31, 51, 0.1);
  }
}

// ── BUTTONS ──────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-family: fonts.$font-accent;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.25s ease;
  text-decoration: none;

  &--primary {
    background: colors.$ALCO-PRIMARY;
    border: 1.5px solid colors.$ALCO-PRIMARY;
    color: colors.$white;
    width: 100%;
    justify-content: center;
    font-size: 1rem;
    padding: 0.95rem 2rem;
    margin-top: 0.25rem;

    &:hover {
      background: rgba(colors.$ALCO-PRIMARY, 0.88);
      border-color: rgba(colors.$ALCO-PRIMARY, 0.88);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(colors.$ALCO-PRIMARY, 0.35);
    }
  }

  &--ghost {
    background: transparent;
    border: 1.5px solid rgba(11, 31, 51, 0.18);
    color: rgba(11, 31, 51, 0.6);
    margin-top: 0.25rem;

    &:hover {
      border-color: rgba(11, 31, 51, 0.4);
      color: colors.$ALCO-DARK;
      background: rgba(11, 31, 51, 0.03);
    }
  }
}

// ── FOOTER INTERNALS ──────────────────────────────────
.footer {
  &__links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;

    a {
      font-family: fonts.$font-interface;
      font-size: 0.8rem;
      color: rgba(11, 31, 51, 0.5);
      text-decoration: none;
      transition: color 0.2s;

      &:hover { color: colors.$ALCO-DARK; }
    }
  }

  &__sep {
    color: rgba(11, 31, 51, 0.2);
  }

  &__copy {
    font-family: fonts.$font-interface;
    font-size: 0.75rem;
    color: rgba(11, 31, 51, 0.4);
    margin: 0;
  }
}
</style>
