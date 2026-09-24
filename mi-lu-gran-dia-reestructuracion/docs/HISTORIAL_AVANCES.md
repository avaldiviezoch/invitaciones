# Historial de avances — Mi Lu Gran Día

Este documento es la bitácora canónica de la reconstrucción. Debe actualizarse al cerrar cada hito importante. No sustituye contratos técnicos; enlaza decisiones, estado y motivos.

## Directiva principal

La aplicación nueva se adapta al Firebase existente. No se migran, renombran, limpian ni reinicializan usuarios, bodas, invitados, checklist, presupuesto, mesas, cronograma, música, confirmaciones ni otros datos existentes para facilitar el refactor.

## 2026-09-22 — Base de reconstrucción
- Se creó `mi-lu-gran-dia-reestructuracion/` con arquitectura core/services/shared/modules.
- Se congeló la regla de no tocar datos reales durante la reconstrucción visual.
- Se definieron roles owner/admin/editor/provider/viewer y capacidades centralizadas.
- Se definió que la cuenta autenticada y la boda activa son conceptos separados.
- Se definió microcopy limpio: sin “Sesión conectada” ni roles decorativos permanentes.
- Se reconstruyó la carátula con video, cuenta, boda activa, cuenta regresiva y accesos a módulos.
- Se hizo legible el HTML/CSS/JS; no se permiten parches con `!important`.

## 2026-09-22 — Conexión con Firebase existente
- Se reutiliza exactamente el proyecto Firebase `migrandia` y sus usuarios existentes.
- Se agregó `services/firebase-client.js` como inicialización única.
- Se agregó `services/wedding-context.js` como único adaptador de la boda activa.
- La boda activa se resuelve leyendo `users/{uid}.activeWeddingId`, el índice `users/{uid}/weddings/{weddingId}`, la membresía `weddings/{weddingId}/members/{uid}` y el documento `weddings/{weddingId}`.
- Si el índice activo no es válido, se busca una membresía válida en los índices existentes. Esta búsqueda NO borra ni repara documentos.
- No se auto-crean bodas, usuarios, membresías ni índices.
- El título y la fecha se leen del documento de la boda existente.
- La edición de título/fecha actualiza únicamente `name`, `date` y `updatedAt` del documento `weddings/{weddingId}`.
- Conforme a las reglas actuales de Firestore, esa edición queda disponible solo para `owner`. No se alteraron las reglas para ampliar permisos.
- Ningún dato de módulos fue migrado o modificado.

## Cómo debe funcionar de aquí en adelante
1. Auth identifica al usuario existente.
2. `wedding-context.js` resuelve la boda activa y su membresía.
3. La UI consume un contexto simple: `id`, `name`, `date`, `role`, `ownerUid`.
4. Los módulos futuros nunca deben consultar o escribir Firebase directamente desde componentes visuales.
5. Cada módulo tendrá un adaptador explícito que respete la estructura existente y la boda activa.
6. Antes de habilitar escrituras de un módulo se auditan sus rutas reales y reglas actuales.

## Próximo hito
Construir las acciones funcionales de los botones de la carátula y luego reconstruir módulos uno por uno sobre esta base, sin cambiar la estructura de datos existente.

## 2026-09-22 — Selector de bodas y diagnóstico de fecha
- Se auditó nuevamente el módulo de bodas del aplicativo original.
- Se recuperó el acceso a “Mis bodas” desde la boda actual, listando únicamente índices y membresías existentes.
- Cambiar de boda valida primero la membresía y luego actualiza únicamente `users/{uid}.activeWeddingId` y `lastSeenAt`, igual que el contrato existente; no crea ni elimina datos.
- Se confirmó que la cuenta regresiva antigua mostraba `16.01.2027` en el HTML, pero el documento principal de una boda puede no tener `date` si esa boda fue creada antes de que ese campo existiera. La nueva app no inventa ni migra esa fecha silenciosamente.
- Nombre y fecha solo pueden escribirse en `weddings/{weddingId}` por el propietario porque las reglas actuales de Firestore reservan la actualización del documento raíz al owner.

## 2026-09-22 — Fecha de boda como dato persistente
- Se eliminó definitivamente `16.01.2027` / `2027-01-16` del HTML de la carátula.
- La cuenta regresiva ya no tiene ninguna fecha fija ni fallback codificado.
- Cada boda usa exclusivamente su propio campo `weddings/{weddingId}.date` como fuente de verdad.
- Si una boda todavía no tiene `date`, la interfaz muestra “Sin fecha”; el owner puede establecerla mediante “Editar” y el valor queda guardado en ese documento de boda.
- Cambiar de boda cambia inmediatamente la fecha y la cuenta regresiva porque ambas se obtienen del contexto Firebase de esa boda.
- No se creó una colección nueva ni un identificador paralelo para la fecha: el identificador estable es el `weddingId` y `date` es un atributo de esa boda. Esto evita duplicar fuentes de verdad.

## 2026-09-22 — Calendario propio para fecha de boda
- Se reemplazó el selector nativo `input[type=date]` por un calendario propio integrado al lenguaje visual de la carátula.
- Permite navegar mes a mes, seleccionar un día, visualizar la fecha elegida y guardar/cancelar explícitamente.
- El cambio es exclusivamente de interfaz: al guardar continúa usando el mismo campo canónico `weddings/{weddingId}.date` y el mismo control owner-only de Firestore.
- No se modificaron reglas, Storage ni otros datos de la boda.

