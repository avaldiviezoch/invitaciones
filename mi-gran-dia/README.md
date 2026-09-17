# Mi Gran Día · DEV

Entorno de desarrollo de **Mi Gran Día**.

## Fuente de producción

La fuente estable continúa en `avaldiviezoch/Wedding/app_integral`.

Este entorno carga la aplicación estable y superpone una capa de desarrollo mantenida en `invitaciones/mi-gran-dia`.

## Qué se puede modificar libremente aquí

- HTML/composición de nuevos componentes DEV.
- CSS, colores, tipografías, tamaños, layout y responsive.
- Navegación y comportamiento de interfaz.
- Nuevos módulos y prototipos.
- Animaciones, iconos y presentación.

## Zona protegida

No modificar desde el entorno DEV sin aprobación expresa:

- Firebase / configuración Firebase.
- Firestore: colecciones, documentos, IDs y contratos.
- Firebase Storage y sus rutas.
- Auth y esquema de usuarios.
- localStorage, sessionStorage e IndexedDB usados por producción.
- Funciones existentes de guardado, recuperación o sincronización.

## Flujo

1. `Wedding/app_integral` = producción.
2. `invitaciones/mi-gran-dia` = desarrollo.
3. Los cambios se construyen y validan en DEV.
4. Solo cuando Antonio apruebe una versión se prepara su migración a Wedding.

## Archivos DEV

- `index.html`: cargador de la aplicación estable.
- `dev-ui.css`: capa visual editable.
- `dev-ui.js`: comportamiento de interfaz editable.

La separación permite desarrollar la estética y nuevas interfaces sin duplicar ni reescribir la capa de datos de producción.
