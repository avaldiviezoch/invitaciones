# ROADMAP MIGRANDIA

Última actualización: 2026-10-07
Último commit DEV registrado: 557de4dcb02010110520a189e76492aacb667e37
Último commit PROD: a2be5675a22199e244ae3f981e1196250911516e
Versión producción: pendiente de versionado formal
Trabajo actual: cerrar bloqueadores restantes de beta y preparar inicio del desarrollo visual multi-evento
Próximo trabajo: revisar MGD-010 y MGD-026 externo; después iniciar implementación visual del onboarding multi-evento
Bloqueadores: MGD-010 pendiente prueba real controlada; MGD-026 pendiente configuración externa Google/Firebase; MGD-003 pendiente validación productiva controlada; MGD-008 pendiente únicamente escritura controlada E2E-17 a E2E-19; MGD-033 mantiene beta pública bloqueada por diseño

## Estado operativo actual — 2026-10-07

- MGD-004, MGD-005, MGD-006 y MGD-007: producción / QA aprobado según cada bloque.
- MGD-009 y MGD-010: QA seguro DEV aprobado; falta prueba real controlada.
- MGD-011: aislamiento estructural multi-evento implementado; pendiente QA seguro y prueba real controlada.
- MGD-012 a MGD-024: capas multi-evento e invitaciones aprobadas en QA seguro DEV.
- MGD-025: fases 1–8 aprobadas; activación real domain-only continúa bloqueada.
- MGD-026: Fase 1 de branding cliente aprobada; falta configuración externa Google/Firebase.
- MGD-027 a MGD-032: QA seguro DEV aprobado.
- MGD-033: gate aprobado; beta pública sigue bloqueada hasta cerrar prerequisitos.
- MGD-034, MGD-035 y MGD-036: QA seguro DEV aprobado.
- No se habilitó beta pública.
- No se realizaron cambios destructivos en Firebase, Firestore, Storage o Auth en esta ronda.

---

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
DEV PR: #67
DEV commit: `4bf63cf464af602525ab5ba73ae330c62df62ae4`
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
- MGD-007 definirá el versionado visible formal.

---

## MGD-002 — Separación total DEV / PROD
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: CRÍTICA

Objetivo:
ninguna función productiva debe depender de URLs DEV hardcodeadas dentro de módulos.

DEV:
`migrandia-dev.avaldiviezoch.workers.dev`

PROD API objetivo:
`migrandia-api.avaldiviezoch.workers.dev`

Objetivo posterior:
`api.migrandiapp.com`

Nota arquitectónica confirmada 2026-10-05:
- el Worker `wedding` es el host estático de `migrandiapp.com` (assets-only) y no debe reutilizarse como API;
- los servicios API productivos deben vivir en un Worker separado para no mezclar hosting estático con endpoints, bindings y secretos.

### Implementación DEV — 2026-10-05

Se creó `src/services/runtime-environment.js` como único propietario de los endpoints por ambiente.

Resolución actual:
- `migrandiapp.com`, `www.migrandiapp.com` y `wedding.avaldiviezoch.workers.dev` → producción.
- cualquier otro host (GitHub Pages DEV / localhost) → desarrollo.

Módulos migrados:
- Ideas → `/api/link-preview`
- Ideas → `/api/image-proxy`
- Música → `/api/music-preview`

Los módulos ya no contienen `migrandia-dev.avaldiviezoch.workers.dev` hardcodeado.

DEV branch: `mgd/002-env-separation-20261005`
DEV PR: #68
DEV commit: `303aa8d27c3fa16c6190c10e43f4ae1303b1b0d0`

QA requerido antes de aprobar DEV:
- Ideas Pinterest preview
- Ideas Temu preview
- Image Proxy
- Música YouTube
- Música Spotify
- Música Apple Music
- GitHub Pages DEV mantiene Worker DEV
- confirmar que el Worker PROD realmente expone los tres endpoints antes de migrar a Wedding

PROD branch: pendiente
PROD PR: pendiente
PROD commit: pendiente

Decisiones:
- no tocar Firebase, Firestore, Auth, Storage ni persistencia;
- no migrar a producción hasta comprobar funcionalmente los endpoints del Worker PROD;
- una sola configuración central para servicios actuales y futuros.

### Corrección final detectada — 2026-10-07

- `runtime-environment.js` seguía resolviendo producción hacia `wedding.avaldiviezoch.workers.dev`;
- ese Worker corresponde al hosting estático y no debe actuar como API;
- se corrigió `serviceBaseUrl` de producción a `https://migrandia-api.avaldiviezoch.workers.dev`;
- DEV se mantiene en `https://migrandia-dev.avaldiviezoch.workers.dev`;
- Ideas y Música siguen consumiendo exclusivamente `serviceUrl()`;
- se agregó QA específico para impedir regresión hacia el Worker estático.

Pendiente:
- QA funcional en desarrollo.
- Validación del backend PROD.
- Migración controlada a `Wedding` tras aprobación.

---

## MGD-003 — Protección contra abuso de RSVP
Estado: 🟢 QA TÉCNICO DEV APROBADO / PENDIENTE VALIDACIÓN PRODUCTIVA CONTROLADA
Prioridad: CRÍTICA

Objetivo:
blindar el RSVP público para que pueda escalar a usuarios externos sin permitir spam, automatización abusiva ni costos innecesarios.

### Auditoría actual — 2026-10-05

Fortalezas existentes:
- las respuestas públicas usan Firebase Anonymous Auth;
- cada respuesta nueva queda vinculada a `ownerUid == request.auth.uid`;
- un invitado anónimo solo puede actualizar su propia respuesta;
- las respuestas no son legibles públicamente;
- el formulario valida `maxGuests`;
- existen límites de longitud para nombre, correo, teléfono, restricciones, notas y música;
- el token RSVP debe existir y estar activo;
- Firestore Rules validan estructura y campos permitidos.

Riesgos pendientes:
- rate limiting y Turnstile ya están validados en Worker DEV, pero falta replicar/configurar la capa equivalente en Worker PROD;
- App Check ya está integrado en DEV y PROD y validado con tráfico real; Enforcement aún está desactivado;
- Anonymous Auth por sí solo no impide automatización masiva;
- el cliente escribe directamente a Firestore, por lo que un atacante puede saltarse controles visuales del formulario;
- no hay límite server-side por intervalo de tiempo;
- no hay señal central de abuso o picos de envío.

### Implementación de código — fase no Firebase — 2026-10-05

Se versionó por primera vez el Worker actual de Migrandia dentro de:
`cloudflare/migrandia-worker.js`

Este archivo conserva los servicios existentes:
- `/api/link-preview`
- `/api/image-proxy`
- `/api/music-preview`

y agrega:
- `POST /api/rsvp/verify`

Protecciones implementadas en el nuevo endpoint:
- solo acepta `POST`;
- CORS específico para `migrandiapp.com`, `www.migrandiapp.com` y GitHub Pages de desarrollo;
- respuesta `no-store`;
- valida presencia y tamaño de `turnstileToken`, `rsvpToken` y `responseId`;
- honeypot `website`;
- tiempo mínimo de interacción antes del envío;
- validación server-side contra Cloudflare Turnstile Siteverify;
- valida `action = rsvp_submit` cuando Turnstile la devuelve;
- preparado para binding `RSVP_RATE_LIMIT` de Cloudflare Workers;
- el secret Turnstile solo se lee desde `env.TURNSTILE_SECRET_KEY`, nunca se hardcodea.

Importante:
esta fase **NO toca Firebase**, pero por sí sola todavía no impide que un atacante intente escribir directamente contra Firestore saltándose el frontend. El cierre completo de MGD-003 requerirá después revisar quirúrgicamente App Check / Rules / ruta de escritura, con autorización explícita.

### Arquitectura objetivo

Mantener:
- Firebase Anonymous Auth;
- token RSVP no enumerado;
- ownership por `ownerUid`;
- reglas de validación existentes.

Agregar por fases:
1. protección anti-bot visible/invisible cuando corresponda;
2. rate limiting real fuera del cliente;
3. validación server-side adicional para envíos públicos;
4. observabilidad de intentos rechazados;
5. límites conservadores que no afecten invitados legítimos.

### Regla de implementación

No modificar Firestore Rules, Auth, Storage ni la estructura canónica sin autorización explícita.

La primera fase será no destructiva:
- diseñar el punto de control;
- definir Turnstile / App Check / Worker;
- preparar integración en desarrollo;
- probar sin tocar datos reales.

DEV branch: `mgd/003-rsvp-abuse-protection-20261005`
DEV PR: #69, #72
DEV commits principales: `1392d6578f839101546c4149a0c009ba39806d21`, `6365dbcfc921af0e8a9028b91e999284301f94d2`

QA realizado en Cloudflare DEV — 2026-10-05:
- Worker `migrandia-dev` actualizado y desplegado;
- `TURNSTILE_SECRET_KEY` configurado como Secret;
- binding `RSVP_RATE_LIMIT` configurado con namespace `1001`, límite `5`, periodo `60s`;
- `POST /api/rsvp/verify` devuelve `200` con la clave oficial de prueba de Turnstile y origen permitido;
- repetición del mismo `rsvpToken + responseId` supera el límite y devuelve `429`;
- CORS específico y `Cache-Control: no-store` confirmados en la ruta RSVP;
- usuario legítimo puede enviar RSVP;
- usuario puede editar su propia respuesta;
- otra sesión anónima no puede editarla;
- spam repetido es rechazado;
- respuesta pública sigue sin ser legible;
- móvil y desktop;
- no se rompe Música;
- no se rompe RSVP histórico.

### Integración frontend DEV preparada

La invitación de desarrollo `invitacion_0_2` ya incluye el guard antes de guardar RSVP:
- carga Turnstile explícitamente;
- usa `action = rsvp_submit`;
- honeypot oculto;
- mide tiempo mínimo de interacción;
- llama a `https://migrandia-dev.avaldiviezoch.workers.dev/api/rsvp/verify`;
- en DEV usa únicamente la sitekey oficial de prueba de Cloudflare;
- si el guard falla o rate-limit responde 429, no continúa con el guardado RSVP.

No se ha aplicado ninguna clave real ni ningún cambio de Firebase.

### PUNTO DE INTERVENCIÓN CLOUDFLARE

Para continuar el QA real de MGD-003 se necesita ahora configuración en la cuenta Cloudflare:
1. desplegar/actualizar el Worker `migrandia-dev` con `cloudflare/migrandia-worker.js`;
2. configurar `TURNSTILE_SECRET_KEY` con la clave de prueba durante QA;
3. configurar el binding `RSVP_RATE_LIMIT` o equivalente disponible en la cuenta;
4. verificar `/api/rsvp/verify` desde GitHub Pages DEV;
5. después crear el widget Turnstile real para los dominios definitivos y sustituir las claves de prueba.

### Estado Cloudflare DEV

La capa Cloudflare de MGD-003 queda validada en DEV: origen → Worker → rate limiter → Turnstile.

### Integración PROD — 2026-10-05
- PR producción: #531.
- Commit producción: `8095ab1b39b28718a97897e5fecd8713a6af2bf3`.
- App Check integrado en `Wedding/app_integral/src/services/firebase-client.js`.
- App Check integrado en la invitación pública `Wedding/invitaciones/invitacion_0`.
- App Check integrado también en la identidad anónima `mgd-rsvp-anonymous`.
- QA manual productivo: login/app operativa y RSVP real de prueba registrado correctamente.
- Métricas App Check posteriores: Firestore 58% verificadas / 42% no verificadas; Authentication 71% / 29%.
- No se modificaron Firestore Rules, Auth, Storage ni estructura de datos.
- Enforcement permanece desactivado.

### Cierre técnico seguro — 2026-10-07

- se agregó QA automatizado para validar que DEV y PROD mantienen Workers separados;
- se valida existencia de `/api/rsvp/verify`, Turnstile Siteverify, secret por entorno y `RSVP_RATE_LIMIT`;
- DEV usa namespace `1001` y PROD `1002`, ambos con 5 intentos / 60 s;
- se valida CORS para dominios oficiales y respuestas no-store;
- este QA no reactiva Turnstile en la invitación productiva;
- la activación final en producción sigue condicionada a prueba real controlada de UX.

### Estado actual MGD-003 — 2026-10-05
- Worker PROD dedicado creado: `migrandia-api.avaldiviezoch.workers.dev`.
- `TURNSTILE_SECRET_KEY` configurado como Secret en PROD.
- `RSVP_RATE_LIMIT` configurado con namespace `1002`, límite 5 / 60 s.
- QA HTTP PROD validado: CORS permitido, 429 por abuso y 403 ante token Turnstile falso.
- La primera integración Turnstile en la invitación productiva se retiró mediante hotfix porque el token podía no estar listo al pulsar enviar y mostraba un mensaje técnico al invitado.
- Hotfix productivo PR #533 fusionado; commit PROD `ad642b317ae4612a48a475c27ef232ef65f9ead7`.
- App Check productivo se mantiene activo.
- DEV incluye corrección de UX silenciosa para Turnstile; PR #73 fusionado; commit DEV `cfcd89cca480250412b6be38d555c0524defdac3`.
- Producción queda estable mientras se valida la nueva UX exclusivamente en DEV.

### Pendiente para cerrar MGD-003
1. QA manual DEV de `invitacion_0_2` con Turnstile silencioso.
2. Confirmar envío normal sin mensajes técnicos visibles.
3. Confirmar móvil y desktop.
4. Confirmar 429 con mensaje de UX controlado.
5. Solo después preparar una nueva migración a PROD.
6. Tras una ventana limpia de tráfico, evaluar Enforcement de App Check; no activarlo antes.

Siguiente fase: revisión Firebase/App Check/Rules para impedir bypass directo a Firestore.

### Firebase App Check — DEV integrado 2026-10-05
- App web registrada en Firebase App Check: `migrandiaweb`.
- Proveedor: Fraud Defense / reCAPTCHA Enterprise.
- Site key web registrada para `migrandiapp.com`, `www.migrandiapp.com` y `avaldiviezoch.github.io`.
- App Check integrado en `src/services/firebase-client.js`.
- Inicialización centralizada con `ReCaptchaEnterpriseProvider`.
- Renovación automática de token activada.
- App Check solo se inicializa en hosts registrados; localhost queda fuera para no romper desarrollo local antes de definir debug tokens.
- No se activó enforcement todavía.
- No se modificaron Firestore Rules, Auth, Storage ni estructura de datos.

