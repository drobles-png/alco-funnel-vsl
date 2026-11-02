<script setup lang="ts">
import LegalLayout from '@/components/LegalLayout.vue'
import { LEGAL, SITE_URL } from '@/config/alco'
</script>

<template>
  <LegalLayout title="Aviso legal" updated="noviembre de 2026">
    <h2>1. Titular del sitio</h2>
    <ul>
      <li><strong>Razón social:</strong> {{ LEGAL.razonSocial }}</li>
      <li><strong>RUC:</strong> {{ LEGAL.ruc }}</li>
      <li><strong>Domicilio:</strong> {{ LEGAL.domicilio }}</li>
      <li><strong>Correo de contacto:</strong> {{ LEGAL.email }}</li>
    </ul>

    <h2>2. Objeto</h2>
    <p>
      El sitio <strong>{{ SITE_URL }}</strong> informa sobre cómo arrancar un negocio de
      fumigación con drones con el acompañamiento de ALCO, y permite agendar una reunión con su
      equipo.
    </p>

    <h2>3. Uso del sitio</h2>
    <p>
      Al usar el sitio te comprometes a darnos información real y a no usarlo para fines ilícitos o
      que perjudiquen a ALCO o a terceros.
    </p>

    <h2>4. Sobre los resultados</h2>
    <p>
      La información del sitio y del video es orientativa. Los resultados de cada negocio dependen
      de la zona, los clientes, la inversión y el trabajo de cada persona. ALCO no garantiza
      ingresos ni resultados específicos.
    </p>

    <h2>5. Propiedad intelectual</h2>
    <p>
      Los textos, videos, logotipos y diseño del sitio son de ALCO o se usan con autorización. DJI
      y Agras son marcas registradas de sus respectivos titulares y se mencionan solo para
      identificar los equipos que comercializa ALCO.
    </p>

    <h2>6. Enlaces a terceros</h2>
    <p>
      El sitio puede enlazar a redes sociales u otros sitios. ALCO no se hace responsable de su
      contenido ni de sus políticas.
    </p>

    <h2>7. Ley aplicable</h2>
    <p>
      Este aviso se rige por las leyes de la República del Ecuador. Cualquier controversia se
      someterá a los jueces competentes del domicilio de ALCO.
    </p>
  </LegalLayout>
</template>
