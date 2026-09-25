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


---

# Fase 2 — Normalización y categorización

## Alcance y decisión arquitectónica

Esta fase transforma el inventario de Fase 1 en un **modelo canónico conceptual**. No modifica todavía `PHYSICAL_ELEMENT_TYPES`, HTML, persistencia, Firebase ni datos existentes.

La normalización separa tres niveles que no deben confundirse:

1. **type persistido/compatible**: identificador que el estado actual reconoce.
2. **nombre canónico**: concepto funcional que queremos representar.
3. **nombre mostrado**: etiqueta legible; puede cambiar sin renombrar datos.

### Hallazgo de compatibilidad del parser V1

La implementación vigente valida `proposal.elements[].type` contra `PHYSICAL_ELEMENT_TYPES`. Un type desconocido invalida la distribución completa. El serializer vuelve a guardar el `type` literalmente.

Consecuencia: **los types actualmente aceptados no deben renombrarse en datos existentes**. Los aliases históricos se resolverán posteriormente en la única fuente de catálogo/adaptación, nunca mediante migración silenciosa.

No se encontraron fixtures o snapshots versionados en el repositorio que permitan afirmar qué types están presentes en datos reales de bodas. Por ello, “persistencia existente” en esta fase significa **soporte actual del parser/serializer**, no evidencia de presencia en datos vivos.

## Categorías canónicas propuestas

Se adoptan ocho categorías, suficientes para la UI futura sin crear una taxonomía excesiva:

1. **Mesas y mobiliario**
2. **Comida y atención**
3. **Celebración y experiencias**
4. **Decoración**
5. **Infraestructura / recinto**
6. **Vegetación**
7. **Seguridad / circulación**
8. **Áreas dibujables**

Las mesas canónicas de invitados y sus sillas quedan fuera de estas categorías porque pertenecen al dominio Mesas.

## Contrato conceptual de capacidades

Para objetos visuales ordinarios, salvo indicación expresa:

- mover: sí;
- resize / editableSize: sí;
- rotar: sí;
- copiar: sí;
- eliminar: sí;
- polígono: no;
- assignable: no;
- guestRelated: no;
- specialBehavior: no.

Las dimensiones indicadas son **dimensiones físicas iniciales en metros**, no restricciones rígidas. Cada instancia puede tener medidas diferentes mediante `width/height`.

Para áreas dibujables:

- mover: sí;
- resize: sí;
- rotar: sí;
- copiar: sí;
- eliminar: sí;
- polígono: sí;
- assignable: no;
- guestRelated: no;
- specialBehavior: sí: motor único de dibujo/edición de áreas.

## Tabla maestra normalizada — objetos visuales ordinarios

