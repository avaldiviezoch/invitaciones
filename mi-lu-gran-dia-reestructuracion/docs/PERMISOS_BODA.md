# Contrato de boda activa, roles y permisos

## Propósito
Toda funcionalidad privada de Mi Gran Día pertenece a una boda concreta. Ningún módulo puede decidir permisos por su cuenta ni escribir datos sin conocer primero el contexto de boda y el rol efectivo del usuario.

## Contexto canónico
La aplicación trabaja con un único contexto activo: `{ id, name, role }`. Los módulos consumen ese contexto; no inventan ni duplican `weddingId`, nombre o rol. Cambiar de boda deberá sustituir el contexto completo antes de cargar datos del nuevo espacio.

## Roles
- `owner` — Propietario: lectura, edición, administración del equipo y asignación de administradores.
- `admin` — Administrador: lectura, edición y administración del equipo; no puede crear otro administrador.
- `editor` — Editor: lectura y edición del planificador; no administra el equipo.
- `provider` — Proveedor: lectura, sin edición general ni administración del equipo.
- `viewer` — Solo lectura: consulta, sin edición ni administración del equipo.

Un rol desconocido se degrada a `viewer`. Nunca se eleva un permiso por ausencia de datos.

## Capacidades canónicas
La UI y los módulos deben consultar capacidades, no comparar roles de forma dispersa. La fuente local es `src/core/app/permissions.js`: `canRead`, `canEdit`, `canManageTeam`, `canAssignAdmin`.

## Regla obligatoria para módulos nuevos
Antes de implementar cualquier creación, edición, eliminación, sincronización o importación se debe definir: boda propietaria del dato, lectura requerida, escritura requerida y capacidad mínima. Todo dato de negocio debe quedar vinculado al `weddingId` activo mediante el contrato de persistencia existente. Ningún módulo puede usar el UID como sustituto del `weddingId`.

## Compartir boda
Compartir significa otorgar membresía sobre una boda, nunca compartir la cuenta. Solo Propietario y Administrador pueden iniciar gestión del equipo. Solo Propietario puede asignar Administrador. Aceptar, revocar o cambiar roles deberá usar exclusivamente el contrato existente cuando se autorice su integración; esta reestructuración no crea colecciones, campos, reglas ni rutas nuevas.

## Seguridad en dos capas
Ocultar o deshabilitar controles en UI es solo UX. La autorización real debe seguir respaldada por las reglas existentes de Firebase/Firestore cuando se integre persistencia. La UI nunca concede un permiso que el backend no conceda.

## Firebase y datos: congelados
Esta fase NO modifica Firebase, Firestore, Storage, Authentication, reglas, colecciones, documentos, campos, IDs, datos reales, localStorage, sessionStorage, IndexedDB ni backups. El nuevo Inicio solo implementa el contrato de contexto/permisos y queda preparado para recibir el contexto mediante el evento `migrandia:wedding-context`. La conexión al contexto real se hará únicamente mediante un adaptador explícito y auditado, sin alterar el esquema existente.

## Eventos
- `migrandia:wedding-context`: entrega el contexto activo a la UI.
- `migrandia:share-wedding-request`: solicitud de abrir la gestión de equipo; no escribe datos por sí misma.

## Fail closed
Sin contexto válido: `viewer`. Sin permiso explícito: no editar. Sin boda activa: no escribir. Si contexto y backend discrepan, prevalece el permiso más restrictivo hasta resolver la inconsistencia.

## Microcopy y visibilidad de roles

El rol sigue siendo parte obligatoria del contrato de autorización, pero no debe mostrarse como ruido permanente en el Inicio. Consultar `docs/MICROCOPY_SHELL.md`. Los permisos se aplican aunque la etiqueta del rol no sea visible.

## Edición del título y fecha en la fase de shell

El título visible de la boda es el encabezado principal del Inicio. La UI de edición de título y fecha debe poder abrirse para el usuario autenticado durante esta fase, sin depender de un contexto de boda aún no hidratado. La persistencia real seguirá bloqueada hasta integrar y validar el `weddingId` y rol reales mediante el adaptador correspondiente. No se deben crear permisos ficticios ni escrituras Firebase desde la UI.
