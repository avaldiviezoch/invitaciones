# Regla de microcopy del shell

## Propósito
El shell debe mostrar información útil para orientarse y actuar, no mensajes técnicos ni estados obvios del sistema.

## No mostrar texto técnico de conexión
No agregar al UI textos como:
- “Sesión conectada”.
- “Conectado”.
- “Online”.
- indicadores decorativos tipo “● conectado”.
- “Sincronizado” cuando no sea necesario para una acción del usuario.

Los estados técnicos solo se muestran cuando cambian una decisión o requieren atención: cargando, guardando, error, sin conexión o conflicto.

## No mostrar roles como ruido permanente
No mostrar etiquetas como “Solo lectura”, “Editor”, “Administrador”, “Proveedor” o “Propietario” como decoración permanente en el Inicio. El permiso debe expresarse principalmente mediante las acciones disponibles o bloqueadas.

El rol puede mostrarse dentro de una pantalla específica de gestión de accesos/equipo cuando sea necesario para comprender o administrar permisos.

## Identidad de la boda
La identidad principal del espacio es el título de la boda, no el nombre de la cuenta autenticada ni su rol. El título pertenece al `weddingId` activo y debe ser visible para todos los miembros de esa boda independientemente de la cuenta con la que ingresen.

El título es texto libre: ejemplos como “Boda de Lucero y Antonio”, “Marco & Carlos” o “Nuestra boda” son válidos. No debe reconstruirse automáticamente a partir del nombre de Google después de que exista un título definido por el usuario.

## Cuenta vs. boda
La cuenta identifica a la persona autenticada. La boda identifica el espacio compartido. Nunca mezclar ambos conceptos en el microcopy o en el modelo de permisos.
