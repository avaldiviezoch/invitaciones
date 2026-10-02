# Contratos iniciales de módulos

Este documento define propietarios lógicos. No modifica almacenamiento existente.

## Confirmaciones
Dueño de respuestas RSVP, estado declarado y vinculación administrativa con invitados.
No crea mesas ni cambia asientos automáticamente.

## Invitados
Fuente lógica de personas y sus referencias de asignación.
`guestId` debe ser estable.
La asignación vigente de una persona se expresa en `guest.tableId + guest.seatId + guest.seatNumber`.
Editar datos personales o RSVP no debe modificar esos tres campos salvo una operación explícita de Mesas.

## Mesas
Fuente lógica de `tableId`, forma, capacidad, `seatId` y dimensiones físicas del tablero por mesa.
La dimensión física se guarda opcionalmente en `table.dimensions`; si no existe, los consumidores usan el estándar de la forma.
Mover o rotar una mesa no cambia su identidad.
`table.guestIds` es una representación derivada de las asignaciones de Invitados; no es una segunda fuente maestra y no debe editarse independientemente.

## Distribución
Dueño de posición, rotación y elementos físicos no-mesa del plano por propuesta.
Consume `table.dimensions` de Mesas para dibujar el tablero, sillas y clearance; no guarda una segunda medida de la mesa en el placement.
No crea una segunda identidad de mesa.

## Checklist
Dueño de tareas, estados, fechas y agrupaciones del checklist.

## Presupuesto
Dueño de partidas, planificado, cotizado, pagado, saldo, estado y categorías.

## Proveedores
Dueño de fichas y relaciones con servicios/propuestas; no duplica partidas presupuestales.

## Cronograma
Dueño de eventos, hora, duración, responsables y secuencia temporal.

## Música
Dueño del catálogo/selección musical y metadatos del módulo.

## Invitaciones
Gestión administrativa de invitaciones; las plantillas públicas se mantienen separadas del núcleo.

## Documentos
Gestión de referencias y metadatos documentales.

## Configuración
Preferencias de aplicación y boda que no pertenezcan a otro dominio.

## Dashboard
Solo compone indicadores derivados. No debe convertirse en una segunda base de datos.

## Ciclo de vida de módulos
Los módulos montados deben exponer una destrucción explícita cuando mantengan listeners, estado o DOM propio. Al cambiar de `weddingId`, cerrar sesión o cerrar el espacio de módulos, el shell debe ejecutar ese cleanup antes de permitir el montaje del siguiente contexto. Un módulo nunca puede reutilizar estado de una boda anterior.

## Regla transversal

Un indicador, gráfico o tarjeta de dashboard se deriva de los módulos; no guarda una copia maestra.

## Aislamiento por boda

Todo dato operativo o personal del módulo pertenece a una única boda y debe resolverse mediante el `weddingId` del contexto activo. La clave o nombre lógico de un dato puede repetirse entre bodas siempre que su persistencia esté aislada por el `weddingId`.

Un módulo no puede reutilizar entre bodas:
- estado JavaScript;
- listeners o subscriptions;
- cachés;
- DOM montado;
- resultados de operaciones asíncronas.

Al cambiar de `weddingId`, cerrar sesión o cambiar de contexto de usuario, el módulo debe ejecutar su cleanup y cargar exclusivamente el estado de la nueva boda.

La privacidad es por boda, no necesariamente por usuario: owner/admin/editor/etc. autorizados pueden compartir los datos de una misma boda.

Los catálogos o recursos globales son la única excepción y deben estar declarados explícitamente como globales.

Cada módulo que persista o mantenga estado específico de boda debe poder demostrar:
- lectura con el contexto de boda activo;
- escritura con el contexto de boda activo;
- cleanup de listeners/estado;
- aislamiento mediante prueba Boda A ↔ Boda B.

## Biblioteca personal de invitaciones

Las invitaciones guardadas por una cuenta pertenecen a su `uid`, no al catálogo global ni directamente a una boda. La ruta conceptual es `users/{uid}/invitations/{invitationId}`. Un usuario nuevo debe comenzar con su biblioteca vacía. Una boda podrá posteriormente referenciar/usar una invitación de la biblioteca, pero la biblioteca personal permanece aislada por cuenta.

Las invitaciones de desarrollo que anteriormente estaban hardcodeadas en el módulo no se consideran catálogo global: son datos heredables de la cuenta propietaria y deben migrarse una sola vez a su biblioteca personal antes de retirar definitivamente el fixture del código.

## Diagnóstico de consistencia RSVP ↔ Invitados

Existe una herramienta de diagnóstico en:

`diagnostico_rsvp_vs_invitados.html`

Debe usarse antes de modificar datos cuando aparezca cualquiera de estas señales:
- el KPI de Confirmados de Invitados no coincide con Personas confirmadas de RSVP;
- una respuesta RSVP aparece revisada y vinculada, pero la persona figura como pendiente;
- se sospecha que un vínculo RSVP se perdió o quedó desincronizado;
- hay dudas sobre qué `guestId` está asociado a cada `responseId`.

La herramienta compara, en solo lectura durante el diagnóstico:
- `guestId`;
- nombre canónico del invitado;
- `status` canónico;
- `responseId`;
- respuesta RSVP;
- `attendance`;
- `rsvpManagement.linkedGuestIds`.

También identifica:
- vinculados a una respuesta RSVP confirmada cuyo `guest.status` no es `confirmed`;
- confirmados canónicos sin vínculo a una respuesta RSVP confirmada;
- IDs vinculados que ya no existan en Invitados.

### Invariante obligatoria

Si un invitado está incluido en `rsvpManagement.linkedGuestIds` de una respuesta con `attendance = confirmed`, su estado canónico debe ser `guest.status = confirmed`.

La vinculación se mantiene por ID, no por nombre. Editar el nombre de un invitado no debe cambiar `guestId`, `rsvpResponseId`, estado RSVP, mesa ni silla.

Un invitado ya vinculado a RSVP no debe permitir que una edición ordinaria de nombre, relación, lado, restricción u otros datos personales sobrescriba su `status`. Antes de introducir cambios en Invitados o RSVP, validar que esta protección siga vigente.

### Reparación

El HTML de diagnóstico incluye una reparación controlada para discrepancias del tipo “RSVP confirmado + guest vinculado + status distinto de confirmed”. Esa acción debe:
- modificar únicamente `guest.status` a `confirmed`;
- preservar nombre, `guestId`, `responseId`, `linkedGuestIds`, mesa, silla y demás metadatos;
- ejecutarse solo después de revisar las filas discrepantes;
- volver a ejecutar el diagnóstico después de guardar.

No usar la reparación para ocultar una causa nueva. Si vuelve a aparecer una discrepancia después del 30/09/2026, primero investigar qué flujo escribió el estado antes de corregir los datos.
