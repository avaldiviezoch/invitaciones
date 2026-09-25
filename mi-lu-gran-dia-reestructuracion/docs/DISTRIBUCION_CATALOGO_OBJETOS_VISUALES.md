# Distribución — Catálogo maestro de objetos visuales

## Alcance de la Fase 1

Este documento inventaría exclusivamente **objetos visuales/físicos independientes** que pueden colocarse en el plano de Distribución.

No define todavía la categorización definitiva de la interfaz ni modifica código de producción. Su propósito es fijar una lista maestra antes de incorporar objetos faltantes.

### Fuentes auditadas

1. `avaldiviezoch/Wedding` — implementación histórica y laboratorio de Distribución.
2. `avaldiviezoch/invitaciones/mi-gran-dia/distribucion-limpia/` — propuesta limpia derivada del laboratorio.
3. `avaldiviezoch/invitaciones/mi-lu-gran-dia-reestructuracion/src/modules/distribucion/` — implementación vigente.

## Regla de separación

Este catálogo **no convierte en objetos visuales** entidades que ya tienen otro dueño lógico.

Quedan fuera de este grupo:

- mesas canónicas de invitados: pertenecen a **Mesas**;
- sillas canónicas de mesa: pertenecen a **Mesas**;
- Toldo poligonal y demás áreas dibujables: se tratarán en una fase específica de **Áreas dibujables**;
- medidas, guías, fondos, grid, etiquetas y controles de cámara: son herramientas de Distribución, no objetos del catálogo.

La antigua “Silla suelta” se conserva en el inventario histórico para decisión posterior, pero si se incorpora deberá representar únicamente mobiliario independiente, nunca un `seatId` canónico.

## Estados usados

- **ACTUAL**: existe en la reestructuración vigente.
- **FALTA**: existe en la propuesta histórica y no está en la reestructuración.
- **EQUIVALENTE**: existe actualmente bajo un nombre/type diferente o simplificado.
- **REVISAR**: su semántica se cruza con otra función y necesita decisión antes de incorporarse.

## Inventario maestro — OBJETOS VISUALES