| type actual / histórico | type canónico | nombre actual/histórico | nombre canónico / mostrado | categoría | aliases | dimensiones iniciales | forma | resize | rotate | copy | delete | comportamiento especial | persistencia existente | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `dance` | `dance` | Pista de baile | Pista de baile | Celebración y experiencias | — | 5.00 × 5.00 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `couple` | `couple` | Mesa de novios | Mesa de novios | Mesas y mobiliario | — | 3.00 × 1.20 m | rectangular | sí | sí | sí | sí | no; no es mesa canónica | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `bar` | `bar` | Barra | Barra | Comida y atención | — | 4.00 × 1.20 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `dj` | `dj` | DJ / sonido | DJ / sonido | Celebración y experiencias | — | 3.00 × 2.00 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `stage` | `stage` | Escenario | Escenario | Infraestructura / recinto | — | 4.00 × 2.50 m | rectangular | sí | sí | sí | sí | no como objeto físico | V1 actual | CONSERVAR |
| `screen` | `screen` | Pantalla / proyector; Pantalla | Pantalla / proyector | Celebración y experiencias | — | 2.50 × 0.50 m | rectangular | sí | sí | sí | sí | no | V1 actual | NORMALIZAR |
| `photo` | `photo` | Photobooth; Zona de fotos | Photobooth / zona de fotos | Celebración y experiencias | Photobooth, Zona de fotos | 3.00 × 2.00 m | rectangular | sí | sí | sí | sí | no | V1 actual | NORMALIZAR |
| `booth360` | `booth360` | Cabina 360; Cabina 360° | Cabina 360° | Celebración y experiencias | — | 2.50 × 2.50 m | circular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `mirror` | `mirror` | Espejo selfie | Espejo selfie | Celebración y experiencias | — | 1.00 × 0.20 m | rectangular | sí | sí | sí | sí | no | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `altar` | `altar` | Altar | Altar | Decoración | — | 4.00 × 2.00 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `arch` | `arch` | Arco decorativo | Arco decorativo | Decoración | — | 2.40 × 0.80 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `backdrop` | `backdrop` | Panel floral / backdrop | Panel floral / backdrop | Decoración | Panel floral | 2.50 × 0.60 m | rectangular | sí | sí | sí | sí | no | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `sign` | `sign` | Tótem / letrero | Tótem / letrero | Decoración | Tótem, Letrero | 0.80 × 0.50 m | rectangular | sí | sí | sí | sí | no | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `divider` | `divider` | Separador / biombo | Separador / biombo | Decoración | Biombo | 2.00 × 0.40 m | rectangular | sí | sí | sí | sí | no | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `plantSmall` | `plantSmall` | Planta pequeña | Planta pequeña | Vegetación | — | 0.50 × 0.50 m | sprite/obstáculo | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `plant` | `plant` | Planta mediana | Planta mediana | Vegetación | — | 0.80 × 0.80 m | sprite/obstáculo | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `tree` | `tree` | Árbol / macetero grande | Árbol / macetero grande | Vegetación | — | 1.20 × 1.20 m | sprite/obstáculo | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `planter` | `planter` | Macetero / decoración; Jardinera | Jardinera / macetero | Vegetación | Macetero, Jardinera | **1.50 × 0.60 m** para nuevos objetos; histórica 0.60 × 0.60 m | sprite/obstáculo | sí | sí | sí | sí | no | V1 actual; semántica histórica conflictiva | NORMALIZAR |
| `buffet` | `buffet` | Buffet | Buffet | Comida y atención | — | 3.00 × 0.90 m | rectangular | sí | sí | sí | sí | no como objeto físico | V1 actual | CONSERVAR |
| `drinks` | `drinks` | Estación de bebidas; Bebidas | Estación de bebidas | Comida y atención | Bebidas | 2.00 × 0.80 m | rectangular | sí | sí | sí | sí | no | V1 actual | NORMALIZAR |
| `desserts` | `desserts` | Estación de postres; Postres | Estación de postres | Comida y atención | Postres | 2.40 × 0.80 m | rectangular | sí | sí | sí | sí | no | V1 actual | NORMALIZAR |
| `cake` | `cake` | Mesa de torta; Torta | Mesa de torta | Mesas y mobiliario | Torta | Ø 1.80 m | circular | sí | sí | sí | sí | no; no es mesa canónica | V1 actual | NORMALIZAR |
| `gift` histórico / `gifts` actual | `gifts` | Mesa de regalos; Regalos | Mesa de regalos | Mesas y mobiliario | `gift`, Regalos | 1.80 × 0.75 m | rectangular | sí | sí | sí | sí | no; no es mesa canónica | `gifts` aceptado por V1; `gift` solo histórico | ALIAS |
| `guestbook` | `guestbook` | Mesa de firmas | Mesa de firmas | Mesas y mobiliario | — | 1.20 × 0.60 m | rectangular | sí | sí | sí | sí | no; no es mesa canónica | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `welcome` | `welcome` | Mesa de bienvenida; Bienvenida | Mesa de bienvenida | Mesas y mobiliario | Bienvenida | 1.80 × 0.75 m | rectangular | sí | sí | sí | sí | no; no es mesa canónica | V1 actual | NORMALIZAR |
| `favors` | `favors` | Mesa de recuerdos | Mesa de recuerdos | Mesas y mobiliario | — | 1.50 × 0.70 m | rectangular | sí | sí | sí | sí | no; no es mesa canónica | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `cocktail` | `cocktail` | Mesa alta / cóctel | Mesa alta / cóctel | Mesas y mobiliario | — | Ø 0.80 m | circular | sí | sí | sí | sí | no; no es mesa canónica | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `snacks` | `snacks` | Carrito de snacks | Carrito de snacks | Comida y atención | Carrito de dulces / snacks | 1.50 × 0.80 m | rectangular | sí | sí | sí | sí | no | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `supplier` | `supplier` | Mesa de proveedores | Mesa de proveedores | Mesas y mobiliario | — | 1.80 × 0.75 m | rectangular | sí | sí | sí | sí | no; no es mesa canónica | histórico/propuesta; no aceptado por V1 actual | NORMALIZAR |
| `entrance` | `entrance` | Entrada; Entrada / salida | Entrada / salida | Infraestructura / recinto | Entrada | 2.00 × 1.20 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `exit` | `exit` | Salida | Salida | Infraestructura / recinto | — | 2.00 × 1.20 m | rectangular | sí | sí | sí | sí | no | histórico/propuesta; no aceptado por V1 actual | VARIANTE |
| `restroom` | `restroom` | Baños | Baños | Infraestructura / recinto | — | 2.50 × 2.00 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `kitchen` | `kitchen` | Cocina / servicio; Cocina / apoyo | Cocina / servicio | Infraestructura / recinto | Cocina / apoyo | 3.00 × 2.50 m | rectangular | sí | sí | sí | sí | no | V1 actual | NORMALIZAR |
| `technical` | `technical` | Zona técnica | Zona técnica | Infraestructura / recinto | — | 2.00 × 1.50 m | rectangular | sí | sí | sí | sí | no como objeto rectangular | V1 actual | CONSERVAR |
| `column` | `column` | Columna | Columna | Infraestructura / recinto | — | 0.50 × 0.50 m | rectangular | sí | sí | sí | sí | no | V1 actual | CONSERVAR |
| `extinguisher` | `extinguisher` | Extintor / seguridad; Extintor | Extintor / seguridad | Seguridad / circulación | Extintor | **0.50 × 0.50 m** para nuevos objetos; histórica 0.40 × 0.40 m | rectangular | sí | sí | sí | sí | no | V1 actual | NORMALIZAR |
| `chair` | `chair` | Silla; Silla suelta | Silla suelta | Mesas y mobiliario | Silla visual | 0.50 × 0.50 m | rectangular | sí | sí | sí | sí | **sí: separación estricta del dominio Mesas** | histórico/propuesta; no aceptado por V1 actual | ESPECIAL |
| `canopy` | `canopy` | Toldo / cobertura | Cobertura rectangular / toldo modular | Infraestructura / recinto | Toldo rectangular | 6.00 × 6.00 m | rectangular/contenedor | sí | sí | sí | sí | **sí: contenedor espacial, pero no polígono** | V1 actual | VARIANTE |

### Decisión sobre `canopy`

`canopy` **debe convivir con el futuro Toldo poligonal**.

No es alias de `tent` porque:

- actualmente tiene identidad propia en el parser V1;
- es rectangular y usa `width/height`;
- su familia espacial es `container`;
- no guarda vértices ni semántica de área dibujada;
- puede representar una cobertura modular/cuadrada perfectamente válida aunque luego exista un Toldo libre.

Por compatibilidad, `canopy` conserva su type. Solo se normaliza su nombre mostrado a **Cobertura rectangular / toldo modular** para no prometer el comportamiento del futuro Toldo dibujable.

## Compatibilidad de áreas rectangulares actualmente persistibles

La reestructuración vigente tiene tres types que conceptualmente anticipan áreas, pero hoy funcionan como objetos rectangulares ordinarios:

