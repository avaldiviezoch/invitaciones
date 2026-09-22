# AGENTS.md — Mi Lu Gran Día / Reestructuración

## REGLA CERO

Esta carpeta nace separada de la aplicación actual. **Ninguna tarea visual, funcional o de refactor autoriza tocar datos reales ni persistencia.**

### Intocable salvo autorización explícita

- Firebase.
- Firestore.
- Firebase Storage / Storage.
- Base de datos de usuarios.
- colecciones, documentos, campos e IDs existentes.
- reglas de seguridad.
- autenticación.
- `localStorage`.
- `sessionStorage`.
- IndexedDB.
- backups.
- contratos de sincronización existentes.
- datos reales de invitados, mesas, presupuesto, checklist, cronograma, música o cualquier otro módulo.

No renombrar, borrar, migrar, sobrescribir, limpiar, reinicializar ni rehidratar datos por conveniencia técnica.

## Prohibido

- Parches acumulativos para ocultar errores.
- Crear una segunda implementación encima de la anterior.
- Usar `!important` para ganar guerras de especificidad.
- Agregar grandes bloques CSS/JS inline en HTML.
- Duplicar lógica para desktop y móvil si puede existir una sola implementación responsive.
- Introducir nuevos listeners globales sin contrato y cleanup.
- Hacer que una acción visual escriba datos como efecto secundario.
- Convertir un cambio UI en una refactorización de persistencia.
- Cambiar nombres de claves, IDs o contratos para “ordenar” el código.

## Regla de reemplazo

Cuando una implementación sea sustituida:
1. identificar la anterior;
2. identificar consumidores;
3. migrar consumidores;
4. retirar la anterior;
5. validar que no existan dobles listeners, CSS duplicado, flashes ni estados inconsistentes.

## Regla de diseño

Mismo propósito visual = mismo patrón visual.

La nueva app tendrá un sistema visual compartido; cada módulo puede tener personalidad, pero no convertirse en otra aplicación.

## Regla de arquitectura

- `src/core`: infraestructura de aplicación.
- `src/services`: adaptadores a servicios externos.
- `src/modules/<modulo>`: UI + dominio del módulo.
- `src/shared`: reutilizables sin reglas de negocio específicas.
- persistencia nunca se incrusta directamente en componentes visuales.

## Responsive mínimo

Verificar 360 px, 390–430 px, 768 px, 1024 px y 1440 px.

## Antes de integrar con la app actual

Debe existir:
- contrato del módulo;
- inventario de datos que consume;
- inventario de datos que escribe;
- adaptador propuesto;
- pruebas de no pérdida de datos;
- plan de rollback.

Hasta entonces, esta carpeta trabaja con datos mock o estado en memoria.

## Boda activa y permisos

Todo desarrollo debe cumplir `docs/PERMISOS_BODA.md`. Ningún módulo puede implementar escritura sin declarar su vínculo con la boda activa y la capacidad requerida.