| # | Objeto visual | Type histórico/propuesta | Type vigente relacionado | Medida base histórica | Forma | Estado | Observación de Fase 1 |
|---:|---|---|---|---|---|---|---|
| 1 | Pista de baile | `dance` | `dance` | 5.00 × 5.00 m | rect | ACTUAL | Coincidencia directa. |
| 2 | Mesa de novios | `couple` | — | 3.00 × 1.20 m | rect | FALTA | Es mobiliario visual independiente; no debe crear una mesa canónica de invitados. |
| 3 | Barra | `bar` | `bar` | 4.00 × 1.20 m | rect | ACTUAL | Coincidencia directa. |
| 4 | DJ / sonido | `dj` | `dj` | 3.00 × 2.00 m | rect | ACTUAL | Coincidencia directa. |
| 5 | Escenario | `stage` | `stage` | 4.00 × 2.50 m | rect | ACTUAL | Coincidencia directa. |
| 6 | Pantalla / proyector | `screen` | `screen` | 2.50 × 0.50 m | rect | ACTUAL | Vigente como “Pantalla”. |
| 7 | Photobooth / zona de fotos | `photo` | `photo` | 3.00 × 2.00 m | rect | EQUIVALENTE | Vigente con etiqueta “Zona de fotos”. |
| 8 | Cabina 360° | `booth360` | `booth360` | 2.50 × 2.50 m | circle | ACTUAL | Coincidencia funcional. |
| 9 | Espejo selfie | `mirror` | — | 1.00 × 0.20 m | rect | FALTA | Objeto visual independiente. |
| 10 | Altar | `altar` | `altar` | 4.00 × 2.00 m | rect | ACTUAL | Coincidencia directa. |
| 11 | Arco decorativo | `arch` | `arch` | 2.40 × 0.80 m | rect | ACTUAL | Coincidencia directa. |
| 12 | Panel floral / backdrop | `backdrop` | — | 2.50 × 0.60 m | rect | FALTA | No confundir con imagen de fondo del plano. |
| 13 | Tótem / letrero | `sign` | — | 0.80 × 0.50 m | rect | FALTA | Elemento señalético/decorativo. |
| 14 | Macetero / decoración | `planter` | `planter` | 0.60 × 0.60 m | circle | EQUIVALENTE | El vigente `planter` mide 1.50 × 0.60 m y representa “Jardinera”; no es equivalencia dimensional exacta. |
| 15 | Separador / biombo | `divider` | — | 2.00 × 0.40 m | rect | FALTA | Elemento físico delimitador. |
| 16 | Planta pequeña | — | `plantSmall` | 0.50 × 0.50 m | visual/obstacle | ACTUAL | Incorporado por la reestructuración actual. |
| 17 | Planta mediana | — | `plant` | 0.80 × 0.80 m | visual/obstacle | ACTUAL | Incorporado por la reestructuración actual. |
| 18 | Árbol / macetero grande | — | `tree` | 1.20 × 1.20 m | visual/obstacle | ACTUAL | Incorporado por la reestructuración actual. |
| 19 | Jardinera | — | `planter` | 1.50 × 0.60 m | visual/obstacle | ACTUAL | El nombre actual colisiona semánticamente con el antiguo Macetero `planter`; requiere normalización en Fase 2. |
| 20 | Buffet | `buffet` | `buffet` | 3.00 × 0.90 m | rect | ACTUAL | Coincidencia directa. |
| 21 | Estación de bebidas | `drinks` | `drinks` | 2.00 × 0.80 m | rect | ACTUAL | Vigente con etiqueta abreviada “Bebidas”. |
| 22 | Estación de postres | `desserts` | `desserts` | 2.40 × 0.80 m | rect | ACTUAL | Vigente con etiqueta abreviada “Postres”. |
| 23 | Mesa de torta | `cake` | `cake` | 1.80 × 1.80 m | circle | EQUIVALENTE | Vigente como “Torta”; conviene recuperar semántica de mesa auxiliar, sin convertirla en mesa canónica. |
| 24 | Mesa de regalos | `gift` | `gifts` | 1.80 × 0.75 m | rect | EQUIVALENTE | Misma función con cambio de type singular→plural. No migrar IDs/datos en Fase 1. |
| 25 | Mesa de firmas | `guestbook` | — | 1.20 × 0.60 m | rect | FALTA | Objeto visual independiente. |
| 26 | Mesa de bienvenida | `welcome` | `welcome` | 1.80 × 0.75 m | rect | ACTUAL | Coincidencia funcional. |
| 27 | Mesa de recuerdos | `favors` | — | 1.50 × 0.70 m | rect | FALTA | Objeto visual independiente. |
| 28 | Mesa alta / cóctel | `cocktail` | — | Ø 0.80 m | circle | FALTA | Objeto visual; no administra invitados ni `seatId`. |
| 29 | Carrito de snacks | `snacks` | — | 1.50 × 0.80 m | rect | FALTA | Objeto visual de atención. |
| 30 | Mesa de proveedores | `supplier` | — | 1.80 × 0.75 m | rect | FALTA | Objeto visual independiente. |
| 31 | Entrada | `entrance` | `entrance` | 2.00 × 1.20 m | rect | EQUIVALENTE | La reestructuración combina “Entrada / salida” en un solo tipo; la propuesta las separaba. |
| 32 | Salida | `exit` | `entrance` | 2.00 × 1.20 m | rect | REVISAR | Falta type independiente; decidir en Fase 2 si entrada y salida son dos tipos o variantes de uno. |
| 33 | Baños | `restroom` | `restroom` | 2.50 × 2.00 m | rect | ACTUAL | Coincidencia directa. |
| 34 | Cocina / servicio | `kitchen` | `kitchen` | 3.00 × 2.50 m | rect | ACTUAL | Vigente como “Cocina / apoyo”. |
| 35 | Zona técnica | `technical` | `technical` | 2.00 × 1.50 m | rect | ACTUAL | Coincidencia funcional como objeto rectangular. |
| 36 | Columna | `column` | `column` | 0.50 × 0.50 m | rect | ACTUAL | Coincidencia directa. |
| 37 | Extintor / seguridad | `extinguisher` | `extinguisher` | 0.40 × 0.40 m | rect | EQUIVALENTE | Vigente con base 0.50 × 0.50 m; dimensión histórica distinta. |
| 38 | Silla suelta / mobiliario | `chair` | — | 0.50 × 0.50 m | rect | REVISAR | Solo podría existir como mobiliario visual independiente; jamás puede representar una silla canónica de mesa. |
| 39 | Toldo / cobertura rectangular | — | `canopy` | 6.00 × 6.00 m | rect/container | REVISAR | Es una simplificación actual. No sustituye al Toldo poligonal histórico; decisión pendiente al diseñar Áreas dibujables. |
| 40 | Circulación rectangular | — | `circulation` | 4.00 × 1.20 m | rect/area | REVISAR | Actualmente es objeto visual, pero semánticamente pertenece al futuro motor de áreas. |
| 41 | Zona restringida rectangular | — | `restricted` | 3.00 × 3.00 m | rect/area | REVISAR | Actualmente es objeto visual, pero semánticamente pertenece al futuro motor de áreas. |
| 42 | Zona / área genérica | — | `zone` | 4.00 × 3.00 m | rect/area | REVISAR | Debe evaluarse contra Área personalizada del motor de dibujo. |