## 2026-09-22 — Cierre y auditoría de seguridad del Inicio
- Se auditó la carátula, autenticación, contexto de boda, selector de bodas, edición de nombre/fecha y calendario antes de cerrar el hito.
- Se corrigió un vector de XSS en “Mis bodas”: el nombre de boda proveniente de Firestore ya no se inserta sin escapar dentro de HTML dinámico.
- Se verificó que nombre y fecha siguen protegidos por rol owner tanto en UI/adaptador como por las reglas Firestore existentes.
- La configuración web de Firebase permanece en cliente; no se trata como secreto. La seguridad depende de Authentication + Firestore Rules.
- No se detectaron escrituras de módulos, Storage, localStorage/sessionStorage/IndexedDB, migraciones, borrados ni creación automática de bodas en el Inicio.
- Queda como endurecimiento de despliegue recomendado definir CSP/headers de seguridad cuando la aplicación deje de depender de GitHub Pages o disponga de una capa que permita encabezados HTTP controlados.
- Se cierra el hito “Intro / Inicio” sobre el commit de auditoría correspondiente.


## 2026-09-22 — Barra canónica de módulos
- Se implementó una única barra responsive para todos los módulos: horizontal en escritorio y vertical en celular.
- La barra define accesos preparados para Checklist, Presupuesto, Proveedores, Invitados, Distribución, Cronograma, Invitaciones, Música, Documentos y Configuración sin duplicar navegación desktop/mobile.
- El primer acceso funcional es Checklist: el botón “Checklist de boda” de la carátula abre el workspace y marca Checklist como módulo activo.
- El botón “Mi Gran Día” de la barra vuelve al Inicio.
- Los demás accesos quedan estructurados para conectar sus módulos posteriormente, pero todavía no ejecutan navegación ni escrituras.
- La barra reutiliza el contexto de boda ya cargado; no agrega lecturas/escrituras de Firebase, Storage ni datos de módulos.

## 2026-09-23 — Presupuesto conectado y auditado
- Presupuesto se integró a la boda activa usando exclusivamente `services/planner-cloud.js`; el módulo no importa SDK de Firebase ni escribe directamente en Firestore.
- La clave existente `planificador_bodas_presupuesto_v5_etiquetas` se conserva sin renombrar, migrar ni crear almacenamiento paralelo.
- Se habilitaron edición de moneda e invitados, categorías, gastos, etiquetas y paquetes integrales respetando `weddingCapabilities(context.role).canEdit`.
- Los paquetes reutilizan `item.packageId`; no se creó una segunda relación ni colección.
- Se incorporó biblioteca visual de iconos para categorías manteniendo el mismo campo `icon`.
- Se auditó XSS/HTML dinámico: valores provenientes del estado se escapan antes de insertarse en HTML; además se sanea el color de etiquetas antes de usarlo en estilos inline.
- Se endureció la exportación CSV contra formula injection al abrir archivos en hojas de cálculo.
- Se corrigió una regla responsive contradictoria del selector de etiquetas.
- No se modificaron Firebase, Firestore Rules, Storage, Authentication, usuarios, IDs ni contratos de sincronización.
- Riesgo pendiente no resuelto en esta tarea: `planner-cloud.js` realiza read-modify-write del backup agregado; escrituras simultáneas de distintas sesiones o módulos pueden producir pérdida de actualización. No se modifica sin autorización explícita porque pertenece a persistencia.
- Las carpetas de tests siguen sin pruebas ejecutables para Presupuesto; antes de declarar el módulo completamente cerrado deben añadirse invariantes/no-pérdida y validación responsive en 360, 390–430, 768, 1024 y 1440 px.



## 2026-09-24 — Distribución Fase 3: persistencia mínima del plano
- Se cerró la edición real de posición y rotación de mesas sobre un estado geométrico separado de Invitados/Mesas.
- Distribución persiste únicamente propuestas y placements: `tableId + x + y + rotation`. No persiste copias de mesas, capacidad, sillas, invitados, `guestIds`, `sharedTableId` ni asignaciones.
- La clave de compatibilidad del backup agregado es `planificador_bodas_distribucion_v1`, almacenada exclusivamente mediante `services/planner-cloud.js`; el módulo no importa Firestore ni usa localStorage/sessionStorage/IndexedDB directamente.
- El contrato inicial es `version: 1`, `activeProposalId` y `proposals[]`; la primera propuesta canónica usa `proposal_main`.
- Abrir Distribución no escribe datos. Si no existe placement guardado, las mesas reciben una proyección inicial solo en memoria; la escritura ocurre únicamente al pulsar “Guardar distribución”.
- Los formatos persistidos desconocidos fallan cerrados y no intentan reparar, migrar ni reconstruir mesas.
- Un placement cuyo `tableId` ya no exista en las mesas canónicas no recrea esa mesa ni altera Invitados; simplemente no se renderiza ni se vuelve a serializar.
- La rotación es propiedad de Distribución: mesa y sillas rotan juntas; las etiquetas de invitados contrarrotan visualmente para permanecer horizontales.
- Se respeta `weddingCapabilities(context.role).canEdit`: usuarios sin edición pueden leer el plano pero no mover, rotar ni guardar.
- Auditoría estática posterior: 0 `!important`, 0 escrituras Firestore directas, 0 localStorage/sessionStorage/IndexedDB directos y 0 asignaciones a `guest.tableId`, `guest.seatId`, `guest.seatNumber`, `table.id` o `seat.id`.
- No se modificó el repositorio Wedding, reglas de Firestore, Storage, Authentication, usuarios ni contratos de Invitados/Mesas.
