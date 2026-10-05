# ROADMAP MIGRANDIA

Última actualización: 2026-10-05
Último commit DEV: pendiente de registrar en cada avance
Último commit PROD: pendiente de registrar en cada avance
Versión producción: pendiente de versionado formal
Trabajo actual: preparación para marcha blanca + arquitectura multi-evento
Próximo trabajo: MGD-001 a MGD-007 y definición MGD-012 a MGD-014
Bloqueadores: separación DEV/PROD de servicios, protección anti-abuso RSVP, observabilidad y E2E

## Regla maestra de mantenimiento

Este archivo es la única fuente oficial del roadmap técnico y funcional de Migrandia / Mi Gran Día.

No crear archivos paralelos como `ROADMAP_V2`, `ROADMAP_FINAL`, `ROADMAP_NUEVO`, `ROADMAP_FIX` u otros equivalentes.

Mientras avancemos:
1. Antes de iniciar una tarea, se cambia su estado a `🟡 EN DESARROLLO`.
2. Al terminar desarrollo, se registra branch, PR, commit y observaciones de QA.
3. Si Antonio aprueba desarrollo, se marca `🟣 APROBADO DEV`.
4. Al migrar a producción, se registra PR y commit de `Wedding/main`.
5. Solo se marca `🟢 PRODUCCIÓN` después de verificar que el cambio está realmente en producción.
6. Si una tarea cambia de alcance, se edita esta misma sección. No se duplica.
7. Antes de iniciar una tarea nueva, se actualiza el estado de la tarea anterior.
8. `HISTORIAL_AVANCES.md` registra lo realizado; este archivo registra estado actual, pendientes, decisiones y siguiente paso.

## Estados

| Estado | Significado |
| --- | --- |
| ⬜ PENDIENTE | Todavía no se inicia |
| 🟡 EN DESARROLLO | Trabajo activo en desarrollo |
| 🟠 QA | Desarrollo terminado, validación en curso |
| 🟣 APROBADO DEV | Aprobado para migración |
| 🔵 PR PRODUCCIÓN | Migración a Wedding en curso |
| 🟢 PRODUCCIÓN | Fusionado y verificado |
| 🔴 BLOQUEADO | Existe un impedimento |
| ⚪ DESCARTADO | Se decidió no implementar |

Cada tarea debe registrar cuando aplique:
- DEV branch
- DEV PR
- DEV commit
- QA realizado
- PROD branch
- PROD PR
- PROD commit
- Fecha
- Decisiones
- Pendientes
- Riesgos / regresiones

---

# PRINCIPIOS DEL PRODUCTO

## Mi Gran Día no es solo bodas

**Mi Gran Día** se mantiene como nombre principal porque funciona para cualquier evento especial.

El producto podrá organizar:
- Bodas
- Cumpleaños
- Baby showers
- 15 años
- Bautizos
- Graduaciones
- Otros eventos personalizados

La boda seguirá siendo el producto principal y el modo más completo, pero la arquitectura no debe quedar amarrada exclusivamente a bodas.

## Una sola aplicación, múltiples perfiles

No se crearán aplicaciones separadas por tipo de evento.

Se mantiene:
- mismo sistema de usuarios;
- mismo UID Firebase;
- misma arquitectura de módulos;
- misma base de permisos;
- mismo motor de persistencia durante la transición;
- mismo motor de Invitados;
- mismo motor de Distribución;
- mismo motor de Invitaciones / RSVP.

Lo que cambia según el evento:
- terminología;
- checklist base;
- módulos visibles;
- catálogo de Distribución;
- iconografía;
- colores;
- temática;
- onboarding;
- plantillas de invitación.

---

# BLOQUE A — PREPARAR MIGRANDIA PARA MÁS USUARIOS

## MGD-001 — Baseline y versión estable
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Crear una referencia de estabilidad antes de cambios estructurales.

Debe registrar:
- commit actual de desarrollo;
- commit actual de producción;
- versión Worker DEV;
- versión Worker PROD;
- Rules Firebase vigentes;
- fecha de auditoría;
- versión visible del app;
- punto de restauración.

---

