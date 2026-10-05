# ROADMAP MIGRANDIA

Última actualización: 2026-10-05
Último commit DEV: 0322bdde6f72887de55edce799d3e08b09f8c995
Último commit PROD: 9a1d5b6f088c610486a2aa02cf69c4687d623fd8
Versión producción: pendiente de versionado formal
Trabajo actual: MGD-001 — baseline y versión estable
Próximo trabajo: MGD-002 — separación total DEV / PROD
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
Estado: 🟠 QA
Prioridad: CRÍTICA

Crear una referencia de estabilidad antes de cambios estructurales.

### Baseline capturado — 2026-10-05

- DEV repo: `avaldiviezoch/invitaciones`
- DEV rama estable: `main`
- DEV commit base: `0322bdde6f72887de55edce799d3e08b09f8c995`
- DEV carpeta: `mi-lu-gran-dia-reestructuracion/`
- PROD repo: `avaldiviezoch/Wedding`
- PROD rama estable: `main`
- PROD commit base: `9a1d5b6f088c610486a2aa02cf69c4687d623fd8`
- PROD carpeta: `app_integral/`
- Worker PROD configurado en repo: `wedding`
- Worker PROD compatibility date: `2026-09-26`
- Worker DEV conocido para previews/servicios: `migrandia-dev.avaldiviezoch.workers.dev`
- Firestore Rules blob SHA en producción: `8cdfd32625f6fe636aac7d15dc27075fd9fa354d`
- Versión visible formal del app: pendiente de MGD-007.
- Punto de restauración DEV: commit DEV base indicado arriba.
- Punto de restauración PROD: commit PROD base indicado arriba.

### Validaciones realizadas
- Se releen `AGENTS.md`, `ARQUITECTURA.md`, `CONTRATOS_MODULOS.md`, `REGLAS_NO_NEGOCIABLES.md`, `HISTORIAL_AVANCES.md` y este roadmap antes de iniciar cambios.
- No se modificó Firebase, Firestore, Auth, Storage, datos reales ni contratos de persistencia.
- No se modificó producción.
- Se confirmó que producción usa Worker `wedding` en `app_integral/wrangler.jsonc`.
- Se deja MGD-001 en QA documental hasta fusionar este registro a desarrollo main.

DEV branch: `mgd/001-baseline-20261005`
DEV PR: pendiente
DEV commit: pendiente
QA:
- Documentación baseline: OK
- Persistencia/Firebase: sin cambios
- Producción: sin cambios

PROD branch: no aplica
PROD PR: no aplica
PROD commit: no aplica

Decisiones:
- Este baseline será la referencia previa a MGD-002 y al resto de cambios de seguridad/arquitectura.
- No se tocará producción para completar MGD-001.

Pendiente:
- Fusionar documentación del baseline a DEV main.
- MGD-007 definirá el versionado visible formal.

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
- Privacidad, legal, analytics y permisos deben diseñarse antes de la beta pública, no después.
- El onboarding debe adaptarse al tipo de evento sin duplicar motores.
- El tema visual es global y los módulos consumen tokens compartidos.
- Edad/rango etario puede orientar presets, nunca imponer estereotipos rígidos.
- Máximo inicial: 8 familias de evento; nuevas familias requieren justificación antes de añadirse.
- Cada avance debe actualizar este roadmap antes de empezar el siguiente.
- Ninguna tarea se marca como producción sin verificar `Wedding/main`.


---

# BLOQUE L — CONFIANZA, GOBERNANZA Y PRODUCTO

## MGD-042 — Legal, privacidad y confianza
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA ANTES DE BETA PÚBLICA

Objetivo:
definir una base legal y de confianza coherente con una plataforma que maneja cuentas, eventos, invitados, RSVP, imágenes y contenido generado por usuarios.

Incluir:
- Términos y Condiciones;
- Política de Privacidad;
- Política de cookies / tecnologías equivalentes cuando aplique;
- tratamiento de datos personales;
- finalidad y minimización de datos;
- conservación y eliminación;
- derechos del usuario;
- datos de invitados que pueden no ser usuarios de Migrandia;
- imágenes y archivos subidos;
- proveedores externos;
- Firebase / Google;
- Cloudflare;
- servicios de música, enlaces e imágenes;
- canales de contacto y soporte.

