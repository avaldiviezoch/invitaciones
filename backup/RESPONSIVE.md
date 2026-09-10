# REGLAS OBLIGATORIAS — RESPONSIVE / DESKTOP

Este archivo complementa `AGENTS.md` y debe leerse **ANTES de realizar cualquier cambio relacionado con responsive, tablet o desktop**.

## Prioridad del proyecto

La invitación fue diseñada, revisada y aprobada principalmente para **móvil**.

- **Móvil es la versión principal y prioritaria.**
- Se estima que aproximadamente **95 %** de los invitados accederán desde un teléfono.
- Desktop/tablet representa aproximadamente **5 %** y debe verse correctamente, pero **nunca a costa de alterar o degradar la versión móvil aprobada**.

## Regla principal

> **El desarrollo desktop debe adaptarse a la versión móvil existente. La versión móvil aprobada no debe adaptarse al desktop.**

## Reglas obligatorias

1. **NO MODIFICAR MÓVIL PARA RESOLVER DESKTOP.**
   - No cambiar tamaños, posiciones, márgenes, tipografías, animaciones, imágenes, estructura o comportamiento móvil únicamente para facilitar el diseño desktop.
   - Si una solución desktop afecta móvil, esa solución se descarta y se busca otra.

2. **MANTENER UNA SOLA INVITACIÓN.**
   - No crear otro `index.html` para desktop.
   - No crear una segunda invitación paralela.
   - No duplicar RSVP, música, regalos, FAQ, entrada, contador ni otras funcionalidades.
   - Se mantiene una sola fuente de verdad: el HTML y JavaScript existentes.

3. **DESKTOP MEDIANTE RESPONSIVE REAL.**
   - Las adaptaciones desktop deben realizarse mediante CSS responsive y reglas claramente acotadas a pantallas mayores.
   - Preferir media queries `min-width` para que las reglas desktop se activen únicamente fuera del rango móvil.
   - No usar detección de dispositivo en JavaScript para decidir qué versión mostrar.
   - No hacer redirecciones móvil/desktop.

4. **AISLAMIENTO DE REGLAS DESKTOP.**
   - Toda regla creada exclusivamente para desktop debe quedar dentro de su media query correspondiente.
   - No modificar una regla base móvil si el cambio solicitado corresponde exclusivamente a desktop.
   - No añadir overrides dispersos o parches fuera del bloque responsive correspondiente.

5. **FUNCIONALIDAD COMPARTIDA.**
   - `script.js` seguirá siendo la única lógica funcional salvo necesidad técnica real.
   - RSVP y Música deben conservar la misma integración con Mi Gran Día y los mismos tokens/configuración aprobados.
   - Entrada, video, Sake de Binks, contador, regalos, FAQ y animaciones deben mantener su comportamiento aprobado en móvil.

6. **CONTENIDO COMPARTIDO.**
   - El contenido textual debe ser el mismo en móvil y desktop salvo instrucción expresa del usuario.
   - No duplicar contenido en HTML para posicionarlo de otra manera en desktop.
   - Resolver cambios de composición mediante layout CSS (`grid`, `flex`, dimensiones fluidas, etc.).

7. **NO TOCAR SECCIONES MÓVILES APROBADAS.**
   - Cada sección ya aprobada en móvil se considera protegida.
   - Un trabajo responsive puede cambiar únicamente su presentación en los breakpoints desktop.
   - Si para lograr un diseño desktop parece indispensable modificar HTML compartido, detenerse primero y verificar que el cambio sea estructuralmente neutro para móvil. Si existe riesgo visual o funcional en móvil, no realizarlo sin autorización expresa.

8. **VALIDACIÓN OBLIGATORIA.**
   - Después de cada cambio desktop, verificar que móvil conserve el mismo aspecto y funcionamiento aprobado.
   - La validación móvil tiene prioridad sobre desktop.
   - Un cambio desktop que genere una regresión móvil se considera incorrecto aunque desktop se vea mejor.

9. **NO PARCHES RESPONSIVE.**
   - No usar `!important` para forzar desktop.
   - No duplicar selectores repetidamente para compensar reglas anteriores.
   - No ocultar una versión y mostrar otra copia de la misma sección.
   - No utilizar JavaScript para recolocar elementos según ancho si CSS puede resolverlo correctamente.

10. **ORDEN DE TRABAJO.**
    - Primero observar la sección móvil aprobada.
    - Después definir cómo debe aprovechar el espacio adicional en desktop.
    - Implementar únicamente reglas desktop.
    - Comprobar desktop.
    - Volver a comprobar móvil antes de considerar terminado el cambio.

## Breakpoints

Los breakpoints deben definirse por necesidad real del diseño, no por modelos específicos de dispositivos.

Como criterio inicial:

- La experiencia móvil existente permanece como base.
- Tablet/desktop puede comenzar mediante `min-width` cuando el ancho adicional realmente permita una composición distinta.
- No modificar los breakpoints actuales sin una necesidad demostrable.

## Criterio de aceptación

Una adaptación responsive se aprueba solamente cuando cumple simultáneamente:

1. Desktop se ve correctamente y aprovecha mejor el espacio disponible.
2. Móvil permanece visual y funcionalmente igual a la versión aprobada.
3. No existe contenido duplicado ni una segunda versión escondida.
4. No se introducen parches, `!important` ni lógica específica de dispositivo innecesaria.
5. El código continúa teniendo una sola fuente de verdad.

## Regla final

> **95 % móvil / 5 % desktop: mejorar el 5 % nunca debe poner en riesgo el 95 %. Si existe conflicto, se conserva móvil.**
