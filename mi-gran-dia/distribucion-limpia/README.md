# Distribución — reestructura completa en 8 archivos

Fecha: 2026-09-04.

Esta carpeta ya no es un prototipo mínimo. Consolida la herramienta funcional de Distribución en **ocho archivos**, tomando como referencia el módulo real de App Mi Lu y el laboratorio completo respaldado.

## Regla principal

**EL STORAGE NO SE TOCA.**

Queda prohibido en esta reestructura:
- Firebase / Firestore / Rules;
- IndexedDB real de App Mi Lu;
- localStorage o sessionStorage real;
- migraciones;
- sincronización real;
- modificación de backups o logout.

Todo el estado del laboratorio es temporal y vive en memoria.

## Auditoría realizada

Se revisó la arquitectura real de Mi Lu:
- `app_integral/applu.html`;
- `app_integral/css/modules/distribucion.css`;
- `app_integral/js/modules/distribucion/index.js`;
- `app_integral/js/modules/distribucion/background-persistence.js` solo para entender la frontera, **no para copiar persistencia**;
- `app_integral/js/modules/invitados/runtime-loader.js`;
- contratos de Mesas/Invitados/Distribución;
- `docs/DISTRIBUTION_PHASE1_AUDIT.md`;
- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md`.

Hallazgo principal: Distribución real está repartido entre legacy, CSS de módulo, adaptador y runtime. La reestructura elimina esa dispersión del laboratorio sin reducir la herramienta visual.

## Los 8 archivos

La carpeta replica desde ahora la organización objetivo de `app_integral`:

```text
mi-gran-dia/distribucion/
├── index.html
├── README.md
├── css/
│   └── modules/
│       └── distribucion.css
└── js/
    └── modules/
        └── distribucion/
            ├── index.js
            ├── engine.js
            ├── renderer.js
            ├── adapter.js
            └── export.js
```

Responsabilidades:
- `index.html`: shell aislado del laboratorio.
- `css/modules/distribucion.css`: presentación del módulo.
- `js/modules/distribucion/index.js`: controlador/editor y lifecycle.
- `engine.js`: estado, geometría, mesas, sillas, colisiones y validación.
- `renderer.js`: SVG, inspector y representación visual.
- `adapter.js`: única frontera futura con App Mi Lu; hoy memory-only.
- `export.js`: exportación/presentación sin persistencia.
- `README.md`: auditoría, invariantes y reglas de seguridad.

## Funciones recuperadas

Canvas 1448×1086, mobiliario completo, mesas, sillas, editor de asientos, drag, multiselección, rotación, teclado, bloqueo, capas, frente/fondo, alinear, copiar/pegar, duplicar, eliminar, historial 80, mediciones, toldos, propuestas en memoria, fondo en memoria, riesgos, presentación, JSON/PNG y controles mobile existentes.

## Contratos obligatorios

- **Cambiar 4/6/8/10/12/14/16 sillas no cambia el tamaño físico del tablero.**
- Zoom solo cambia la vista.
- Tabletop, chairs y clearance son geometrías distintas.
- Cambiar forma conserva el mismo `tableId`.
- Reducir capacidad nunca elimina ocupantes silenciosamente.
- Distribución no administra el maestro de invitados.
- La integración futura con App Mi Lu entra solo por el adapter.