Reglas:
- solicitar solo los datos necesarios;
- no reutilizar datos personales para finalidades no informadas;
- diferenciar datos del organizador de datos de invitados;
- contemplar eliminación de cuenta y evento;
- revisar requisitos legales aplicables antes de beta pública;
- la implementación técnica debe permitir cumplir las políticas declaradas.

---

## MGD-043 — Analytics de producto con privacidad
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Objetivo:
medir uso real de Migrandia sin convertir la analítica en recolección invasiva.

Medir:
- creación de eventos por eventType;
- inicio y finalización del onboarding;
- abandono por paso;
- activación de módulos;
- uso de Checklist, Presupuesto, Invitados, Distribución, Ideas, Música e Invitaciones;
- origen de entrada: home general o landing específica;
- conversión Landing → Onboarding → Evento creado;
- uso por dispositivo y tamaño de pantalla;
- errores de experiencia relacionados con flujo.

No registrar en analytics:
- contraseñas;
- nombres completos de invitados;
- teléfonos;
- correos;
- respuestas RSVP completas;
- contenido privado de notas;
- datos personales que no sean necesarios para la métrica.

Separar:
- observabilidad técnica = MGD-006;
- analytics de producto = MGD-043.

---

## MGD-044 — Roles y permisos por evento
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Objetivo:
definir quién puede ver o modificar cada parte de un evento compartido.

Roles base iniciales:
- Owner;
- Admin;
- Editor;
- Provider;
- Viewer.

Evaluar perfiles contextuales:
- pareja;
- familiar;
- wedding/event planner;
- colaborador de empresa;
- proveedor invitado;
- ayudante temporal.

La autorización real debe resolverse por capacidades, no solo por etiquetas visuales.

Ejemplos de capacidades:
- ver evento;
- editar configuración;
- gestionar invitados;
- ver datos sensibles;
- editar presupuesto;
- editar checklist;
- modificar distribución;
- gestionar invitaciones;
- revisar RSVP;
- administrar colaboradores;
- eliminar evento;
- transferir ownership.

Reglas:
- mínimo privilegio;
- un Provider no debe recibir acceso global por defecto;
- Viewer nunca modifica;
- acciones destructivas restringidas;
- permisos deben validarse también en backend / Rules, no solo ocultarse en UI;
- los permisos se aplican por eventId y no contaminan otros eventos del mismo usuario.

---

## MGD-045 — Ciclo de vida y estados del evento
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Definir un estado explícito del evento para evitar que todos los eventos se comporten igual durante toda su vida.

Estados conceptuales iniciales:
- draft;
- planning;
- invitations_open;
- active;
- completed;
- archived;
- cancelled cuando corresponda.

El estado podrá influir en:
- CTA principal;
- recordatorios;
- checklist;
- RSVP;
- edición de invitaciones;
- indicadores;
- notificaciones;
- visibilidad de tareas posteriores;
- archivado.

Reglas:
- no borrar automáticamente un evento al terminar;
- permitir consulta histórica;
- separar evento completado de evento eliminado;
- transiciones críticas deben quedar registradas;
- no inferir estados únicamente por fecha sin permitir corrección del owner.

---

## MGD-046 — Configuración regional e internacionalización base
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Preparar Migrandia para no quedar amarrada a Perú aunque la primera operación se concentre allí.

Configurable por usuario/evento cuando corresponda:
- país;
- zona horaria;
- idioma;
- moneda;
- símbolo y formato monetario;
- formato de fecha;
- formato de hora;
- separadores numéricos;
- unidades cuando apliquen.

Regla:
- almacenar fechas internamente de manera consistente;
- renderizar según locale / timezone;
- Presupuesto no debe hardcodear PEN;
- textos visibles deben poder migrar progresivamente a un sistema de traducciones;
- no duplicar módulos por idioma o país.

Primera prioridad:
- español;
- Perú;
- PEN;
- zona horaria del evento.

Arquitectura preparada para ampliar después.

---

## MGD-047 — Capacidades activables por tipo de evento
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Objetivo:
permitir que distintos eventos tengan funciones diferentes sin crear ocho aplicaciones ni llenar el código de condicionales dispersos.

