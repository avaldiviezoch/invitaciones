# REGLAS OBLIGATORIAS — VERSIÓN DESKTOP / RESPONSIVE

Este documento complementa `AGENTS.md` y aplica específicamente a cualquier trabajo de adaptación de la carpeta `invitación final/` para escritorio.

## Prioridad absoluta

La versión móvil actual es la versión principal, aprobada y protegida de la invitación.

- Aproximadamente el **95 % de los invitados verá la invitación desde celular**.
- La versión desktop corresponde al aproximadamente **5 % restante**.
- Ninguna mejora de escritorio justifica degradar, alterar o desconfigurar la experiencia móvil ya aprobada.
- Ante cualquier conflicto entre móvil y desktop, **gana móvil**.

## Regla principal

> **La adaptación desktop debe construirse alrededor de la versión móvil existente, nunca modificando la versión móvil para acomodar desktop.**

La versión móvil debe conservar exactamente su diseño, proporciones, posiciones, comportamiento, animaciones y funcionalidades salvo que el usuario solicite expresamente un cambio móvil.

## Arquitectura obligatoria

Se mantiene una sola invitación:

- `index.html`
- `styles.css`
- `script.js`

No crear una segunda invitación, un HTML exclusivo para escritorio, duplicados de secciones, iframes, redirecciones por dispositivo ni una segunda lógica JavaScript para desktop.

La adaptación desktop debe realizarse principalmente mediante CSS responsive real.

## Breakpoint protegido

Para aislar la versión móvil actual, los cambios específicos de escritorio deben comenzar, por defecto, en:

```css
@media (min-width: 900px) {
  /* reglas exclusivas para desktop */
}
```

Esto significa:

- Menos de `900px`: conservar la experiencia móvil/tablet existente salvo instrucción expresa.
- Desde `900px`: se permite adaptar composición, ancho, espacios, proporciones y distribución para escritorio.

El breakpoint podrá modificarse únicamente si una prueba real demuestra que otro valor funciona mejor y el cambio no afecta la versión móvil.

## Reglas de protección móvil

1. **NO modificar reglas base para resolver un problema exclusivo de desktop.**
   - Si una corrección solo corresponde a escritorio, debe vivir dentro del media query desktop.

2. **NO modificar el bloque móvil existente `@media(max-width:540px)` para mejorar desktop.**

3. **NO cambiar posiciones, tamaños o márgenes móviles como efecto secundario de una adaptación desktop.**

4. **NO cambiar el HTML aprobado únicamente porque resulte más cómodo diseñar escritorio.**
   - Primero resolver con CSS.
   - Si una modificación estructural compartida fuera realmente indispensable, detenerse y validarla antes de realizarla.

5. **NO duplicar elementos para mostrar uno en móvil y otro en desktop**, salvo autorización expresa y una razón técnica real.

6. **NO ocultar en desktop elementos existentes para sustituirlos por copias nuevas.**

7. **NO crear JavaScript específico para detectar `userAgent`, iPhone, Android, Mac o Windows con fines de layout.**
   - El layout debe depender del viewport mediante CSS.

8. **NO tocar RSVP, Música, regalos, audio, video de entrada, contador o demás lógica funcional por un cambio puramente visual de desktop.**

## Overrides responsive permitidos

Repetir un selector dentro de `@media (min-width:900px)` **sí está permitido** cuando se trata de una adaptación responsive legítima.

Ejemplo correcto:

```css
.location-card {
  /* regla base/móvil aprobada */
}

@media (min-width:900px) {
  .location-card {
    /* adaptación real para escritorio */
  }
}
```

Esto no se considera parche porque el selector pertenece explícitamente a otro contexto de viewport.

Lo que sigue prohibido es agregar reglas generales posteriores únicamente para tapar o contradecir errores anteriores.

## Qué puede cambiar en desktop

Dentro del breakpoint desktop se puede ajustar, cuando corresponda:

- ancho máximo de la invitación;
- distribución en columnas;
- tamaño relativo de imágenes;
- espacios verticales y horizontales;
- tipografía y escalas específicas de escritorio;
- alineaciones;
- posición de elementos decorativos;
- aprovechamiento de espacios laterales;
- composición de fotografías;
- presentación del programa;
- distribución de ubicación, RSVP, regalos, música y FAQ.

Todo cambio debe preservar el contenido, la identidad visual y las funcionalidades ya aprobadas.

## Qué NO debe cambiar por adaptar desktop

Sin solicitud expresa, no modificar:

- textos;
- colores aprobados;
- tipografías aprobadas;
- assets aprobados;
- enlaces;
- token de Mi Gran Día;
- comportamiento de RSVP;
- comportamiento de pedidos musicales;
- secuencia video → Sake de Binks;
- cuenta regresiva;
- contenido de regalos;
- preguntas frecuentes;
- animaciones aprobadas;
- lógica de copiado;
- estructura funcional de la invitación.

## Flujo obligatorio para cada sección desktop

Antes de adaptar una sección:

1. Revisar cómo se ve actualmente en móvil.
2. Identificar exactamente qué necesita cambiar solo en escritorio.
3. Mantener intacta la regla móvil/base siempre que sea posible.
4. Implementar únicamente el override desktop necesario dentro de `@media (min-width:900px)`.
5. Comprobar escritorio.
6. Volver a comprobar móvil después del cambio.
7. Si móvil cambió visual o funcionalmente sin haber sido solicitado, revertir la modificación y buscar otra solución.

## Validación mínima obligatoria

Después de cada bloque de cambios desktop deben comprobarse, como mínimo, estos anchos:

- `390px` — móvil de referencia.
- `430px` — móvil grande.
- `768px` — tablet / zona protegida previa a desktop.
- `900px` — inicio de desktop.
- `1024px` — laptop/tablet horizontal.
- `1366px` — escritorio común.
- `1440px` — escritorio amplio.

La comparación de `390px` y `430px` debe confirmar que la versión móvil continúa visualmente igual a la aprobada.

## Regla de riesgo

Si una mejora desktop exige tocar una implementación que actualmente funciona en móvil y existe riesgo de alterar la versión aprobada:

> **NO realizar el cambio automáticamente. Consultar primero.**

No asumir que una mejora de escritorio autoriza modificar móvil.

## Estrategia recomendada

Trabajar desktop sección por sección, no toda la invitación de una sola vez.

Orden recomendado:

1. Contenedor general y ancho desktop.
2. Portada / anuncio / contador.
3. Tarjeta y ubicación.
4. Ceremonia y fotografías.
5. Tripulación.
6. Dress Code.
7. Programa.
8. RSVP.
9. Regalos.
10. Música.
11. FAQ.
12. Cierre.

Cada sección se considera aprobada antes de avanzar a la siguiente.

## Regla final

> **Desktop es una mejora secundaria. Mobile es el producto principal. El objetivo no es rediseñar la invitación sino hacer que la misma invitación aprobada aproveche correctamente una pantalla grande sin modificar la experiencia móvil.**