## Conteo de Fase 1

- **42 entradas** inventariadas dentro del universo actual/histórico de objetos visuales.
- **20 ACTUAL**.
- **10 FALTA**.
- **6 EQUIVALENTE**.
- **6 REVISAR**.

Los conteos son de inventario de trabajo y pueden variar en Fase 2 al consolidar equivalencias y separar definitivamente las áreas dibujables.

## Objetos históricos faltantes que pasan a Fase 2

Estos son los candidatos claros a incorporación posterior, sin modificar todavía la UI:

1. Mesa de novios — `couple`
2. Espejo selfie — `mirror`
3. Panel floral / backdrop — `backdrop`
4. Tótem / letrero — `sign`
5. Separador / biombo — `divider`
6. Mesa de firmas — `guestbook`
7. Mesa de recuerdos — `favors`
8. Mesa alta / cóctel — `cocktail`
9. Carrito de snacks — `snacks`
10. Mesa de proveedores — `supplier`

`exit` y `chair` quedan expresamente como decisiones de normalización, no como altas automáticas.

## Conflictos de nomenclatura detectados

### `gift` vs `gifts`

La propuesta usa `gift`; la reestructuración usa `gifts`. No se renombra ningún dato existente en esta fase.

### `planter`

La propuesta usa `planter` para un macetero circular de 0.60 × 0.60 m.
La reestructuración usa el mismo type para una jardinera de 1.50 × 0.60 m.

No deben coexistir dos conceptos distintos con el mismo type. Fase 2 debe resolver el nombre canónico antes de agregar objetos.

### Entrada / salida

La propuesta tenía `entrance` y `exit` separados.
La reestructuración tiene un solo `entrance` etiquetado “Entrada / salida”.

Fase 2 decidirá si son tipos independientes o variantes visuales de un mismo contrato.

### Toldo

El actual `canopy` rectangular no se declara equivalente al antiguo `tent` poligonal.
El Toldo completo queda reservado para la fase específica de Áreas dibujables.

## Reglas para las siguientes fases

1. Este inventario es la lista de referencia; no agregar un botón nuevo sin que el objeto exista primero aquí.
2. La Fase 2 decidirá categorías y nombres canónicos.
3. No renombrar keys existentes ni migrar objetos guardados para hacer coincidir el catálogo.
4. Desktop y móvil deberán consumir una sola definición de catálogo.
5. Dimensiones del catálogo son valores iniciales; cada instancia seguirá siendo editable cuando el tipo lo permita.
6. Ningún objeto visual auxiliar puede crear/modificar `tableId`, `seatId`, `seatNumber` o invitados.
7. Áreas dibujables se diseñarán después sobre un motor único; no introducir polígonos especiales durante la incorporación de objetos ordinarios.