| type vigente | concepto actual | decisión canónica | persistencia | estado |
|---|---|---|---|---|
| `circulation` | Circulación 4.00 × 1.20 m | compatibilidad rectangular del futuro Área de circulación | V1 actual | LEGADO |
| `restricted` | Zona restringida 3.00 × 3.00 m | compatibilidad rectangular de futura Área restringida | V1 actual | LEGADO |
| `zone` | Zona / área 4.00 × 3.00 m | compatibilidad rectangular de futura Área personalizada | V1 actual | LEGADO |

Estos types **no se eliminan ni renombran**. Cuando exista el motor poligonal, podrán mantenerse para leer/editar objetos existentes, mientras la UI nueva crea áreas mediante el motor canónico. No se convertirán silenciosamente ni se migrarán.

## Catálogo conceptual — Áreas dibujables

Las áreas dibujables constituyen una categoría separada y un único comportamiento común. Conceptualmente, el futuro motor debería distinguir:

- `type: 'area'` como entidad geométrica común;
- `areaKind` como variante semántica.

Esto se propone porque la referencia histórica ya necesitaba un discriminador equivalente (`areaKind`) para compartir un mismo motor sin nueve implementaciones distintas.

**No se implementa ni persiste todavía este contrato.**

| type conceptual | areaKind | nombre canónico | referencia inicial | forma | resize | rotate | copy | delete | especial | estado |
|---|---|---|---|---|---|---|---|---|---|---|
| `area` | `tent` | Toldo | 5.00 × 4.00 m sugerido | polígono libre | sí | sí | sí | sí | vértices, lados, área, perímetro, color, transparencia | ÁREA DIBUJABLE |
| `area` | `stage` | Área de escenario | 4.00 × 2.50 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |
| `area` | `lounge` | Área lounge | 3.00 × 2.50 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |
| `area` | `kids` | Área infantil | 3.00 × 3.00 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |
| `area` | `buffet` | Área de buffet | 3.00 × 0.90 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |
| `area` | `technical` | Área técnica | 2.00 × 1.50 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |
| `area` | `restricted` | Área restringida | 2.00 × 2.00 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |
| `area` | `circulation` | Área de circulación | 1.20 × 4.00 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |
| `area` | `custom` | Área personalizada | 2.00 × 2.00 m sugerido | polígono libre | sí | sí | sí | sí | motor de áreas | ÁREA DIBUJABLE |

Las medidas de áreas son referencias iniciales encontradas en la propuesta histórica. La geometría real vendrá de sus vértices; no deben persistirse como “área calculada” o “perímetro calculado”.

## Duplicidades detectadas

### 1. `gift` vs `gifts`

- **A:** `gift` histórico.
- **B:** `gifts` actual.
- Representan la misma Mesa de regalos y comparten 1.80 × 0.75 m.
- El parser actual solo reconoce `gifts`.
- **Normalización:** `gifts` es type canónico; `gift` queda como alias histórico para una futura adaptación/importación.
- **Riesgo:** renombrar objetos persistidos `gifts` a `gift` rompería el parser vigente.

### 2. `photo`: Photobooth vs Zona de fotos

- Mismo type y mismas dimensiones.
- La diferencia es de microcopy, no de comportamiento.
- **Normalización:** conservar `photo`; nombre mostrado “Photobooth / zona de fotos”.
- No requiere alias de persistencia.

### 3. `planter`: Macetero histórico vs Jardinera actual

- Comparten type pero no dimensiones ni presentación histórica.
- El actual usa 1.50 × 0.60 m; el histórico 0.60 × 0.60 m.
- Como `width/height` se persisten por instancia, la dimensión concreta no depende obligatoriamente del default.
- **Normalización:** conservar `planter`; nombre “Jardinera / macetero”; default nuevo actual 1.50 × 0.60 m.
- Los tamaños históricos siguen representables sin cambiar type.
- **Riesgo:** crear otro `planter` paralelo produciría dos fuentes semánticas.

### 4. Entrada / salida

- La propuesta histórica separaba `entrance` y `exit`.
- La reestructuración actual usa `entrance` con nombre “Entrada / salida”.
- Son físicamente similares pero semánticamente distintos cuando se necesita marcar evacuación o flujo.
- **Normalización:** conservar `entrance` exactamente por compatibilidad y admitir `exit` posteriormente como **variante real**, no como alias.
- No reinterpretar objetos `entrance` existentes como solo “Entrada”.

### 5. `canopy` vs Toldo poligonal

- Comparten palabra “Toldo”, pero no contrato.
- `canopy`: rectángulo/contenedor con width/height; V1 actual.
- Toldo dibujado: polígono libre con vértices y métricas derivadas.
- **Normalización:** convivencia.
- `canopy` → Cobertura rectangular / toldo modular.
- futuro `area + areaKind=tent` → Toldo dibujable.
- **Riesgo:** fusionarlos eliminaría información geométrica o forzaría comportamiento especial sobre objetos actuales.

### 6. `stage` vs Área de escenario

- `stage` es un objeto físico rectangular.
- Área de escenario es una delimitación espacial dibujada.
- Son **variantes reales**, no aliases.
- Pueden coexistir en el mismo plano.

### 7. `buffet` vs Área de buffet

- `buffet` representa mobiliario/estación física.
- Área de buffet representa superficie reservada.
- Son variantes reales.

### 8. `technical` vs Área técnica

- `technical` actual es un elemento rectangular concreto.
- Área técnica delimita una superficie.
- Son variantes reales.

### 9. `circulation`, `restricted`, `zone` vs futuras áreas

- Los types actuales son rectángulos persistibles.
- Las futuras áreas serán polígonos.
- Los actuales quedan como **LEGADO compatible**, no se borran.
- La UI futura deberá evitar crear dos conceptos indistinguibles, pero la compatibilidad de lectura permanece.

## Decisiones de categorización

### Mesas y mobiliario

- Mesa de novios — `couple`
- Mesa de torta — `cake`
- Mesa de regalos — `gifts`
- Mesa de firmas — `guestbook`
- Mesa de bienvenida — `welcome`
- Mesa de recuerdos — `favors`
- Mesa alta / cóctel — `cocktail`
- Mesa de proveedores — `supplier`
- Silla suelta — `chair`