## MGD-002 — Separación total DEV / PROD
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Objetivo:
ninguna función productiva debe depender de `migrandia-dev`.

DEV:
`migrandia-dev.avaldiviezoch.workers.dev`

PROD:
`wedding.avaldiviezoch.workers.dev`

Objetivo posterior:
`api.migrandiapp.com`

Centralizar endpoints en una sola configuración por ambiente.

Incluye:
- Ideas
- Música
- Link Preview
- Image Proxy
- futuros servicios

---

## MGD-003 — Protección contra abuso de RSVP
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Mantener Anonymous Auth + Firestore Rules.

Agregar / evaluar:
- Firebase App Check;
- Cloudflare Turnstile;
- rate limiting;
- límites por token;
- límites por IP / fingerprint cuando sea viable y compatible con privacidad;
- protección contra spam;
- límites de payload;
- límites de frecuencia;
- detección de abuso.

---

## MGD-004 — Seguridad de Workers
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Auditar:
- CORS;
- origins;
- redirects;
- allowlist de proveedores;
- SSRF;
- proxy de imágenes;
- tamaño máximo;
- timeout;
- cache;
- rate limiting;
- abuso de endpoints públicos.

Endpoints:
- `/api/link-preview`
- `/api/image-proxy`
- `/api/music-preview`

---

## MGD-005 — Seguridad web general
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Revisar / implementar:
- Content-Security-Policy;
- Referrer-Policy;
- Permissions-Policy;
- protección contra iframe/clickjacking;
- enlaces externos;
- `target="_blank"`;
- proveedores externos;
- Firebase;
- YouTube;
- Spotify;
- Apple Music;
- Pinterest;
- Temu.

---

## MGD-006 — Observabilidad de producción
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Agregar captura centralizada de:
- errores JavaScript;
- `unhandledrejection`;
- error de módulo;
- versión de app;
- navegador;
- dispositivo;
- error Firebase;
- error Worker;
- error de carga;
- error de persistencia.

No almacenar:
- contraseñas;
- RSVP completo;
- teléfonos;
- correos;
- información personal innecesaria.

---

## MGD-007 — Versionado de Migrandia
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Definir versión visible:
`Migrandia x.y.z`

Registrar por release:
- versión;
- commit DEV;
- commit PROD;
- fecha;
- cambios principales.

---

## MGD-008 — Tests E2E reales
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Incorporar pruebas de navegador.

Flujos mínimos:
1. Usuario nuevo.
2. Login.
3. Crear evento.
4. Onboarding.
5. Checklist.
6. Presupuesto.
7. Invitados.
8. Mesas.
9. Distribución.
10. Recargar.
11. Verificar persistencia.

Roles:
- Owner
- Admin
- Editor
- Provider
- Viewer

Otros flujos:
- invitación de colaborador;
- aceptar invitación;
- RSVP;
- Música;
- cambio de evento;
- aislamiento de datos;
- iPhone;
- Android;
- tablet;
- desktop.

---

# BLOQUE B — CUENTA, LOGIN Y BRANDING DE ACCESO

## MGD-009 — Registro por correo
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Agregar:
- Crear cuenta;
- validación;
- mensajes amigables;
- flujo consistente con Google.

---

## MGD-010 — Recuperación de contraseña
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Agregar:
- “Olvidé mi contraseña”;
- Firebase Auth;
- confirmación visual;
- protección contra enumeración de correos cuando corresponda.

---

## MGD-011 — Usuario único multi-evento
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Se mantiene:
**un usuario = un UID Firebase único**.

Ejemplo:

`Usuario Antonio`
- Boda Antonio & Lucero
- Cumpleaños mamá
- Baby Shower
- Graduación

No crear usuarios separados por evento.

---

## MGD-033 — Branding profesional del login Google / Firebase
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA ANTES DE MARCHA BLANCA

Problema actual:
el flujo de Google puede mostrar referencias técnicas a Firebase / dominio poco elegante.

Objetivo:
el usuario debe percibir que está entrando a **Mi Gran Día / Migrandia**, no a “Firebase”.

