# MGD-021 — Auditoría de permisos para borradores de invitación (solo DEV)

## Fuentes inspeccionadas
- `avaldiviezoch/Wedding/firebase/firestore.rules` (repositorio de producción, solo lectura).
- `avaldiviezoch/Wedding/tests/firestore/firestore.rules.test.mjs` (pruebas con emulador, solo lectura).
- DEV `src/services/invitation-drafts-firestore.js`, `invitation-draft-session.js` y `invitation-draft-contract.js`.

**Limitación:** los archivos del repositorio no acreditan las reglas actualmente desplegadas en Firebase. No se realizó consulta a Firebase Console, despliegue de Rules, emulador ni pruebas con datos reales.

## Hallazgo: bloqueo de diseño

La regla `match /users/{uid}/{document=**}` permite lectura/escritura al dueño de la cuenta. La ruta propuesta `users/{uid}/eventInvitationDrafts/{eventId}/drafts/{draftId}` no valida el vínculo entre `eventId` y una celebración autorizada. Un propietario de cuenta puede construir una ruta con cualquier ID de evento, aunque no necesariamente acceda a los datos de terceros: **no representa el permiso canónico del evento**, y no admite colaboración basada en membresía del evento.

Las reglas de `weddings/{weddingId}` sí incluyen funciones `hasActiveMembership(weddingId)` y `canEditPlanner(weddingId)`. No hay un `match /invitationDrafts` específico en ese árbol. Sin regla explícita, la colección nueva está bloqueada.

## Decisión propuesta (PENDIENTE de validación)

Para borradores operativos vinculados a un evento, usar como destino canónico por estudiar:
`weddings/{weddingId}/invitationDrafts/{draftId}`.

- Lectura: usuarios con membresía activa de ese evento.
- Creación, actualización y eliminación: roles owner/admin/editor.
- Provider, viewer, usuario ajeno, sesión anónima: sin escritura; ajeno y anónimo sin lectura.
- Validar `eventId/weddingId` y autoría/auditoría sin permitir cambios de propietario o evento en actualizaciones.
- Garantizar campos, tipos, límites y versionado; no reutilizar ni alterar la biblioteca personal de enlaces `users/{uid}/invitations`.
- Aclarar previamente si la futura expansión multievento reutilizará el documento canónico `weddings/{weddingId}` o una entidad nueva `events/{eventId}`. No escribir en rutas inventadas.
- Si se requiere borrador estrictamente personal (sin colaboración), definir contrato separado y política de referencia a evento autorizado.

**NO cambiar** la ruta efectiva del adaptador Firestore actual ni habilitarlo hasta decidir el modelo, modificar reglas con aprobación explícita y probarlo con emulador aislado.

## Matriz mínima de aceptación (emulador / fixture)

| Contexto | Leer | Crear/editar/eliminar |
|---|---|---|
| Owner, evento A | Permitir | Permitir |
| Admin, evento A | Permitir | Permitir |
| Editor, evento A | Permitir | Permitir |
| Provider o viewer, evento A | Permitir | Denegar |
| Miembro inactivo, evento A | Denegar | Denegar |
| Cuenta ajena a A | Denegar | Denegar |
| Sesión anónima | Denegar | Denegar |
| Miembro de A consultando B ajena | Denegar | Denegar |

### QA adicional obligatorio
1. Cuenta A, evento A: crear y recuperar borrador de prueba; cambio a evento B y vuelta A sin filtración.
2. Cambio de usuario con lectura pendiente: descartar resultado de la sesión anterior.
3. Edición simultánea en dos pestañas: revisión obsoleta rechazada, sin sobrescribir.
4. Reglas: bloqueo de cambios de eventId/ownerUid, tamaños excesivos, esquema inválido.
5. Confirmar que `invitations`, RSVP, cloudSync y sus reglas existentes continúan funcionando.
6. Probar en un proyecto Firebase de emulador `demo-*` antes de considerar un despliegue.

## Estado
**BLOQUEADO** para escrituras reales y autosave. Revisión documental completada; Security Rules productivas no verificadas en la consola, y ninguna regla o dato ha sido modificado.