Ninguno de estos crea `tableId`, `seatId`, `seatNumber` ni recibe invitados.

### Comida y atención

- Barra — `bar`
- Buffet — `buffet`
- Estación de bebidas — `drinks`
- Estación de postres — `desserts`
- Carrito de snacks — `snacks`

### Celebración y experiencias

- Pista de baile — `dance`
- DJ / sonido — `dj`
- Pantalla / proyector — `screen`
- Photobooth / zona de fotos — `photo`
- Cabina 360° — `booth360`
- Espejo selfie — `mirror`

### Decoración

- Altar — `altar`
- Arco decorativo — `arch`
- Panel floral / backdrop — `backdrop`
- Tótem / letrero — `sign`
- Separador / biombo — `divider`

### Infraestructura / recinto

- Escenario — `stage`
- Cobertura rectangular / toldo modular — `canopy`
- Entrada / salida — `entrance`
- Salida — `exit` como variante histórica/real
- Baños — `restroom`
- Cocina / servicio — `kitchen`
- Zona técnica — `technical`
- Columna — `column`

### Vegetación

- Planta pequeña — `plantSmall`
- Planta mediana — `plant`
- Árbol / macetero grande — `tree`
- Jardinera / macetero — `planter`

### Seguridad / circulación

- Extintor / seguridad — `extinguisher`

Los actuales `circulation`, `restricted` y `zone` se mantienen por compatibilidad, pero conceptualmente se trasladan al bloque de Áreas dibujables como representaciones rectangulares legacy.

### Áreas dibujables

- Toldo
- Área de escenario
- Área lounge
- Área infantil
- Área de buffet
- Área técnica
- Área restringida
- Área de circulación
- Área personalizada

## Objetos especiales

### Toldo

Es **ÁREA DIBUJABLE**, no objeto rectangular ordinario. Su contrato posterior requiere:

- mínimo 3 vértices;
- edición de vértices;
- lados en metros;
- área derivada;
- perímetro derivado;
- resize;
- rotación;
- color;
- transparencia;
- Undo/Redo;
- autosave;
- persistencia de `points[]`.

No se implementa en esta fase.

### Áreas dibujables

Comparten un único motor futuro. Las diferencias entre Toldo/Lounge/Infantil/etc. son semántica, valores iniciales y estilo; no justifican motores separados.

### Silla suelta

Se **mantiene conceptualmente** porque sirve como mobiliario espacial independiente, por ejemplo ceremonia, espera o asiento auxiliar.

Reglas obligatorias:

- no tiene `seatId`;
- no recibe invitados;
- no tiene `tableId`;
- no participa en capacidad de mesas;
- no participa en asignación;
- no modifica Invitados/Mesas.

Por esta separación recibe estado **ESPECIAL**, aunque su geometría use el motor ordinario.

### Mesas canónicas

Permanecen fuera del catálogo genérico. Son propiedad de Mesas y Distribución solo consume identidad, dimensiones y asignaciones para representarlas.

### Pista de baile

No necesita motor especial actualmente. Es un rectángulo redimensionable con familia espacial reservada. Su gran dimensión no justifica una implementación propia.

### Escenario

El objeto `stage` ordinario no requiere motor especial. Debe distinguirse de **Área de escenario**, que sí usa el motor de áreas.

### Cobertura rectangular `canopy`

Es especial solo por su semántica de contenedor espacial. Geométricamente sigue siendo un objeto rectangular ordinario.

## Compatibilidad

### Types V1 que no deben renombrarse

`dance`, `bar`, `dj`, `stage`, `column`, `canopy`, `circulation`, `restricted`, `entrance`, `plant`, `plantSmall`, `tree`, `planter`, `buffet`, `drinks`, `desserts`, `cake`, `gifts`, `welcome`, `booth360`, `photo`, `screen`, `altar`, `arch`, `restroom`, `kitchen`, `technical`, `extinguisher`, `zone`.

Estos son los types reconocidos actualmente por el parser V1. Cambiarlos directamente podría hacer ilegibles estados existentes.

### Aliases históricos claros

- `gift` → `gifts`
- “Photobooth” / “Zona de fotos” → `photo`
- “Bebidas” / “Estación de bebidas” → `drinks`
- “Postres” / “Estación de postres” → `desserts`
- “Torta” / “Mesa de torta” → `cake`
- “Bienvenida” / “Mesa de bienvenida” → `welcome`
- “Cocina / apoyo” / “Cocina / servicio” → `kitchen`

Solo `gift` implica alias de **type**. Los demás son aliases de nombre mostrado.

### Types históricos que pueden incorporarse sin renombrar conceptos actuales

`couple`, `mirror`, `backdrop`, `sign`, `divider`, `guestbook`, `favors`, `cocktail`, `snacks`, `supplier`, `exit`, `chair`.

Su incorporación futura exige ampliar el catálogo/parser de forma controlada, pero no migrar objetos existentes.

### Compatibilidad legacy de áreas

`circulation`, `restricted` y `zone` deben seguir siendo legibles como objetos rectangulares aunque la UI futura priorice el motor poligonal.

El futuro Toldo no reutilizará ni sobrescribirá `canopy`.

## Propuesta de contrato canónico

Para objetos ordinarios, un objeto JavaScript simple es suficiente:

```js
{
  type: 'bar',
  label: 'Barra',
  category: 'food-service',
  aliases: [],
  dimensions: { widthM: 4, heightM: 1.2 },
  shape: 'rect',
  spatialFamily: 'obstacle',
  capabilities: {
    movable: true,
    resizable: true,
    rotatable: true,
    copyable: true,
    deletable: true
  },
  behavior: 'physical'
}
```

No se propone factory, registry anidado ni clases. La Fase 3 puede convertir el actual `PHYSICAL_ELEMENT_TYPES` en esta única fuente o reemplazarlo de manera controlada, migrando primero sus consumidores.

### Campos justificados

