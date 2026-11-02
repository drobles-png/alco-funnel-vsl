<script setup lang="ts">
import LegalLayout from '@/components/LegalLayout.vue'
import { LEGAL, SITE_URL } from '@/config/alco'
</script>

<template>
  <LegalLayout title="Política de privacidad" updated="noviembre de 2026">
    <p>
      En ALCO cuidamos tus datos personales. Aquí te explicamos qué datos recogemos en
      <strong>{{ SITE_URL }}</strong> (el "sitio"), para qué los usamos y cómo puedes ejercer tus
      derechos, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).
    </p>

    <h2>1. Responsable del tratamiento</h2>
    <ul>
      <li><strong>Razón social:</strong> {{ LEGAL.razonSocial }}</li>
      <li><strong>RUC:</strong> {{ LEGAL.ruc }}</li>
      <li><strong>Domicilio:</strong> {{ LEGAL.domicilio }}</li>
      <li><strong>Correo de contacto:</strong> {{ LEGAL.email }}</li>
      <li><strong>Actividad:</strong> {{ LEGAL.actividad }}</li>
    </ul>

    <h2>2. Qué datos recogemos</h2>
    <ul>
      <li>Nombre y apellido.</li>
      <li>Correo electrónico y número de teléfono o WhatsApp.</li>
      <li>Ciudad o cantón donde estás.</li>
      <li>
        Las respuestas que nos das sobre tu caso: perfil, si ya tienes dron o clientes, tu zona,
        cómo piensas invertir y qué quieres lograr.
      </li>
      <li>
        Datos de navegación y de campañas (cookies del Pixel de Meta, identificadores de anuncio y
        parámetros UTM).
      </li>
    </ul>

    <h2>3. Para qué los usamos</h2>
    <ul>
      <li>Mostrarte el video y contactarte para agendar y preparar tu reunión.</li>
      <li>Asesorarte sobre equipos DJI Agras, la Academia EAD y el servicio posventa de ALCO.</li>
      <li>Enviarte información relacionada con lo que nos pediste.</li>
      <li>Medir y mejorar nuestras campañas publicitarias.</li>
    </ul>
    <p>
      La base legal es tu consentimiento, que nos das al enviar los formularios del sitio. Puedes
      retirarlo cuando quieras.
    </p>

    <h2>4. Con quién los compartimos</h2>
    <p>
      No vendemos tus datos. Los compartimos solo con proveedores que nos ayudan a operar: nuestro
      CRM para gestionar contactos y citas, Meta Platforms para medir campañas, y el proveedor de
      alojamiento del sitio. Estos proveedores pueden estar fuera de Ecuador y tratan los datos con
      medidas de seguridad adecuadas.
    </p>

    <h2>5. Cuánto tiempo los guardamos</h2>
    <p>
      Mientras sean necesarios para atender tu solicitud y mantener la relación comercial, o hasta
      que nos pidas eliminarlos, salvo que la ley exija conservarlos más tiempo.
    </p>

    <h2>6. Tus derechos</h2>
    <p>
      Puedes pedir acceso, rectificación, actualización, eliminación, oposición, portabilidad o
      suspensión del tratamiento de tus datos escribiéndonos a <strong>{{ LEGAL.email }}</strong>.
      Te responderemos en los plazos que establece la LOPDP.
    </p>

    <h2>7. Cookies</h2>
    <p>
      Usamos el Pixel de Meta y almacenamiento local del navegador para recordar tu avance en el
      sitio y medir campañas. Puedes borrarlos o bloquearlos desde la configuración de tu
      navegador.
    </p>

    <h2>8. Cambios</h2>
    <p>
      Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de
      actualización.
    </p>
  </LegalLayout>
</template>
