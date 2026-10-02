# Mi Lu Gran Día — Reestructuración

Estado: **FASE 0 — estructura y contratos**  
Repositorio de trabajo: `avaldiviezoch/invitaciones`

Esta carpeta es la nueva base limpia de Mi Lu Gran Día. En esta fase **no se migra código productivo, datos, Firebase, Firestore, Storage ni claves locales**.

## Objetivo

Reconstruir la aplicación de forma modular, mantenible y segura, evitando la acumulación histórica de HTML/CSS/JS, parches y duplicaciones.

## Principios

1. Una sola fuente de verdad por dominio.
2. UI, lógica de negocio y persistencia separadas.
3. Un módulo no accede directamente a la persistencia de otro módulo.
4. No se superpone una implementación nueva sobre una vieja.
5. Nada de parches permanentes ni `!important` como solución arquitectónica.
6. La persistencia existente se considera **intocable** hasta una fase de integración explícitamente autorizada.
7. Primero contratos, luego módulos, después adaptadores y finalmente integración.

## Módulos previstos

- dashboard
- checklist
- presupuesto
- proveedores
- confirmaciones
- invitados
- mesas
- distribucion
- cronograma
- invitaciones
- musica
- documentos
- configuracion

## Estructura

- `docs/`: reglas, arquitectura, diseño y contratos.
- `src/core/`: shell, router, estado global y utilidades.
- `src/services/`: adaptadores externos; inicialmente vacíos.
- `src/modules/`: un dominio por carpeta.
- `src/shared/`: componentes, estilos y utilidades reutilizables.
- `assets/`: recursos visuales propios de la nueva app.
- `tests/`: pruebas de contratos e invariantes.

Leer primero `AGENTS.md` y `docs/REGLAS_NO_NEGOCIABLES.md`.

## Diagnóstico RSVP ↔ Invitados

Si los indicadores de Confirmados y RSVP no coinciden, usar primero `diagnostico_rsvp_vs_invitados.html`.

La herramienta compara `guestId`, `responseId`, vínculos RSVP y estado canónico, y permite detectar inconsistencias como la ocurrida el 02/10/2026 con Jordan y Leila. El detalle del incidente, la causa histórica y la regla para evitar regresiones están documentados en `docs/HISTORIAL_AVANCES.md` y `docs/CONTRATOS_MODULOS.md`.

No corregir diferencias de conteo cambiando KPIs ni editando Firebase manualmente antes de ejecutar este diagnóstico.