- `type`: ya es identidad funcional/persistida.
- `label`: evita hardcodear microcopy por interfaz.
- `category`: necesaria para agrupar el catálogo.
- `aliases`: compatibilidad/nombres históricos cuando existan.
- `dimensions`: defaults físicos actualmente ya existen.
- `shape`: necesario para geometría común.
- `spatialFamily`: ya existe en el motor de conflictos.
- `capabilities`: ya existe como contrato de edición.
- `behavior`: distingue objetos físicos ordinarios de futuras áreas sin condiciones dispersas.

No se añaden propiedades decorativas que no tengan consumidor funcional.

### Contrato conceptual de áreas

Las áreas necesitan únicamente una extensión mínima del concepto:

```js
{
  type: 'area',
  areaKind: 'tent',
  label: 'Toldo',
  category: 'drawn-areas',
  dimensions: { suggestedWidthM: 5, suggestedHeightM: 4 },
  shape: 'polygon',
  spatialFamily: 'container',
  capabilities: {
    movable: true,
    resizable: true,
    rotatable: true,
    copyable: true,
    deletable: true
  },
  behavior: 'draw-area'
}
```

`areaKind` está justificado porque la referencia histórica ya compartía un solo motor de áreas y necesitaba distinguir Toldo, Lounge, Infantil, Buffet, Técnica, Restringida, Circulación y Personalizada.

La definición de persistencia concreta de `area` queda para la fase específica de implementación y deberá preservar compatibilidad con V1. Esta fase no autoriza escribir este formato.

## Resultado cuantitativo de Fase 2

El modelo queda definido como:

- **38 objetos visuales ordinarios canónicos**.
- **9 variantes canónicas de áreas dibujables** bajo un único motor conceptual.
- **47 conceptos canónicos de catálogo en total**.
- **3 types rectangulares actuales de área** (`circulation`, `restricted`, `zone`) conservados como compatibilidad legacy, no como conceptos adicionales.
- mesas canónicas y sillas canónicas siguen fuera del catálogo visual.

## Respuestas al criterio de éxito

1. **¿Cuántos objetos canónicos?** 38 ordinarios + 9 áreas = 47 conceptos.
2. **¿Nombre de cada uno?** Definido en las tablas anteriores.
3. **¿type interno?** Definido para los 38 ordinarios; áreas usan conceptualmente `area + areaKind`.
4. **¿Aliases?** Identificados; `gift` es el único alias claro de type hacia `gifts`.
5. **¿Categorías?** Ocho categorías.
6. **¿Dimensiones?** Definidas desde fuentes históricas/actuales; son defaults físicos iniciales.
7. **¿Forma?** Definida como rectangular, circular, sprite/obstáculo o polígono.
8. **¿Capacidades?** Motor físico común para objetos ordinarios; motor de área común para polígonos.
9. **¿Motor especial?** Áreas dibujables; silla suelta requiere aislamiento semántico; canopy conserva semántica de contenedor.
10. **¿Qué pertenece a áreas?** Nueve `areaKind`.
11. **¿Qué no se mezcla con Invitados/Mesas?** Todos los objetos del catálogo; en especial mesas auxiliares y silla suelta.
12. **¿Qué types deben conservarse?** Todos los reconocidos por V1 listados en Compatibilidad.
13. **¿Duplicidades resueltas?** Sí: gift/gifts, photo, planter, entrada/salida, canopy/tent y objetos vs áreas homónimas.
14. **¿Contrato para Fase 3?** Objeto JS simple con identidad, categoría, defaults, forma, familia espacial, capacidades y comportamiento.

## Cierre de Fase 2

La Fase 2 termina aquí.

No se implementa todavía:

- catálogo único en código;
- nuevos botones;
- categorías visuales/acordeones;
- búsqueda o filtros;
- cambios en móvil;
- nuevos types en parser;
- motor poligonal;
- Toldo;
- vértices;
- migraciones;
- Firebase/Firestore;
- cambios de datos.


---

# Fase 3 — Contrato único implementado

## Archivo fuente de verdad

`src/modules/distribucion/distribution-catalog.js`

Única fuente ejecutable para los **38 objetos visuales ordinarios canónicos**. El mismo archivo mantiene un bloque separado de compatibilidad para `circulation`, `restricted` y `zone`; esos tres no se cuentan como objetos ordinarios nuevos.

## Contrato definitivo

Cada entrada ordinaria declara: `type`, `label`, `category`, `aliases`, `dimensions`, `shape`, `spatialFamily`, `capabilities`, `behavior`, `icon` y `visual`. Icono y visual se justifican porque ya tienen consumidores reales en la UI/renderer.

## Aliases

`resolveCatalogType()` centraliza aliases derivados de las propias entradas. El alias de type actualmente aprobado es `gift → gifts`. `getCatalogItem('gift')` obtiene la definición canónica, pero el parser conserva `element.type='gift'` al leer legacy; no migra datos. La creación nueva sí normaliza al type canónico.

## Dimensiones

Los defaults físicos están solo en el catálogo, en metros. `index.js` los convierte a píxeles con `PLAN_SCALE`. Parser y creación consumen la misma definición.

## Desktop y móvil

Los botones desktop conservan únicamente `data-distribution-add-element`; label, icono y dimensión se hidratan desde el catálogo. Móvil recorre esos mismos botones visibles y consulta el mismo `getCatalogItem()`. No existe catálogo móvil paralelo.

## Compatibilidad legacy

- `gifts` sigue canónico y `gift` es alias sin migración.
- `planter` sigue siendo `planter`, mostrado como Jardinera / macetero.
- `entrance` se conserva.
- `exit` queda registrado como variante real, sin botón nuevo todavía.
- `canopy` sigue siendo Cobertura rectangular / toldo modular.
- Se retira el botón “Dibujar toldo” que reutilizaba `canopy` como polígono; no se implementa el Toldo nuevo.
- `chair` queda como Silla suelta, behavior `detached-chair`, sin integración con Mesas/Invitados.
- `circulation`, `restricted` y `zone` siguen reconocidos como legacy V1.