Agregar a eventProfile una capa de capabilities, por ejemplo:

```js
capabilities = {
  rsvp: true,
  seating: true,
  padrinos: false,
  accreditation: false,
  giftRegistry: false,
  ceremony: false
}
```

Ejemplos:
- boda puede activar ceremonia, padrinos, mesas e RSVP;
- evento corporativo puede activar acreditación y agenda;
- cumpleaños puede ocultar funciones matrimoniales;
- graduación puede activar promoción, ceremonia o diplomas cuando se implemente.

Reglas:
- una capability define disponibilidad funcional;
- el tema visual no decide capacidades;
- eventType propone defaults;
- el evento puede guardar configuración compatible cuando corresponda;
- ningún módulo debe asumir que siempre está habilitado;
- capabilities centralizadas en eventProfile.

---

## MGD-048 — Revisión transversal antes de marcha blanca
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA

Antes de incorporar usuarios externos, realizar una revisión transversal que confirme:

- privacidad y textos legales mínimos definidos;
- roles y permisos probados;
- separación real entre observabilidad y analytics;
- datos personales minimizados;
- ciclo de vida del evento consistente;
- configuración regional sin hardcodes críticos;
- capabilities centralizadas;
- login y branding MGD-033 verificados;
- DEV/PROD separados;
- backup y restore probados;
- E2E principales ejecutados;
- comportamiento móvil validado.

Esta tarea no reemplaza las anteriores: funciona como gate de salida hacia marcha blanca.



---

# BLOQUE M — ENTRADAS GENERALES Y ESPECÍFICAS POR EVENTO

## Regla de entrada a Migrandia

Migrandia tendrá **dos formas distintas de entrada**, ambas conectadas al mismo motor multi-evento:

1. **Entrada general**: para usuarios que llegan a Mi Gran Día sin tener todavía definido o declarado el tipo de evento. La experiencia debe presentar la plataforma de forma general y permitir elegir entre los tipos de evento disponibles.
2. **Entrada específica por evento**: para usuarios que llegan buscando una necesidad concreta, por ejemplo “organizador de bodas”, “organizador de cumpleaños”, “organizador de quinceañero”, etc. En este caso la página debe mostrar información, ejemplos, beneficios, módulos y CTA enfocados solamente en ese tipo de evento.

Estas dos entradas no deben convertirse en aplicaciones separadas. Deben compartir el mismo core, autenticación, módulos, eventProfile, sistema de temas y backend.

### MGD-037 — Landing general de Mi Gran Día
**Estado:** ⬜ PENDIENTE  
**Prioridad:** ALTA

Objetivo:
- Mantener una landing principal genérica de Mi Gran Día.
- Comunicar que la plataforma sirve para organizar distintos tipos de eventos especiales.
- Mostrar los tipos base de evento disponibles.
- El CTA principal debe llevar al onboarding general.
- En el onboarding general, la primera decisión será el tipo de evento.
- No asumir boda por defecto cuando el usuario entra por la portada general.

Ejemplo conceptual:
```text
migrandiapp.com
        ↓
Mi Gran Día — plataforma general
        ↓
¿Qué gran día estás organizando?
        ↓
Boda / Cumpleaños / 15 años / Baby Shower /
Bautizo-Comunión / Graduación / Corporativo / Otro
```

### MGD-038 — Landings específicas por tipo de evento
**Estado:** ⬜ PENDIENTE  
**Prioridad:** ALTA

Crear rutas reales e indexables por cada tipo de evento, evitando depender de fragmentos tipo `#boda`.

Rutas iniciales propuestas:
```text
/bodas
/cumpleanos
/quinceaneros
/baby-shower
/bautizo-comunion
/graduaciones
/eventos-corporativos
```

Cada landing específica debe:
- tener copy específico del evento;
- usar imágenes, ejemplos y beneficios relevantes para ese evento;
- mostrar únicamente funciones que tengan sentido para ese contexto;
- usar terminología del eventProfile correspondiente;
- adoptar el tema visual o familia visual definida para ese evento;
- tener metadata SEO propia;
- tener título, description, Open Graph y contenido indexable propio;
- evitar contenido duplicado entre categorías;
- mantener marca Mi Gran Día como marca principal.