Revisar:
- nombre público de la aplicación en Firebase / Google Cloud;
- logo;
- pantalla de consentimiento;
- dominio autorizado;
- dominio verificado;
- branding OAuth;
- texto mostrado al iniciar sesión;
- política de privacidad;
- términos;
- correo de soporte;
- favicon / identidad;
- flujo de retorno a `migrandiapp.com`.

Criterio de diseño:
- “Mi Gran Día” debe presentarse como organizador de eventos especiales;
- no usar mensajes que hagan pensar que la plataforma es exclusivamente de bodas;
- boda sigue siendo el producto estrella, pero la identidad pública es multi-evento;
- visual sobrio y profesional;
- eliminar rastros técnicos innecesarios de Firebase del recorrido del usuario cuando la plataforma lo permita.

Validar en:
- Google Login desktop;
- Google Login Android;
- Google Login iPhone;
- cuenta nueva;
- cuenta existente;
- logout / login nuevamente.

---

# BLOQUE C — ARQUITECTURA MULTI-EVENTO

## MGD-012 — Concepto EVENTO sin romper `weddings`
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

No renombrar todavía `weddings` a `events`.

Agregar capa conceptual:
`eventType`

Compatibilidad:
todo documento histórico sin `eventType` se interpreta como:
`wedding`

No hacer migración destructiva.

---

## MGD-013 — Tipos iniciales
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Primera versión acordada: **máximo 8 tipos base**, evitando fragmentar demasiado el producto.

Tipos:
- `wedding` — Boda
- `birthday` — Cumpleaños
- `quince` — 15 años
- `baby_shower` — Baby Shower
- `religious` — Bautizo / Primera Comunión
- `graduation` — Graduación
- `corporate` — Evento corporativo
- `custom` — Otro / personalizado

Regla:
- No crecer a 15 o 20 tipos desde el inicio.
- La variedad fina se resuelve con `themeId`, edad/perfil y configuración del evento.
- Boda seguirá siendo el modo flagship y el más completo.
- Bautizo y Primera Comunión comparten una misma familia inicial de evento religioso para no duplicar lógica.

---

## MGD-014 — Motor central `eventProfile`
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

No llenar el código de:
`if (wedding)`
`if (birthday)`
`if (quince)`

Crear una configuración central pequeña y estática, no datos del usuario.

Conceptualmente:

```js
eventProfile = {
  type,
  terminology,
  modules,
  checklist,
  distributionCatalog,
  theme,
  onboarding,
  invitationCapabilities,
  audienceProfile
}
```

`audienceProfile` podrá considerar edad/rango etario, rol del organizador y contexto del evento sin convertir cada combinación en una aplicación distinta.

Este perfil no escala con usuarios y por ello sí puede ser configuración JS/JSON.

---

# BLOQUE D — EVENTO VS TEMÁTICA

## MGD-015 — Separar tipo de evento de temática
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Ejemplos:

`eventType = wedding`
`themeId = classic-elegant`

`eventType = wedding`
`themeId = one-piece-elegant`

`eventType = birthday`
`themeId = minimal-black`

No mezclar lógica funcional con tema visual.

---

## MGD-016 — Tema global y tokens visuales
Estado: ⬜ PENDIENTE
Prioridad: ALTA

El tema será **global para toda la aplicación** y consumido por cada módulo.

No crear CSS separado por evento ni repetir fuentes/colores módulo por módulo.

Usar tokens centrales:
- `--event-primary`
- `--event-secondary`
- `--event-accent`
- `--event-background`
- `--event-surface`
- `--event-heading-font`
- `--event-body-font`
- `--event-radius`
- `--event-decoration-style`

Cada módulo conserva su propio HTML/JS/CSS, pero consume estos tokens globales.

La apariencia podrá ajustarse según:
1. tipo de evento;
2. tema elegido;
3. edad o rango etario cuando corresponda;
4. perfil del homenajeado/organizador.

Ejemplos:
- cumpleaños infantil de 5 años → visual más lúdico y apropiado a infancia;
- cumpleaños adulto de 50 años → visual más sobrio/adulto;
- 15 años → perfil visual específico elegido por el usuario, sin asumir obligatoriamente color rosado;
- boda → mantiene la línea premium como referencia principal.

Regla:
la edad orienta presets y recomendaciones, pero nunca debe imponer estereotipos visuales de forma rígida.

