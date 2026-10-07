# Firebase / Firestore — reglas y referencia operativa

Última revisión documental: 2026-10-07

## Objetivo

Este documento permite conocer rápidamente cómo está planteada la seguridad de Firebase/Firestore de Migrandia y evita asumir permisos durante desarrollo, QA o diagnóstico.

**No sustituye al archivo de reglas desplegado.** Antes de modificar o desplegar reglas siempre se debe revisar la fuente versionada y la configuración real de Firebase.

## Fuentes revisadas

### Reglas proporcionadas por Antonio — 2026-10-07

Antonio proporcionó un snapshot de reglas Firestore para usarlo como referencia durante MGD-008 y las pruebas de Auth/Firestore.

Este snapshot incluye lógica que no coincide completamente con la versión actualmente encontrada en el repositorio de producción.

### Reglas versionadas actualmente en producción

Repositorio:
`avaldiviezoch/Wedding`

Archivo:
`firebase/firestore.rules`

Blob SHA observado al documentar:
`8cdfd32625f6fe636aac7d15dc27075fd9fa354d`

IMPORTANTE:
el repositorio DEV `avaldiviezoch/invitaciones` no contiene actualmente un `firestore.rules` equivalente dentro de `mi-lu-gran-dia-reestructuracion`.

Por lo tanto, cualquier cambio real de reglas requiere revisión explícita y autorización previa. No se debe inferir que un documento de referencia está desplegado.

---

## Modelo de autenticación observado

Las reglas distinguen principalmente:

- usuario autenticado: `request.auth != null`;
- usuario anónimo de RSVP: proveedor Firebase `anonymous`;
- usuario autenticado por correo: se normaliza el correo a minúsculas mediante `authEmail()`.

La creación de una cuenta mediante Firebase Authentication **no está controlada por Firestore Rules**. Un error en `createUserWithEmailAndPassword()` debe diagnosticarse primero en Firebase Auth/configuración del cliente.

Las reglas de Firestore entran en juego cuando, después de autenticarse, la aplicación intenta leer o escribir documentos.

---

## Roles de boda / evento

Roles reconocidos para colaboración:

- `owner`
- `admin`
- `editor`
- `provider`
- `viewer`

Funciones principales:

- `owner`: control total del evento y miembros;
- `admin`: gestión de equipo con restricciones;
- `editor`: edición de datos del planner;
- `provider` / `viewer`: permisos más limitados.

`canEditPlanner(weddingId)` permite edición a:
`owner`, `admin` y `editor`.

`canManageTeam(weddingId)` permite gestión de equipo a:
`owner` y `admin`.

---

## /users/{uid}

Regla conceptual:

un usuario autenticado solo puede leer/escribir su propia rama:

`users/{uid}`

y sus subdocumentos.

Condición:
`request.auth.uid == uid`.

Esto protege datos personales por cuenta.

---

## /weddings/{weddingId}

### Crear

Un usuario autenticado puede crear un documento de boda/evento cuando:

`request.resource.data.ownerUid == request.auth.uid`.

### Leer

Solo miembros activos del evento.

### Actualizar / eliminar

Solo el `owner`.

---

## /weddings/{weddingId}/members/{memberUid}

Permite lectura a miembros activos del evento.

El alta inicial del owner usa un bootstrap controlado que exige:

- usuario autenticado;
- mismo UID;
- rol `owner`;
- estado `active`;
- `ownerUid` del evento igual al usuario autenticado.

También existe flujo de incorporación mediante invitación pendiente válida.

### Diferencia detectada entre el snapshot aportado y la versión productiva

El snapshot proporcionado por Antonio contiene lógica adicional para permitir que un usuario previamente retirado pueda volver a estado `active` si existe una invitación `pending` válida para su correo y el rol coincide.

Esta lógica debe compararse expresamente con producción antes de desplegar o modificar reglas.

---

## Planner legacy / persistencia

### cloudSync

Lectura:
miembro activo.

