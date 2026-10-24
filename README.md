# EdZa tech

Landing de EdZa tech tomada del frame de Figma [EdZa tech](https://www.figma.com/design/L2rqQ4UwZ2211aEuuBpzaT/EdZa?node-id=14-2). Cada bloque queda en la coordenada del diseño, sobre un lienzo de 1440 px.

El fondo de puntos es un canvas a pantalla completa: al hacer clic se propagan ondas circulares (estilo WeEvolveIt) que desplazan los puntos y los colorean en azul `#2172B1` y morado `#E654EA`. El mismo clic ilumina la imagen de las manos del hero. El menú queda fijo arriba en todas las secciones.

## Cómo verla

```bash
npm install
npx ng serve
```

Abre [http://localhost:4200](http://localhost:4200). También puedes iniciar el servidor con `npm run dev`.

La página se inicia desde Angular; la interfaz y sus interacciones actuales se montan dentro de la aplicación Angular para conservar el diseño durante la transición. Para ejecutar la versión original de Next.js, usa `npm run dev:next`.

A 1440 px de ancho o más se ve a tamaño real, centrada. En pantallas más angostas la composición entera se escala, así que nada se reacomoda.

## Qué responde al clic

- Inicio, Proceso, Proyectos y Contacto (menú, botones y pie) llevan a su sección.
- Contáctanos abre Contacto. Proyectos abre la sección de proyectos.
- El formulario pide nombre, correo y descripción. Si falta algo, el campo se marca. Si está completo, el botón pasa a «Enviado».
- Idioma abre la opción del diseño: Español.
- Términos y Condiciones y aviso de privacidad abren su texto. Es un borrador para reemplazar.
- Gmail, WhatsApp, Instagram y Facebook llevan a Contacto. Cuando existan los perfiles, se sustituyen por sus enlaces.
