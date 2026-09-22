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
