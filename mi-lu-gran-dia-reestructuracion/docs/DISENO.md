# Lineamientos de diseño

Fuente histórica consultada: documentación de diseño y UX/UI de `Wedding`.

## Principio

Mismo propósito visual = mismo patrón visual.

## Dirección

La nueva app debe conservar identidad propia de Mi Gran Día, pero con un sistema consistente:
- tokens de color, espaciado, tipografía, radios y sombras;
- botones primarios/secundarios coherentes;
- tarjetas y paneles reutilizables;
- inputs y modales compartidos;
- loaders y estados vacíos comunes;
- navegación consistente;
- iconografía controlada.

## Modos de trabajo

- **NORMAL**: corrección puntual sin rediseño.
- **REFINE**: mejora de jerarquía, espaciado y pulido.
- **REDESIGN**: solo cuando se acuerde replantear una pantalla.

Esta reestructuración permite REDESIGN por módulo, pero nunca como excusa para tocar persistencia.

## Responsive

Diseño compartido para móvil y escritorio; evitar dos aplicaciones paralelas.

Breakpoints de revisión:
- 360 px;
- 390–430 px;
- 768 px;
- 1024 px;
- 1440 px.

## CSS

- sin `!important`;
- evitar selectores globales agresivos;
- estilos por módulo;
- tokens compartidos;
- nada de sobrescribir una pantalla vieja desde una hoja nueva;
- si se reemplaza un componente, el anterior debe retirarse.