## Estructuras eliminadas

Se retiran `physicalType()`, `PHYSICAL_ELEMENT_TYPES`, las capabilities físicas duplicadas en `index.js` y los labels/iconos/dimensiones manuales de los botones HTML. `SPATIAL_INTERACTIONS` permanece porque es motor de colisiones, no catálogo.

## Alcance

No se agregan objetos faltantes a la UI, no se rediseña el catálogo, no se implementan áreas nuevas/Toldo y no se modifica Firebase/Firestore ni la estructura V1.


---

# Fase 4 — Objetos ordinarios incorporados

## Clasificación previa

Antes de esta fase había **26 objetos ordinarios canónicos visibles** mediante `data-distribution-add-element`: `dance`, `bar`, `dj`, `stage`, `screen`, `canopy`, `column`, `entrance`, `plantSmall`, `plant`, `tree`, `planter`, `altar`, `arch`, `buffet`, `drinks`, `desserts`, `cake`, `gifts`, `welcome`, `booth360`, `photo`, `restroom`, `kitchen`, `technical` y `extinguisher`.

Además, `circulation`, `restricted` y `zone` ya tenían controles legacy existentes. Se conservan por compatibilidad y no se contabilizan entre los 38 ordinarios.

## Objetos incorporados

Se exponen mediante el mismo flujo genérico existente **11 objetos ordinarios** que ya estaban definidos en `distribution-catalog.js`:

- `couple` — Mesa de novios.
- `mirror` — Espejo selfie.
- `backdrop` — Panel floral / backdrop.
- `sign` — Tótem / letrero.
- `divider` — Separador / biombo.
- `guestbook` — Mesa de firmas.
- `favors` — Mesa de recuerdos.
- `cocktail` — Mesa alta / cóctel.
- `snacks` — Carrito de snacks.
- `supplier` — Mesa de proveedores.
- `exit` — Salida.

Los botones solo declaran `data-distribution-add-element="<type>"`. Label, icono, dimensiones, capabilities, shape y comportamiento continúan proviniendo del catálogo único. No se agregó lógica individual por type.

## Objeto ordinario no expuesto

`chair` permanece únicamente en el catálogo con `behavior: 'detached-chair'`. No se agrega como herramienta visible en esta fase para evitar confusión con las sillas canónicas de Mesas. Sigue sin `tableId`, `seatId`, invitados ni asignaciones.

Con ello quedan **37 de los 38 objetos ordinarios canónicos expuestos** y uno interno/especial (`chair`).

## Desktop y móvil

Desktop mantiene los grupos visuales existentes; no se crean acordeones, filtros ni buscador. Los nuevos botones se insertan en esos grupos sin repetir metadata.

Móvil continúa derivando su lista de los mismos `[data-distribution-add-element]` del template y obtiene cada definición mediante `getCatalogItem()`. No existe una segunda lista móvil.

## Legacy y áreas

`circulation`, `restricted` y `zone` se mantienen compatibles con sus controles existentes, sin convertirlos a `type:'area'` ni ampliar el motor de áreas. No se implementa Toldo poligonal ni ninguna de las nueve áreas dibujables futuras.

`canopy` continúa como Cobertura rectangular / toldo modular, 6 × 6 m y familia espacial `container`.

## Validación de contrato

La incorporación reutiliza las rutas genéricas existentes de creación, dimensiones desde catálogo, movimiento, resize, rotación, copy/delete, inspector, Undo/Redo, autosave, serialización V1 y propuestas. No se añadió persistencia ni comportamiento por objeto.

Se comprobó por inspección del contrato que los 11 nuevos types resuelven mediante `getCatalogItem()`, tienen dimensiones canónicas y capabilities físicas comunes. `couple` sigue siendo mobiliario espacial y no una mesa canónica; `exit` permanece separado de `entrance`; `cocktail` conserva forma circular.

No se modificaron Firebase, Firestore, Storage, Auth, reglas, IDs, claves ni estructura V1.


---

# Fase 5 — Presentación del catálogo

## Solución elegida

El catálogo ordinario deja de mantener 37 botones escritos en HTML y pasa a renderizarse desde `distribution-catalog.js`. El contrato sigue siendo la única fuente de `type`, label, icono, aliases, dimensiones y capacidades. La presentación añade únicamente un orden explícito de categorías y objetos para evitar depender del orden accidental del objeto JavaScript.

## Desktop

El panel conserva su ubicación lateral real de 210 px (180 px en el breakpoint intermedio). Se utiliza un grid compacto de dos columnas dentro de categorías colapsables; solo la primera inicia abierta. Los botones muestran icono y nombre corto, sin repetir dimensiones. Se añade una búsqueda pequeña por label y aliases porque 37 objetos ya hacen costoso recorrer visualmente siete grupos.

## Móvil

Se conserva el bottom sheet y la acción Añadir ya existentes. Al abrir Añadir, el contenido se genera desde los mismos grupos del catálogo y se presenta como categorías colapsables con grid táctil de dos columnas. Al elegir un objeto se reutiliza el mismo botón/flujo genérico de creación y el sheet se cierra para volver al lienzo. No se crea catálogo móvil paralelo ni se modifica la rueda existente.

## Categorías visibles

Se respetan las categorías ordinarias aprobadas que tienen objetos expuestos: Mesas y mobiliario (8), Comida y atención (5), Celebración y experiencias (6), Decoración (5), Infraestructura / recinto (8), Vegetación (4) y Seguridad / circulación (1). La octava categoría aprobada, Áreas dibujables, permanece fuera de este catálogo porque corresponde a la fase posterior y no contiene objetos ordinarios expuestos.

Total: **37/38 objetos ordinarios visibles**. `chair` continúa excluido. `circulation`, `restricted` y `zone` permanecen en sus controles legacy y no se absorben en el catálogo ordinario.

## Validación