Ejemplo:
```text
Google: “organizador de bodas”
        ↓
migrandiapp.com/bodas
        ↓
Contenido 100 % orientado a bodas
        ↓
CTA: “Organiza tu boda”
        ↓
Onboarding con eventType = wedding
```

### MGD-039 — Onboarding preconfigurado desde landing específica
**Estado:** ⬜ PENDIENTE  
**Prioridad:** ALTA

Cuando un usuario entra desde una landing específica, el onboarding no debe volver a preguntarle qué tipo de evento está organizando.

La ruta debe transmitir el contexto al onboarding:

```text
/bodas              → eventType = wedding
/cumpleanos         → eventType = birthday
/quinceaneros       → eventType = quince
/baby-shower        → eventType = baby_shower
/bautizo-comunion   → eventType = baptism_communion
/graduaciones       → eventType = graduation
/eventos-corporativos → eventType = corporate
```

Luego el onboarding continúa con las preguntas relevantes:
```text
quién organiza
→ edad / etapa de vida cuando corresponda
→ cantidad estimada de invitados
→ fecha
→ presupuesto
→ temática / estilo
→ configuración inicial del eventProfile
```

### MGD-040 — SEO multi-evento
**Estado:** ⬜ PENDIENTE  
**Prioridad:** ALTA

Trabajar posicionamiento por intención de búsqueda, sin mezclar todas las intenciones en una única página.

Ejemplos de familias de búsqueda:

**Bodas**
- organizador de bodas;
- planificador de bodas online;
- checklist de boda;
- presupuesto de boda;
- invitaciones de boda;
- distribución de mesas para boda.

**Cumpleaños**
- organizador de cumpleaños;
- planificador de cumpleaños;
- invitaciones de cumpleaños;
- checklist de cumpleaños;
- distribución de mesas para cumpleaños.

La misma lógica se extenderá al resto de eventos.

Reglas:
- una URL canónica por intención principal;
- sitemap actualizado;
- metadata específica;
- schema/structured data cuando corresponda;
- no duplicar contenido textual entre landings;
- enlazado interno entre la home general y las páginas específicas;
- medir tráfico y conversión por tipo de evento.

### MGD-041 — Coherencia entre adquisición y experiencia interna
**Estado:** ⬜ PENDIENTE  
**Prioridad:** ALTA

La promesa de la landing específica debe continuar dentro de la aplicación.

Ejemplo:
si el usuario entra por `/cumpleanos`, no debe llegar a una interfaz que hable de “novios”, “iglesia” o “mesa de novios”.

Debe preservarse el contexto:
```text
Landing específica
→ eventType
→ onboarding
→ eventProfile
→ tema global
→ terminología
→ checklist
→ distribución
→ invitaciones
→ módulos habilitados
```

La landing no tendrá lógica de negocio duplicada. Solamente define la puerta de entrada y el contexto inicial.

## Criterio de aceptación del bloque

Este bloque se considera terminado cuando:
- la home general permite descubrir y elegir cualquier tipo de evento;
- existe al menos una landing específica funcional por cada tipo base priorizado;
- cada landing específica inicia el onboarding con el eventType correcto;
- no se pregunta dos veces el tipo de evento cuando ya viene definido;
- la app interna conserva el contexto del evento;
- las URLs son indexables y tienen metadata propia;
- no existe dependencia de GitHub Pages visible para el usuario final;
- todo se sirve bajo el dominio de Mi Gran Día;
- cada avance queda registrado aquí con DEV → QA → PROD, PR y commit.


# BLOQUE L — CONFIANZA, ANALÍTICA Y CONFIGURACIÓN GLOBAL

## MGD-042 — Legal y confianza del producto
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA ANTES DE BETA PÚBLICA

Objetivo:
Mi Gran Día debe transmitir confianza profesional desde el primer acceso y cumplir con el manejo responsable de datos personales.

