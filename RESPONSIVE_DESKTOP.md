# REGLAS OBLIGATORIAS — RESPONSIVE DESKTOP

Este documento complementa `AGENTS.md` y debe leerse **antes de realizar cualquier cambio relacionado con la versión desktop o responsive** de la invitación.

## Principio principal

La **versión móvil actual es la versión principal, aprobada y protegida** de la invitación.

Aproximadamente el **95 % de los invitados visualizará la invitación desde un celular**, por lo que ningún trabajo de adaptación a escritorio puede alterar, degradar, desplazar o reinterpretar el diseño móvil ya aprobado.

La versión desktop corresponde aproximadamente al 5 % restante y debe construirse como una adaptación responsive de la misma invitación, nunca a costa de la experiencia móvil.

## Prioridad obligatoria

1. **Móvil = prioridad absoluta y fuente visual aprobada.**
2. **Desktop = adaptación secundaria.**
3. Ante cualquier conflicto entre ambas, **se conserva móvil y se corrige desktop**.
4. No se acepta una mejora de escritorio que produzca cualquier regresión visual o funcional en móvil.

## Arquitectura

La invitación continuará utilizando una sola implementación:

- `invitación final/index.html`
- `invitación final/styles.css`
- `invitación final/script.js`

No crear una segunda invitación, un segundo HTML, duplicados de secciones ni lógica paralela para desktop.

El responsive desktop debe resolverse principalmente mediante CSS y media queries claramente delimitadas. HTML o JavaScript solo podrán modificarse si existe una necesidad estructural real que no pueda resolverse correctamente mediante layout responsive y, aun así, el comportamiento móvil existente debe permanecer intacto.

## Protección de la versión móvil

Durante el desarrollo desktop queda prohibido:

- modificar reglas móviles ya aprobadas para conseguir que desktop funcione;
- cambiar posiciones, tamaños, márgenes, tipografías, colores o proporciones móviles como efecto colateral;
- reemplazar selectores móviles por reglas globales que cambien su resultado;
- introducir `!important` para resolver conflictos entre móvil y desktop;
- duplicar HTML para mostrar una versión en móvil y otra en escritorio;
- ocultar una versión con `display:none` para mostrar otra;
- usar JavaScript para detectar móvil/escritorio y reconstruir la interfaz;
- crear parches, overlays o elementos compensatorios;
- alterar RSVP, Música, entrada, audio, contador, regalos, FAQ u otra funcionalidad aprobada únicamente por necesidades visuales de desktop.

## Estrategia CSS

El CSS actual debe considerarse **mobile-first**.

Las reglas existentes representan la experiencia móvil aprobada. Las adaptaciones de escritorio deben añadirse dentro de media queries desktop explícitas, utilizando el menor número posible de reglas y modificando solamente las propiedades necesarias para aprovechar pantallas mayores.

Como criterio inicial, el trabajo desktop deberá comenzar en un breakpoint claramente definido (por ejemplo, `min-width: 768px` o el que se determine tras revisar el layout real). No se elegirán breakpoints para corregir un dispositivo específico, sino según dónde el diseño necesite cambiar naturalmente.

Las reglas desktop deben estar agrupadas y ser identificables. No deben mezclarse correcciones desktop dentro de reglas móviles existentes.

## Contenido y funcionalidad compartidos

Móvil y desktop deben compartir exactamente:

- contenido y textos;
- recursos principales;
- enlaces;
- fecha y contador;
- video de entrada;
- reproducción de Sake de Binks;
- RSVP y su token de Mi Gran Día;
- pedidos musicales y su token de Mi Gran Día;
- regalos y botones de copiar;
- preguntas frecuentes;
- accesibilidad y estados de controles;
- lógica JavaScript.

Desktop puede reorganizar visualmente una sección cuando el espacio adicional lo justifique, pero no debe crear una segunda implementación funcional.

## Método de trabajo por sección

El desktop se desarrollará **una sección a la vez**.

Para cada sección:

1. revisar primero cómo funciona actualmente en móvil;
2. conservar el resultado móvil sin cambios;
3. definir únicamente qué necesita cambiar en pantallas grandes;
4. implementar esas diferencias dentro del ámbito desktop;
5. comprobar desktop;
6. volver a comprobar móvil;
7. no avanzar a la siguiente sección si móvil sufrió una regresión.

No realizar un rediseño masivo de toda la invitación en una sola intervención.

## Regla de regresión

Si después de un cambio desktop la versión móvil presenta una diferencia no solicitada, el cambio desktop se considera incorrecto aunque escritorio se vea mejor.

La solución debe corregirse desde la regla desktop. **No se ajustará móvil para acomodar desktop.**

## Rendimiento

La adaptación desktop no debe duplicar la carga de la invitación.

Evitar:

- descargar una segunda colección completa de imágenes solo para escritorio;
- cargar otro JavaScript equivalente;
- duplicar widgets de Mi Gran Día;
- duplicar video o audio;
- cargar componentes desktop que permanezcan ocultos en móvil sin una razón técnica justificada.

Siempre que sea posible, los mismos recursos deben adaptarse mediante CSS.

## Validación mínima obligatoria

Antes de considerar aprobado cualquier cambio responsive:

- verificar que móvil mantiene el aspecto previamente aprobado;
- verificar que no aparezcan scroll horizontal, cortes o desbordamientos accidentales;
- verificar que video y audio mantienen su secuencia;
- verificar botones y enlaces;
- verificar RSVP;
- verificar Pedidos Musicales;
- verificar desplegable de regalos;
- verificar FAQ;
- verificar animaciones relevantes;
- verificar la sección modificada en una pantalla desktop real o equivalente.

## Regla final

> **Desktop debe adaptarse a la invitación móvil; la invitación móvil no debe adaptarse para resolver desktop.**

Si existe duda sobre si una modificación puede afectar la versión móvil aprobada, **no realizarla hasta revisar el impacto o consultar al usuario**.