Validación estática/lógica: los 37 types visibles se derivan de `getVisibleCatalogGroups()`; cada botón obtiene label/icono/type desde su definición canónica; la creación sigue usando `createElement()` y las dimensiones del catálogo. Se verificó que no existen botones ordinarios hardcodeados en el template, catálogo móvil manual, metadata física duplicada ni `!important` nuevo.

No se realizó validación interactiva real en navegador en esta sesión; la revisión visual se basó en la estructura HTML/CSS y breakpoints existentes. No se modificaron Firebase, Firestore, Storage, Auth, persistencia V1, canvas, geometría, propuestas ni el motor de áreas.


---

# Fase 6 — Toldo poligonal

## Contrato

El Toldo se incorpora como área dibujable moderna con `type: 'area'` y `areaKind: 'tent'`. No reutiliza ni modifica `canopy`. La geometría primaria es `points[]`, almacenada como vértices locales al bounding box del elemento; `x/y` ubican ese bounding box y `rotation` aplica la rotación del elemento sin reescribir los puntos. Ancho, alto, área, perímetro y medidas laterales se derivan de los puntos.

El formato global continúa siendo V1. Solo los elementos `type: 'area'` incluyen de forma opcional y compatible `areaKind`, `color` y `transparency`. No existe migración de elementos anteriores.

## Creación y finalización

“Dibujar Toldo” reutiliza el motor de dibujo poligonal ya existente. Cada clic/tap agrega un vértice. Se muestra preview de segmentos, vértices y línea temporal al puntero. El primer vértice se distingue visualmente.

Con un mínimo de tres vértices se puede finalizar de tres formas: clic/tap cerca del primer vértice, doble clic o Enter. Esc cancela y limpia preview/estado sin crear historial ni persistencia parcial. Se rechazan polígonos auto-intersectados, sin superficie válida o con segmentos prácticamente nulos.

## Geometría y medidas

Área: fórmula Shoelace sobre `points[]`, convertida con la escala vigente de 32 px/m. Perímetro: suma de las distancias de cada arista incluyendo último→primero. Las medidas laterales se calculan con la misma escala y se muestran solo cuando el Toldo está seleccionado.

Los handles de vértice permiten drag individual. Durante el gesto se actualizan puntos, bounding box, medidas, área, perímetro y colisiones en memoria; el commit lógico ocurre al soltar el puntero. El bounding box se renormaliza sin cambiar la posición mundial de la geometría restante.

Resize reutiliza el gesto genérico existente y escala todos los puntos desde el snapshot inicial del gesto. Rotación reutiliza `element.rotation`; los puntos permanecen en coordenadas locales, evitando almacenar una segunda geometría rotada.

## Estilo

El inspector muestra Toldo, ancho/alto derivados, Área, Perímetro, color y transparencia. Transparencia se limita a 0–90 %. Color y transparencia forman parte del elemento, no de la geometría. Móvil reutiliza los mismos campos mediante Ajustes.

## Persistencia, historial y propuestas

`points[]`, `areaKind`, color y transparencia viajan por la serialización V1 existente. Los puntos conservan cuatro decimales de píxel al serializar para no degradar la geometría por redondeo visual. Undo/Redo reutiliza `editorSnapshot()` y cubre creación, movimiento, edición de vértices, resize, rotación, estilo y eliminación. Autosave sigue ocurriendo al finalizar una acción lógica mediante `markDirty()`. Duplicado/copy/paste preservan puntos y estilo con nuevo ID. Las propuestas clonan los puntos y metadatos sin compartir referencias.

## Compatibilidad

`circulation`, `restricted` y `zone` continúan como tipos legacy y siguen usando el mismo motor de polígonos existente. `canopy` permanece como Cobertura rectangular / toldo modular 6 × 6 m. No se modifica Firebase, Firestore, Storage, Auth, claves, IDs ni esquema global.

## Limitaciones reales

El motor espacial vigente ya consume polígonos y se reutiliza sin reescritura. Su intersección polígono-polígono está basada en los ejes de las aristas (SAT), por lo que su comportamiento es más sólido con polígonos convexos; no se reescribió el motor global para casos cóncavos en esta fase. La selección continúa perteneciendo al nodo/bounding box existente del elemento; no se introdujo un segundo hit-test poligonal.

No se realizó validación interactiva real en navegador en esta sesión. Las validaciones de esta fase son estáticas y lógicas sobre contrato, serialización y fórmulas geométricas.


---

# Fase 7 — Motor común de áreas dibujables

## Presets modernos

La única fuente de valores permitidos es `DRAWABLE_AREA_PRESETS`, presentada mediante `DRAWABLE_AREA_ORDER`. Las nueve variantes modernas son: `tent`, `stage`, `lounge`, `children`, `buffet`, `technical`, `restricted`, `circulation` y `custom`.

Cada preset define únicamente semántica/presentación necesaria: `areaKind`, label, icono, color inicial, transparencia inicial, referencia dimensional y familia espacial. Todos persisten `type:'area'`; no se crean types modernos separados.

## Motor común

El motor de Fase 6 se generaliza para cualquier elemento `type:'area'`: dibujo, cierre, cancelación, preview, Shoelace, perímetro, medidas laterales, handles de vértice, resize, rotación, movimiento, historial, autosave, copy/paste, renderer e inspector. No existen motores ni listeners por preset.

El renderer resuelve label/capacidades mediante el preset de `areaKind`. Color y transparencia se toman del preset solo como valores iniciales y continúan siendo editables por instancia.

## Catálogo desktop y móvil

Desktop incorpora la octava categoría «Áreas dibujables» con las nueve variantes en orden explícito. La búsqueda existente filtra tanto objetos ordinarios como áreas y permite distinguir, por ejemplo, «Escenario» de «Área de escenario».

Móvil deriva la sección «Áreas dibujables» directamente de los mismos presets; no existe una lista móvil paralela.

## Legacy y modelo moderno