Incluir:
- Términos y condiciones;
- Política de privacidad;
- Política de cookies cuando corresponda;
- Información de contacto / soporte;
- consentimiento cuando se recojan datos personales;
- tratamiento de fotos, nombres, teléfonos, correos y restricciones alimentarias;
- derechos de eliminación y actualización;
- política de retención;
- tratamiento de datos de invitados que no tienen cuenta;
- revisión específica para formularios RSVP públicos.

Regla:
estos documentos deben ser consistentes con lo que realmente hace la plataforma. No publicar textos legales genéricos que no correspondan al comportamiento real del sistema.

---

## MGD-043 — Analytics y métricas respetando privacidad
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Objetivo:
entender cómo usan Migrandia los usuarios reales sin recopilar información personal innecesaria.

Medir:
- creación de eventos;
- tipo de evento;
- finalización de onboarding;
- módulos abiertos;
- abandono de flujo;
- creación de invitaciones;
- uso de RSVP;
- uso de Distribución;
- errores por módulo;
- conversión de landing específica → onboarding → evento creado;
- rendimiento y tiempos de carga.

No registrar:
- contraseñas;
- textos privados completos;
- contenido de RSVP;
- nombres de invitados;
- teléfonos;
- correos;
- notas personales.

Diferenciar:
- analytics de producto;
- observabilidad técnica;
- métricas de negocio.

---

## MGD-044 — Matriz central de capacidades por rol y tipo de evento
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Objetivo:
evitar permisos dispersos o inconsistentes conforme crezcan los eventos y módulos.

Mantener roles base:
- Owner;
- Admin;
- Editor;
- Provider;
- Viewer.

Definir en una matriz central:
- qué puede ver cada rol;
- qué puede editar;
- qué puede invitar;
- qué puede eliminar;
- qué puede exportar;
- qué módulos puede utilizar;
- qué acciones son exclusivas del propietario.

El tipo de evento puede cambiar módulos disponibles, pero no debe crear modelos de permisos completamente distintos sin justificación.

---

## MGD-045 — Estados del evento
Estado: ⬜ PENDIENTE
Prioridad: MEDIA

Definir estados estándar del ciclo de vida:

- draft;
- active;
- completed;
- archived;
- cancelled.

Aplicaciones:
- eventos futuros;
- eventos ya realizados;
- eventos cancelados;
- eventos archivados;
- recuperación y limpieza;
- filtros en “Mis eventos”.

Regla:
archivar no equivale a eliminar.

---

## MGD-046 — Configuración regional e internacionalización
Estado: ⬜ PENDIENTE
Prioridad: MEDIA

Preparar la arquitectura para no quedar amarrados a Perú.

Configuración por evento/usuario:
- moneda;
- zona horaria;
- idioma;
- formato de fecha;
- formato de hora;
- formato numérico;
- país / región;
- unidades cuando corresponda.

Primera implementación:
Perú / español / PEN.

Arquitectura:
debe permitir posteriormente otros países sin reescribir módulos.

---

## MGD-047 — Motor de capacidades por tipo de evento
Estado: ⬜ PENDIENTE
Prioridad: CRÍTICA PARA MULTI-EVENTO

No crear aplicaciones distintas por evento.

Cada `eventProfile` debe declarar capacidades disponibles.

Conceptualmente:

```js
capabilities: {
  checklist: true,
  budget: true,
  guests: true,
  tables: true,
  distribution: true,
  invitations: true,
  music: true,
  ideas: true,
  timeline: true
}
```

Cada evento podrá activar, ocultar o simplificar módulos.

Ejemplos:
- Boda: experiencia completa.
- Cumpleaños: experiencia simplificada.
- Evento corporativo: módulos y lenguaje adaptados.
- Otro: configuración flexible.

Regla:
una capacidad desactivada no debe significar código duplicado; simplemente el motor no expone ese módulo para ese perfil.

---

## MGD-048 — Centro de ayuda y soporte
Estado: ⬜ PENDIENTE
Prioridad: MEDIA

Antes de crecer a usuarios externos, preparar:
- preguntas frecuentes;
- ayuda contextual;
- contacto de soporte;
- reporte de errores;
- guía rápida de primeros pasos;
- explicación de permisos;
- ayuda para RSVP;
- ayuda para recuperación de cuenta.

Objetivo:
reducir dependencia de soporte manual por WhatsApp o mensajes directos.

---
