# Contratos iniciales de módulos

Este documento define propietarios lógicos. No modifica almacenamiento existente.

## Confirmaciones
Dueño de respuestas RSVP, estado declarado y vinculación administrativa con invitados.
No crea mesas ni cambia asientos automáticamente.

## Invitados
Fuente lógica de personas y sus referencias de asignación.
`guestId` debe ser estable.

## Mesas
Fuente lógica de `tableId`, forma, capacidad y `seatId`.
Mover o rotar una mesa no cambia su identidad.

## Distribución
Dueño de posición, rotación y elementos físicos del plano por propuesta.
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

## Regla transversal

Un indicador, gráfico o tarjeta de dashboard se deriva de los módulos; no guarda una copia maestra.