---

# BLOQUE E — TERMINOLOGÍA DINÁMICA

## MGD-017 — Diccionario de lenguaje por evento
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Evitar texto matrimonial hardcodeado.

Ejemplos:

Boda:
- Mesa de novios
- Novia / Novio
- Iglesia

15 años:
- Mesa principal
- Quinceañera

Cumpleaños:
- Mesa del homenajeado

Baby Shower:
- Futuros padres / bebé

Graduación:
- Graduado/a

La interfaz debe consultar el perfil del evento.

---

# BLOQUE F — CHECKLIST POR EVENTO

## MGD-018 — Plantillas iniciales de Checklist
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Boda:
- conservar riqueza actual.

15 años:
- vestido;
- DJ;
- fotografía;
- coreografía;
- invitados;
- salón;
- torta;
- decoración.

Baby Shower:
- invitados;
- decoración;
- mesa de dulces;
- regalos;
- juegos;
- fotografía.

Cumpleaños:
- local;
- invitaciones;
- torta;
- decoración;
- música;
- comida.

Regla:
al crear el evento se parte de una plantilla.
Después de creada, la lista pertenece al evento y no se pisa automáticamente.

---

## MGD-034 — Onboarding dinámico por tipo de evento
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

El onboarding actual está orientado a boda (Novia / Novio / Ayudo a organizar). Debe convertirse en un flujo adaptativo.

Primera decisión:
**¿Qué tipo de evento estás organizando?**

Según la respuesta, cambian las siguientes preguntas.

Ejemplos:

Boda:
- Novia
- Novio
- Somos la pareja
- Ayudo a organizar

Cumpleaños:
- Es para mí
- Para mi hijo/a
- Para un familiar
- Para otra persona
- Ayudo a organizar

15 años:
- Soy la quinceañera
- Mamá / papá
- Familiar
- Organizador/a

Baby Shower:
- Futura mamá / futuros padres
- Familiar
- Amigo/a
- Organizador/a

Evento religioso:
- Mamá / papá
- Familiar
- Padrino / madrina
- Organizador/a

Graduación:
- Soy el/la graduado/a
- Familiar
- Institución / promoción
- Organizador/a

Evento corporativo:
- Represento a la empresa
- Colaborador/a
- Organizador interno
- Organizador / proveedor externo

Otro:
- Para mí
- Para otra persona
- Para una organización
- Ayudo a organizar

Regla:
no crear ocho onboardings independientes. Se mantiene un solo motor de onboarding que lee preguntas y opciones desde `eventProfile.onboarding`.

---

## MGD-035 — Edad / etapa de vida y adaptación de experiencia
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Cuando el tipo de evento lo requiera, el onboarding preguntará edad exacta o rango etario del homenajeado.

Aplicaciones:
- cumpleaños infantil;
- cumpleaños adolescente;
- cumpleaños adulto;
- adulto mayor;
- 15 años;
- otros eventos donde la edad sea relevante.

La edad podrá influir en:
- presets visuales sugeridos;
- tono de microcopy;
- checklist inicial;
- catálogo recomendado;
- ideas;
- plantillas de invitación;
- recomendaciones de actividades.

No debe cambiar permisos, identidad del usuario ni estructura de datos.

La app no debe inferir que una edad obliga a un color o estilo específico; ofrecerá presets y permitirá cambiar tema manualmente.

---

## MGD-036 — Onboarding con previsualización temática progresiva
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Mientras el usuario completa el onboarding, la interfaz podrá ir adaptándose en tiempo real.

Flujo conceptual:
`eventType → organizerRole → ageProfile → themeId → eventProfile final`

Ejemplo:
1. Selecciona Cumpleaños.
2. Indica “para mi hijo/a”.
3. Ingresa edad 5.
4. La UI muestra presets infantiles apropiados.
5. El usuario elige una temática.
6. Mi Gran Día aplica ese tema global al evento.

Otro ejemplo:
1. Selecciona Evento corporativo.
2. Indica “represento a la empresa”.
3. La app cambia a lenguaje corporativo.
4. Se ofrecen temas sobrios/brand-neutral.
5. Los módulos y checklist se adaptan.

