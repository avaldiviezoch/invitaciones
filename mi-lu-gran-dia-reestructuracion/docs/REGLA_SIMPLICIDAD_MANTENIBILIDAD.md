# Regla de simplicidad y mantenibilidad

## Objetivo
Mi Lu Gran Día debe seguir siendo fácil de entender, localizar, modificar y depurar mientras crece. Una funcionalidad debe tener un lugar claro y una sola implementación vigente.

## Regla principal
**No aumentar archivos, capas, listeners, documentos o abstracciones por costumbre. Solo se crea una pieza nueva cuando resuelve una responsabilidad que no puede vivir limpiamente en una pieza existente.**

## Antes de crear un archivo
1. Buscar dónde vive actualmente esa responsabilidad.
2. Extender ese archivo si sigue teniendo la misma responsabilidad.
3. Crear un archivo nuevo solo si existe una frontera funcional real.
4. No crear archivos `fix`, `patch`, `temp`, `new`, `v2`, `final` o equivalentes para corregir otro archivo.
5. Si una implementación reemplaza otra, retirar la anterior en el mismo cambio.

## Una sola ruta para cada función
- Una función de negocio tiene un único propietario.
- No duplicar lógica entre módulos.
- La UI no replica reglas de persistencia.
- Desktop y móvil comparten lógica; solo cambia la presentación responsive.
- Invitados, mesas, asientos, distribución y confirmaciones deben consumir identidades canónicas, nunca copias paralelas.
- Un error debe poder rastrearse desde la pantalla hasta una ruta de código clara, sin decidir entre varias implementaciones parecidas.

## Listeners y eventos
- No crear listeners globales si un listener local resuelve el caso.
- No registrar dos listeners para la misma acción.
- Todo listener debe estar cerca del componente o módulo que lo posee.
- Si un componente puede montarse más de una vez, debe existir cleanup explícito.
- No usar eventos personalizados como puente entre módulos cuando una llamada o estado compartido explícito sea suficiente.
- Antes de agregar un listener, buscar primero si la acción ya tiene uno.

## Archivos y módulos
- Mantener pocos archivos por módulo.
- No dividir un archivo solo para reducir su cantidad de líneas.
- Separar únicamente por responsabilidad: UI, dominio o adaptador cuando realmente corresponda.
- La lógica compartida se extrae solo cuando existen consumidores reales; no crear utilidades anticipadas.
- Las carpetas vacías no obligan a crear archivos.
- No crear documentación por cada cambio pequeño.

## Documentación
La documentación debe ser mínima y útil. Este documento y `AGENTS.md` contienen las reglas permanentes. `HISTORIAL_AVANCES.md` registra hitos; `ESTADO_PROYECTO.txt` resume el estado. No crear nuevos MD para explicar correcciones, bugs o decisiones pequeñas si pueden registrarse en esos archivos.

## Correcciones
Una corrección debe:
1. encontrar la causa raíz;
2. identificar la implementación propietaria;
3. corregirla allí;
4. eliminar código obsoleto relacionado;
5. comprobar que no quedó una segunda ruta;
6. validar los consumidores afectados.

Está prohibido solucionar un problema agregando una capa que simplemente tape el comportamiento anterior.

## Homogeneización visual general
Mientras no exista un sistema visual definitivo, las superficies generales de Mi Lu Gran Día deben conservar una apariencia coherente entre módulos.

- Cada módulo nuevo o modificado debe comparar sus superficies generales con los módulos ya consolidados y mantener la misma familia visual.
- La homogeneización aplica a elementos de ambiente general: tipografía de interfaz, escalas y jerarquías de texto, botones, banners y cabeceras, contenedores, tarjetas, formularios, campos, modales, barras de herramientas, filtros, espaciados, bordes, radios, sombras y comportamiento responsive.
- No se fijan aquí una fuente, tamaño, color o medida definitiva. Esos valores podrán cambiar cuando se defina formalmente el sistema visual de la aplicación.
- Hasta entonces, no introducir arbitrariamente una segunda escala tipográfica, otra familia de botones, otra estructura de modal o patrones generales distintos si ya existe un referente consolidado.
- Los elementos específicos de un módulo pueden tener una presentación propia cuando su función lo requiera, pero deben convivir con el lenguaje visual general y no redefinirlo.
- Una diferencia visual debe responder a una necesidad funcional o semántica, no a que el módulo haya sido desarrollado en otro momento.
- Cuando se cambie posteriormente la fuente, escala, botones, banners u otros patrones generales definitivos, deberán declararse de forma común para que los módulos los consuman sin mantener versiones visuales paralelas.
- Antes de cerrar un módulo, comparar al menos sus superficies generales de escritorio y móvil con el referente vigente y retirar reglas antiguas que compitan con la implementación homologada.

## Persistencia y vinculación
Firebase y los datos existentes son la fuente real. Los módulos se adaptan a sus contratos auditados. No crear almacenes paralelos para facilitar una pantalla. En especial, usuarios/membresías, invitados, mesas, asientos, distribución y confirmaciones deben mantener relaciones explícitas y estables.

## Barrido antes de cerrar un módulo
Antes de considerar terminado un módulo revisar:
- archivos innecesarios;
- código muerto;
- funciones duplicadas;
- listeners duplicados o huérfanos;
- CSS que pise otra implementación;
- `!important`;
- estado duplicado;
- escrituras o lecturas fuera del adaptador correspondiente;
- referencias a implementaciones reemplazadas;
- comportamiento responsive;
- vinculación con otros módulos.

## Criterio de mantenibilidad
Si para corregir una función futura hay que buscar entre varios archivos sin saber cuál manda, la arquitectura ya falló. La ubicación de la responsabilidad debe poder determinarse por el nombre del módulo y su contrato.