Se conserva lectura, render, edición y serialización de `circulation`, `restricted` y `zone` legacy. No se migran ni reinterpretan. Los controles para crear nuevos legacy se retiran de la UI porque las alternativas modernas `area/circulation`, `area/restricted` y `area/custom` cubren la creación nueva. El soporte legacy permanece en parser, catálogo y motor geométrico.

Un `areaKind` desconocido se rechaza de forma controlada por el parser al no existir en la fuente central; no se convierte silenciosamente a `custom`.

## Persistencia y compatibilidad

Se mantiene V1 y la geometría primaria sigue siendo `points[]`. `areaKind`, color y transparencia son metadata de las áreas modernas; área, perímetro, lados y bounding box continúan derivados.

`canopy` permanece como objeto ordinario rectangular «Cobertura rectangular / toldo modular» 6 × 6 m. El catálogo ordinario conserva 38 definiciones y 37 visibles; `chair` sigue sin exponerse.

No se modifica Firebase, Firestore, Storage, Auth, reglas, usuarios, IDs ni documentos.

## Limitaciones

Se mantiene documentada la limitación SAT para polígonos cóncavos y el hit-test existente. Esta fase no reescribe geometría, zoom/pan ni rueda radial.

No se realizó validación interactiva real en navegador en esta sesión; las comprobaciones son estáticas, contractuales y geométricas.


---

# Fase 8 — Auditoría final y regresión

## Estado final auditado

La auditoría de cierre confirma una única fuente ejecutable para el catálogo ordinario y una única fuente de presets para áreas modernas. El catálogo conserva 38 objetos registrados, 37 visibles y `chair` registrado pero oculto. Las áreas modernas son exactamente 9 (`tent`, `stage`, `lounge`, `children`, `buffet`, `technical`, `restricted`, `circulation`, `custom`) y comparten `type:'area'` + `areaKind`.

Desktop y móvil consumen las mismas fuentes. No hay botones ordinarios manuales, catálogo móvil paralelo ni botones UI para crear los types legacy.

## Validaciones de contrato

- 38 objetos ordinarios; 37 visibles; `chair` fuera del orden visible.
- 9 `areaKind` modernos únicos.
- 3 types legacy soportados: `circulation`, `restricted`, `zone`.
- 0 botones legacy de creación.
- types ordinarios únicos; `areaKind` únicos.
- único alias vigente: `gift -> gifts`, sin conflicto con types ordinarios.
- separación conservada: `stage != area/stage`, `buffet != area/buffet`, `technical != area/technical`, `canopy != area/tent`.
- `canopy` continúa rectangular, ordinario y 6 × 6 m.
- parser V1 conserva `points[]`, valida `areaKind` y rechaza variantes modernas desconocidas.
- serialización de `points[]` conserva precisión de cuatro decimales de píxel.
- área, perímetro y medidas laterales continúan derivados y no se persisten como fuente de verdad.
- copy/paste, duplicación de propuesta e historial clonan `points[]` y conservan metadata de área.

## Regresión geométrica

Con escala 32 px = 1 m:
- rectángulo 4 × 6 m: área 24 m² y perímetro 20 m;
- triángulo rectángulo 3-4-5: área 6 m² y perímetro 12 m;
- movimiento mantiene `points[]` locales sin deformación;
- resize 1.5 × 0.5 escala el área 24 m² a 18 m², consistente con el producto de escalas;
- rotación se conserva como metadata separada y no modifica `points[]`, área ni perímetro.

## Undo/Redo, autosave y propuestas

Los gestos de movimiento, resize, rotación y edición de vértice toman una sola instantánea al iniciar y no crean historial por cada `pointermove`. Si un gesto no produce cambio, la instantánea se retira. Creación, eliminación, dimensiones, color y transparencia utilizan el mismo historial.

El autosave continúa centralizado mediante el estado `dirty`; no se agregó botón Guardar ni persistencia por `pointermove`. Las propuestas mantienen placements y elementos aislados, clonan geometría al duplicarse y limpian el historial al cambiar de propuesta.

## Legacy y datos canónicos

`circulation`, `restricted` y `zone` legacy continúan resolviéndose por el catálogo legacy, parsean, renderizan y serializan sin migración. No pueden crearse desde la UI moderna.

Mesas e Invitados permanecen fuera del catálogo de objetos. Distribución conserva `tableId` y placements; consume sillas/asignaciones canónicas y no convierte `chair` en asiento de mesa.

El diff acumulado de Fases 1–7 solo afectó documentación, shell/cache y archivos del módulo Distribución; no modificó Firebase, Firestore, Storage, Auth, reglas, usuarios ni IDs.

## Residuos reales corregidos

La auditoría encontró dos residuos de la retirada de los botones legacy de dibujo:
1. `drawingLabel()` y el estado `drawingType='zone'` habían quedado sin consumidor real. Se eliminaron y el flujo moderno crea explícitamente `type:'area'`.
2. Las reglas CSS `.distribution-drawing-tools` habían quedado huérfanas después de retirar su HTML. Se eliminaron.

No se encontraron otras funciones locales sin consumidor en `index.js` mediante el barrido estático realizado. El módulo continúa con cero `!important`.

## Compatibilidad, UI y limitaciones

El buscador sigue operando sobre objetos ordinarios y presets modernos, por lo que términos homónimos mantienen resultados separados. Desktop conserva categorías, acordeones y scroll existentes. Móvil sigue derivando Añadir y Áreas desde las mismas fuentes y usa el mismo motor de creación; no se implementó rueda radial nueva, pinch-to-zoom ni paneo nuevo.

Limitaciones conocidas que permanecen:
1. SAT puede ser menos preciso para polígonos cóncavos.
2. El hit-test mantiene el comportamiento/bounding box existente.
3. No se realizó validación interactiva real de mouse/touch en navegador durante esta auditoría; las comprobaciones de cierre fueron estáticas, contractuales, lógicas y geométricas.

## Estado de cierre

Fases 1–8 cerradas para este bloque. Persistencia global V1 conservada. No se crearon archivos, presets, objetos, migraciones ni funcionalidades nuevas.