La adaptación visual durante onboarding es una **previsualización**. Al finalizar, se guarda la configuración elegida como parte del evento.

---

# BLOQUE G — DISTRIBUCIÓN MULTI-EVENTO

## MGD-019 — Catálogo universal + filtros por evento
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Los 46 iconos actuales se mantienen.

Ejemplos:

`bar` → todos

`altar` → wedding

`couple` → wedding

`photobooth` → wedding, quince, birthday, graduation

`cake` → wedding, quince, birthday, baby_shower

No eliminar objetos.
Filtrar visibilidad según `eventProfile`.

---

## MGD-020 — Objetos especializados
Estado: ⬜ PENDIENTE
Prioridad: MEDIA

15 años:
- mesa principal;
- zona coreografía.

Baby Shower:
- zona regalos;
- juegos.

Graduación:
- diplomas;
- escenario.

Reutilizar el mismo motor espacial.

---

# BLOQUE H — INVITACIONES

## MGD-021 — Separar motor de invitación de plantilla de boda
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Arquitectura:
**motor + plantilla**

El motor gestiona:
- evento;
- fecha;
- lugar;
- invitado;
- acompañantes;
- RSVP;
- preguntas;
- música;
- estado.

Las plantillas definen apariencia.

---

## MGD-022 — Invitaciones bajo dominio Migrandia
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Nunca enviar al usuario final enlaces de GitHub.

Objetivo:

`https://migrandiapp.com/i/ABC123`

Posible evolución:

`https://invite.migrandiapp.com/ABC123`

---

## MGD-023 — ID público de invitación
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

No exponer directamente `weddingId` / `eventId`.

Crear ID público independiente.

Ejemplo:
`MGD-X7K92P`

Resolución:
`publicInviteId → eventId → template → RSVP config`

Debe ser revocable.

---

## MGD-024 — URL personalizada
Estado: ⬜ PENDIENTE
Prioridad: MEDIA

Posible:
`migrandiapp.com/i/antonio-lucero`

Internamente mantener token seguro.

---

# BLOQUE I — DATOS Y ESCALABILIDAD

## MGD-025 — Evolución de `planner-cloud`
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA A MEDIANO PLAZO

Problema:
actualmente varios módulos dependen de un backup agregado `cloudSync/cloudChunks`.

No hacer big-bang.

Migración progresiva hacia dominios separados:
- checklist;
- budget;
- guests;
- distribution;
- ideas;
- otros.

Usar transición controlada:
- lectura antigua;
- lectura nueva;
- migración;
- validación;
- retirada gradual.

---

## MGD-026 — Permisos de Ideas
Estado: ⬜ PENDIENTE
Prioridad: MEDIA

UI:
Owner/Admin.

Backend agregado actual:
Owner/Admin/Editor.

No retirar Editor globalmente.

Resolver cuando Ideas tenga persistencia propia.

---

## MGD-027 — Límites de plataforma
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Definir límites técnicos:
- eventos por usuario;
- invitados;
- mesas;
- ideas;
- proveedores;
- RSVP;
- imágenes;
- objetos de Distribución;
- tamaño de datos.

Objetivo:
proteger costos y estabilidad.

---

# BLOQUE J — PRIVACIDAD Y RECUPERACIÓN

## MGD-028 — Eliminar evento
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Eliminar un evento sin afectar los otros eventos del usuario.

Confirmación fuerte.

---

## MGD-029 — Eliminar cuenta
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Definir:
- eventos propios;
- eventos compartidos;
- miembros;
- RSVP;
- archivos;
- responsabilidades de owner.

---

## MGD-030 — Backup y restauración
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Sistema formal de:
- eventId;
- versión;
- fecha;
- backup;
- restore.

Nunca restaurar un evento sobre otro por accidente.

---

# BLOQUE K — MARCHA BLANCA Y BETA

## MGD-031 — Marcha blanca controlada
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Primero:
5–10 usuarios externos.

Después:
20–30.

Medir:
- errores;
- Firebase;
- Workers;
- costos;
- UX;
- móvil;
- persistencia;
- permisos;
- RSVP.

---

