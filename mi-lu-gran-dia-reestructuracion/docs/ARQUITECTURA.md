# Arquitectura objetivo

## Capas

```text
UI / Shell
   │
   ├── shared components
   │
   ▼
Modules
   │
   ├── domain
   ├── ui
   ├── state
   └── adapters (interfaces)
   │
   ▼
Services / Integration adapters
   │
   ▼
Persistencia existente (fase posterior)
```

## Estructura base

```text
mi-lu-gran-dia-reestructuracion/
├── AGENTS.md
├── README.md
├── docs/
├── assets/
├── src/
│   ├── core/
│   │   ├── app/
│   │   ├── router/
│   │   ├── state/
│   │   └── utils/
│   ├── services/
│   ├── shared/
│   │   ├── components/
│   │   ├── styles/
│   │   ├── icons/
│   │   └── utils/
│   └── modules/
│       ├── dashboard/
│       ├── checklist/
│       ├── presupuesto/
│       ├── proveedores/
│       ├── confirmaciones/
│       ├── invitados/
│       ├── mesas/
│       ├── distribucion/
│       ├── cronograma/
│       ├── invitaciones/
│       ├── musica/
│       ├── documentos/
│       └── configuracion/
└── tests/
```

## Estructura interna de un módulo

Cada módulo podrá evolucionar hacia:

```text
modulo/
├── README.md
├── index.js
├── ui/
├── domain/
├── state/
├── adapters/
└── styles/
```

No es obligatorio llenar todas las carpetas desde el primer día. Se crean cuando exista responsabilidad real.

## Core

`core` no contiene reglas específicas de bodas. Aloja:
- arranque;
- navegación;
- registro de módulos;
- eventos internos tipados/documentados;
- estado transversal mínimo;
- utilidades de plataforma.

## Services

En Fase 0 permanecen vacíos. En integración futura podrán contener adaptadores hacia Firebase/Firestore, pero los módulos no importarán SDKs directamente.

## Shared

Solo piezas verdaderamente reutilizables. No debe convertirse en un cajón de código sin dueño.

## Módulos

Cada módulo es dueño de su lógica y expone un contrato público pequeño.

## Distribución: archivos con propietario explícito

La carpeta `src/modules/distribucion/` mantiene pocos archivos. No se divide por tamaño; un archivo nuevo requiere una frontera funcional independiente.

- `index.html`: estructura y controles visibles del módulo. No contiene lógica de negocio ni persistencia.
- `distribucion.css`: presentación visual, estados de edición/presentación e impresión. No contiene reglas de dominio.
- `index.js`: orquestador del módulo. Monta la vista, coordina estado del editor, propuestas, historial, render de mesas/elementos, validación espacial e integración explícita con los contratos de Mesas/Invitados.
- `camera.js`: único propietario de cámara y navegación del plano: zoom, paneo, pinch, Encajar, conversión de coordenadas pantalla↔plano y enfoque de objetos. No conoce mesas, invitados, propuestas ni persistencia.

No se crearán archivos `helpers`, `utils`, `fix`, `patch`, `v2` o equivalentes para repartir código sin dueño. Una futura extracción solo procede si toda una responsabilidad puede trasladarse a un único propietario sin duplicarla ni repartir su lógica entre varios archivos.

## Migración

La migración será por módulo. No se copiará `app_integral` completo ni se moverán 140+ archivos a esta estructura.

Secuencia:
1. documentar módulo;
2. definir contrato;
3. reconstruir limpio;
4. probar con mock;
5. crear adaptador legacy;
6. validar no pérdida;
7. integrar.