Pendiente de autorización antes de tocar infraestructura protegida:
- cualquier cambio de Firestore Rules;
- habilitación/configuración de App Check;
- cambios en Auth;
- despliegue/configuración del Worker DEV en Cloudflare;
- creación del secret `TURNSTILE_SECRET_KEY`;
- creación del binding `RSVP_RATE_LIMIT`;
- configuración productiva de Cloudflare Turnstile/rate limiting.

---

## MGD-004 — Seguridad de Workers
Estado: 🟢 PRODUCCIÓN
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

### Auditoría inicial MGD-004 — 2026-10-05
Archivo auditado: `cloudflare/migrandia-worker.js`.

Fortalezas:
- RSVP usa CORS por allowlist, Turnstile, rate limit, honeypot, tiempo mínimo y `no-store`.
- Pinterest y Temu validan protocolo y host antes de fetch.
- Pinterest/Temu preview revalidan el host final tras redirects.
- Temu image proxy revalida la URL final.
- Secretos se leen desde `env`; no están hardcodeados.

Hallazgos prioritarios:
1. ALTO — `/api/link-preview`, `/api/image-proxy` y `/api/music-preview` usan CORS global `*`; cualquier sitio externo puede consumir la API y generar costo/tráfico.
2. ALTO — no existe rate limiting para link preview, image proxy ni music preview.
3. ALTO — `isMusicUrl()` valida YouTube/Spotify mediante `hostname.includes(...)`, lo que permite dominios con esos textos embebidos en el hostname; debe cambiarse a allowlist exacta/subdominio.
4. ALTO — varios fetch externos no tienen timeout/AbortSignal.
5. ALTO — previews HTML usan `response.text()` sin límite explícito de bytes; una respuesta grande puede consumir CPU/memoria.
6. ALTO — image proxy transmite imágenes sin límite explícito de tamaño; riesgo de abuso de ancho de banda.
7. MEDIO — YouTube/Apple siguen redirects sin revalidar el hostname final.
8. MEDIO — Pinterest image proxy no revalida explícitamente la URL final después de redirect.
9. MEDIO — errores generales pueden devolver `error.message` del upstream/runtime y estados específicos; conviene normalizar mensajes públicos.
10. MEDIO — `json()` aplica `Cache-Control: public, max-age=3600` también a varias respuestas de error; conviene separar cache de éxito/error.
11. BAJO — rutas GET desconocidas responden health check 200 en vez de 404; dificulta observabilidad y detección de rutas incorrectas.

Decisión:
- no tocar Firebase, Firestore Rules, Auth, Storage ni BD;
- endurecer primero DEV;
- mantener contratos de endpoints actuales;
- no modificar RSVP productivo salvo regresión crítica;
- después de QA DEV, migrar el mismo Worker endurecido a `migrandia-api`.


---

## MGD-005 — Seguridad web general
Estado: 🟢 PRODUCCIÓN / QA APROBADO
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

Cierre QA (06/10/2026):
- hardening de URLs y enlaces externos validado;
- vista previa de invitaciones validada con sandbox y navegación externa segura;
- Referrer-Policy aplicado;
- protección anti-frame desplegada en `migrandiapp.com` con `Content-Security-Policy: frame-ancestors 'none'` y `X-Frame-Options: DENY`;
- prueba externa real en Esri StoryMap: el contenido de Migrandia queda bloqueado dentro del frame;
- módulos y flujo funcional revisados sin modificar Firebase Rules, Auth, Storage ni el flujo RSVP.

---

## MGD-006 — Observabilidad de producción
Estado: 🟢 PRODUCCIÓN / QA APROBADO
Prioridad: CRÍTICA

QA DEV 06/10/2026:
- captura global de `unhandledrejection` validada;
- errores de carga de recursos validados;
- error de persistencia local validado sin guardar datos de prueba;
- contexto técnico validado: versión, entorno, navegador, dispositivo, viewport y conectividad;
- endpoint `/api/observability` validado en `migrandia-dev` con CORS/preflight y rate guard;
- redacción de correo y teléfono validada tanto en cliente como en Worker;
- errores centrales de Firebase/Firestore instrumentados sin provocar operaciones de prueba contra BD;
- no se modificaron Firestore, Storage, Rules, Auth, RSVP ni datos reales.