## MGD-032 — Beta pública
Estado: ⬜ PENDIENTE
Prioridad: FUTURA

Requisitos mínimos:
- MGD-002 cerrado;
- MGD-003 cerrado;
- MGD-004 cerrado;
- MGD-006 cerrado;
- MGD-008 cerrado;
- MGD-010 cerrado;
- branding de login MGD-033 cerrado;
- multi-evento base validado;
- no contaminación entre eventos;
- backup probado;
- QA móvil / desktop.

---

# ORDEN PROPUESTO PARA ESTA SEMANA

## HOY — Seguridad, producción y base arquitectónica
1. MGD-001 — Baseline
2. MGD-002 — Separar Worker DEV/PROD
3. MGD-003 — Anti-abuso RSVP
4. MGD-004 — Worker security
5. MGD-006 — Observabilidad
6. MGD-007 — Versionado
7. MGD-033 — Branding Login Google/Firebase
8. MGD-012 — Capa eventType
9. MGD-013 — Tipos de evento
10. MGD-014 — eventProfile

## SIGUIENTE BLOQUE — Multi-evento visible
11. MGD-015 — evento vs tema
12. MGD-016 — tema global y tokens
13. MGD-017 — textos dinámicos
14. MGD-034 — onboarding dinámico
15. MGD-035 — edad / etapa de vida
16. MGD-036 — previsualización temática progresiva
17. MGD-018 — checklist
18. MGD-019 — Distribución filtrada
19. MGD-020 — objetos especializados

## SIGUIENTE BLOQUE — Invitaciones profesionales
17. MGD-021 — motor de invitaciones
18. MGD-022 — dominio Migrandia
19. MGD-023 — IDs públicos
20. MGD-024 — slugs opcionales

## SIGUIENTE BLOQUE — Usuarios reales
21. MGD-008 — E2E
22. MGD-009 — crear cuenta
23. MGD-010 — recuperar contraseña
24. MGD-031 — marcha blanca

## SIGUIENTE BLOQUE — Escalabilidad
25. MGD-025 — planner-cloud modular
26. MGD-026 — permisos Ideas
27. MGD-027 — límites
28. MGD-028 — eliminación evento
29. MGD-029 — eliminación cuenta
30. MGD-030 — backup / restore
31. MGD-032 — beta pública

---

# FORMATO DE ACTUALIZACIÓN OBLIGATORIO POR TAREA

Ejemplo:

```md
## MGD-019 — Catálogo Distribución multi-evento

Estado: 🟡 EN DESARROLLO
Prioridad: Alta

DEV branch:
DEV PR:
DEV commit:

QA:
- Desktop:
- Android:
- iPhone:
- Persistencia:
- Regresión:

Aprobación DEV:

PROD branch:
PROD PR:
PROD commit:

Decisiones:
- No duplicar catálogo.
- Filtrar por eventProfile.
- Mantener objetos existentes.

Pendiente:
- Definir compatibilidad de los 46 objetos.

Riesgos:
- Ninguno / describir.

Última actualización:
```

---

# CRITERIOS NO NEGOCIABLES

- Desarrollo primero.
- Producción solo tras aprobación.
- No duplicar módulos por tipo de evento.
- No duplicar CSS/HTML/JS por evento salvo necesidad arquitectónica aprobada.
- No usar `!important`.
- No crear “fix”, “final”, “v2”, “nuevo” como solución permanente.
- Un único dueño lógico por feature.
- Aislamiento por evento.
- Usuarios únicos por Firebase UID.
- No exponer IDs internos en enlaces públicos.
- No exponer GitHub al usuario final.
- Boda sigue siendo el modo flagship.
- Mi Gran Día debe funcionar semánticamente para cualquier evento especial.
- El onboarding debe adaptarse al tipo de evento sin duplicar motores.
- El tema visual es global y los módulos consumen tokens compartidos.
- Edad/rango etario puede orientar presets, nunca imponer estereotipos rígidos.
- Máximo inicial: 8 familias de evento; nuevas familias requieren justificación antes de añadirse.
- Cada avance debe actualizar este roadmap antes de empezar el siguiente.
- Ninguna tarea se marca como producción sin verificar `Wedding/main`.