Escritura:
`owner`, `admin` o `editor`.

### cloudChunks

Mismo modelo que `cloudSync`.

Estas rutas siguen siendo relevantes durante la transición hacia persistencia por dominios.

---

## RSVP privado administrativo

### /weddings/{weddingId}/rsvpConfig/{configId}

Lectura:
miembro activo.

Crear/actualizar/eliminar:
`owner`, `admin` o `editor`.

### /weddings/{weddingId}/rsvpManagement/{managementId}

Mismo modelo.

Estos datos son administrativos y no deben exponerse al invitado público.

---

## Invitaciones de colaboradores

Ruta:

`/invitations/{inviteId}`

Para crear una invitación se exige, entre otros:

- usuario autenticado;
- `invitedBy == request.auth.uid`;
- correo en minúsculas;
- rol válido;
- estado `pending`;
- permisos para gestionar equipo;
- solo el owner puede otorgar rol `admin`.

Lectura:
destinatario del correo o usuario con capacidad de gestionar el equipo.

### Diferencia detectada

El snapshot proporcionado por Antonio contiene una lógica de actualización más completa para:

- aceptación por el destinatario preservando `weddingId`, correo y rol;
- reinvitación;
- cambio controlado de rol al reinvitar;
- impedir que un admin asigne rol admin.

Esta sección no coincide completamente con el archivo productivo versionado revisado.

---

## RSVP público

Ruta:

`/publicRsvp/{token}`

El documento de configuración puede leerse públicamente solo cuando está activo, o por miembros autenticados del evento correspondiente.

Crear/actualizar/eliminar configuración requiere capacidad de edición del planner.

### responses/{responseId}

Las respuestas nuevas públicas usan Firebase Anonymous Auth.

Para crear una respuesta:

- usuario anónimo autenticado;
- token RSVP activo;
- estructura validada;
- `ownerUid == request.auth.uid`;
- límites de longitud/cantidad;
- origen esperado.

Música puede crear primero un documento parcial con:
`source == 'music-widget'`.

RSVP y Música pueden compartir el mismo `responseId`.

Las respuestas no son legibles públicamente.

Lectura administrativa:
miembros activos del evento.

Eliminación:
usuarios con permiso de edición del planner.

---

## Validaciones RSVP relevantes

El snapshot proporcionado establece, entre otros:

- nombre máximo 120 caracteres;
- attendance: `confirmed`, `declined` o `tentative`;
- cantidad no superior a `maxGuests`;
- menú máximo 120;
- correo máximo 120;
- teléfono máximo 60;
- restricción máximo 160;
- notas máximo 700;
- `customData` con máximo 15 claves;
- `ownerUid` debe coincidir con el UID anónimo autenticado;
- música `mgdMusic` máximo 8000 caracteres.

---

## Regla operativa para desarrollo y QA

1. No modificar Firebase/Firestore Rules sin autorización explícita.
2. Antes de cualquier cambio, comparar:
   - reglas proporcionadas para análisis;
   - archivo versionado;
   - reglas realmente desplegadas en Firebase Console.
3. No usar un MD como fuente desplegable.
4. No cambiar reglas para “hacer pasar” una prueba.
5. Un error de Firebase Auth debe diagnosticarse primero como Auth; no asumir que Firestore Rules es la causa.
6. Si una operación autenticada falla después del login, revisar el código exacto, la ruta Firestore y el rol/contexto activo.
7. Toda modificación real de Rules debe tener prueba controlada y plan de rollback.

---

## Hallazgo pendiente — MGD-008

Durante la creación de una cuenta por correo en DEV se obtuvo el mensaje:

`No se pudo crear la cuenta.`

El cliente actualmente oculta códigos de Firebase Auth que no estén mapeados por `errorText()`.

Siguiente diagnóstico:
capturar el `error.code` real desde navegador/consola antes de cambiar Firebase, Firestore o Rules.

No se debe atribuir este fallo a las reglas Firestore sin evidencia.