QA PROD 06/10/2026:
- aplicación y módulos cargan normalmente tras el despliegue;
- Cloudflare Workers Observability habilitado;
- preflight OPTIONS y POST de `/api/observability` validados;
- evento `qa-prod` recibido con `environment: production` y mensaje esperado;
- detectada falsa redacción de la versión `mgd-006-20261006` como teléfono; corregida en DEV y PROD mediante el formato `mgd-v006-2026-10-06` (PR #548, checks verdes y merge completado).

Pendiente para cierre: sincronizar el código aprobado a PROD mediante PR en `Wedding`, esperar checks verdes y realizar QA de producción.

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
Estado: 🟢 PRODUCCIÓN / QA APROBADO
Prioridad: ALTA

Objetivo:
disponer de una única versión formal de la aplicación que permita relacionar cada despliegue con el código ejecutado y con los eventos capturados por MGD-006.

### Auditoría inicial — 2026-10-06

Estado encontrado:
- MGD-006 mantiene actualmente su propio identificador `mgd-v006-2026-10-06`; no existe todavía una fuente global de versión.
- `index.html` y varios imports dinámicos conservan sufijos `?v=...` independientes por archivo/módulo. Estos valores funcionan como cache-busting local y no representan una release completa.
- no se detectó Service Worker propio ni un sistema formal de release en la aplicación revisada.
- el roadmap ya reservaba MGD-007 para definir una versión visible y registrar versión, commits DEV/PROD, fecha y cambios principales.
- no se eliminarán ni renumerarán masivamente los `?v=` existentes durante este bloque: primero se introduce la fuente única de versión sin alterar el mecanismo de caché actual.

Diseño inicial:
- crear una única fuente de verdad de versión en código;
- formato visible: `Migrandia x.y.z`;
- MGD-006 debe consumir esa fuente en lugar de mantener una versión propia;
- la versión debe poder consultarse desde la aplicación sin depender de Firebase;
- registrar cada release en esta misma documentación/bitácora, sin crear roadmaps paralelos;
- DEV primero; PROD solo después de QA y mediante PR/checks verdes.

Restricciones:
- no tocar Firestore, Storage, Rules, Auth, RSVP ni datos reales;
- no introducir dependencias;
- no reemplazar indiscriminadamente los cache-busters existentes;
- no crear mecanismos duplicados de versión.

Registrar por release:
- versión;
- commit DEV;
- commit PROD;
- fecha;
- cambios principales.

DEV branch: no aplica; repositorio DEV libre según flujo vigente.
DEV commits:
- `31b02e51dc5720fe96566b659ed8fbda3e2db138` — fuente única `src/core/app/version.js`.
- `26ac432097b06540d3dcb7be62ea569268ff2bd1` — MGD-006 consume la versión global.

Versión DEV inicial: `Migrandia 0.7.0`.

Implementación:
- `src/core/app/version.js` es la única fuente de verdad de la versión formal;
- expone únicamente `APP_VERSION` y `APP_VERSION_LABEL`;
- Observabilidad ya no contiene un identificador de versión propio y utiliza `APP_VERSION`;
- los `?v=` existentes permanecen sin cambios y continúan siendo únicamente cache-busters locales.

QA DEV — APROBADO 2026-10-06:
- import directo validado: `0.7.0` / `Migrandia 0.7.0`;
- MGD-006 registró en `migrandia-dev` el evento `qa-version-mgd007` con `context.version: "0.7.0"` y `environment: "development"`;
- versión visible validada en la pantalla inicial debajo de `Antonio Valdiviezo © Derechos reservados`;
- revisión final confirmó una sola fuente formal de versión y sin cambios en Firebase, Firestore, Storage, Rules, Auth, RSVP ni datos reales.
PROD branch: `feature/mgd-007-versioning-20261006`.
PROD PR: #549 — `MGD-007: versionado formal de Migrandia` — Repository validation #777 en `success`.
PROD commit: `c11075a7d9456e051af3ca737a361226e5eb2ad9`.

QA PROD — APROBADO 2026-10-06:
- versión visible `Migrandia 0.7.0` en la pantalla inicial;
- evento `qa-version-mgd007-prod` recibido por el Worker `wedding` con respuesta HTTP 202;
- `context.version: "0.7.0"` y `context.environment: "production"` confirmados en Real-time logs;
- flujo DEV → PROD completado sin modificar Firebase, Firestore, Storage, Rules, Auth, RSVP ni datos reales.

Release registrada:
- versión: `Migrandia 0.7.0`;
- commit DEV de cierre QA/documentación: `bb6ab4631580d7dca45a2f25d6ae5569f7830b64` (implementación MGD-007 acumulada en DEV);
- commit PROD: `c11075a7d9456e051af3ca737a361226e5eb2ad9`;
- fecha: 2026-10-06;
- cambios principales: fuente única de versión, integración con MGD-006 y etiqueta visible en pantalla inicial.

---

## MGD-008 — Tests E2E reales
Estado: 🟣 AUTH READONLY APROBADO DEV / E2E-17 APROBADO / PENDIENTE E2E-18 Y E2E-19
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


### Auditoría inicial — 2026-10-06

Hallazgos:
- la arquitectura objetivo ya reserva una carpeta `tests/`, pero no se detectó infraestructura E2E existente (Playwright/Cypress/package de pruebas) en la aplicación revisada;
- la versión base a proteger es `Migrandia 0.7.0`;
- el shell actual expone nueve módulos navegables: Checklist, Presupuesto, Proveedores, Invitados, Distribución, Cronograma, Invitaciones, Música e Ideas;
- MGD-008 mezcla flujos disponibles hoy con capacidades todavía pendientes (roles completos, colaboración, multi-evento y aislamiento avanzado).

Decisión de alcance:
- **MGD-008A — baseline E2E de Migrandia 0.7.0:** acceso/login, boda activa/onboarding existente, navegación por los nueve módulos, recarga y persistencia ya existente, responsive y ausencia de regresiones visibles;
- **MGD-008B — E2E multi-evento/colaboración:** Owner/Admin/Editor/Provider/Viewer, invitación/aceptación de colaborador, cambio de evento y aislamiento; se ejecutará cuando esas capacidades existan;
- no se crearán ni modificarán datos reales para montar la infraestructura de pruebas sin autorización expresa;
- antes de automatizar se definirá una matriz de casos de solo lectura/navegación frente a casos que requieren escritura controlada.

Estado auditoría: infraestructura y alcance identificados; implementación de tests aún no iniciada.

### Matriz MGD-008A — baseline E2E 0.7.0

| ID | Flujo | Tipo | Escritura real | Criterio de aprobación |
|---|---|---|---|---|
| E2E-01 | Carga pública inicial | Automático | No | Home carga sin error fatal y muestra `Migrandia 0.7.0`. |
| E2E-02 | Login existente | Semiautomático | Auth únicamente | Usuario autenticado llega a su boda activa sin error. |
| E2E-03 | Boda activa / Inicio | Automático tras sesión | No | Identidad y resumen de la boda activa cargan sin alterar datos. |
| E2E-04 | Navegación por 9 módulos | Automático | No | Cada módulo monta, cambia hash/vista y no deja error fatal. |
| E2E-05 | Checklist lectura | Automático | No | Vista y resumen existentes cargan. |
| E2E-06 | Presupuesto lectura | Automático | No | Vista y resumen existentes cargan. |
| E2E-07 | Proveedores lectura | Automático | No | Vista existente carga sin modificar proveedores. |
| E2E-08 | Invitados lectura | Automático | No | Lista/canon actual carga sin altas, bajas ni edición. |
| E2E-09 | Distribución lectura | Automático | No | Plano, mesas y estado guardado cargan; validaciones no escriben. |
| E2E-10 | Cronograma lectura | Automático | No | Vista existente carga sin edición. |
| E2E-11 | Invitaciones lectura | Automático | No | Biblioteca existente carga sin crear/eliminar referencias. |
| E2E-12 | Música lectura | Automático | No | Módulo y contenido existente cargan sin editar playlists. |
| E2E-13 | Ideas lectura | Automático | No | Tablero existente carga sin agregar/eliminar ideas. |
| E2E-14 | Recarga y retorno | Automático | No | Tras recargar se conserva sesión/contexto y puede volver al módulo. |
| E2E-15 | Responsive desktop/tablet/mobile | Automático visual/DOM | No | Shell y navegación siguen utilizables en viewports objetivo. |
| E2E-16 | Observabilidad durante recorrido | Automático | No | No aparecen errores globales inesperados; los fallos reales quedan asociados a versión 0.7.0. |
| E2E-17 | Persistencia con cambio controlado | Manual posterior | **Sí** | ✅ APROBADO 2026-10-09: nombre del evento cambiado a `E2E-17 · Persistencia`, sobrevivió Ctrl+F5 y se revirtió a `cuenta de prueba`, sobreviviendo nuevamente Ctrl+F5. |
| E2E-18 | Usuario nuevo + onboarding + crear evento | Manual posterior | **Sí** | Cuenta/evento de prueba se crea y persiste. No ejecutar sobre cuenta/datos reales sin autorización. |
| E2E-19 | RSVP | Manual posterior | **Sí** | Confirmación de prueba controlada completa el flujo y luego se limpia según procedimiento autorizado. |

Resultado E2E-17 — 2026-10-09:
- prueba realizada sobre cuenta/evento de prueba en DEV;
- nombre temporal: `E2E-17 · Persistencia`;
- persistencia validada tras Ctrl+F5;
- nombre revertido a `cuenta de prueba`;
- reversión validada tras nuevo Ctrl+F5;
- sin cambios en RSVP, invitados, presupuesto, distribución, Auth, Rules ni Storage;
- E2E-17 aprobado.

Clasificación:
- **Fase segura inmediata:** E2E-01 y E2E-03 a E2E-16; navegación/lectura solamente. E2E-02 requiere autenticación pero no cambios de negocio.
- **Fase con escritura controlada:** E2E-17 a E2E-19; queda bloqueada hasta autorización expresa y definición de datos/cuenta de prueba.
- **MGD-008B diferido:** roles completos, colaboración, cambio multi-evento y aislamiento avanzado.

Criterio de diseño de automatización:
- una sola infraestructura E2E bajo `tests/`, sin duplicar suites por dispositivo;
- reutilizar los mismos escenarios con viewports distintos;
- no introducir mocks que oculten fallos reales del shell/integraciones en el baseline;
- no automatizar escrituras contra la boda real;
- si una prueba necesita estado destructivo, debe usar un entorno/dato de prueba expresamente autorizado y limpieza verificable.



Implementación inicial segura — 2026-10-06:
- se incorporó Playwright como dependencia exclusiva de desarrollo porque MGD-008 exige navegador real; no se añade ninguna dependencia al runtime de Migrandia;
- `playwright.config.js` reutiliza una sola suite en desktop 1440 px, tablet y móvil 390 px;
- `tests/e2e-safe.spec.js` inicia únicamente con E2E-01, rutas de los nueve módulos y E2E-15 responsive;
- la suite no ejecuta clicks de edición, altas, bajas, onboarding, RSVP ni llamadas de escritura deliberadas;
- URL por defecto: GitHub Pages DEV; puede sobreescribirse con `MIGRANDIA_E2E_URL`;
- primera ejecución real completada: desktop pasó; tablet/móvil fallaron únicamente porque la configuración de dispositivos solicitaba WebKit mientras el workflow instalaba Chromium;
- se corrigió la configuración para que desktop/tablet/móvil reutilicen Chromium con viewports/touch distintos, sin alterar la aplicación;
- segunda ejecución real reportada en verde por el usuario para los tres proyectos;
- la siguiente corrida ejecutó 39 pruebas: 33 pasaron y 6 fallaron, concentradas únicamente en E2E-14 y E2E-16 en los tres viewports;
- E2E-14 reveló que, sin sesión autenticada, la aplicación elimina correctamente el hash de módulo al recargar y vuelve a la superficie pública; la expectativa del test era incorrecta y se ajustó al comportamiento real, sin modificar la aplicación;
- E2E-16 detectó únicamente `requestStorageAccess: Permission denied.`, ruido del navegador/entorno al solicitar acceso de almacenamiento; se excluyó de la lista de errores inesperados mediante una allowlist cerrada y específica, manteniendo activos todos los demás errores de consola y `pageerror`;
- commit de ajuste seguro: `9ef78ace73940b94e93b6a086eeea2bee8eba071`;
- tercera corrida real reportada en verde por el usuario: E2E-14 y E2E-16 quedan validados junto con el baseline público en desktop, tablet y móvil;
- **MGD-008A público/solo lectura: QA APROBADO**. Permanecen pendientes los casos autenticados y/o con escritura controlada (E2E-02, E2E-03, E2E-05 a E2E-13 en estado autenticado, E2E-17 a E2E-19), que no se ejecutarán contra datos reales sin autorización.
- siguiente subbloque iniciado: **E2E-02-pre**, validación no destructiva del arranque de Google Login. La prueba abre el popup real de autenticación, verifica que el destino pertenezca al flujo Google/Firebase y lo cierra sin elegir cuenta, sin completar Auth y sin acceder a datos. Commit: `79f6de48b2e889fcb63921a5fcc9995db55f9e61`. Pendiente corrida real.
- primera corrida E2E-02-pre: 39/42 pruebas pasaron; los tres fallos fueron del nuevo caso porque el test intentaba pulsar `#googleLoginButton` mientras la pantalla Descubre visible interceptaba el click. No se abrió popup ni se alcanzó Google/Auth. Se corrigió el test para usar la entrada real visible `#discoverGoogleButton`, que en la aplicación cierra Descubre y delega al mismo login Google. Commit: `25b613881ffe74b17605f7b5daa2a0e56f4d39ec`. Pendiente nueva corrida.
- nueva corrida de E2E-02-pre: 38/42 pruebas pasaron. El test confirmó que `#discoverGoogleButton` existe pero está oculto en la diapositiva final de Descubre; la prueba no debía asumir que esa pantalla ya estaba activa. Se corrigió el recorrido para usar la entrada visible inicial: `#discoverSkipButton` → overlay de autenticación → `#googleLoginButton`, sin completar login. En móvil apareció además un mensaje report-only de CSP emitido por Google (`frame-ancestors 'self'`), que se añadió a la allowlist cerrada de ruido conocido sin silenciar otros errores. Commit: `4f1caa4b94c1544ec495c4159aa07d8026d1e2b8`. Pendiente nueva corrida.

Commits implementación inicial:
- `b44f132e3586c50baae5ad1d39f6446a1872cd47` — runner/dependencia E2E;
- `eba4ffc2b21f808f918de16fe51c4d08d26cbf11` — configuración responsive;
- `5a7de913675e67731405b9e2eeb10653c1fdf526` — smoke tests seguros;
- `3e4e3282e0e2603e681f3d3d46990674fe13d847` — responsive sobre Chromium;
- `09cb09db79385a39bd7043d170678efa7420aa4b` — recarga/retorno y barrido de errores globales.

### Hallazgo de prueba autenticada — 2026-10-07

- Google bloquea el inicio de sesión desde navegador automatizado Playwright/Chrome controlado por considerarlo entorno no seguro;
- no se insistirá con login Google automatizado;
- DEV sí contiene lógica y UI de registro por correo, aunque “Crear cuenta” es poco visible;
- una captura con “Tu boda, siempre contigo” correspondía a PRODUCCIÓN y no debe usarse para validar cambios DEV;
- las pruebas autenticadas de MGD-008 se realizarán exclusivamente sobre DEV;
- la siguiente estrategia debe evitar depender de Google automatizado y mantener cero escrituras reales no autorizadas.


---

# BLOQUE B — CUENTA, LOGIN Y BRANDING DE ACCESO

## MGD-009 — Registro por correo
Estado: 🟣 APROBADO DEV — PRUEBA REAL COMPLETADA
Prioridad: ALTA

Agregar:
- Crear cuenta;
- validación;
- mensajes amigables;
- flujo consistente con Google.

### Auditoría inicial — 2026-10-06

Estado actual:
- la UI solo ofrece login por correo/contraseña; no existe botón ni flujo de “Crear cuenta”;
- el código importa `signInWithEmailAndPassword`, pero no `createUserWithEmailAndPassword`;
- `errorText()` solo distingue credencial inválida y, para el resto, devuelve “No se pudo iniciar sesión”;
- la persistencia de Auth ya está centralizada en `firebase-client.js` mediante `browserLocalPersistence`;
- Google y correo convergen después en `onAuthStateChanged`, por lo que el registro por correo debe reutilizar esa misma carga de contexto y no crear una ruta paralela.

Diseño propuesto:
- agregar un modo “Crear cuenta” dentro del mismo `authOverlay`, sin duplicar modal;
- reutilizar `authEmail` y `authPassword`;
- usar `createUserWithEmailAndPassword` únicamente al confirmar registro;
- tras registro exitoso, reutilizar el mismo flujo de bodas/onboarding existente;
- mensajes específicos y amigables para correo inválido, contraseña débil y correo ya registrado;
- no crear documentos, bodas ni onboarding automáticamente fuera del flujo actual ya definido;
- no modificar Firebase Rules, Firestore, Storage ni configuración de proyecto.

Implementación DEV — 2026-10-06:
- autorización expresa recibida para modificar Firebase Auth en MGD-009/010;
- se añadió modo “Crear cuenta” dentro del mismo `authOverlay`, sin duplicar modal;
- se reutilizan `authEmail` y `authPassword` y se agrega confirmación de contraseña solo en registro;
- registro mediante `createUserWithEmailAndPassword`;
- validación local de correo, mínimo 6 caracteres y coincidencia de contraseñas;
- mensajes diferenciados para correo inválido, contraseña débil, correo ya registrado, demasiados intentos y red;
- tras autenticación exitosa se reutiliza el flujo existente de carga de bodas/onboarding mediante `completeEmailAccess()`;
- no se modificaron Firebase Rules, Firestore, Storage ni configuración de proyecto;
- QA seguro añadido: valida cambio de modo y rechazo por contraseñas distintas sin crear una cuenta real.

Commits:
- `0f05e6a4858dc8210d0a189fce383edf8c0eb4f1` — UI de acceso;
- `a4da41407d471eae3cdcb76837d329471659a10b` — lógica Auth;
- `bbb30270d79780fbf9b37a02348abd038b4478c4` — estilos;
- `43af4370b2f566d7b4b47f70ef342e86b4e76f1f` — QA seguro.

QA seguro DEV — 2026-10-06:
- workflow `MGD-008 E2E seguro` reportado en verde por el usuario;
- validado cambio de modo Ingresar/Crear cuenta, confirmación de contraseña y rechazo local sin crear usuarios reales.

Pendiente:
- prueba real de creación de cuenta solo con una cuenta de prueba autorizada, no con datos reales.

---

Prueba real MGD-009 — 2026-10-09:
- se creó una cuenta nueva real por correo en DEV;
- la cuenta se registró correctamente en Firebase Auth;
- el usuario ingresó a Migrandia sin errores visibles;
- se cerró sesión correctamente;
- se volvió a iniciar sesión con la misma cuenta;
- no se observaron errores de consola ni comportamientos anómalos durante el flujo;
- MGD-009 queda cerrado en DEV.

## MGD-010 — Recuperación de contraseña
Estado: 🟣 APROBADO DEV — PRUEBA REAL COMPLETADA
Prioridad: ALTA

Agregar:
- “Olvidé mi contraseña”;
- Firebase Auth;
- confirmación visual;
- protección contra enumeración de correos cuando corresponda.

Implementación DEV — 2026-10-06:
- botón `Olvidé mi contraseña` integrado al mismo `authOverlay`;
- envío mediante `sendPasswordResetEmail`;
- validación local de correo antes de enviar;
- mensaje neutro de confirmación: “Si existe una cuenta con ese correo…” para evitar confirmar si una dirección está registrada;
- `auth/user-not-found` y `auth/invalid-credential` reciben el mismo mensaje neutro;
- errores de red/rate limit mantienen mensajes operativos sin revelar existencia de cuenta;
- el botón se oculta durante el modo “Crear cuenta” para mantener el flujo claro;
- QA seguro añadido con correo inválido, sin enviar ninguna solicitud real a Firebase.

Corrección UX DEV — 2026-10-07:
- se detectó que `hidden` era visualmente anulado por `.auth-card label { display:grid; }`, haciendo visible “Confirmar contraseña” incluso en modo Ingresar;
- se añadió una regla específica `.auth-card [hidden]` para respetar el estado real sin `!important`;
- Auth queda con tres modos dentro del mismo formulario y un solo JS: `login`, `register` y `recovery`;
- login muestra correo + contraseña;
- register muestra correo + contraseña + confirmar contraseña;
- recovery muestra únicamente correo y botón “Enviar enlace”;
- “Olvidé mi contraseña” entra al modo recovery en lugar de mezclar recuperación con el formulario de login;
- el copy de recuperación se centralizó en `auth-branding.js`;
- E2E seguro ampliado para validar transiciones visuales y volver a login;
- no se modificó Firebase, Firestore, Auth, Storage, Rules ni datos reales.

QA seguro DEV — 2026-10-06:
- workflow `MGD-008 E2E seguro` reportado en verde por el usuario;
- validado botón de recuperación, validación local de correo y mensaje de error sin enviar solicitudes reales.

QA seguro DEV — 2026-10-07:
- workflow `MGD-008 E2E seguro` reportado en verde por Antonio tras la corrección UX de Auth;
- validada la separación visual de login, registro y recuperación;
- sin regresiones reportadas en la suite segura.

Prueba real controlada — 2026-10-07:
- solicitud de recuperación enviada desde DEV con cuenta QA autorizada;
- Firebase devolvió el mensaje neutro esperado: “Si existe una cuenta con ese correo…”;
- el correo de recuperación llegó correctamente;
- el enlace permitió establecer una nueva contraseña;
- el inicio de sesión posterior con la nueva contraseña fue exitoso;
- no se tocaron Firestore, datos de boda, invitados, Storage ni Rules.

Resultado:
- **MGD-010 funcionalmente aprobado en DEV**.

Pendiente no bloqueante de MGD-010:
- ninguno. El branding visual del correo pertenece a MGD-026.

---

## MGD-011 — Usuario único multi-evento
Estado: 🟢 AISLAMIENTO ESTRUCTURAL QA APROBADO / PENDIENTE PRUEBA REAL CONTROLADA
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

### Auditoría inicial — 2026-10-06

Hallazgos:
- la arquitectura actual ya soporta más de una boda por el mismo UID mediante `users/{uid}/weddings/{weddingId}`;
- `listWeddingContexts()` lista todos los contextos disponibles para el usuario;
- `loadActiveWeddingContext()` resuelve `activeWeddingId` y cae al primer contexto válido si no existe;
- `selectActiveWedding()` cambia el contexto activo actualizando `users/{uid}.activeWeddingId`;
- la UI ya incluye selector de bodas, creación de una nueva boda y cambio entre bodas;
- al cambiar de boda, el dashboard invalida el cache de módulos mediante `moduleCacheWeddingId` y vuelve a montar el módulo activo;
- colaboradores usan el mismo UID y obtienen contexto mediante membresía; no se crean usuarios separados por boda.

Límite actual:
- todo el modelo sigue nombrado y tipado como `wedding`; todavía no existe `eventType`, por lo que esto es multi-boda, no multi-evento completo;
- MGD-011 funcionalmente ya tiene una base sólida, pero no debe declararse cerrado hasta incorporar MGD-012 y validar aislamiento real entre eventos;
- las pruebas obligatorias de aislamiento requieren cuentas/eventos de prueba y no se ejecutarán sobre datos reales sin autorización.

Decisión:
- no reescribir ni migrar colecciones actuales;
- reutilizar esta base para MGD-012 agregando la capa conceptual `eventType`;
- mantener un único UID por persona y múltiples contextos/eventos asociados a ese UID.

Implementación DEV MGD-011 — aislamiento estructural:
- nuevo `src/core/app/event-context-isolation.js`;
- un mismo UID puede resolver múltiples contextos con `eventId` distintos;
- rutas de raíz, membresía, índice por usuario, planner legacy/nuevo y RSVP quedan derivadas por `eventId`;
- eventId duplicados se consideran inválidos;
- el contrato verifica que dos eventos nunca compartan eventRoot, userIndex ni plannerMeta;
- no se escriben datos ni se crean cuentas/eventos de prueba;
- el cierre total seguirá requiriendo una prueba real controlada con cuentas/eventos de prueba autorizados.

---

## MGD-026 — Branding profesional del login Google / Firebase
Estado: 🟡 PRODUCCIÓN ACTUALIZADA / PENDIENTE PROPAGACIÓN GOOGLE
Prioridad: CRÍTICA ANTES DE MARCHA BLANCA

Problema actual:
el flujo de Google puede mostrar referencias técnicas a Firebase / dominio poco elegante.

Objetivo:
el usuario debe percibir que está entrando a **Mi Gran Día / Migrandia**, no a “Firebase”.

Hallazgo de prueba real — 2026-10-07:
- el correo de recuperación funciona, pero llega con asunto/identidad técnica “migrandiaweb”;
- contenido en inglés;
- remitente técnico `noreply@migrandia.firebaseapp.com`;
- Outlook lo clasificó inicialmente como correo no deseado;
- este hallazgo no bloquea MGD-010, pero sí debe resolverse dentro de MGD-026 antes de marcha blanca.

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

Implementación DEV — Fase 1 branding cliente:
- nuevo `src/core/app/auth-branding.js` como fuente única de identidad pública;
- login propio usa lenguaje multi-evento;
- título actualizado a “Tu evento, siempre contigo”;
- descripción pública actualizada para “eventos especiales”;
- botón Google conserva texto neutral “Continuar con Google”;
- la UI propia no muestra referencias a Firebase;
- esta fase no modifica OAuth, Firebase Auth, dominios autorizados ni pantalla de consentimiento externa;
- la parte Google/Firebase Console sigue requiriendo validación/configuración externa antes de cerrar MGD-026.

Corrección QA rojo MGD-026:
- el primer rerun dejó 141/144 pruebas en verde;
- los 3 fallos fueron únicamente MGD-026 en desktop/tablet/mobile;
- causa: `inicio.js` mantenía un segundo copy hardcodeado “Tu boda, siempre contigo” y sobrescribía el HTML;
- se eliminó esa segunda fuente y el login ahora consume `AUTH_BRANDING` directamente.

Segunda corrección QA rojo MGD-026:
- el segundo rerun volvió a quedar 141/144;
- los 3 fallos fueron del propio test, no del login;
- causa: `window.location.href` se evaluaba en Node/Playwright en lugar del navegador;
- la importación de `auth-branding.js` ahora se resuelve dentro de `page.evaluate`;
- sin cambios adicionales sobre Auth, OAuth o UI funcional.

Criterio de diseño:
- “Mi Gran Día” debe presentarse como organizador de eventos especiales;
- no usar mensajes que hagan pensar que la plataforma es exclusivamente de bodas;
- boda sigue siendo el producto estrella, pero la identidad pública es multi-evento;
- visual sobrio y profesional;
- eliminar rastros técnicos innecesarios de Firebase del recorrido del usuario cuando la plataforma lo permita.

Configuración externa realizada — 2026-10-07:
- Firebase: nombre del proyecto actualizado a “Mi Gran Día”;
- Firebase: nombre público actualizado de `migrandiaweb` a “Mi Gran Día”;
- se conservaron sin cambios el ID de proyecto `migrandia`, el alias interno de la app web `migrandiaweb`, SDK, AuthDomain y demás identificadores técnicos;
- Google Auth Platform: nombre de aplicación “Mi Gran Día”;
- logo oficial de Migrandia cargado en formato cuadrado optimizado;
- página principal configurada como `https://migrandiapp.com`;
- dominio autorizado `migrandiapp.com` agregado sin retirar `migrandia.firebaseapp.com`;
- correo de soporte/contacto configurado;
- primer intento de verificación de marca rechazado porque Google no detecta propiedad verificada del dominio, la home no contiene enlace a privacidad y `/privacy.html` todavía no responde.

Implementación DEV — Fase legal/verificación:
- se crean `privacy.html` y `terms.html` como páginas públicas, responsivas y sin dependencias nuevas;
- la home pública enlaza visiblemente Política de Privacidad y Términos y Condiciones desde el onboarding;
- el overlay de acceso también expone enlaces legales;
- E2E seguro valida presencia de los enlaces y respuesta HTTP de ambas páginas;
- no se modifican Firebase Rules, Firestore, Storage, datos ni contratos de persistencia.



Producción — 2026-10-07:
- PR #551 fusionado en `avaldiviezoch/Wedding`;
- `Wedding/main` quedó en commit `1c8412c82b03599919f7cc8b92fe595be4288113`;
- GitHub Pages de producción terminó en verde;
- home productiva prioriza el nombre público **Mi Gran Día**;
- Política de Privacidad ampliada publicada en `https://migrandiapp.com/privacy.html`;
- Google Auth Platform dejó de mostrar las observaciones por nombre de aplicación y contenido insuficiente de privacidad;
- `migrandiapp.com` fue verificado correctamente en Google Search Console mediante Cloudflare;
- permanece únicamente el aviso histórico de propiedad del dominio mientras Google propaga la verificación (la consola indica hasta 24 horas);
- recordatorio creado para revisar el estado el **09/10/2026 por la mañana**.

Seguimiento pendiente — verificación Google OAuth:
- 2026-10-07: dominio `migrandiapp.com` verificado correctamente en Google Search Console mediante Cloudflare.
- Google Auth Platform todavía muestra el hallazgo histórico de propiedad del dominio y advierte que la actualización interna puede demorar hasta 24 horas.
- revisión programada directamente para el **09/10/2026**;
- cuando desaparezca el aviso, seleccionar **“Corregí los problemas” → Continuar** para reenviar la verificación de marca.
- no modificar DNS, Search Console ni dominios mientras se espera la propagación, salvo que Google muestre una observación nueva.

Pendiente para completar verificación Google:
1. aprobar QA DEV y desplegar estas páginas a producción;
2. confirmar `https://migrandiapp.com/privacy.html` y `https://migrandiapp.com/terms.html`;
3. confirmar que la home productiva enlaza la política;
4. verificar propiedad de `migrandiapp.com` en Google Search Console;
5. esperar propagación indicada por Google y volver a solicitar verificación de marca;
6. revisar después el branding de las plantillas de correo de Firebase, cuya edición desde consola devolvió restricción temporal del proyecto.

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
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: CRÍTICA

No renombrar todavía `weddings` a `events`.

Agregar capa conceptual:
`eventType`

Compatibilidad:
todo documento histórico sin `eventType` se interpreta como:
`wedding`

No hacer migración destructiva.

### Auditoría inicial — 2026-10-06

Hallazgos:
- el acceso actual está concentrado en `wedding-context.js`; los contextos se leen desde `weddings/{weddingId}` y `users/{uid}/weddings/{weddingId}`;
- la UI y servicios consumen un objeto de contexto pequeño con `id`, `name`, `date`, `role` y `ownerUid`;
- no existe todavía ningún `eventType` en el código revisado;
- por compatibilidad, los documentos históricos pueden interpretarse como `eventType: 'wedding'` **en memoria**, sin escribir ni migrar documentos existentes;
- la introducción inicial puede hacerse en el adaptador/contexto antes de modificar módulos individuales.

Diseño propuesto sin migración:
- `readWeddingContextById()` expondrá `eventType` normalizado;
- si el documento no contiene `eventType`, el contexto devolverá `wedding`;
- `createWedding()` seguirá siendo compatible y, cuando se autorice la persistencia del nuevo campo, podrá crear eventos con `eventType` explícito;
- mantener nombres de colecciones/rutas `weddings` por ahora para evitar una migración destructiva;
- los módulos consumirán posteriormente `eventProfile` (MGD-014), no condicionales dispersos.

Gate de datos:
- **todavía no se escribe `eventType` en Firestore**;
- cualquier cambio que agregue el campo a documentos nuevos o existentes requerirá autorización específica de persistencia y QA de aislamiento.

---

## MGD-013 — Tipos iniciales
Estado: 🟢 QA SEGURO DEV APROBADO
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
Estado: 🟢 QA SEGURO DEV APROBADO
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
Estado: 🟢 QA SEGURO DEV APROBADO
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
Estado: 🟢 QA SEGURO DEV APROBADO
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
Estado: 🟢 QA SEGURO DEV APROBADO
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
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV:
- plantillas centralizadas en `src/core/app/checklist-templates.js`;
- los 8 tipos base resuelven una plantilla mediante `eventProfile.checklist`;
- no se duplica el módulo Checklist;
- no se aplican ni persisten automáticamente todavía: la creación efectiva queda para el flujo multi-evento/onboarding correspondiente;
- una vez materializada para un evento, la lista será propiedad de ese evento y no se sobrescribirá por cambios futuros de plantilla.

---

## MGD-034 — Onboarding dinámico por tipo de evento
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV base MGD-034:
- nuevo `src/core/app/onboarding-profiles.js`;
- un único engine: `adaptive-onboarding-v1`;
- 8 perfiles de opciones de rol, uno por tipo de evento;
- la primera decisión canónica es `eventType`;
- `eventProfile.onboarding` ahora consume este contrato central;
- todavía no se cambió la UI ni la persistencia del onboarding actual;
- no se duplicó ningún flujo por evento.

---

## MGD-035 — Edad / etapa de vida y adaptación de experiencia
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV base MGD-035:
- nuevo `src/core/app/age-profile.js`;
- perfiles: child, teen, young-adult, adult y older-adult;
- ageProfile aplica inicialmente a birthday, quince y custom;
- quince se clasifica como teen sin modificar permisos ni identidad;
- onboarding-profiles expone una pregunta opcional de edad solo para eventos age-aware;
- las recomendaciones quedan en modo `suggest-only`;
- el usuario mantiene override manual de tema;
- no se modifica persistencia ni estructura de datos.

---

## MGD-036 — Onboarding con previsualización temática progresiva
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV base MGD-036:
- nuevo `src/core/app/onboarding-preview.js`;
- flujo puro: `eventType → organizerRole → ageProfile → themeId → eventProfile`;
- la preview resuelve eventProfile, ageProfile, sugerencias de tema y tokens;
- cumpleaños infantil/adolescente recibe sugerencias adaptadas sin imponer estilo;
- corporate prioriza temas sobrios/brand-neutral;
- el usuario puede elegir manualmente otro tema;
- `previewOnly: true` y `persist: false`;
- todavía no se escribe `themeId`, `eventType` ni ageProfile durante la previsualización.

---

# BLOQUE G — DISTRIBUCIÓN MULTI-EVENTO

## MGD-019 — Catálogo universal + filtros por evento
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV:
- se conserva el catálogo físico único de 38 objetos y las áreas dibujables existentes;
- cada objeto puede declarar `eventTypes`; ausencia de esa propiedad significa objeto universal;
- `bar` permanece universal;
- `couple` se muestra solo en wedding;
- `altar` se muestra en wedding/religious;
- `photo` se muestra en wedding/quince/birthday/graduation;
- `cake` se muestra en wedding/quince/birthday/baby_shower;
- desktop y móvil consumen el mismo filtro;
- el tipo se resuelve desde `eventProfile.distributionCatalog`;
- el filtro solo afecta el catálogo de alta: no borra ni altera elementos ya guardados.

---

## MGD-020 — Objetos especializados
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV:
- se mantiene intacto el catálogo base de 38 objetos;
- se agrega una capa central de 6 objetos especializados que usa el mismo contrato físico del catálogo;
- 15 años: mesa principal y zona de coreografía;
- Baby Shower: zona de regalos y zona de juegos;
- Graduación: mesa de diplomas y escenario de graduación;
- cada objeto especializado declara `eventTypes` y reutiliza dimensiones, capacidades, familias espaciales, movimiento, rotación, colisiones y persistencia del motor existente;
- se reutilizan assets visuales existentes; no se crean motores, listeners ni formatos de guardado paralelos;
- los objetos especializados solo aparecen para el evento correspondiente y no alteran distribuciones ya guardadas.

---

# BLOQUE H — INVITACIONES

## MGD-021 — Separar motor de invitación de plantilla de boda
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV segura:
- nuevo `src/core/app/invitation-engine.js` con un modelo genérico de 9 campos funcionales;
- nuevo `src/core/app/invitation-templates.js` con plantillas declarativas de presentación;
- `eventProfile.invitationCapabilities` referencia un motor genérico común;
- el motor no contiene CSS, HTML ni reglas visuales;
- las plantillas no contienen lógica RSVP ni persistencia;
- no se conectó todavía este motor con invitaciones reales, Firestore ni RSVP productivo;
- la biblioteca personal de enlaces existente permanece intacta.

---

## MGD-022 — Invitaciones bajo dominio Migrandia
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: CRÍTICA

Nunca enviar al usuario final enlaces de GitHub.

Objetivo:

`https://migrandiapp.com/i/ABC123`

Posible evolución:

`https://invite.migrandiapp.com/ABC123`

Implementación DEV segura:
- se creó `src/core/app/public-invitation-url.js` como contrato único para construir URLs públicas;
- origen canónico actual: `https://migrandiapp.com`;
- ruta pública reservada: `/i/{publicInviteId}`;
- el helper rechaza como válidas las URLs públicas de GitHub;
- no se modificaron DNS, rutas de Cloudflare, Worker productivo ni despliegues;
- la resolución real de `/i/{publicInviteId}` queda condicionada a MGD-023 y a una activación controlada de infraestructura.

---

## MGD-023 — ID público de invitación
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: CRÍTICA

No exponer directamente `weddingId` / `eventId`.

Crear ID público independiente.

Ejemplo:
`MGD-X7K92P`

Resolución:
`publicInviteId → eventId → template → RSVP config`

Debe ser revocable.

Implementación DEV segura:
- nuevo `src/core/app/public-invite-id.js`;
- formato independiente `MGD-XXXXXX`, sin reutilizar `weddingId` ni `eventId`;
- generación con alfabeto no ambiguo y validación central;
- contrato interno `publicInviteId → eventId → templateId → rsvpConfig`;
- revocación representada como transformación inmutable del contrato;
- una resolución revocada devuelve `null`;
- no se creó ninguna colección, escritura, migración ni índice en Firestore;
- la persistencia y resolución real del ID público quedan pendientes de autorización explícita.

---

## MGD-024 — URL personalizada
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: MEDIA

Posible:
`migrandiapp.com/i/antonio-lucero`

Internamente mantener token seguro.

Implementación DEV segura:
- nuevo `src/core/app/custom-invite-slug.js`;
- normalización central de alias legibles (`Antonio & Lucero` → `antonio-lucero`);
- validación de longitud y formato del slug;
- el alias nunca contiene ni expone `eventId`;
- internamente resuelve únicamente hacia el `publicInviteId` seguro de MGD-023;
- revocación soportada en memoria;
- la URL resultante puede ser `https://migrandiapp.com/i/antonio-lucero`;
- no se agregó persistencia, reserva de alias, unicidad en base de datos ni routing real de dominio.

---

# BLOQUE I — DATOS Y ESCALABILIDAD

## MGD-025 — Evolución de `planner-cloud`
Estado: 🟢 FASE 1-8 QA APROBADAS / ACTIVACIÓN REAL DE CHECKLIST EN AUDITORÍA
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

Auditoría previa MGD-025:
- `src/services/planner-cloud.js` usa Firestore directamente;
- lectura actual: `weddings/{id}/cloudSync/main` + `cloudChunks/*`;
- escritura actual: transacción que recompone el backup agregado y actualiza chunks/meta;
- la evolución a dominios separados implicará nuevas rutas de datos y una migración progresiva;
- no se iniciará ninguna nueva escritura, backfill ni cambio de esquema sin autorización explícita del usuario.

Implementación autorizada — Fase 1 sombra:
- se creó `planner-domain-map.js` con un mapa explícito de 10 claves legacy hacia dominios separados;
- se creó `planner-domain-cloud.js` con ruta nueva `weddings/{id}/domainData/{domain}/entries/{storageKey}`;
- el backup legacy `cloudSync/cloudChunks` continúa siendo la fuente autoritativa;
- después de una escritura legacy exitosa, DEV intenta una copia sombra al dominio nuevo;
- la copia sombra es best-effort: si la ruta nueva aún no está habilitada por Rules, la operación legacy no falla;
- todavía no se cambió ninguna lectura del usuario al dominio nuevo;
- no se ejecutó backfill masivo ni retirada de datos legacy;
- esta fase permite validar permisos, forma y estabilidad antes de activar lectura nueva/fallback.

Implementación autorizada — Fase 2 lectura nueva + fallback:
- cada escritura legacy recibe un `syncToken` único en `cloudSync/main`;
- la copia sombra por dominio almacena el mismo `syncToken`;
- la lectura intenta primero el dominio nuevo;
- el dato nuevo solo se acepta cuando su `syncToken` coincide exactamente con el metadata legacy;
- si el dominio no existe, está desactualizado, falla por permisos o no tiene token válido, se lee automáticamente desde `cloudChunks`;
- esto evita lecturas obsoletas durante la pequeña ventana entre la transacción legacy y el shadow write;
- las suscripciones siguen observando metadata legacy, por lo que no se introduce un segundo sistema de listeners;
- no se retiraron lecturas legacy ni datos existentes.

Implementación autorizada — Fase 3 migración lazy:
- cuando una lectura nueva no puede usarse y cae al legacy, solo las claves efectivamente solicitadas pueden autorrepararse;
- la autorreparación requiere que exista un `syncToken` legacy válido;
- solo se ejecuta para roles con capacidad de edición;
- solo migra claves realmente presentes en el backup legacy;
- la escritura al dominio nuevo es asíncrona y best-effort, por lo que no bloquea la lectura del usuario;
- no existe barrido global, backfill masivo ni enumeración de bodas;
- datos legacy previos a la existencia de `syncToken` continúan usando fallback hasta una escritura posterior o una futura migración controlada;
- `cloudSync/cloudChunks` sigue intacto.

Nota QA Fase 4:
- primera corrida: 98/99; MGD-025 fase 4 pasó en todos los dispositivos;
- único fallo ajeno al bloque: E2E-04 Presupuesto tablet por `net::ERR_CONNECTION_RESET` transitorio;
- se ajustó únicamente el filtro de ruido de red del test.

Implementación autorizada — Fase 4 readiness:
- se creó `planner-domain-readiness.js`;
- cada clave puede clasificarse como `ready`, `missing`, `stale`, `legacy-only` o `inaccessible`;
- solo `ready` puede considerarse apto para una futura retirada del fallback legacy;
- cualquier ausencia, desfase de token, dato legacy sin token o error de acceso bloquea la retirada;
- se agregó un resumen agregado de readiness para impedir decisiones parciales o silenciosas;
- esta fase no elimina, mueve ni reescribe datos;
- la retirada gradual queda bloqueada hasta que todas las claves relevantes estén validadas.

Implementación autorizada — Fase 5 diagnóstico readiness:
- `planner-cloud.js` expone `inspectPlannerDomainReadiness(context, keys)`;
- el diagnóstico lee metadata legacy, backup legacy y entradas del dominio nuevo;
- clasifica cada clave usando el motor de readiness de Fase 4;
- devuelve detalle por clave y resumen agregado;
- no escribe Firestore, no ejecuta migraciones y no elimina datos;
- esta función permitirá validar una boda real antes de plantear retirada gradual de cualquier clave.

Implementación autorizada — Fase 6 compuerta de retirada:
- se creó `planner-domain-retirement.js`;
- todas las claves permanecen en modo `hybrid` por defecto;
- no existe ninguna clave activada en `domain-only`;
- pasar una clave a `domain-only` exige simultáneamente readiness positivo y aprobación explícita;
- readiness positivo sin aprobación no habilita retirada;
- aprobación sin readiness positivo tampoco habilita retirada;
- esta fase no modifica lecturas activas, no borra datos y no cambia Firestore.

Implementación autorizada — Fase 7 piloto Checklist:
- se seleccionó Checklist como primera candidata a `domain-only`;
- razones: una sola clave de storage, lectura/escritura directa y ausencia de `subscribePlannerStorageKey`;
- se creó `planner-domain-pilot.js`;
- el piloto está explícitamente `enabled: false`;
- activar el piloto sigue requiriendo readiness positivo y aprobación explícita;
- esta fase no cambia el modo de lectura de Checklist ni retira fallback legacy.

Implementación autorizada — Fase 8 solicitud de activación:
- se creó `planner-domain-activation.js`;
- la solicitud de `domain-only` reutiliza la compuerta de Fase 6;
- exige readiness positivo y aprobación explícita;
- devuelve una orden verificable con `requestedMode: domain-only`;
- la orden lleva `apply: false`, por lo que no modifica todavía el modo de lectura;
- no cambia Checklist, no toca Firestore y no elimina legacy.

---

## MGD-027 — Permisos de Ideas
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: MEDIA

UI:
Owner/Admin.

Backend agregado actual:
Owner/Admin/Editor.

No retirar Editor globalmente.

Resolver cuando Ideas tenga persistencia propia.

Implementación DEV:
- la UI ya restringía edición a Owner/Admin;
- se creó `planner-domain-permissions.js` para llevar esa misma política a la capa de aplicación;
- la clave `planificador_bodas_ideas_v1` solo admite escritura para Owner/Admin;
- Editor continúa habilitado globalmente para otros módulos;
- `planner-cloud` valida permisos por clave antes de escribir;
- no se modificaron Firestore Rules ni roles globales.

---

## MGD-028 — Límites de plataforma
Estado: 🟢 QA SEGURO DEV APROBADO
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

Guardrails V1 definidos:
- eventos por usuario: 20;
- invitados por evento: 2,000;
- mesas por evento: 250;
- ideas por evento: 500;
- proveedores por evento: 300;
- respuestas RSVP por evento: 5,000;
- imágenes por evento: 500;
- objetos de Distribución por evento: 2,000;
- payload serializado por entrada de dominio: 750,000 bytes;
- imagen individual: 10 MiB.

Implementación DEV:
- nuevo `src/core/app/platform-limits.js`;
- límites centralizados y versionados;
- helpers puros para consulta, validación y cálculo de tamaño serializado;
- todavía no se aplica enforcement a módulos ni escrituras reales;
- no se modificaron Firestore Rules, Storage, datos existentes ni UX.

---

# BLOQUE J — PRIVACIDAD Y RECUPERACIÓN

## MGD-029 — Eliminar evento
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: ALTA

Eliminar un evento sin afectar los otros eventos del usuario.

Confirmación fuerte.

Implementación DEV segura:
- nuevo `src/services/event-deletion-contract.js`;
- solo Owner puede solicitar eliminación;
- confirmación exacta requerida: `nombre :: eventId`;
- se genera un plan explícito de recursos relacionados;
- el plan incluye documento raíz, miembros, índices por usuario, planner legacy/nuevo, invitaciones y RSVP;
- el plan siempre devuelve `execute: false`;
- no se ejecuta ningún `deleteDoc`, batch destructivo ni borrado real en esta fase.

---

## MGD-030 — Eliminar cuenta
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: ALTA

Definir:
- eventos propios;
- eventos compartidos;
- miembros;
- RSVP;
- archivos;
- responsabilidades de owner.

Implementación DEV segura:
- nuevo `src/services/account-deletion-contract.js`;
- confirmación fuerte exacta: `email :: uid`;
- los eventos propios bloquean la eliminación de cuenta hasta transferirlos o eliminarlos;
- los eventos compartidos no se eliminan: solo se planifica retirar membresía e índice del usuario;
- RSVP del evento compartido se preserva;
- archivos quedan sujetos a inventario previo;
- Auth se elimina únicamente después de resolver responsabilidades de datos;
- el plan siempre devuelve `execute: false`;
- no se ejecuta ningún borrado real ni operación sobre Auth.

---

## MGD-031 — Backup y restauración
Estado: 🟢 QA SEGURO DEV APROBADO
Prioridad: CRÍTICA

Sistema formal de:
- eventId;
- versión;
- fecha;
- backup;
- restore.

Nunca restaurar un evento sobre otro por accidente.

Implementación DEV segura:
- nuevo `src/services/event-backup-contract.js`;
- formato formal `migrandia_event_backup`;
- incluye `eventId`, versión de esquema, fecha, nombre, tipo de evento, tema y payload;
- el restore valida que `backup.eventId === targetContext.id`;
- si el backup pertenece a otro evento, la restauración se bloquea;
- el plan de restore devuelve `restore: false` y `overwriteAllowed: false`;
- todavía no se escribe ningún dato ni se ejecuta restauración real.

---

# BLOQUE K — MARCHA BLANCA Y BETA

## MGD-032 — Marcha blanca controlada
Estado: 🟢 QA SEGURO DEV APROBADO
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

Implementación DEV segura:
- nuevo `src/core/app/controlled-rollout.js`;
- cohortes: interna (0–4), externa pequeña (5–10) y externa ampliada (20–30);
- métricas obligatorias centralizadas;
- gate de avance exige E2E, móvil y desktop en verde, cero errores críticos, cero fallos de persistencia/permisos/RSVP, Firebase y Workers saludables y costos dentro de rango;
- un solo fallo bloquea el avance;
- `autoEnroll: false`;
- `publicBeta: false`;
- todavía no se habilitan usuarios externos ni se cambia producción.

---

## MGD-033 — Beta pública
Estado: 🟢 GATE QA APROBADO / BETA BLOQUEADA POR PREREQUISITOS
Prioridad: FUTURA

Requisitos mínimos:
- MGD-002 cerrado;
- MGD-003 cerrado;
- MGD-004 cerrado;
- MGD-006 cerrado;
- MGD-008 cerrado;
- MGD-010 cerrado;
- branding de login MGD-026 cerrado;
- multi-evento base validado;
- no contaminación entre eventos;
- backup probado;
- QA móvil / desktop.

Gate DEV de beta pública:
- nuevo `src/core/app/public-beta-readiness.js`;
- todos los requisitos deben estar cerrados simultáneamente;
- con el estado actual la beta queda bloqueada por MGD-002, MGD-003, MGD-008, MGD-010 y MGD-026;
- `publicBeta: false` mientras falte cualquiera;
- incluso con todos cerrados, `autoPublish: false`;
- no se habilita beta ni producción automáticamente.

---

# ORDEN PROPUESTO PARA ESTA SEMANA

## HOY — Seguridad, producción y base arquitectónica
1. MGD-001 — Baseline
2. MGD-002 — Separar Worker DEV/PROD
3. MGD-003 — Anti-abuso RSVP
4. MGD-004 — Worker security
5. MGD-006 — Observabilidad
6. MGD-007 — Versionado
7. MGD-026 — Branding Login Google/Firebase
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
24. MGD-032 — marcha blanca

## SIGUIENTE BLOQUE — Escalabilidad
25. MGD-025 — planner-cloud modular
26. MGD-027 — permisos Ideas
27. MGD-028 — límites
28. MGD-029 — eliminación evento
29. MGD-030 — eliminación cuenta
30. MGD-031 — backup / restore
31. MGD-033 — beta pública

---

# FORMATO DE ACTUALIZACIÓN OBLIGATORIO POR TAREA

Ejemplo:

```md
## MGD-XXX — Ejemplo de tarea

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

## MGD-043 — Analytics de producto, tráfico y KPIs con privacidad
Estado: ⬜ PENDIENTE
Prioridad: ALTA

Objetivo:
medir adquisición, uso real, conversión, retención y monetización de Migrandia sin convertir la analítica en recolección invasiva ni introducir scripts duplicados o parches de medición.

Principio de arquitectura:
- una sola capa central de eventos de analytics para toda la aplicación;
- Firebase/Google Analytics para eventos y embudos de producto cuando corresponda;
- Cloudflare para tráfico, rendimiento y señales agregadas de infraestructura;
- parámetros UTM para atribución de campañas y publicaciones;
- evitar múltiples handlers o SDKs midiendo el mismo evento;
- la instrumentación debe ser reutilizable por todos los eventType y futuros productos.

KPIs de tráfico y adquisición:
- usuarios únicos;
- visitas/sesiones totales;
- usuarios nuevos vs. recurrentes;
- páginas/landing de entrada;
- fuente y medio de adquisición: directo, orgánico, Google Ads, Facebook, Instagram y otras campañas identificables;
- campaña mediante UTM cuando exista;
- país/ciudad aproximados solo cuando la plataforma de analytics los entregue de forma agregada;
- dispositivo, navegador y tamaño de pantalla;
- duración/engagement de sesión y páginas o módulos consultados.

Embudo principal:
- Landing visitada;
- registro iniciado/completado;
- onboarding iniciado/completado;
- evento creado;
- invitados agregados;
- invitación creada;
- invitación compartida;
- primeras confirmaciones/RSVP recibidas;
- uso de módulos avanzados;
- inicio de Premium;
- conversión a Premium/pago completado cuando exista monetización.

KPIs de producto:
- creación de eventos por eventType;
- abandono del onboarding por paso;
- activación y frecuencia de uso de módulos;
- uso de Checklist, Presupuesto, Invitados, Distribución, Ideas, Música e Invitaciones;
- origen de entrada: home general o landing específica;
- conversión Landing → Registro → Onboarding → Evento creado;
- tasa de activación;
- retención y recurrencia;
- funcionalidades con alto/bajo uso;
- errores de experiencia relacionados con flujo.

KPIs comerciales cuando exista monetización:
- conversión Free → Premium;
- usuarios Premium activos;
- ingresos recurrentes mensuales (MRR), cuando aplique;
- ingreso medio por usuario/cliente, cuando aplique;
- cancelaciones/churn, cuando aplique;
- costo de adquisición (CAC) únicamente cuando existan campañas pagadas y datos suficientes;
- conversión e ingreso atribuible por campaña/UTM cuando sea técnicamente posible.

Panel interno:
- dashboard de KPIs con filtros por rango de fechas, eventType, dispositivo y fuente de adquisición;
- embudo visual de conversión;
- evolución temporal de usuarios, eventos creados, activación y Premium;
- ranking de módulos por uso;
- indicadores de abandono;
- comparación de campañas cuando existan UTMs;
- nunca exponer información privada de invitados en el panel analítico.

No registrar en analytics:
- contraseñas;
- nombres completos de invitados;
- teléfonos;
- correos;
- respuestas RSVP completas;
- contenido privado de notas;
- texto privado introducido por usuarios;
- datos personales que no sean necesarios para la métrica.

Criterios de implementación:
- definir primero el catálogo canónico de eventos y propiedades;
- nombres de eventos estables y documentados;
- no introducir medición ad hoc directamente en cada módulo;
- QA debe verificar que un evento de usuario produzca una sola señal analítica esperada;
- distinguir tráfico humano de pruebas/QA cuando sea viable;
- respetar consentimiento, privacidad y normativa aplicable antes de activar medición que lo requiera;
- ningún cambio de analytics debe alterar Firestore canónico, Auth, Storage ni lógica funcional existente salvo autorización expresa.

Separar:
- observabilidad técnica = MGD-006;
- analytics de producto, adquisición y negocio = MGD-043.

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
- login y branding MGD-026 verificados;
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


# NOTA DE CONSOLIDACIÓN DEL ROADMAP

Los MGD-042 a MGD-048 tienen una única definición canónica en el **BLOQUE L — CONFIANZA, GOBERNANZA Y PRODUCTO** ubicado anteriormente en este documento. Se eliminó la segunda definición duplicada para evitar estados contradictorios.

El contenido único de soporte que figuraba como un segundo MGD-048 se conserva con numeración propia:

## MGD-049 — Centro de ayuda y soporte
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

### RSVP DEV direct clients con App Check — 2026-10-05
- `invitacion_0_2/rsvp-nominal-widget.js` ahora inicializa App Check tanto en la app Firebase por defecto como en la app anónima `mgd-rsvp-anonymous`.
- `invitacion_0_3/rsvp-nominal-widget.js` hace lo mismo y deja preinicializada la app anónima que reutiliza el cliente RSVP compartido.
- Se mantienen los mismos datos y colecciones; no se alteró la BD.
- Se incrementaron versiones de carga para evitar caché del widget anterior.
- Producción (`Wedding`) aún conserva clientes RSVP sin App Check y por eso no debe activarse enforcement global todavía.


### QA App Check posterior a integración producción — 2026-10-05
- Métrica observada en Firebase App Check tras integrar PROD: Cloud Firestore 58% solicitudes verificadas / 42% no verificadas; Authentication 71% verificadas / 29% no verificadas.
- Tendencia mejora respecto al punto anterior (Firestore 48% / 52%; Authentication 64% / 36%), confirmando que nuevos clientes están enviando App Check.
- Enforcement permanece desactivado: todavía existe tráfico no verificado significativo y primero debe identificarse/agotarse el tráfico legado y validar RSVP público productivo.


### QA RSVP producción — 2026-10-05
- Invitación 0 productiva validada manualmente.
- El formulario RSVP abrió correctamente con App Check integrado.
- Se envió una confirmación de prueba y fue registrada correctamente.
- La prueba se eliminará después del QA para no contaminar datos reales.
- Resultado: flujo RSVP productivo operativo con App Check.


### Hallazgo Cloudflare PROD — 2026-10-05
- El Worker `wedding` está desplegado como Worker de assets estáticos para `migrandiapp.com`.
- Cloudflare muestra “Metrics is unavailable for Workers with only static assets” y actualmente tiene 0 bindings.
- Decisión: NO convertir `wedding` en Worker API ni pegar allí el código de `migrandia-dev`.
- Se separará la API productiva en un Worker dedicado, recomendado: `migrandia-api`.
- Objetivo final de dominio: `api.migrandiapp.com`.
- Esta separación reduce riesgo de romper el frontend productivo y mejora escalabilidad/observabilidad.


### QA DEV Turnstile silencioso — 2026-10-05
- Invitación DEV validada manualmente en `invitacion_0_2`.
- Envío RSVP correcto.
- No se mostró mensaje técnico de seguridad durante el envío.
- No apareció desafío Turnstile visible en el flujo normal.
- Se mostró correctamente el estado final de éxito con los 2 pases nominales registrados.
- Resultado: UX normal aprobada para el flujo legítimo; falta QA de rate-limit/abuso antes de volver a preparar producción.


### QA DEV rate-limit — 2026-10-05
- Flujo de abuso controlado validado manualmente en DEV.
- Tras varios envíos seguidos, el rate limiter bloquea correctamente.
- La UX muestra un mensaje amigable sin exponer códigos 429 ni detalles técnicos de Cloudflare.
- Resultado: flujo legítimo + flujo de abuso aprobados en DEV.
- Siguiente paso: preparar migración controlada del guard silencioso a producción.


### QA final PROD RSVP silencioso — 2026-10-05
- PR PROD #534 fusionado.
- Commit PROD: `a2be5675a22199e244ae3f981e1196250911516e`.
- Invitación productiva validada manualmente.
- Envío RSVP correcto.
- Sin mensajes técnicos de seguridad.
- Sin CAPTCHA visible en flujo normal.
- Estado final “¡Gracias por confirmar!” correcto.
- Rate limit y Turnstile quedan activos mediante `migrandia-api`.
- App Check continúa activo; Enforcement aún no se habilita hasta observar una ventana limpia de tráfico.
- MGD-003 queda funcionalmente desplegado en producción; el cierre definitivo depende únicamente de la decisión posterior sobre Enforcement de App Check.


### Implementación DEV MGD-004 — 2026-10-05
Se endureció `cloudflare/migrandia-worker.js` sin tocar Firebase ni datos.

Cambios:
- CORS de previews/música/imágenes pasa de `*` a allowlist de Migrandia + GitHub Pages DEV.
- Se agrega soporte de rate limit general mediante binding `API_RATE_LIMIT`, separado de `RSVP_RATE_LIMIT`.
- Validación de dominios musicales pasa a host exacto/subdominio válido; se eliminan comparaciones permisivas con `includes()`.
- Todos los fetch externos usan timeout de 8 s.
- HTML externo limitado a 1.5 MB.
- JSON externo limitado a 1 MB.
- Imágenes proxied limitadas a 6 MB.
- Pinterest image proxy revalida dominio final después de redirect.
- YouTube y Apple Music revalidan dominio final después de redirect.
- Se normalizan errores públicos para no exponer mensajes internos/upstream.
- Respuestas de error usan `Cache-Control: no-store`.
- URLs objetivo limitadas a 2048 caracteres.
- Rutas desconocidas devuelven 404 real.
- Health check queda en `/` y `/health`.

Pendiente QA DEV:
1. desplegar la rama/versión endurecida al Worker `migrandia-dev`;
2. crear binding `API_RATE_LIMIT` en DEV;
3. validar Ideas Pinterest/Temu, image proxy y Música;
4. probar origen no permitido, URL no permitida, payload grande, timeout y 429;
5. solo después migrar a `migrandia-api` PROD.


## Registro consolidado de cambios, Workers y bindings — 2026-10-05

Este bloque consolida los cambios realizados y las configuraciones de Cloudflare/Firebase trabajadas durante la sesión para evitar pérdida de contexto.

### Workers y separación DEV / PROD
- Frontend PROD: Worker `wedding` continúa como Worker de assets estáticos para `migrandiapp.com`; no se convierte en API.
- API DEV: `migrandia-dev`.
- API PROD: `migrandia-api`.
- Endpoint PROD utilizado por RSVP: `https://migrandia-api.avaldiviezoch.workers.dev/api/rsvp/verify`.
- Objetivo futuro: mover la API productiva a `api.migrandiapp.com`.
- Regla arquitectónica: frontend estático y API permanecen separados.

### Bindings y secretos Cloudflare
**DEV — `migrandia-dev`**
- `TURNSTILE_SECRET_KEY`: configurado como secret. No registrar ni exponer su valor.
- `RSVP_RATE_LIMIT`:
  - Namespace: `1001`
  - Limit: `5`
  - Period: `60 seconds`
  - Uso: protección del endpoint RSVP DEV.
- `API_RATE_LIMIT`:
  - Namespace: `1003`
  - Limit: `60`
  - Period: `60 seconds`
  - Uso: `/api/link-preview`, `/api/image-proxy`, `/api/music-preview`.
  - Estado: confirmado guardado en Cloudflare DEV.

**PROD — `migrandia-api`**
- `TURNSTILE_SECRET_KEY`: configurado como secret rotado. No registrar ni exponer su valor.
- `RSVP_RATE_LIMIT`:
  - Namespace: `1002`
  - Limit: `5`
  - Period: `60 seconds`
  - Uso: protección del endpoint RSVP productivo.
- `API_RATE_LIMIT`: todavía no desplegado/configurado en PROD; solo se hará después del QA completo de MGD-004 en DEV.
- `YOUTUBE_API_KEY`: confirmado configurado como secret en `migrandia-dev`; el valor permanece cifrado/no documentado. En PROD aún no asumir configurado salvo verificación específica.

### Turnstile RSVP
- Widget PROD creado como `Migrandia RSVP PROD`.
- Hostnames autorizados:
  - `migrandiapp.com`
  - `www.migrandiapp.com`
  - `avaldiviezoch.github.io`
- Site key público PROD: `0x4AAAAAAF0hdpk8eH91dghw`.
- El secret original expuesto accidentalmente fue rotado y reemplazado; nunca almacenar el valor del secret en repositorio/documentación.
- DEV usa el flujo de prueba/validación con Turnstile Managed.
- Modo UX aprobado: silencioso en flujo normal, sin mensaje técnico ni CAPTCHA visual cuando no hay desafío.
- Rate-limit muestra solo mensaje amigable al usuario.

### Firebase App Check
- Proveedor: reCAPTCHA Enterprise / Fraud Defense.
- App web: `migrandiaweb`.
- Clave pública App Check: `6LeukOAtAAAAAJODsmEu9XyMLnyb6JH9TNYizFHk`.
- TTL: 1 hora.
- Dominios:
  - `migrandiapp.com`
  - `www.migrandiapp.com`
  - `avaldiviezoch.github.io`
- Auto refresh habilitado.
- App Check se inicializa tanto en la app Firebase por defecto como en la app anónima `mgd-rsvp-anonymous` para los clientes RSVP correspondientes.
- Enforcement permanece desactivado hasta observar tráfico suficientemente limpio y reducir solicitudes no verificadas.
- No se modificaron Firestore Rules, Auth, Storage ni esquema de BD como parte de estos cambios.

### Cambios RSVP DEV
- PR #70: corrección del botón “Agregar al tablero” de Ideas al esperar el preview asíncrono antes de validar título/imagen.
- PR #71: cache bust de Ideas/dashboard; DEV quedó funcionando.
- PR #72: App Check para clientes RSVP directos `invitacion_0_2` y `invitacion_0_3`.
- PR #73: primera versión silenciosa del guard Turnstile en DEV.
- PR #74: corrección del caso en que Turnstile se renderizaba dentro del panel RSVP inicialmente oculto.
  - lee token también mediante `turnstile.getResponse()`;
  - si el token no está listo al enviar, reinicia el widget ya con el panel visible;
  - espera silenciosa hasta 8 s;
  - no muestra mensajes técnicos al invitado;
  - cache bust en `invitacion_0_2` y `invitacion_0_3`.
- Commit merge DEV PR #74: `efd995e1ce0de8d471c2339ee3450486adc10355`.
- QA manual DEV:
  - envío legítimo correcto;
  - sin mensaje técnico;
  - sin Turnstile visible en flujo normal;
  - confirmación final correcta;
  - rate-limit probado y mensaje amigable correcto.

### Cambios RSVP PROD
- PR #531: integración App Check en producción.
  - Commit: `8095ab1b39b28718a97897e5fecd8713a6af2bf3`.
- PR #532: primer intento de Turnstile productivo.
  - Se detectó mala UX por mensaje visible de verificación.
- PR #533: hotfix para restaurar estabilidad productiva mientras se corregía el flujo silencioso.
  - Commit: `ad642b317ae4612a48a475c27ef232ef65f9ead7`.
- PR #534: reintroducción controlada del guard silencioso ya validado en DEV.
  - Commit PROD: `a2be5675a22199e244ae3f981e1196250911516e`.
  - Resultado QA PROD: RSVP correcto, sin mensaje técnico, sin CAPTCHA visible, Turnstile + rate-limit activos.
- MGD-003 queda funcionalmente desplegado; Enforcement de App Check sigue pendiente por decisión controlada.

### MGD-004 — Hardening Worker DEV
- Auditoría inicial detectó CORS abierto, ausencia de rate-limit general, validaciones de host permisivas, falta de timeout/límites y redirects sin revalidación.
- PR #75: hardening del Worker en DEV.
- Commit merge DEV PR #75: `e18b281628a590cd625e618b1fedbb8c012797ce`.
- Cambios:
  - CORS de previews/música/imágenes pasa de `*` a allowlist.
  - soporte de `API_RATE_LIMIT` separado de `RSVP_RATE_LIMIT`;
  - allowlist estricta de hosts musicales;
  - timeout upstream de 8 s;
  - HTML limitado a 1.5 MB;
  - JSON limitado a 1 MB;
  - imágenes proxied limitadas a 6 MB;
  - URL objetivo limitada a 2048 caracteres;
  - revalidación de redirect final para Pinterest image proxy;
  - revalidación de redirects de YouTube y Apple Music;
  - errores públicos normalizados;
  - errores con `Cache-Control: no-store`;
  - rutas desconocidas devuelven 404 real;
  - health check disponible en `/` y `/health`.
- No se tocó Firebase, Firestore Rules, Auth, Storage ni estructura de BD.

### Próximo QA MGD-004
1. Confirmar en Cloudflare DEV que `API_RATE_LIMIT` quedó guardado con namespace `1003`, limit `60`, period `60 seconds`.
2. Desplegar/confirmar el Worker DEV con el código de `main`.
3. Probar Pinterest, Temu, image proxy y Música desde la app DEV.
4. Probar origen no permitido.
5. Probar dominio musical falso.
6. Probar URL demasiado larga.
7. Probar timeout/upstream lento.
8. Probar límite de tamaño.
9. Probar 429 del `API_RATE_LIMIT`.
10. Solo después preparar el pase a `migrandia-api` PROD.


### Confirmación Cloudflare DEV bindings — 2026-10-05
Captura revisada en `migrandia-dev > Settings > Production`.

Confirmado:
- Secret `TURNSTILE_SECRET_KEY`: presente.
- Secret `YOUTUBE_API_KEY`: presente.
- Binding `API_RATE_LIMIT`: namespace `1003`, limit `60`, period `60`.
- Binding `RSVP_RATE_LIMIT`: namespace `1001`, limit `5`, period `60`.
- Cloudflare muestra aviso para mantener Wrangler sincronizado con los cambios de bindings.

Siguiente paso:
- desplegar/confirmar el código endurecido de MGD-004 en `migrandia-dev`;
- luego ejecutar QA funcional de Ideas/Música/Image Proxy y pruebas de seguridad/rate-limit.


### Sincronización Wrangler DEV — 2026-10-05
- Se agregó `cloudflare/wrangler.jsonc` para evitar que futuros despliegues de `migrandia-dev` pierdan los bindings configurados manualmente en Cloudflare.
- Configuración versionada:
  - Worker: `migrandia-dev`
  - `API_RATE_LIMIT`: namespace `1003`, limit `60`, period `60`.
  - `RSVP_RATE_LIMIT`: namespace `1001`, limit `5`, period `60`.
- Los secretos `TURNSTILE_SECRET_KEY` y `YOUTUBE_API_KEY` NO se versionan; permanecen únicamente en Cloudflare.
- No se modificó Firebase, Firestore Rules, Auth, Storage ni BD.


### Deploy DEV MGD-004 — 2026-10-05
- El usuario confirmó que reemplazó el código de `migrandia-dev` por la versión endurecida de `cloudflare/migrandia-worker.js` y ejecutó Deploy en Cloudflare.
- Bindings DEV ya confirmados previamente:
  - `API_RATE_LIMIT`: namespace `1003`, limit `60`, period `60`.
  - `RSVP_RATE_LIMIT`: namespace `1001`, limit `5`, period `60`.
  - `TURNSTILE_SECRET_KEY`: presente.
  - `YOUTUBE_API_KEY`: presente.
- Wrangler DEV quedó versionado en GitHub con los dos rate-limit bindings.
- Estado: desplegado según confirmación del usuario; pendiente QA funcional y de seguridad sobre el Worker DEV.
- No se modificó Firebase, Firestore Rules, Auth, Storage ni BD.


### QA funcional MGD-004 — Ideas — 2026-10-05
- Worker DEV endurecido validado desde la app DEV.
- Pinterest: preview correcto, imagen/título y agregado al tablero funcionando.
- Temu: preview correcto, imagen/título y agregado al tablero funcionando.
- Resultado: `/api/link-preview` e integración asociada continúan operativas después del hardening.


### QA funcional MGD-004 — Música — 2026-10-05
- El usuario confirmó que el módulo Música en DEV continúa funcionando igual que antes del hardening del Worker.
- Se mantiene el comportamiento esperado de los previews musicales sin regresiones funcionales visibles.
- Resultado: `/api/music-preview` continúa operativo después del hardening.


### QA seguridad MGD-004 — dominio musical falso — 2026-10-05
- Prueba ejecutada contra `/api/music-preview` usando `https://youtube.com.ejemplo.com/watch?v=123`.
- Resultado: bloqueado correctamente.
- Respuesta: `{"ok":false,"error":"La URL no corresponde a Spotify, YouTube Music o Apple Music."}`
- Conclusión: la validación estricta de hostname funciona y ya no acepta dominios que solo contienen el texto `youtube.com`.


### QA seguridad MGD-004 — URL larga (primer intento) — 2026-10-05
- Primer intento no alcanzó el límite de longitud definido por el Worker.
- Respuesta obtenida: `{"ok":false,"error":"No se pudieron obtener los datos de la música.","provider":"youtube","type":"unknown"}`.
- Interpretación: la solicitud sí pasó la validación de longitud y llegó a la lógica de `music-preview`; por tanto esta prueba no valida todavía el límite de 2048 caracteres.
- Siguiente prueba: generar programáticamente una URL >2048 caracteres y verificar respuesta `La URL excede el tamaño permitido.`.


### QA seguridad MGD-004 — rate limit (primer intento) — 2026-10-05
- Se ejecutaron 70 solicitudes consecutivas contra `/api/music-preview`.
- Todas devolvieron HTTP 200; no se observó 429 en este primer intento.
- El resultado es inconcluso, no se clasifica como fallo del binding: las respuestas de éxito usan `Cache-Control: public, max-age=3600` y el navegador puede reutilizar la respuesta cacheada sin volver a ejecutar el Worker.
- Siguiente prueba: repetir con `cache: "no-store"` y un parámetro anti-cache único por solicitud para forzar ejecución real del Worker y validar `API_RATE_LIMIT`.


### QA seguridad MGD-004 — API_RATE_LIMIT confirmado — 2026-10-05
- Se repitió la prueba de 70 solicitudes con `cache: "no-store"` y parámetro anti-cache único.
- Resultado: `API_RATE_LIMIT` respondió correctamente con HTTP 429 y el mensaje público `Demasiadas solicitudes. Inténtalo nuevamente en un momento.`.
- También se observaron respuestas 200 antes/durante la ráfaga por ejecución concurrente fuera de orden; esto es esperable en una prueba paralela.
- Durante la ráfaga aparecieron algunos 502/503 sin CORS visibles en el navegador, atribuibles al estrés/subrequests concurrentes del entorno; no se reproducen en el flujo funcional normal ya validado.
- Conclusión: el binding DEV `API_RATE_LIMIT` (namespace 1003, limit 60/60s) está activo y bloquea abuso.


### Preparación PROD MGD-004 — 2026-10-05
DEV quedó aprobado funcionalmente y en seguridad básica:
- Health check OK.
- Pinterest OK.
- Temu OK.
- Música OK.
- Dominio musical falso bloqueado.
- `API_RATE_LIMIT` confirmado con HTTP 429 bajo ráfaga.
- Sin regresiones funcionales visibles en Ideas/Música.
- No se modificó Firebase, Firestore Rules, Auth, Storage ni BD.

Se agregó configuración productiva versionada:
- `cloudflare/wrangler.prod.jsonc`
- Worker: `migrandia-api`
- `RSVP_RATE_LIMIT`: namespace `1002`, limit `5`, period `60`.
- `API_RATE_LIMIT`: namespace `1004`, limit `60`, period `60`.

Pendiente para cierre definitivo:
1. crear/confirmar en Cloudflare PROD binding `API_RATE_LIMIT` con namespace `1004`, limit `60`, period `60`;
2. mantener `RSVP_RATE_LIMIT` existente en namespace `1002`;
3. desplegar en `migrandia-api` el mismo `migrandia-worker.js` endurecido ya probado en DEV;
4. ejecutar smoke test productivo: `/health`, Pinterest/Temu/Música y un 429 controlado;
5. marcar MGD-004 como 🟢 PRODUCCIÓN.


### PROD MGD-004 — binding API_RATE_LIMIT creado — 2026-10-05
- Confirmación del usuario: se creó en Cloudflare Worker `migrandia-api` el binding `API_RATE_LIMIT`.
- Configuración acordada/versionada: namespace `1004`, limit `60`, period `60`.
- `RSVP_RATE_LIMIT` existente debe permanecer en namespace `1002`, limit `5`, period `60`.
- Pendiente: desplegar en `migrandia-api` el mismo `migrandia-worker.js` endurecido validado en DEV y ejecutar smoke test productivo.


### PROD MGD-004 — deploy confirmado por usuario — 2026-10-05
- Confirmación del usuario: el Worker `migrandia-api` fue desplegado en Cloudflare con el código endurecido validado previamente en DEV.
- Binding `API_RATE_LIMIT` PROD ya creado (namespace `1004`, limit `60`, period `60`).
- Pendiente únicamente smoke test productivo final antes de marcar MGD-004 como 🟢 PRODUCCIÓN.


### Smoke test PROD MGD-004 — health — 2026-10-05
- Usuario confirmó `/health` en `migrandia-api` con `ok: true`.
- Resultado: Worker productivo responde correctamente después del despliegue endurecido.
- Pendiente: validar una función real (Ideas o Música) y confirmar rate limit 429 en PROD.


### Smoke test PROD MGD-004 — funcional — 2026-10-05
- Usuario confirmó que en `https://www.migrandiapp.com` el funcionamiento productivo está correcto después del despliegue endurecido.
- Resultado: sin regresiones funcionales visibles en el frontend productivo.
- Pendiente únicamente: confirmar `API_RATE_LIMIT` productivo con respuesta HTTP 429 controlada y cerrar MGD-004 como 🟢 PRODUCCIÓN.


### Cierre MGD-004 — PRODUCCIÓN — 2026-10-05
- Smoke test productivo completado.
- `/health`: OK.
- Funcionalidad real en `https://www.migrandiapp.com`: OK, sin regresiones visibles.
- Prueba controlada de `API_RATE_LIMIT` en `migrandia-api`:
  - 70 solicitudes totales.
  - 29 respuestas HTTP 400 por URL inválida esperada.
  - 41 respuestas HTTP 429 `Too Many Requests`.
  - 0 respuestas HTTP 200.
- Conclusión: `API_RATE_LIMIT` PROD está activo y bloquea ráfagas correctamente.
- MGD-004 queda cerrado como 🟢 PRODUCCIÓN.
- No se modificó Firebase, Firestore Rules, Auth, Storage ni BD.

- nueva corrida: 39/42 pruebas pasaron. E2E-02-pre abrió correctamente el flujo Google en los tres viewports y llegó hasta la validación final; el único motivo de fallo fue un `console.error` genérico `Failed to load resource: the server responded with a status of 403 ()` emitido durante el popup headless. Como el popup y su URL ya fueron validados, no se convirtió este 403 en excepción global: se filtró únicamente dentro de E2E-02-pre y por coincidencia exacta. Commit: `2fc71cdfb2e3fe6eaccc08fbfb18168af5d2c74b`. Pendiente corrida final de este subbloque.
- revisión de la corrida posterior mostró que el filtro 403 del commit `2fc71cdf...` no había quedado aplicado en E2E-02-pre; por una sustitución demasiado amplia terminó en E2E-01. Se corrigió explícitamente: E2E-01 vuelve a ser estricto y el filtro exacto del 403 queda únicamente dentro de E2E-02-pre. Commit correcto: `ba8c1a73b134f4c376c2ff316416a19dca1574b3`. Pendiente nueva corrida.
- corrida final de E2E-02-pre reportada en verde por el usuario. Queda validado el inicio del flujo Google en desktop, tablet y móvil sin seleccionar cuenta ni completar autenticación. **E2E-02-pre: 🟢 QA APROBADO**.
- siguiente paso de MGD-008: preparar el baseline autenticado de solo lectura (E2E-02/E2E-03 y lectura real de módulos) sin usar datos destructivos ni automatizar onboarding/escrituras sobre la boda real.

### MGD-008A autenticado — preparación local segura

Auditoría previa:
- Checklist, Presupuesto, Proveedores, Invitados, Cronograma e Ideas cargan sus datos existentes en el montaje y no ejecutan una escritura deliberada por el simple hecho de abrir el módulo;
- Invitaciones se deja fuera de esta primera tanda por cargar contenido externo/iframe y suscripción propia, aunque el montaje revisado no escribe por sí mismo;
- Distribución se deja fuera inicialmente porque su módulo contiene autosave y preferencias de vista persistidas; se validará por separado antes de incorporarlo al baseline de solo lectura;
- Música se deja fuera inicialmente porque `mountMusica()` puede escribir automáticamente si `hydratePlaylistCovers()` detecta cambios de carátula; no cumple el criterio estricto de “solo lectura”.

Implementación:
- se agregó `tests/e2e-auth-readonly.spec.js` para validar una sesión existente, boda activa y montaje real de Checklist, Presupuesto, Proveedores, Invitados, Cronograma e Ideas sin acciones de edición;
- la sesión autenticada NO se guarda en el repositorio: se captura localmente en `tests/.auth/storage-state.json`;
- `mi-lu-gran-dia-reestructuracion/.gitignore` excluye `tests/.auth/`, `test-results/` y `playwright-report/` para impedir subir tokens o artefactos locales;
- se agregó `playwright.auth.config.js` con un único proyecto desktop autenticado para esta primera validación;
- scripts: `npm run auth:e2e:capture` y `npm run test:e2e:auth-readonly`.

Commits:
- `c5e16767bee74b4106bcbe9e0f99be5f80f8e1a1` — scripts locales;
- `967829114a197756ebc0eb8c8dec86a87fd7a48d` — configuración autenticada;
- `29894cd2a825d682cc8951bf985c0b330e8b9b92` — pruebas autenticadas de solo lectura;
- `175c0754fc73743eab2bfbdf8a9ebcddd5cc4f45` — exclusión de sesión/tokens y artefactos.

Estado: preparación completada; pendiente captura manual de sesión existente y primera corrida local autenticada. No usar cuenta nueva ni completar onboarding durante este QA.


### MGD-008A autenticado — auditoría de Invitaciones, Distribución y Música

Resultado por módulo:
- **Invitaciones:** el montaje carga la vista, suscribe la biblioteca personal y puede cargar una URL segura en el iframe. La escritura solo aparece en el submit de `addPersonalInvitation(...)`; abrir el módulo por sí solo no ejecuta esa alta. Se clasifica como **apto para baseline autenticado de solo lectura**, con la precaución de no enviar formularios ni accionar creación.
- **Distribución:** no entra al baseline estricto de solo lectura. Aunque el montaje inicia leyendo invitados/distribución, contiene autosave y además una reparación dirigida que puede ejecutar `writePlannerStorageKey(...DISTRIBUTION_VIEW_STORAGE_KEY...)` al detectar el estado legado Casa Acapulco con Y=+450. Por tanto, abrir el módulo puede escribir en una condición real específica.
- **Música:** no entra al baseline estricto de solo lectura. `mountMusica()` ejecuta `hydratePlaylistCovers(plan)` y, si detecta cambios de portada, persiste automáticamente el plan mediante `writePlannerStorageKey` sin interacción adicional.

Decisión:
- sumar **Invitaciones** a la próxima tanda autenticada de solo lectura;
- mantener **Distribución** y **Música** fuera del QA autenticado automático hasta definir una estrategia segura que garantice cero escritura;
- no modificar el código funcional de ambos módulos solo para facilitar pruebas.


### MGD-008A autenticado — ampliación de tanda segura

- tras la auditoría específica, `Invitaciones` se incorporó a `tests/e2e-auth-readonly.spec.js`;
- la tanda autenticada preparada queda en siete módulos: Checklist, Presupuesto, Proveedores, Invitados, Cronograma, Ideas e Invitaciones;
- Distribución y Música continúan excluidos por riesgo de escritura automática durante el montaje;
- commit: `1e1287f4ce59f5a391dc43bdb8307c25a96a2a88`.

Limitación operativa actual:
- como el trabajo del usuario se realiza directamente en GitHub y no existe un entorno local con sesión iniciada, la suite autenticada no puede ejecutarse todavía sin entregar una sesión/credencial a GitHub Actions;
- no se almacenará contraseña, token de Google ni estado autenticado en el repositorio ni en Actions sin autorización expresa;
- por ello se continúa avanzando en auditoría y cobertura segura mientras E2E autenticado real queda preparado pero pendiente de mecanismo de sesión aprobado.


### MGD-008B — mapa de dependencias y bloqueos reales

Para no crear pruebas ficticias sobre funciones todavía inexistentes, los flujos avanzados quedan vinculados a sus tareas funcionales:

| Flujo E2E futuro | Dependencia funcional | Estado actual |
|---|---|---|
| Usuario nuevo por correo | MGD-009 — Registro por correo | Bloqueado hasta implementación |
| Recuperación de contraseña | MGD-010 | Bloqueado hasta implementación |
| Usuario con varios eventos | MGD-011 | Bloqueado hasta implementación |
| eventType / tipos de evento | MGD-012 a MGD-014 | Bloqueado hasta implementación |
| Cambio entre eventos | MGD-011 + MGD-012 | Bloqueado hasta implementación |
| Aislamiento entre eventos | MGD-011 + MGD-012 + persistencia por eventId | Bloqueado hasta implementación |
| Roles Owner/Admin/Editor/Provider/Viewer completos | arquitectura de permisos + flujos de colaboración existentes/futuros | Parcial; no cerrar como E2E completo aún |
| Invitación / aceptación de colaborador | flujo de colaboración real y cuenta de prueba separada | Requiere datos/cuentas de prueba autorizadas |
| Persistencia con escritura controlada | E2E-17 | Bloqueado hasta autorizar dato/entorno de prueba |
| Usuario nuevo + onboarding + crear evento | E2E-18 | Bloqueado hasta autorizar cuenta/entorno de prueba |
| RSVP controlado | E2E-19 | Bloqueado hasta autorizar confirmación de prueba y limpieza |

Decisión de QA:
- no inventar mocks para declarar estos flujos aprobados;
- no reutilizar la boda real como entorno destructivo;
- no almacenar credenciales o sesiones reales en el repositorio;
- cada flujo se activará en MGD-008 en cuanto su dependencia funcional esté disponible y exista una forma segura de probarla.

Checkpoint actual:
- baseline público E2E: 🟢 aprobado;
- arranque Google Login sin completar Auth: 🟢 aprobado;
- baseline autenticado de lectura: preparado, pendiente de mecanismo de sesión seguro;
- módulos con riesgo de escritura automática (Distribución/Música): separados;
- MGD-008 general permanece 🟡 EN DESARROLLO.


### Gate de pruebas controladas MGD-009 / MGD-010

Las pruebas reales de registro y recuperación **no se ejecutarán todavía sobre la cuenta/boda real**.

Motivo:
- el flujo actual de una cuenta nueva puede continuar hacia `finishOnboardingForNewUser()` y crear una boda real en Firestore;
- MGD-029 (eliminación de evento) aún no existe, por lo que una cuenta de QA podría dejar datos de prueba sin un mecanismo funcional de limpieza desde la aplicación.

Momento de ejecución:
1. cuando exista un entorno/cuenta de prueba con limpieza segura, o después de implementar MGD-029;
2. crear una cuenta de prueba controlada;
3. validar cierre de sesión y reingreso;
4. solicitar recuperación;
5. verificar recepción del correo;
6. limpiar cuenta/evento de prueba;
7. solo entonces marcar MGD-009 y MGD-010 como cerrados funcionalmente.

Hasta ese gate, ambos permanecen con QA seguro DEV aprobado pero no “cerrados” al 100 %.

### MGD-012 — implementación DEV de compatibilidad eventType

Implementado sin persistencia:
- nuevo `src/core/app/event-type.js` con `DEFAULT_EVENT_TYPE = 'wedding'` y `normalizeEventType()`;
- `wedding-context.js` ahora expone `eventType` en memoria para contextos existentes;
- si Firestore no tiene `eventType`, el contexto devuelve `wedding`;
- `createWedding()` y `acceptWeddingInvitation()` devuelven también `eventType` en el objeto de contexto, sin agregar todavía el campo al documento persistido;
- no se renombraron colecciones, rutas, claves ni funciones legacy;
- no se escribió ningún `eventType` nuevo en Firestore.

QA seguro agregado:
- prueba automática verifica fallback vacío → `wedding`;
- normalización `WEDDING` → `wedding`;
- preservación de un tipo futuro como `birthday`;
- la prueba solo importa el módulo puro y no toca datos.

Commits:
- `99873d0e06cde8658787fc507585ea3eeee3fd52` — normalizador eventType;
- `9d9ca38bc856cca16dd6349dd9d324e64efa97f7` — integración de contexto en memoria;
- `1bfaac952654bcd3ad3be7bf57cd316affbac31c` — QA seguro MGD-012.

Pendiente:
- ejecutar GitHub Actions;
- MGD-013 definirá el catálogo oficial de tipos;
- persistir `eventType` en documentos nuevos queda para una fase autorizada posterior.

### MGD-013 — implementación DEV del catálogo inicial

Implementado:
- catálogo canónico centralizado en `src/core/app/event-types.js`;
- exactamente 8 tipos base: `wedding`, `birthday`, `quince`, `baby_shower`, `religious`, `graduation`, `corporate`, `custom`;
- etiquetas visibles centralizadas;
- helper `isKnownEventType()` para distinguir tipos admitidos;
- helper `eventTypeLabel()` para resolver terminología base sin condicionales dispersos;
- catálogo congelado con `Object.freeze` para evitar mutaciones accidentales en runtime;
- no se modifica Firestore ni se persiste todavía `eventType`.

QA seguro agregado:
- verifica que existan exactamente 8 IDs;
- comprueba unicidad;
- valida reconocimiento case-insensitive;
- rechaza tipos no definidos como `festival`;
- valida la etiqueta compartida de `religious`.

Commits:
- `489f8ad55018faf1bdae426b63b675390a3c60d6` — catálogo canónico;
- `6bc983bfb805bb973439a500d991cdcc470967b7` — QA seguro.

Estado:
- MGD-012: 🟢 QA SEGURO DEV APROBADO tras corrida de 51/51 reportada en verde;
- MGD-013: 🟡 IMPLEMENTADO EN DEV / PENDIENTE QA.

### MGD-014 — implementación DEV del motor central eventProfile

Implementado:
- nuevo `src/core/app/event-profile.js`;
- una única fuente de verdad para los 8 perfiles de evento;
- forma estable por perfil: `type`, `terminology`, `modules`, `checklist`, `distributionCatalog`, `theme`, `onboarding`, `invitationCapabilities`, `audienceProfile`;
- los 9 módulos actuales se declaran una sola vez en `CURRENT_MODULES`, sin duplicar listas por evento;
- `getEventProfile()` resuelve perfiles conocidos y usa `wedding` como fallback compatible ante valores desconocidos;
- se incluyen únicamente diferencias semánticas mínimas por evento; la personalización visual queda separada para MGD-015/016;
- no se conectó todavía el perfil a persistencia ni se modificó Firestore.

QA seguro:
- valida los 8 perfiles;
- valida la forma obligatoria;
- valida que la lista de módulos actual se comparte;
- valida terminología básica;
- valida fallback compatible.

Commits:
- `ac315b7ab32b336431675b1adef2801017b7b6e7` — motor central;
- `22b6cc79335141d8b08e34d1c5aa91c44e656fd3` — QA seguro.

Estado:
- MGD-013: 🟢 QA SEGURO DEV APROBADO, corrida reportada en verde;
- MGD-014: 🟡 IMPLEMENTADO EN DEV / PENDIENTE QA.

### MGD-015 — implementación DEV: eventType ≠ themeId

Implementado:
- nuevo `src/core/app/theme-id.js` con `DEFAULT_THEME_ID`, `normalizeThemeId()` y `resolveEventPresentation()`;
- `eventType` y `themeId` se modelan como propiedades independientes;
- el mismo `themeId` puede utilizarse con tipos de evento distintos sin cambiar la lógica funcional;
- `wedding-context.js` expone `themeId` en memoria junto a `eventType`;
- documentos históricos sin `themeId` reciben fallback `classic-elegant` en memoria;
- no se persiste todavía `themeId` en Firestore;
- no se mezclaron colores/tokens visuales en esta tarea: eso queda para MGD-016.

QA seguro:
- valida `wedding + one-piece-elegant`;
- valida `birthday + minimal-black`;
- valida que un mismo tema pueda coexistir con distintos `eventType`;
- valida normalización independiente del tema.

Commits:
- `dc585f703af955f16e1eccc5f06ddd9af855d417` — helper de themeId;
- `f2fc3ce148db6deed40bd92a3fd3cb0db32b542b` — integración de contexto en memoria;
- `9da4cf55a473a7b46cef1a63587df35d2f885c8c` — QA seguro.

Estado:
- MGD-014: 🟢 QA SEGURO DEV APROBADO;
- MGD-015: 🟡 IMPLEMENTADO EN DEV / PENDIENTE QA.

### MGD-016 — implementación DEV de tema global y tokens visuales

Implementado:
- nuevo `src/core/app/theme-tokens.js` con presets `classic-elegant`, `one-piece-elegant` y `minimal-black`;
- tokens globales: `--event-primary`, `--event-secondary`, `--event-accent`, `--event-background`, `--event-surface`, `--event-heading-font`, `--event-body-font`, `--event-radius`, `--event-decoration-style`;
- `applyEventTheme()` aplica el tema al elemento raíz y registra `data-event-theme`;
- el dashboard aplica el tema del contexto activo mediante `context.themeId`;
- fallback seguro a `classic-elegant` para contextos históricos o temas desconocidos;
- los nueve módulos actuales consumen al menos los tokens globales de fondo/tipografía o aliases de color existentes, sin duplicar CSS por tipo de evento;
- la apariencia actual se conserva con los valores de `classic-elegant`;
- no se persiste `themeId` todavía y no se toca Firestore.

QA seguro:
- valida aplicación de `one-piece-elegant`;
- valida fallback a `classic-elegant`;
- valida valores principales de tokens sin escribir datos.

Commits principales:
- `20fb535ad84775c24fe6622d9a89554d36da9f1c` — motor de tokens;
- `dc27da007e43b55f21689eddbdfabdabb352caad` — tokens raíz;
- `ae05059e7d0496e3e3caf2410bc094a4aedfc1c8` — aplicación desde contexto;
- `08d65ff84af8e0d07c43d2c5c64f03d3137f221f` — QA seguro.

Estado:
- MGD-015: 🟢 QA SEGURO DEV APROBADO;
- MGD-016: 🟡 IMPLEMENTADO EN DEV / PENDIENTE QA.

### MGD-017 — implementación DEV del diccionario de lenguaje

Implementado:
- nuevo `src/core/app/event-terminology.js` como fuente única de terminología por tipo de evento;
- cubre los 8 tipos base;
- centraliza términos de evento, organizador/homenajeado, invitados/asistentes, mesa principal, lugar de ceremonia, nombre por defecto y textos de foco;
- `eventProfile` consume ahora este diccionario en vez de mantener terminología duplicada;
- el dashboard activo consulta el diccionario para textos sensibles al contexto: invitados/asistentes, pendientes del Checklist, mensaje de inicio y nombre por defecto;
- se eliminó en móvil la construcción fija “La boda de …”; ahora se muestra el nombre real del evento;
- no se cambia todavía el onboarding de creación, que continúa siendo boda hasta los MGD específicos de onboarding multi-evento;
- no se modificó persistencia.

QA seguro:
- valida términos de boda, cumpleaños, 15 años, baby shower, graduación y corporativo;
- valida fallback legacy a boda;
- valida que `eventProfile` reutilice el mismo diccionario.

Commits:
- `8542192b4805646e63785e63b4cdb12772c06a6b` — diccionario;
- `276e97d867d55ee3ffe8eb491f6d7d041db33040` — eventProfile consume diccionario;
- `1d718222c3c03c6d0b00fa2412872db3dcce12b3` — dashboard dinámico;
- `889aff58b380254c23e8e9326c3ce08998495fce` — QA seguro.

Estado:
- MGD-016: 🟢 QA SEGURO DEV APROBADO;
- MGD-017: 🟡 IMPLEMENTADO EN DEV / PENDIENTE QA.