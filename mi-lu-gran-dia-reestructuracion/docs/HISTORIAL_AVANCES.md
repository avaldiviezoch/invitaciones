# Historial de avances — Mi Lu Gran Día

Este documento es la bitácora canónica de la reconstrucción. Debe actualizarse al cerrar cada hito importante. No sustituye contratos técnicos; enlaza decisiones, estado y motivos.

## Directiva principal

La aplicación nueva se adapta al Firebase existente. No se migran, renombran, limpian ni reinicializan usuarios, bodas, invitados, checklist, presupuesto, mesas, cronograma, música, confirmaciones ni otros datos existentes para facilitar el refactor.

## 2026-09-22 — Base de reconstrucción
- Se creó `mi-lu-gran-dia-reestructuracion/` con arquitectura core/services/shared/modules.
- Se congeló la regla de no tocar datos reales durante la reconstrucción visual.
- Se definieron roles owner/admin/editor/provider/viewer y capacidades centralizadas.
- Se definió que la cuenta autenticada y la boda activa son conceptos separados.
- Se definió microcopy limpio: sin “Sesión conectada” ni roles decorativos permanentes.
- Se reconstruyó la carátula con video, cuenta, boda activa, cuenta regresiva y accesos a módulos.
- Se hizo legible el HTML/CSS/JS; no se permiten parches con `!important`.

## 2026-09-22 — Conexión con Firebase existente
- Se reutiliza exactamente el proyecto Firebase `migrandia` y sus usuarios existentes.
- Se agregó `services/firebase-client.js` como inicialización única.
- Se agregó `services/wedding-context.js` como único adaptador de la boda activa.
- La boda activa se resuelve leyendo `users/{uid}.activeWeddingId`, el índice `users/{uid}/weddings/{weddingId}`, la membresía `weddings/{weddingId}/members/{uid}` y el documento `weddings/{weddingId}`.
- Si el índice activo no es válido, se busca una membresía válida en los índices existentes. Esta búsqueda NO borra ni repara documentos.
- No se auto-crean bodas, usuarios, membresías ni índices.
- El título y la fecha se leen del documento de la boda existente.
- La edición de título/fecha actualiza únicamente `name`, `date` y `updatedAt` del documento `weddings/{weddingId}`.
- Conforme a las reglas actuales de Firestore, esa edición queda disponible solo para `owner`. No se alteraron las reglas para ampliar permisos.
- Ningún dato de módulos fue migrado o modificado.

## Cómo debe funcionar de aquí en adelante
1. Auth identifica al usuario existente.
2. `wedding-context.js` resuelve la boda activa y su membresía.
3. La UI consume un contexto simple: `id`, `name`, `date`, `role`, `ownerUid`.
4. Los módulos futuros nunca deben consultar o escribir Firebase directamente desde componentes visuales.
5. Cada módulo tendrá un adaptador explícito que respete la estructura existente y la boda activa.
6. Antes de habilitar escrituras de un módulo se auditan sus rutas reales y reglas actuales.

## Próximo hito
Construir las acciones funcionales de los botones de la carátula y luego reconstruir módulos uno por uno sobre esta base, sin cambiar la estructura de datos existente.

## 2026-09-22 — Selector de bodas y diagnóstico de fecha
- Se auditó nuevamente el módulo de bodas del aplicativo original.
- Se recuperó el acceso a “Mis bodas” desde la boda actual, listando únicamente índices y membresías existentes.
- Cambiar de boda valida primero la membresía y luego actualiza únicamente `users/{uid}.activeWeddingId` y `lastSeenAt`, igual que el contrato existente; no crea ni elimina datos.
- Se confirmó que la cuenta regresiva antigua mostraba `16.01.2027` en el HTML, pero el documento principal de una boda puede no tener `date` si esa boda fue creada antes de que ese campo existiera. La nueva app no inventa ni migra esa fecha silenciosamente.
- Nombre y fecha solo pueden escribirse en `weddings/{weddingId}` por el propietario porque las reglas actuales de Firestore reservan la actualización del documento raíz al owner.

## 2026-09-22 — Fecha de boda como dato persistente
- Se eliminó definitivamente `16.01.2027` / `2027-01-16` del HTML de la carátula.
- La cuenta regresiva ya no tiene ninguna fecha fija ni fallback codificado.
- Cada boda usa exclusivamente su propio campo `weddings/{weddingId}.date` como fuente de verdad.
- Si una boda todavía no tiene `date`, la interfaz muestra “Sin fecha”; el owner puede establecerla mediante “Editar” y el valor queda guardado en ese documento de boda.
- Cambiar de boda cambia inmediatamente la fecha y la cuenta regresiva porque ambas se obtienen del contexto Firebase de esa boda.
- No se creó una colección nueva ni un identificador paralelo para la fecha: el identificador estable es el `weddingId` y `date` es un atributo de esa boda. Esto evita duplicar fuentes de verdad.

## 2026-09-22 — Calendario propio para fecha de boda
- Se reemplazó el selector nativo `input[type=date]` por un calendario propio integrado al lenguaje visual de la carátula.
- Permite navegar mes a mes, seleccionar un día, visualizar la fecha elegida y guardar/cancelar explícitamente.
- El cambio es exclusivamente de interfaz: al guardar continúa usando el mismo campo canónico `weddings/{weddingId}.date` y el mismo control owner-only de Firestore.
- No se modificaron reglas, Storage ni otros datos de la boda.

## 2026-09-22 — Cierre y auditoría de seguridad del Inicio
- Se auditó la carátula, autenticación, contexto de boda, selector de bodas, edición de nombre/fecha y calendario antes de cerrar el hito.
- Se corrigió un vector de XSS en “Mis bodas”: el nombre de boda proveniente de Firestore ya no se inserta sin escapar dentro de HTML dinámico.
- Se verificó que nombre y fecha siguen protegidos por rol owner tanto en UI/adaptador como por las reglas Firestore existentes.
- La configuración web de Firebase permanece en cliente; no se trata como secreto. La seguridad depende de Authentication + Firestore Rules.
- No se detectaron escrituras de módulos, Storage, localStorage/sessionStorage/IndexedDB, migraciones, borrados ni creación automática de bodas en el Inicio.
- Queda como endurecimiento de despliegue recomendado definir CSP/headers de seguridad cuando la aplicación deje de depender de GitHub Pages o disponga de una capa que permita encabezados HTTP controlados.
- Se cierra el hito “Intro / Inicio” sobre el commit de auditoría correspondiente.


## 2026-09-22 — Barra canónica de módulos
- Se implementó una única barra responsive para todos los módulos: horizontal en escritorio y vertical en celular.
- La barra define accesos preparados para Checklist, Presupuesto, Proveedores, Invitados, Distribución, Cronograma, Invitaciones, Música, Documentos y Configuración sin duplicar navegación desktop/mobile.
- El primer acceso funcional es Checklist: el botón “Checklist de boda” de la carátula abre el workspace y marca Checklist como módulo activo.
- El botón “Mi Gran Día” de la barra vuelve al Inicio.
- Los demás accesos quedan estructurados para conectar sus módulos posteriormente, pero todavía no ejecutan navegación ni escrituras.
- La barra reutiliza el contexto de boda ya cargado; no agrega lecturas/escrituras de Firebase, Storage ni datos de módulos.

## 2026-09-23 — Presupuesto conectado y auditado
- Presupuesto se integró a la boda activa usando exclusivamente `services/planner-cloud.js`; el módulo no importa SDK de Firebase ni escribe directamente en Firestore.
- La clave existente `planificador_bodas_presupuesto_v5_etiquetas` se conserva sin renombrar, migrar ni crear almacenamiento paralelo.
- Se habilitaron edición de moneda e invitados, categorías, gastos, etiquetas y paquetes integrales respetando `weddingCapabilities(context.role).canEdit`.
- Los paquetes reutilizan `item.packageId`; no se creó una segunda relación ni colección.
- Se incorporó biblioteca visual de iconos para categorías manteniendo el mismo campo `icon`.
- Se auditó XSS/HTML dinámico: valores provenientes del estado se escapan antes de insertarse en HTML; además se sanea el color de etiquetas antes de usarlo en estilos inline.
- Se endureció la exportación CSV contra formula injection al abrir archivos en hojas de cálculo.
- Se corrigió una regla responsive contradictoria del selector de etiquetas.
- No se modificaron Firebase, Firestore Rules, Storage, Authentication, usuarios, IDs ni contratos de sincronización.
- Riesgo pendiente no resuelto en esta tarea: `planner-cloud.js` realiza read-modify-write del backup agregado; escrituras simultáneas de distintas sesiones o módulos pueden producir pérdida de actualización. No se modifica sin autorización explícita porque pertenece a persistencia.
- Las carpetas de tests siguen sin pruebas ejecutables para Presupuesto; antes de declarar el módulo completamente cerrado deben añadirse invariantes/no-pérdida y validación responsive en 360, 390–430, 768, 1024 y 1440 px.



## 2026-09-24 — Distribución Fase 3: persistencia mínima del plano
- Se cerró la edición real de posición y rotación de mesas sobre un estado geométrico separado de Invitados/Mesas.
- Distribución persiste únicamente propuestas y placements: `tableId + x + y + rotation`. No persiste copias de mesas, capacidad, sillas, invitados, `guestIds`, `sharedTableId` ni asignaciones.
- La clave de compatibilidad del backup agregado es `planificador_bodas_distribucion_v1`, almacenada exclusivamente mediante `services/planner-cloud.js`; el módulo no importa Firestore ni usa localStorage/sessionStorage/IndexedDB directamente.
- El contrato inicial es `version: 1`, `activeProposalId` y `proposals[]`; la primera propuesta canónica usa `proposal_main`.
- Abrir Distribución no escribe datos. Si no existe placement guardado, las mesas reciben una proyección inicial solo en memoria; la escritura ocurre únicamente al pulsar “Guardar distribución”.
- Los formatos persistidos desconocidos fallan cerrados y no intentan reparar, migrar ni reconstruir mesas.
- Un placement cuyo `tableId` ya no exista en las mesas canónicas no recrea esa mesa ni altera Invitados; simplemente no se renderiza ni se vuelve a serializar.
- La rotación es propiedad de Distribución: mesa y sillas rotan juntas; las etiquetas de invitados contrarrotan visualmente para permanecer horizontales.
- Se respeta `weddingCapabilities(context.role).canEdit`: usuarios sin edición pueden leer el plano pero no mover, rotar ni guardar.
- Auditoría estática posterior: 0 `!important`, 0 escrituras Firestore directas, 0 localStorage/sessionStorage/IndexedDB directos y 0 asignaciones a `guest.tableId`, `guest.seatId`, `guest.seatNumber`, `table.id` o `seat.id`.
- No se modificó el repositorio Wedding, reglas de Firestore, Storage, Authentication, usuarios ni contratos de Invitados/Mesas.


## 2026-09-24 — Distribución Fase 4 cerrada: integración estructural e integridad
- Distribución continúa consumiendo mesas, sillas, invitados y asignaciones como datos canónicos de Invitados/Mesas; no crea una segunda fuente de verdad.
- Los cambios canónicos de Mesas/Invitados refrescan Distribución mediante el evento existente `migrandia:datachange`, con cleanup explícito y sin polling, MutationObserver, iframe ni puentes legacy.
- Al volver a la aplicación desde segundo plano se relee el snapshot canónico cuando no existen movimientos visuales pendientes; si hay cambios locales sin guardar, no se mezclan estados.
- Crear, eliminar o modificar capacidad de una mesa sigue siendo responsabilidad exclusiva de Mesas. Distribución conserva únicamente `tableId -> x/y/rotation`.
- Antes de habilitar la edición del plano se valida en memoria: IDs de mesa únicos y no vacíos; IDs de silla únicos y no vacíos; referencias a mesas existentes; seatNumber dentro de rango; correspondencia seatId/seatNumber; y ausencia de doble ocupación de una silla.
- Una inconsistencia canónica bloquea Distribución en modo seguro y no intenta reparar, migrar ni escribir datos.
- Los placements persistidos de mesas eliminadas no recrean mesas. Una mesa canónica nueva recibe solo una posición proyectada en memoria hasta un guardado explícito.
- Barrido estático final: sin escritura directa a Firestore, sin localStorage/sessionStorage/IndexedDB directo, sin escrituras de guest.tableId/seatId/seatNumber ni table.id/seat.id y sin `!important`.
- Fase 4 cerrada. Siguiente hito: Fase 5, editor avanzado de Distribución, preservando estas invariantes.


## 2026-09-24 — Distribución Fase 5R cerrada: editor avanzado, integración y limpieza arquitectónica
- Se completó el editor avanzado de Distribución sobre el contrato persistente `version: 1`, sin crear almacenamiento paralelo ni cambiar IDs canónicos.
- El plano admite propuestas independientes, posición/rotación de mesas, catálogo de elementos físicos, zonas poligonales, medición, ajuste a cuadrícula, alertas espaciales, capas de visibilidad, modo presentación, plano limpio, impresión/PDF y fondo de referencia transitorio.
- El fondo de referencia permanece exclusivamente en memoria mediante Object URL; no se incorpora al payload persistido ni se guarda en Firebase, Firestore, Storage, localStorage, sessionStorage o IndexedDB.
- La cámara quedó aislada en `src/modules/distribucion/camera.js` como único propietario de zoom, paneo, pinch, Fit, conversión pantalla↔mundo y enfoque. El motor espacial permanece en `index.js` porque comparte directamente escala, catálogo y reglas del dominio.
- Mesas conserva la identidad canónica de mesas y sillas. Distribución renderiza únicamente las sillas presentes en `table.seats`; no inventa capacidad visual a partir de `table.capacity`.
- La evolución respecto de la Fase 4 es explícita: Distribución puede mover un invitado ya existente a otra silla canónica libre mediante el adaptador de Invitados. La operación solo modifica `guest.tableId`, `guest.seatId` y `guest.seatNumber`, valida la integridad antes de persistir, revierte esos tres campos si falla y no crea mesas, sillas, invitados ni IDs. Intercambios o reemplazos sobre una silla ocupada siguen delegados a Mesas.
- El evento posterior a una asignación usa `source: 'distribucion'`; el listener propio lo ignora y queda un único remontaje controlado, evitando el doble refresco del módulo.
- Las propuestas rechazan IDs de propuesta duplicados y una referencia `activeProposalId` inexistente. Duplicar una propuesta genera IDs de elementos sin colisiones.
- Al cambiar de propuesta se recalcula la secuencia de elementos y la creación comprueba los IDs existentes antes de aceptar un nuevo `element_N`.
- Los placements de mesas que ya no existen canónicamente no recrean esas mesas. Al serializar la propuesta activa se escriben únicamente los `tableId` canónicos actuales.
- Guardar establece una frontera limpia del historial: tras persistir correctamente se vacían Undo/Redo para impedir deshacer a un estado anterior al baseline guardado.
- Los cambios canónicos externos siguen bloqueando un guardado local pendiente mediante `canonicalChanged`; no se mezclan ni reparan estados automáticamente.
- Se corrigieron condiciones de ciclo de vida: un mount asíncrono obsoleto no toca el DOM, los listeners globales tienen cleanup equivalente y las Object URL del fondo se revocan al desmontar.
- Auditoría HTML ↔ JS ↔ CSS: no se detectaron controles o selectores de Distribución huérfanos que justificaran eliminación; los controles de cámara pertenecen deliberadamente a `camera.js`.
- Barrido estático de cierre: 0 Firestore directo, 0 localStorage/sessionStorage/IndexedDB directo, 0 polling, 0 MutationObserver, 0 postMessage, 0 `sharedTableId` legacy y 0 `!important`; los dos listeners globales del módulo tienen sus dos removals correspondientes.
- No se modificaron reglas de Firestore, Storage, Authentication, usuarios, esquema de persistencia ni el repositorio `Wedding`.
- Fase 5R cerrada. La siguiente fase es 5S: monkey test y regresión funcional final; esas pruebas todavía no forman parte de este cierre.


## 2026-09-24 — Distribución: catálogo local de planos antes de Fase 5S
- Se incorporó un catálogo de planos del recinto como extensión posterior al cierre arquitectónico 5R y previa a la regresión 5S.
- Casa Acapulco queda incluido por defecto en la aplicación como plano base de referencia y no puede eliminarse.
- El usuario puede agregar planos PNG/JPG/WebP, seleccionarlos, controlar visibilidad/opacidad y eliminar únicamente los personalizados.
- Los planos personalizados y la preferencia de fondo se guardan exclusivamente en IndexedDB del navegador. Esta excepción está limitada a `background-catalog.js`; no se usa para mesas, sillas, invitados, asignaciones, propuestas ni geometría persistente.
- No se incorporaron imágenes al payload `planificador_bodas_distribucion_v1`; su esquema continúa en `version: 1`.
- No se modificaron Firebase, Firestore, Storage, Authentication, usuarios ni datos canónicos.
- Si IndexedDB no está disponible, Casa Acapulco continúa disponible como fondo incluido y el módulo no intenta migrar datos a otro almacenamiento.
- Fase 5S continúa pendiente para probar el conjunto completo, incluido catálogo, recarga, selección local y fallback a Casa Acapulco.


## 2026-09-24 — Distribución: corrección de escala física, plano base y restauración de invariantes
- Se restauró un único sistema espacial para Distribución: lienzo lógico fijo de 1448 × 1086 y escala física fija de 32 px/m.
- Casa Acapulco deja de depender de `/Wedding/distribucion_base.png`. El mismo blob original `981caa80c12b68518c7b53947772ccb04a9accb4` queda incluido en `assets/distribucion/casa-acapulco.png`.
- El plano base ya no se pinta con un pseudo-elemento CSS `background-size: contain`; ahora es una imagen real de 1448 × 1086 dentro del mismo `distribution-world` que mesas, objetos, áreas y mediciones.
- El `distribution-world` ya no crece según el número de mesas. La cámara puede hacer zoom/pan, pero no modifica la escala física del mundo.
- Distribución dejó de usar `tableSeatGeometry()` de Invitados para el tamaño físico de las mesas. Ese helper continúa perteneciendo a la presentación de Invitados/Mesas.
- La mesa redonda vuelve al contrato físico auditado de Wedding: radio de tablero 0.915 m, diámetro funcional 3.40 m, órbita de sillas 1.33× y órbita de etiquetas 2.18×. Cuadradas y rectangulares usan dimensiones físicas en metros convertidas por el mismo `PLAN_SCALE`.
- Sillas y nombres dejan de usar tamaños/órbitas arbitrarios derivados de capacidad; los nombres mantienen contrarrotación y se retiró el halo visual heredado.
- El frame invisible de mesa se mantiene estable para preservar compatibilidad con los `x/y` ya guardados en `planificador_bodas_distribucion_v1`; no se migró ni cambió el esquema persistente.
- Se recuperó el movimiento independiente del plano de referencia mediante offset local en IndexedDB, sin alterar escala, Firebase, Firestore, Storage ni el payload de Distribución.
- Se retiró la escritura de asignaciones desde Distribución: ya no importa ni ejecuta `saveInvitadosSnapshot()` y no asigna `guest.tableId`, `guest.seatId` ni `guest.seatNumber`. Mesas vuelve a ser el único propietario de esas operaciones.
- No se modificaron IDs de mesas/sillas/invitados, usuarios, reglas, Authentication, Storage ni contratos Firebase.


## 2026-09-24 — Distribución: corrección visual posterior a escala física
- Se corrigió el encaje inicial de cámara para recuperar la conducta del Distribución original: el ajuste automático se calcula por ancho del lienzo y nunca baja de 65 %. El botón Encajar conserva este mismo criterio; el usuario puede alejar manualmente hasta el mínimo de cámara si lo necesita.
- Se eliminó la selección nativa de texto durante paneo/arrastre, que estaba mostrando nombres de invitados con resaltado azul.
- Los nombres visibles de invitados vuelven a compactarse a 18 caracteres con el nombre completo disponible en tooltip.
- Se recuperó una etiqueta visual clara y discreta para nombres, sin modificar la geometría física, asignaciones, IDs, Firebase, Firestore ni Storage.


## 2026-09-24 — Distribución: plano full bleed y responsive horizontal
- Se trabajó únicamente la presentación del plano del recinto; no se modificó geometría de mesas, sillas ni etiquetas.
- El visor ahora usa comportamiento full bleed: el mundo 1448 × 1086 se escala con criterio cover para ocupar todo el espacio disponible del visor, centrado y sin áreas transparentes del fondo.
- El plano de referencia se muestra siempre con opacidad 100 %. Se retiraron los controles y la persistencia local de opacidad y desplazamiento para evitar estados visuales inconsistentes y mantener una única presentación.
- En celular vertical el visor adopta formato horizontal 16:9, manteniendo el plano full bleed, y muestra debajo el mensaje “Gira tu celular” para sugerir una vista de trabajo más amplia. En horizontal el mensaje desaparece y el visor aprovecha la altura disponible.
- La cámara vuelve a encajar automáticamente cuando cambia el tamaño/orientación de la ventana y libera su listener al desmontar el módulo.
- Se mantuvieron intactos el lienzo lógico 1448 × 1086, la escala 32 px/m, Firebase, Firestore, Storage, usuarios, IDs y el payload persistente de Distribución.


## 2026-09-24 — Distribución: mayor altura del plano en desktop
- Se amplió únicamente el visor del plano en escritorio amplio; no se tocaron mesas, sillas, etiquetas ni persistencia.
- Desde 1200 px de ancho el visor adopta relación 4:3, igual al lienzo físico 1448 × 1086, con mínimo de 620 px.
- Esto permite que Casa Acapulco se extienda hacia abajo y reduzca el recorte vertical del modo full bleed, manteniendo el mismo sistema de coordenadas y la misma escala física.
- Tablet y móvil conservan sus reglas responsive anteriores, incluido el modo horizontal sugerido en celular.


## 2026-09-24 — Distribución: visor igual al plano y cámara fija
- Se trabajó únicamente el encuadre del plano.
- En desktop el visor ahora usa exactamente la relación 1448:1086 del lienzo físico, por lo que el espacio del visor coincide con el espacio de la imagen.
- Se eliminó el fondo negro del visor; el fondo neutro evita que transparencias internas del PNG aparezcan como franjas negras.
- La cámara queda fija temporalmente: sin paneo, rueda, pinch ni desplazamiento al enfocar elementos.
- Se retiraron temporalmente Encajar y los controles de zoom del toolbar. El zoom se resolverá como una fase posterior, una vez cerrada la presentación base del plano.
- Tablet y móvil conservan sus reglas responsive; en móvil vertical continúa el formato horizontal 16:9 con sugerencia de rotación.
- No se modificaron mesas, sillas, etiquetas, escala física, Firebase, Firestore, Storage, IDs ni persistencia.


## 2026-09-24 — Distribución: capas como switches en la barra superior
- Los cuatro controles de visibilidad principales se movieron desde el panel lateral a la barra superior de “Plano de mesas”.
- Se muestran como switches compactos: Plano, Mesas, Nombres y Elementos.
- Se conservaron exactamente los mismos atributos data y la misma lógica existente; no se creó una segunda implementación ni listeners duplicados.
- La sección lateral dejó de contener las capas y pasa a “Ajustes del plano”, donde permanecen catálogo de plano, separación, medición, cuadrícula y herramientas de dibujo.
- En escritorio los switches permanecen junto al encabezado del plano; en anchos medios la toolbar puede envolver limpiamente y en móvil se muestran en una cuadrícula de dos columnas.
- No se modificaron geometría, persistencia, mesas, sillas, invitados, Firebase, Firestore, Storage ni IDs.


## 2026-09-24 — Distribución: nombre de mesa más compacto
- Se ajustó únicamente el nombre mostrado dentro del tablero de la mesa.
- La tipografía baja de 12 px a 10 px.
- El nombre puede ocupar hasta dos líneas centradas; si excede ese espacio se recorta con puntos suspensivos.
- No se modificaron geometría, sillas, etiquetas de invitados, asignaciones, persistencia ni escala física.


## 2026-09-24 — Distribución: indicadores de validación en la barra superior
- Los indicadores de validación se movieron a la zona superior junto a los switches de capas.
- Se muestran siempre visibles como KPIs compactos: total de incidencias, conflictos, alertas y proximidad.
- Se conservaron los mismos data-attributes y la misma función de cálculo; no se duplicó la lógica ni el estado.
- El panel lateral mantiene únicamente el detalle/listado de incidencias bajo “DETALLE DE VALIDACIÓN”.
- En pantallas medianas los indicadores ocupan una fila propia y en móvil se organizan como tres KPIs más un total en ancho completo.
- No se modificaron reglas espaciales, geometría, persistencia, mesas, sillas, invitados, Firebase, Firestore, Storage ni IDs.


## 2026-09-24 — Distribución: retirar encabezado redundante de la toolbar
- Se retiró visualmente el bloque “Plano de mesas / Distribución proyectada · aún sin guardar” de la barra superior.
- Se conserva el mismo nodo data-distribution-status como texto oculto accesible para no romper la lógica existente ni los mensajes de estado.
- La barra superior comienza directamente con switches de capas e indicadores de validación.
- En modo Presentación se oculta el bloque principal de switches/indicadores junto con los demás controles no esenciales.
- No se modificaron acciones, persistencia, geometría, Firebase, Firestore, Storage ni IDs.


## 2026-09-24 — Shell móvil: navegación lateral plegable
- La barra lateral móvil continúa visible por defecto y conserva la misma navegación y cuenta activa.
- Se agregó un control propio de la barra para recogerla sin crear una segunda navegación.
- Al recogerla, el área de módulos deja de reservar los 82 px de navegación y vuelve a márgenes simétricos de 16 px, recuperando ancho útil especialmente para Distribución.
- Mientras la barra está oculta aparece un único botón flotante translúcido en la esquina inferior izquierda, respetando el safe area, para restaurarla.
- El estado es exclusivamente visual y en memoria: no se escribe en Firebase, Firestore, Storage, localStorage, sessionStorage ni IndexedDB.
- Al volver al inicio o ampliar la pantalla fuera del breakpoint móvil, la barra retorna al estado visible por defecto.
- La cámara de Distribución observa cambios reales de tamaño de su viewport mediante ResizeObserver, además del resize de ventana, para reencajar el plano cuando cambia el espacio disponible sin modificar coordenadas lógicas, mesas, sillas ni persistencia.
- Desktop conserva su barra horizontal actual; el cambio está limitado al layout móvil existente.


## 2026-09-24 — Distribución: simplificación visual de acciones superiores
- Se redujo la carga visual de la toolbar agrupando acciones secundarias sin retirar ninguna función.
- El selector de propuesta activa permanece visible.
- Nueva propuesta, Duplicar, Renombrar y Eliminar pasan al menú compacto “Propuesta”.
- Presentación, Plano limpio e Imprimir/PDF pasan al menú compacto “Vista”.
- Guardar permanece como acción primaria visible y se simplifica el texto de “Guardar distribución” a “Guardar”.
- Deshacer y Rehacer permanecen visibles como botones compactos ↶ y ↷ con aria-label/title.
- Los menús usan details/summary nativo, solo uno puede permanecer abierto y se cierran al ejecutar una acción.
- En móvil el selector y menús se adaptan al ancho disponible sin volver a desplegar todas las acciones.
- No se modificaron funciones, persistencia, geometría, capas, validaciones, Firebase, Firestore, Storage ni IDs.


## 2026-09-24 — Distribución: blindaje contra plantilla antigua en caché
- Se verificó que la toolbar simplificada sí está presente en el HEAD a67d2ae3.
- La plantilla de Distribución ahora se carga con fetch(..., { cache: 'no-store' }) para evitar reutilizar index.html antiguo durante iteraciones rápidas.
- Se suben identificadores de carga a template v38, Distribución v73, CSS v30 y dashboard v165.
- Se añade un marcador app-build en el HTML raíz para facilitar la verificación de la versión servida.
- No se modificó la estructura funcional de la toolbar, datos, Firebase, Firestore, Storage ni geometría.


## 2026-09-24 — Shell móvil: header permanente y drawer
- Se reemplazó la prueba anterior de barra lateral móvil plegable por una única navegación móvil tipo app.
- En celular queda un header fijo con hamburguesa, marca MGD, “Mi Gran Día” y el nombre de la boda activa; el subtítulo se forma desde el nombre ya cargado por wedding-context, sin duplicar persistencia.
- La navegación existente se reutiliza como drawer superpuesto desde la izquierda: no reserva ancho del módulo y no crea una segunda lista de navegación.
- El drawer se abre/cierra desde la hamburguesa, se cierra al tocar el fondo o seleccionar un módulo y conserva dentro el acceso a Inicio y Cuenta.
- Se retiraron completamente el botón flotante inferior, el estado is-nav-collapsed y los controles appNavCollapse/appNavRestore.
- El contenido móvil usa márgenes laterales completos; Distribución conserva todo el ancho disponible debajo del header.
- Durante la carga inicial/cambio de módulo, el loader ocupa toda la pantalla y mantiene ocultos header, drawer y contenido hasta completar el montaje y finalizar la salida del loader.
- Desktop conserva la navegación horizontal vigente.
- Sin cambios en Firebase, Firestore, Storage, usuarios, invitados, mesas, sillas ni contratos persistentes.


## 2026-09-24 — Shell móvil: corrección estructural y carga
- Se retiraron las excepciones por orientación, pointer e iOS introducidas durante la prueba del nuevo shell.
- El shell responsive usa una sola regla: hasta 980 px se presenta header móvil + drawer; desde 981 px se mantiene la barra desktop.
- Se eliminó el 100dvh redundante del workspace fijo; el workspace móvil usa fondo blanco propio y el safe area inferior queda integrado al contenido blanco.
- Se corrigió un texto literal "\\n" que había quedado dentro del head y podía alterar el parseo del documento en Safari.
- El loader sigue ocultando shell y módulo hasta completar el montaje, pero su transición de salida se redujo para no añadir espera artificial.
- Distribución dejó de solicitar su plantilla con cache no-store; la plantilla versionada usa caché del navegador.
- El adaptador planner-cloud deduplica únicamente lecturas concurrentes del mismo backup de la misma boda/usuario. No conserva caché persistente ni cambia el contrato de datos.
- Invitados y Distribución comparten esa misma lectura cuando montan simultáneamente sus datos, evitando descargar dos veces cloudSync/main y sus chunks.
- No se modificaron Firebase, Firestore, Storage, Authentication, usuarios, documentos, claves, payloads ni datos persistentes.


## 2026-09-24 — Recuperación del shell estable
- Se retiró por completo la implementación experimental de header móvil + drawer que había provocado una regresión del shell.
- HTML del workspace, bloque CSS de navegación y ciclo JS de navegación/carga fueron restaurados desde el último estado estable previo a los cambios de barra (commit 0b8fb0646a9d3bb7ab23c73ee608687c2a7dbb72).
- Se eliminó la referencia huérfana a appMobileWeddingName, que podía interrumpir applyWeddingContext y detener la inicialización completa de la aplicación.
- Se preservó la versión actual de Distribución mediante import versionado v76; no se restauró ni modificó su lógica funcional.
- La capa de datos permanece restaurada a su comportamiento previo: planner-cloud.js sin deduplicación/caché añadida, Invitados y Distribución con sus imports de datos originales v4.
- No se modificaron Firebase, Firestore, Storage, Authentication, usuarios ni datos persistentes.
- Publicación de recuperación: dashboard CSS v40, JS v172.


## 2026-09-24 — Distribución móvil: rueda de acciones y panel inferior
- Se crea una experiencia exclusiva para móvil (<=700 px); desktop conserva su interfaz actual.
- En móvil se ocultan hero, indicadores superiores, acciones extensas, panel lateral de herramientas e inspector. Se mantienen el plano y los cuatro switches de capas.
- Se agrega una rueda flotante inferior con cinco categorías: Añadir, Propuesta, Vista, Revisar y Ajustes.
- La rueda gira con flechas izquierda/derecha; el botón central permite plegarla/desplegarla.
- Al tocar una categoría se abre un bottom sheet oscuro inspirado en la referencia móvil.
- Las acciones reutilizan los controles existentes mediante proxy: no se duplica la lógica funcional.
- Añadir ofrece accesos iniciales a Pista, Barra, DJ, Escenario y Pantalla; Propuesta reutiliza Nueva/Duplicar/Renombrar/Eliminar; Vista reutiliza Presentación/Plano limpio/Imprimir; Revisar refleja validaciones; Ajustes incorpora Medir/Limpiar y cuadrícula.
- Sin !important, sin cambios en Firebase, Firestore, Storage, IDs, esquema persistente ni comportamiento desktop.


## 2026-09-24 — Distribución móvil: restaurar cabecera común del módulo
- Se restaura únicamente la cabecera/hero de Distribución en móvil para mantener consistencia con Presupuesto y los demás módulos.
- La cabecera vuelve a mostrar “Módulo · Espacio de la boda”, título “Distribución”, descripción y KPI “Mesas registradas”.
- La rueda móvil, plano, switches y bottom sheet permanecen sin cambios.
- Desktop no se modifica.


## 2026-09-24 — Distribución móvil: corregir visibilidad de la rueda
- Se corrigió un problema de cascada CSS: la regla base que oculta la rueda fuera de móvil estaba declarada después del media query y anulaba el display móvil.
- La regla base queda ahora antes de @media(max-width:700px), permitiendo que la rueda y el bottom sheet aparezcan correctamente en iPhone.
- No se modificaron rueda, acciones, plano, switches, desktop ni lógica funcional.


## 2026-09-24 — Distribución móvil: zoom con dos dedos sin paneo
- Se habilita pinch-to-zoom únicamente en móvil (<=700 px) sobre el visor de Distribución.
- El gesto requiere dos dedos; un dedo no desplaza la cámara.
- El zoom mantiene el plano centrado: no existe paneo ni arrastre de la imagen.
- El mínimo de zoom es siempre el encaje inicial y el máximo es 4x respecto de ese encaje.
- Al cambiar tamaño u orientación se recalcula el encaje base.
- Desktop permanece sin cambios.


## 2026-09-24 — Distribución móvil: navegación tipo mapa
- Se reemplaza el zoom centrado rígido por interacción táctil tipo mapa únicamente en móvil.
- Un dedo sobre espacio vacío desplaza el plano libremente en los ejes X/Y.
- Dos dedos hacen pinch-to-zoom alrededor del punto medio real del gesto; el punto bajo los dedos permanece estable mientras se amplía o reduce.
- Al mover ambos dedos durante el pinch también se puede recorrer el plano naturalmente.
- Un dedo sobre una mesa u objeto no activa el paneo de cámara, preservando el arrastre del elemento.
- La cámara limita el desplazamiento para no dejar el plano perdido fuera del visor ni mostrar espacio vacío más allá de sus bordes.
- El zoom conserva mínimo de encaje y máximo 4x.
- Desktop permanece sin cambios.


## 2026-09-24 — Distribución móvil: guardado compartido visible
- Se confirma que desktop y móvil usan la misma clave planificador_bodas_distribucion_v1 en la misma copia de Firebase.
- Mover mesas/objetos continúa siendo una edición en memoria hasta ejecutar Guardar; no se cambia este contrato.
- Se agrega en móvil un control compacto sobre la rueda con estado Guardado / Sin guardar / Guardando / Reabrir.
- El botón móvil “Guardar cambios” reutiliza exactamente el mismo saveButton y la misma writePlannerStorageKey; no se crea una segunda ruta de persistencia.
- Esto hace explícito cuándo un movimiento ya está disponible para otro dispositivo tras recargar.
- Sin cambios en Firebase, Firestore, Storage, claves, geometría ni modelo de datos.


## 2026-09-24 — Distribución: autoguardado y sincronización entre dispositivos
- Se confirma que las posiciones de mesa ya se almacenan como x/y/rotation dentro de planificador_bodas_distribucion_v1; no se crea un segundo modelo ni otra clave.
- Toda edición estable que deja Distribución en estado dirty programa autoguardado a los 250 ms usando la misma writePlannerStorageKey existente.
- El autoguardado cubre movimientos finalizados de mesas/objetos y cualquier otra operación que ya marque el módulo como dirty (rotación, tamaño, creación, eliminación, propuestas, undo/redo).
- Al ocultar la pestaña se intenta vaciar inmediatamente cualquier cambio pendiente mediante la misma ruta de guardado.
- planner-cloud incorpora subscribePlannerStorageKey basado en onSnapshot del metadato cloudSync/main. Tras un cambio remoto relee únicamente la clave solicitada.
- Distribución compara la firma del estado remoto con la última versión persistida; si está limpia, se remonta automáticamente con la versión recibida de desktop/móvil.
- Si llega un evento remoto mientras existe una edición local en guardado, se difiere el refresco hasta terminar para no interrumpir el gesto.
- El botón Guardar sigue existiendo como acción manual/estado de respaldo, pero ya no es requisito para conservar una edición estable.
- No se cambian Firebase collections, esquema planificador_bodas_distribucion_v1, IDs, Firestore rules ni Storage.


## 2026-09-24 — Distribución: autoguardado puro, sin botones Guardar
- Se eliminan los botones Guardar de desktop y móvil.
- El autoguardado deja de simular clicks sobre controles UI.
- Se crea persistDistribution() como única ruta interna de persistencia de Distribución.
- Cada estado dirty programa persistDistribution() automáticamente a los 250 ms.
- Al ocultar la pestaña se intenta persistir directamente cualquier edición pendiente.
- Si Firebase falla, dirty se conserva y no se presenta el estado como sincronizado.
- Se mantiene la misma clave planificador_bodas_distribucion_v1 y la misma escritura writePlannerStorageKey.
- No se modifican colecciones, reglas, IDs, esquema ni Storage.


## 2026-09-24 — Distribución: cambio canónico de tipo de mesa
- Se habilita cambiar la forma de una mesa desde Distribución con los mismos valores canónicos de Invitados: round, square y rectangular.
- En desktop, el selector aparece en el inspector de la mesa seleccionada.
- En móvil, las opciones Redonda/Cuadrada/Rectangular aparecen dentro de Ajustes cuando existe una mesa seleccionada.
- El cambio actualiza table.type en la estructura canónica de Invitados y persiste mediante saveInvitadosSnapshot().
- No se cambia capacidad, seats, seatId, seatNumber ni asignaciones de invitados.
- Si hay una posición de Distribución pendiente, primero se sincroniza antes de guardar el cambio canónico de la mesa.
- Tras guardar, Distribución se remonta para recalcular y redibujar la geometría física de la mesa conservando su placement.
- Se emite migrandia:datachange con source=distribucion para mantener informados los demás módulos sin provocar autorrecarga por el listener de Distribución.


## 2026-09-24 — Distribución: cambio de tipo de mesa instantáneo
- Se elimina el mountDistribucion() posterior al cambio de forma de mesa.
- El cambio round/square/rectangular actualiza inmediatamente la mesa seleccionada en memoria y reemplaza solo su nodo DOM.
- Se recalcula tablePhysicalGeometry() con la misma capacidad y se vuelve a enlazar la interacción de arrastre.
- Se conservan placement x/y, rotación, selección, cámara/zoom y el resto del plano sin desmontar.
- Firebase se sincroniza en segundo plano mediante saveInvitadosSnapshot().
- Si la persistencia falla, se restaura el tipo anterior y se redibuja únicamente esa mesa, sin reiniciar el módulo.


## 2026-09-24 — Mesas y sillas: guardar fiable + sincronización inmediata con Distribución
- submitTable ya no descarta silenciosamente Guardar mesa cuando existe una persistencia inmediata previa en curso; espera a que termine y luego continúa.
- El botón Guardar mesa fuerza el submit del formulario mediante requestSubmit(), evitando clicks perdidos.
- Distribución procesa eventos table-* de Invitados mediante reconcileCanonicalTables().
- Si el conjunto de mesas es el mismo, se relee Firebase y se actualizan en caliente nombre, tipo, capacidad, sillas e invitados, conservando x/y, rotación, cámara y selección.
- Solo crear/eliminar/reordenar estructuralmente puede requerir remonte cuando el conjunto/orden de mesas cambia.


## 2026-09-24 — Distribución: auditoría y corrección de sincronización intermitente
- Se identifica una carrera: el listener de Distribución podía recibir su propio autoguardado mientras saving=true, marcar un refresco remoto pendiente y remontar el módulo después dependiendo del orden de eventos.
- subscribePlannerStorageKey ahora observa cambios reales por clave: inicializa la firma del valor actual, ignora escrituras globales que no cambian esa clave y descarta lecturas asíncronas obsoletas mediante generación.
- Distribución reemplaza remoteRefreshQueued booleano por la firma exacta del estado remoto; un evento propio ya persistido no puede provocar remonte posterior.
- Distribución se suscribe además a GUEST_STORAGE_KEY para recibir cambios canónicos de Invitados/Mesas desde otros dispositivos.
- GUEST_STORAGE_KEY y SHARED_STORAGE_KEY se exportan desde invitados-data.js, evitando strings mágicos duplicados.
- reconcileCanonicalTables actualiza también guestIndex para que redibujos posteriores usen asignaciones vigentes.
- Al volver a una pestaña visible se reconcilian mesas/invitados en caliente en lugar de remontar Distribución innecesariamente.
- Se mantienen una sola fuente Firebase, los mismos IDs, claves, placements y contratos de datos.


## 2026-09-24 — Distribución: sincronización en caliente y nombres apagados por defecto
- El switch Nombres/Etiquetas inicia apagado y se aplica hide-guest-labels desde el primer render.
- Las actualizaciones remotas de planificador_bodas_distribucion_v1 ya no llaman mountDistribucion().
- applyRemoteDistributionState() actualiza propuestas, placements x/y/rotation y elementos sobre el DOM actual.
- Se preservan cámara, zoom, viewport y selección cuando siguen siendo válidos.
- Los cambios canónicos locales de Invitados se reconcilian mediante reconcileCanonicalTables() en lugar de remontar el módulo.
- Se elimina el remonte posterior al autoguardado y el fallback de remonte ante errores ordinarios de eventos table-*.
- Solo cambios estructurales reales del conjunto de mesas (crear/eliminar/reordenar IDs) conservan la posibilidad de reconstrucción completa.


## 2026-09-24 — Invitados/Música: uniformizar botones a rojo
- Se elimina la excepción verde de la pestaña Música dentro de Invitados.
- La pestaña Música activa usa la misma paleta rosada/roja de Invitados.
- Guardar configuración cambia de verde a #ad7480.
- Copiar enlace y Abrir vista usan fondo #f7ecef, borde #e3c6cc y texto #9c6470.
- No se modifican tarjetas, iconos, estados informativos ni lógica funcional.


## 2026-09-24 — Mesas y sillas: corrección raíz del guardado de opciones
- Se corrige assertSeatIdentityPreserved(): al reducir capacidad solo se exige conservar la identidad de las sillas que permanecen; las sillas vacías eliminadas ya no bloquean un cambio legítimo.
- Se mantiene la validación estricta de invitados ocupados y de seatId/seatNumber canónicos.
- Se elimina la ruta redundante que interceptaba Guardar mesa y llamaba requestSubmit(); queda un único flujo nativo de submit.
- El formulario captura nombre, forma y capacidad una sola vez y espera cualquier persistencia previa antes de aplicar la mutación.
- El diálogo solo se cierra después de que saveInvitadosSnapshot confirme el guardado.
- Si la validación o Firebase falla, el diálogo permanece abierto y muestra el error en data-table-dialog-state.
- No se cambian claves, IDs, colecciones, reglas de Firebase ni asignaciones de invitados.


## 2026-09-24 — Distribución: sillas libres con color de Conflictos
- Las sillas no asignadas dejan el fondo blanco y adoptan la misma familia visual de la pastilla Conflictos.
- Se usa fondo rgba(246,231,228,.92) y borde rojizo suave rgba(172,92,82,.34).
- Las sillas ocupadas conservan su estado verde existente.
- No se modifica geometría, tamaño, asignaciones ni interacción.


## 2026-09-24 — Mesas y sillas: normalización segura de seatId legacy
- Se confirma en la implementación original de Wedding que un invitado con tableId y seatNumber válidos normalizaba guest.seatId al id canónico de table.seats[seatNumber - 1].
- La reestructuración estaba bloqueando ese caso como error, impidiendo guardar mesas con asignaciones históricas válidas pero seatId desfasado.
- reconcileGuestSeatIdentity() restaura el contrato original: mantiene tableId y seatNumber y corrige únicamente seatId cuando la silla canónica existe.
- Las sillas fuera de rango, mesas inválidas o sillas sin identidad siguen bloqueando el guardado.
- La reparación forma parte de la misma mutación de Mesas y queda cubierta por el snapshot previo/rollback si Firebase falla.
- No se reasignan invitados, no se cambian números de silla, no se crean IDs paralelos y no se modifican contratos de Firebase.


## 2026-09-24 — Distribución Fase 1: dimensiones físicas por mesa
- Se formaliza table.dimensions como override físico opcional de cada tableId canónica.
- Mesas existentes sin dimensions conservan automáticamente los tamaños estándar actuales; no se ejecuta migración masiva.
- Redonda guarda diámetro; cuadrada lado; rectangular largo y fondo. Rango inicial seguro: 0.5 a 4.0 m.
- tablePhysicalGeometry() consume ahora la mesa completa y deriva tablero, órbita de sillas y clearance desde su tamaño real.
- Clearance deja de ser constante global y se deriva como tablero + 0.80 m por cada lado, siguiendo el contrato físico original.
- El inspector desktop permite editar medidas y restaurar el estándar.
- Ajustes móvil permite editar las mismas medidas mediante la misma función de dominio; no existe una segunda implementación.
- Las dimensiones se persisten mediante saveInvitadosSnapshot sobre la mesa canónica, releyendo primero el snapshot vigente para reducir escrituras desde estado obsoleto.
- x/y/rotation siguen siendo propiedad de Distribución y no incluyen dimensiones.
- Los elementos físicos no-mesa mantienen su width/height existente por propuesta; esa persistencia ya estaba implementada.


## 2026-09-24 — Distribución Fase 2: redimensionamiento directo de objetos físicos
- Los elementos físicos redimensionables muestran cuatro tiradores de esquina al seleccionarse.
- El gesto de resize vive en bindElementInteraction(), el mismo propietario de mover/seleccionar; no se agregan listeners globales ni una segunda ruta.
- El cálculo respeta la rotación del objeto: el delta de puntero se transforma a ejes locales y el vértice opuesto permanece anclado.
- width/height siguen siendo la única fuente de tamaño y se autoguardan mediante la serialización existente de Distribución.
- Los polígonos dibujados escalan sus puntos desde el snapshot inicial del gesto, evitando acumulación de error.
- refreshElementGeometryNode() centraliza la actualización DOM de tamaño/posición/polígono y reemplaza reconstrucciones innecesarias.
- Un gesto completo genera una sola entrada de Undo/Redo y un solo dirty/autosave al terminar.
- El inspector muestra ancho × alto actual; Ajustes móvil permite editar ambos con la misma changeSelectedElementDimensions().
- Tiradores móviles usan 20 px para facilitar interacción táctil.
- No se modifica Firebase, tablas, invitados, sillas ni dimensiones canónicas de mesas.


## 2026-09-24 — Mesas y sillas: integración canónica de dimensiones físicas
- table-geometry.js pasa a ser el único propietario de estándares físicos de mesa, límites y normalización de table.dimensions.
- Mesas y sillas incorpora edición de medida física en el mismo diálogo de la mesa: diámetro para redonda, lado para cuadrada y largo/fondo para rectangular.
- El diálogo hidrata directamente table.dimensions existente; no crea una copia local persistente.
- “Usar medida estándar” elimina el override al guardar, de modo que la mesa vuelve a heredar el estándar de su forma.
- Una mesa nueva solo guarda dimensions cuando el usuario personaliza la medida; las mesas existentes sin override permanecen sin migración.
- El resumen de vista previa muestra forma, capacidad y medida física actual.
- Distribución deja de declarar sus propios estándares físicos y consume las mismas funciones exportadas por table-geometry.js.
- Cambiar medidas desde Mesas emite table-updated mediante el persist existente; Distribución recibe el mismo tableId y redibuja la geometría canónica.
- Cambiar medidas desde Distribución sigue escribiendo table.dimensions canónico; al reabrir Mesas se hidrata el mismo valor.
- No se modifican IDs de mesa/silla, asignaciones, claves de almacenamiento, colecciones ni reglas de Firebase.


## 2026-09-24 — Distribución Fase 3: geometría física consistente de mesas
- Las sillas dejan de usar un factor proporcional al radio de mesas redondas.
- Todas las formas usan una separación física estándar de 0.38 m entre borde del tablero y centro de silla.
- Las etiquetas usan una separación física estándar de 0.72 m respecto al borde del tablero.
- Esto evita sillas demasiado pegadas en mesas pequeñas y excesivamente alejadas en mesas grandes.
- Se corrige una inconsistencia de estado: layout.items podía conservar geometry anterior después de editar table.dimensions.
- syncLayoutTableGeometry() mantiene table, index, capacity y geometry del layout alineados con la mesa canónica actual.
- redrawTableInPlace() y reconcileCanonicalTables() actualizan layout antes de redibujar.
- refreshSpatialConflicts() deriva nuevamente la geometría desde tableById antes de calcular colisiones/proximidad, por lo que las validaciones siempre usan la medida física vigente.
- No se cambian seatId, seatNumber, tableId, placements ni contratos de persistencia.


## 2026-09-24 — Distribución Fase 4: historial y concurrencia multi-dispositivo
- El autosave deja de borrar undoStack/redoStack; un objeto redimensionado puede deshacerse incluso después de sincronizarse.
- restoreEditorSnapshot() considera Undo/Redo una nueva edición y vuelve a autoguardarla, evitando que el DOM quede revertido solo localmente.
- Antes de guardar Distribución se relee la clave remota y se compara contra lastPersistedState.
- mergeDistributionStates() realiza fusión de tres vías por proposalId: cambios no superpuestos en propuestas distintas se combinan automáticamente.
- Si dos dispositivos modificaron la misma propuesta desde la misma base y los resultados difieren, no se sobrescribe silenciosamente.
- En conflicto aparece un control compacto con “Conservar este” y “Usar remoto”; la decisión queda explícitamente en manos del usuario.
- “Conservar este” fuerza la escritura solo después de esa acción explícita; “Usar remoto” aplica el estado remoto en caliente y limpia el historial incompatible.
- lastPersistedState se actualiza tanto al guardar como al recibir/aplicar cambios remotos.
- No se modifica el esquema de Firebase, claves, IDs, invitados, sillas ni table.dimensions.


## 2026-09-24 — Distribución Fase 5: cierre responsive y de estados transitorios
- El panel móvil Añadir deja de mantener una lista hardcodeada de 5 objetos y consume directamente los mismos botones/tipos físicos del catálogo desktop.
- Móvil tiene acceso al catálogo completo sin crear una segunda fuente de tipos ni etiquetas.
- Se elimina el texto de “Primera versión móvil” porque la funcionalidad ya no es parcial.
- Mientras existe un conflicto multi-dispositivo sin resolver, el autosave queda pausado; no vuelve a ejecutar preflight en bucle.
- updateSaveState() da prioridad visual al conflicto pendiente y solo reanuda autosave después de resolverlo.
- Al mostrar o aplicar un estado remoto se cierra el bottom sheet móvil para evitar controles con valores obsoletos.
- El cleanup del módulo cierra panel móvil y limpia el estado visual transitorio de conflicto.
- No se añaden listeners globales ni una segunda ruta de catálogo/persistencia.


## 2026-09-25 — Distribución Fase 6: barrido técnico final y reconciliación canónica
- Se elimina el estado bloqueante canonicalChanged: podía activarse durante una sincronización y nunca volver a false, dejando autosave/edición bloqueados.
- canonicalRefreshPending funciona ahora como cola temporal únicamente mientras existe una escritura en curso; al finalizar se reconcilia Invitados/Mesas y se limpia.
- Crear, eliminar o reordenar mesas ya no remonta mountDistribucion(). La reconciliación actualiza tables, guests, tableIds, layout.items, placementState, tableById y nodos de mesa en caliente.
- Mesas existentes conservan su x/y/rotation; mesas nuevas reciben una posición proyectada; mesas eliminadas retiran sus placements activos y referencias obsoletas de propuestas.
- Los cambios estructurales marcan Distribución dirty para limpiar/persistir el conjunto vigente de placements sin perder trabajo local.
- Se preservan cámara, zoom, propuesta activa, objetos físicos y selección cuando la mesa seleccionada sigue existiendo.
- El listener cloud de Invitados/Mesas usa la misma cola si llega durante un save; no existe una segunda ruta de reconciliación.
- camera.focusNode() deja de ser un stub: las incidencias de validación ahora centran realmente el objeto seleccionado manteniendo el zoom actual.
- Se elimina una regla CSS duplicada de acciones del inspector.
- Barrido: 0 !important, 0 reload de página y 0 remonte estructural de Distribución por cambios de mesas.


## 2026-09-25 — Distribución: rotación visual precisa de mesas
- La rotación de mesas continúa teniendo una sola fuente de verdad: placement.rotation.
- Cada mesa renderiza un control de rotación visual que solo aparece al seleccionarla: guía punteada semitransparente, línea, handle superior y lectura del ángulo.
- Arrastrar el handle rota de forma continua siguiendo el puntero; el cálculo usa el centro visual de la mesa y normaliza correctamente el cruce 359°/0°.
- applyTableRotation() centraliza la mutación visual de placement.rotation para el gesto y para los botones del inspector.
- Un gesto completo registra un solo snapshot de Undo/Redo y dispara un solo dirty/autosave al finalizar.
- Los botones ↺/↻ pasan de 15° a 1° por clic para ajuste fino.
- El ángulo visible sobre la mesa se actualiza desde applyPlacement(), evitando un segundo estado visual.
- En móvil el handle aumenta su área táctil, pero usa exactamente la misma lógica que desktop.
- No se modifican IDs, invitados, sillas, table.dimensions, contratos de persistencia ni Firebase.


## 2026-09-25 — Distribución: simplificación visual del control de rotación
- Se elimina la guía/perímetro punteado alrededor de la mesa seleccionada.
- Se elimina la lectura flotante de grados sobre la mesa; el inspector conserva la lectura numérica.
- Se mantiene únicamente la línea de rotación y el handle superior.
- El handle circular se reemplaza visualmente por una flecha en espiral ↻ con el mismo tono rosado y 50% de transparencia.
- La lógica de arrastre, placement.rotation, Undo/Redo y autoguardado permanece sin cambios.


## 2026-09-25 — Distribución: mayor visibilidad del control de rotación
- La flecha en espiral de rotación pasa de 50% a 80% de opacidad (20% de transparencia) para mejorar su visibilidad.
- No se modifica línea, color base, tamaño ni lógica de rotación.


## 2026-09-25 — Distribución Fase 1: inventario maestro de objetos visuales
- Se auditan la propuesta histórica de Wedding, distribucion-limpia y la reestructuración vigente.
- Se crea un catálogo documental exclusivo de objetos visuales, separado de mesas/sillas canónicas y del futuro motor de áreas dibujables.
- Se inventarían 42 entradas entre objetos actuales, faltantes, equivalentes y casos que requieren normalización.
- Se detectan conflictos de nomenclatura gift/gifts, planter, entrada/salida y la diferencia entre canopy rectangular y tent poligonal.
- No se modifica UI, persistencia, Firebase ni PHYSICAL_ELEMENT_TYPES en esta fase.


## 2026-09-25 — Distribución Fase 2: normalización y categorización del catálogo
- Se normaliza el inventario de Fase 1 sin modificar UI, persistencia ni datos.
- Se definen 38 objetos visuales ordinarios canónicos y 9 variantes de áreas dibujables, para 47 conceptos de catálogo.
- Se establecen ocho categorías: Mesas y mobiliario; Comida y atención; Celebración y experiencias; Decoración; Infraestructura/recinto; Vegetación; Seguridad/circulación; Áreas dibujables.
- Se conserva compatibilidad conceptual con todos los types aceptados por el parser V1; no se renombra ningún type persistido.
- gift queda como alias histórico de gifts; planter conserva el type actual y normaliza su nombre a Jardinera/macetero.
- canopy se conserva como Cobertura rectangular/toldo modular y convivirá con el futuro Toldo poligonal.
- circulation, restricted y zone quedan como representaciones rectangulares legacy compatibles con el futuro motor de áreas.
- Silla suelta se mantiene únicamente como mobiliario espacial sin seatId, tableId, invitados ni asignación.
- Se propone un contrato simple para Fase 3; no se implementa todavía.


## 2026-09-25 — Distribución Fase 3: contrato único del catálogo
- distribution-catalog.js pasa a ser la única fuente de verdad para 38 objetos ordinarios; circulation/restricted/zone permanecen en un bloque legacy separado.
- Se centralizan labels, categorías, aliases, dimensiones, formas, familias espaciales, capabilities, behavior, iconos y visual.
- gift se resuelve centralmente a gifts sin migrar el type leído desde legacy.
- index.js elimina physicalType() y PHYSICAL_ELEMENT_TYPES; parser, creación, renderer, inspector, desktop y móvil consumen getCatalogItem().
- Los botones desktop dejan de duplicar label/icono/dimensiones y se hidratan desde el catálogo.
- canopy conserva el contrato rectangular; se elimina solo el botón histórico Dibujar toldo basado en canopy.
- Sin cambios de Firebase/Firestore ni del formato persistido V1.


## 2026-09-25 — Distribución Fase 4: incorporación de objetos ordinarios
- Se incorporan a la UI 11 objetos ordinarios ya definidos por el contrato único: couple, mirror, backdrop, sign, divider, guestbook, favors, cocktail, snacks, supplier y exit.
- La UI pasa de 26 a 37 objetos ordinarios visibles; chair permanece solo en catálogo como detached-chair para no confundirse con sillas canónicas.
- Los botones nuevos contienen únicamente data-distribution-add-element; labels, iconos, dimensiones, capabilities y comportamiento siguen viniendo de distribution-catalog.js.
- Desktop conserva los grupos existentes y móvil sigue derivándose de esos mismos botones mediante getCatalogItem(), sin catálogo paralelo.
- circulation, restricted y zone permanecen legacy compatibles; no se implementa el motor de áreas ni Toldo poligonal.
- canopy continúa rectangular 6 × 6 m y exit permanece separado de entrance.
- Sin cambios en Firebase/Firestore, Storage, Auth, claves, IDs ni persistencia V1.


## 2026-09-25 — Distribución Fase 5: presentación data-driven del catálogo
- Se eliminan los 37 botones ordinarios hardcodeados del template; desktop renderiza el catálogo desde distribution-catalog.js.
- Se centraliza únicamente el orden de presentación de las siete categorías ordinarias visibles y sus objetos; la categoría Áreas dibujables permanece reservada para la fase posterior.
- Desktop usa categorías colapsables, grid compacto de dos columnas y búsqueda simple por label/aliases.
- Móvil conserva el bottom sheet existente y genera las mismas categorías/objetos desde la misma fuente, sin lista móvil paralela.
- Se mantienen 37/38 objetos expuestos; chair continúa sin botón y circulation/restricted/zone permanecen legacy.
- No se modifica Firebase/Firestore, Storage, Auth, persistencia V1, canvas, geometría ni motor de áreas.


## 2026-09-25 — Distribución Fase 6: Toldo poligonal
- Se incorpora Toldo como `type: area` + `areaKind: tent`, independiente de canopy.
- Se reutiliza el motor poligonal existente: points[] local es la geometría primaria; área, perímetro, bounding box y lados se derivan.
- Dibujar Toldo permite cierre por primer vértice, doble clic o Enter; Esc cancela sin crear objeto parcial.
- Preview muestra segmentos, vértices y línea al puntero; se rechazan auto-intersecciones y segmentos prácticamente nulos.
- El Toldo seleccionado muestra medidas laterales y handles para editar vértices; un drag produce una sola entrada de Undo/Redo y autosave al finalizar.
- Resize escala points[]; rotation continúa como transformación única del elemento; movimiento traslada x/y sin deformar los puntos.
- Inspector incorpora área, perímetro, color y transparencia 0–90%; móvil reutiliza el mismo contrato desde Ajustes.
- Duplicado/copy/paste y propuestas conservan points[], areaKind, color y transparencia con IDs independientes.
- circulation/restricted/zone siguen legacy y canopy continúa rectangular 6 × 6 m.
- Se mantiene formato V1 sin migraciones y no se modifica Firebase/Firestore, Storage, Auth, reglas, IDs ni usuarios.


## 2026-09-25 — Distribución Fase 7: motor común de áreas dibujables
- Se generaliza el motor poligonal de Fase 6 a nueve presets modernos: tent, stage, lounge, children, buffet, technical, restricted, circulation y custom.
- Todas las variantes persisten type=area + areaKind y comparten dibujo, preview, cierre/cancelación, vértices, área, perímetro, medidas laterales, resize, rotación, Undo/Redo, autosave, copy/paste, renderer e inspector.
- Desktop activa «Áreas dibujables» con nueve opciones; móvil deriva las mismas opciones de la misma fuente central.
- La búsqueda de Fase 5 incluye las áreas sin confundir objetos ordinarios stage/buffet/technical con area/stage, area/buffet y area/technical.
- Se retiran únicamente los controles de creación legacy; circulation, restricted y zone siguen soportados para lectura, render, edición y persistencia sin migración.
- Un areaKind desconocido se rechaza controladamente; no se convierte silenciosamente a custom.
- canopy continúa ordinario rectangular 6 × 6 m; catálogo ordinario sigue 37/38 visible con chair oculto.
- Se mantiene formato V1 y no se modifica Firebase/Firestore, Storage, Auth, reglas, usuarios, IDs ni documentos.


## 2026-09-25 — Distribución Fase 8: auditoría final y regresión
- Auditoría final sobre el HEAD de Fase 7, sin reabrir Fases 1–7 ni modificar Wedding.
- Conteos verificados: 38 ordinarios, 37 visibles, 9 áreas modernas, 3 legacy soportados y 0 botones legacy de creación; chair permanece registrado/oculto.
- Unicidad verificada para types, areaKinds y alias `gift -> gifts`; se conserva separación stage/area-stage, buffet/area-buffet, technical/area-technical y canopy/area-tent.
- Parser/serialización V1 conservan areaKind y points; points mantienen precisión de cuatro decimales de píxel.
- Regresión geométrica: rectángulo 4×6 = 24 m² / 20 m; triángulo 3-4-5 = 6 m² / 12 m; movimiento y rotación no deforman points y resize escala geometría.
- Undo/Redo mantiene una instantánea por gesto; autosave continúa por dirty y no por pointermove; propuestas clonan points y permanecen aisladas.
- Residuos reales retirados: función `drawingLabel()` y estado legacy `drawingType='zone'` sin consumidores, más CSS huérfano `.distribution-drawing-tools`.
- Barrido estático posterior: cero funciones locales sin consumidor detectadas y cero `!important` en CSS del módulo.
- Diff acumulado Fases 1–7 sin cambios en Firebase/Firestore/Storage/Auth/reglas/usuarios/IDs.
- No hubo prueba interactiva real en navegador; cierre basado en validación estática, contractual, lógica y geométrica.
- No se añadieron funcionalidades, archivos, presets, objetos, migraciones, rueda radial, zoom/pan, SAT ni hit-test nuevos.


## 2026-09-25 — Distribución Fase 9: retiro de edición manual por vértices
- Se eliminan los handles de vértice de las áreas seleccionadas y toda la rama de interacción vertexEdit asociada.
- Se conserva points[] como geometría primaria y continúan dibujo inicial, validaciones, medidas laterales, área/perímetro, resize, rotación, movimiento, Undo/Redo, autosave, propuestas y persistencia V1.
- El resize sigue escalando points[]; no se introduce una segunda geometría ni una segunda ruta de edición.
- Se retira CSS huérfano de distribution-polygon-vertex e is-editing-vertex.
- Sin cambios en Firebase/Firestore, Storage, Auth, datos canónicos, catálogo, presets ni esquema V1.


## 2026-09-25 — Distribución Fase 10: blindaje del inspector
- Se sustituye el ocultamiento disperso del panel lateral por un único controlador de modos empty/table/element/area.
- Cada cambio de selección primero limpia todas las secciones específicas y después habilita solo las que pertenecen al tipo actual.
- Tipo de mesa, medida física canónica, asignados/libres e invitados quedan exclusivamente en modo table.
- Objetos ordinarios usan controles de objeto según capabilities; áreas añaden área/perímetro y color/transparencia sin heredar controles de mesa.
- clearSelection reutiliza el mismo controlador y vuelve a estado vacío.
- Sin cambios en Firebase/Firestore, datos canónicos, persistencia, catálogo, propuestas o geometría.


## 2026-09-25 — Distribución Fase 11: desacoplamiento desktop/móvil
- Se elimina proxyClick y el disparo de eventos sintéticos desde la hoja móvil hacia controles desktop.
- Desktop y móvil consumen las mismas operaciones compartidas para catálogo, áreas dibujables, propuestas, vista, impresión, medición, snap y estilo de áreas.
- Añadir objetos y áreas sigue usando el catálogo/presets canónicos; no se crea catálogo móvil paralelo.
- Color y transparencia de áreas se aplican mediante una única operación, con un único snapshot de historial cuando existe cambio real.
- El estado de snap se modifica por operación compartida y mantiene sincronizado el checkbox desktop.
- Sin cambios en Firebase/Firestore, datos canónicos, persistencia V1, geometría, permisos o contratos de sincronización.


## 2026-09-25 — Distribución Fase 12: frontera Mesas ↔ Distribución
- Auditoría: Distribución tenía 2 escrituras canónicas de mesa (tipo y dimensiones) mediante saveInvitadosSnapshot y un helper local de read/mutate/save.
- Se añade updateCanonicalTable al adaptador existente invitados-data.js; la escritura canónica queda localizada en el propietario/adaptador de Invitados/Mesas.
- Distribución queda con 0 referencias a saveInvitadosSnapshot y usa 2 llamadas explícitas a updateCanonicalTable.
- Se elimina la mutación optimista de table.type/table.dimensions; el espejo local solo se actualiza después de persistir correctamente.
- x/y/rotation siguen perteneciendo a Distribución; tipo/dimensiones siguen siendo canónicos de Mesas.
- No se cambian claves, schemas, IDs, invitados, sillas, asignaciones, capacidad, Firebase/Firestore ni V1 de Distribución.
- La sincronización canónica/evento existente no se refactoriza en esta fase para mantener el alcance quirúrgico.


## 2026-09-25 — Distribución Fase 13: saneamiento estructural de index.js
- Auditoría inicial: index.js tenía 3,319 líneas y concentraba una frontera funcional clara de geometría/espacio junto al orquestador UI.
- Se extrae únicamente esa frontera a spatial-geometry.js; no se divide el módulo por cantidad de líneas.
- El nuevo archivo concentra geometría poligonal, normalización, área/perímetro, auto-intersección, shapes espaciales, reglas de colisión y distancias.
- index.js elimina las definiciones trasladadas y queda en 3,118 líneas; spatial-geometry.js tiene 239 líneas.
- No existe motor duplicado: index.js solo importa y consume las funciones extraídas.
- Sin cambios de algoritmos, escala, UI, listeners, catálogo, persistencia, Firebase/Firestore, datos canónicos, propuestas o sincronización.


## 2026-09-25 — Distribución Fase 14: listeners y cleanup
- Auditoría: 2 listeners globales, 2 suscripciones cloud, 1 cámara y recursos temporales requerían cleanup; los listeners locales viven en nodos reemplazables y no necesitan desmontaje manual individual.
- Hallazgo: activeDistributionCleanup se asignaba al final del montaje, dejando una ventana de inicialización donde una excepción podía ocurrir después de adquirir recursos y antes de registrar su liberación completa.
- Se implementa un registro cleanup por montaje, idempotente y LIFO; cada recurso externo registra su liberación cuando se adquiere.
- Los 2 addEventListener globales tienen sus 2 removeEventListener; las 2 suscripciones tienen unsubscribe; setupDistributionCamera tiene un destroy registrado.
- El catch limpia solo los recursos de su propio montaje, sin riesgo de desmontar una instancia posterior.
- Sin nuevos listeners globales y sin cambios en UI, persistencia, Firebase/Firestore, catálogo, geometría, datos o comportamiento de sincronización.


## 2026-09-25 — Distribución Fase 15: sincronización y conflictos
- Se auditan dirty/saving/canonicalRefreshPending, autosave, cola remota, merge por propuestas y resolución manual.
- Hallazgo: un remoto recibido durante saving podía convertirse en conflicto artificial al finalizar un guardado local ya limpio.
- La cola remota ahora descarta el eco de la propia escritura y aplica un remoto posterior cuando ya no existe edición local pendiente.
- Si llega remoto con dirty real, se intenta merge a tres vías inmediatamente: propuestas distintas se integran; divergencia sobre la misma propuesta muestra conflicto.
- El merge remoto no conflictivo actualiza la base remota y conserva dirty para que autosave persista la combinación.
- Conservar este sigue siendo la única escritura force:true; Usar remoto conserva reemplazo explícito.
- Sin cambios en Firebase/Firestore, schema, datos canónicos, catálogo, geometría o permisos.


## 2026-09-25 — Distribución Fase 16: Undo/Redo y cierre de regresión
- Auditadas 17 rutas de rememberEdit, cancelaciones, Undo/Redo y autosave.
- Los gestos continuos toman un snapshot al inicio; pointermove no crea snapshots ni escrituras/autosave.
- Un gesto sin cambio descarta el snapshot provisional; dibujo inválido conserva su rollback existente.
- Undo/Redo restauran placements/elementos, recalculan conflictos y marcan dirty para autosave centralizado.
- Autosave conserva debounce de 250 ms y no escribe durante pointermove.
- El cambio de propuesta limpia Undo/Redo y evita aplicar historia entre propuestas.
- No se encontró defecto funcional demostrable; no se altera el motor de historial en esta fase.
- Regresión contractual final sin cambios en Firebase/Firestore, datos canónicos, schema V1, catálogo, geometría o UI.
- Con esta fase queda cerrado el plan de auditoría estructural de Distribución.


## 2026-09-26 — Reconstrucción limpia del módulo Cronograma
- Se activa Cronograma dentro del shell reestructurado y se mantiene una sola implementación responsive para escritorio y móvil.
- El módulo conserva la clave auditada `planificador_bodas_cronograma_v1` y accede únicamente mediante el adaptador existente `planner-cloud.js`; no se crea una segunda persistencia.
- La normalización exige el contrato existente `events[]` y preserva propiedades no conocidas de la raíz y de cada evento al editar.
- Se implementan timeline, búsqueda, filtro por estado, indicadores, alta, edición, consulta de solo lectura y eliminación según permisos de la boda activa.
- Los campos compatibles contemplan aliases históricos para título, hora, duración, responsable, estado, notas y orden sin renombrar datos existentes.
- Un formato existente no reconocido bloquea la carga y no se sobrescribe con un estado vacío.
- No se modifican Firebase/Firestore, Storage, Auth, reglas, usuarios, claves, colecciones ni contratos de sincronización.


## 2026-09-26 — Invitaciones Fase 1: catálogo y vista previa
- Se reconstruye el módulo administrativo de Invitaciones dentro del shell reestructurado con una sola implementación responsive.
- El catálogo visible incorpora las invitaciones publicadas 0 a 7 y marca la Invitación 0 como principal.
- Se conserva el patrón funcional del módulo original: selector de modelos, vista previa móvil, tamaños 360×800, 390×844 y 430×932, recarga, copia de enlace y apertura aparte.
- Las plantillas públicas continúan separadas en Wedding; no se duplican ni migran sus HTML, scripts o recursos al núcleo nuevo.
- El módulo no crea persistencia, no modifica localStorage y no toca Firebase, Firestore, Storage, Auth, reglas ni datos reales.
- La presentación se homologa con las cabeceras y superficies actuales de Mi Lu Gran Día, sin !important y con cleanup de listeners y del iframe.


## 2026-09-26 — Música Fase 1: módulo administrativo de lectura
- Se crea el módulo independiente Música dentro del shell reestructurado.
- La primera fase es deliberadamente de solo lectura: consume el mismo snapshot RSVP ya utilizado por Invitados y no crea una segunda persistencia musical.
- Se muestran solicitudes, canciones únicas, participantes, canción más solicitada, búsqueda y agrupación de duplicados por canción/artista.
- Se conserva el acceso a la vista pública Solo Música mediante el token RSVP existente.
- No se modifica Firebase, Firestore, Storage, Auth, reglas, esquema ni datos; tampoco se crea una clave local paralela.
- La interfaz replica la familia visual y responsive consolidada en Invitados/Checklist/Proveedores.


## 2026-09-26 — Música: enriquecimiento visual de catálogo
- Las solicitudes RSVP permanecen como fuente original e inmutable; el reconocimiento musical es solo una capa visual en memoria.
- Se consulta el iTunes Search API de Apple desde el navegador para intentar reconocer título + artista y obtener nombre canónico, álbum, portada y enlace de tienda, sin credenciales ni secretos embebidos.
- Las búsquedas usan storefront PE, máximo 5 candidatos, puntuación conservadora por coincidencia de título/artista, caché solo en memoria y hasta 3 consultas concurrentes.
- Si no existe coincidencia suficiente o la API falla, la tarjeta conserva exactamente el texto RSVP original y sigue funcionando sin portada.
- Las portadas enlazan al contenido de Apple; no se guardan en Storage, Firestore ni localStorage.
- Spotify queda pendiente de una integración backend segura: su Web API requiere OAuth y las credenciales de aplicación no deben exponerse en GitHub Pages.

## 2026-09-26 — Música: estabilización del catálogo externo
- Se crea `src/services/music-catalog.js` como único adaptador del catálogo musical externo.
- La consulta a iTunes Search deja de ejecutarse con `fetch` directo desde la UI y pasa a JSONP compatible con navegación cross-site.
- El adaptador usa caché solo en memoria, timeout, cleanup y una cola espaciada para evitar ráfagas de solicitudes.
- Música conserva las respuestas RSVP como fuente canónica; portada, título oficial, artista, álbum y enlace son únicamente enriquecimiento visual.
- Las tarjetas se actualizan progresivamente a medida que responde el catálogo, con portada más visible y estados diferenciados entre búsqueda y resultado sin coincidencia.
- Se elimina el estado permanente “Buscando coincidencia…” cuando la consulta ya terminó.
- Se incrementan las versiones de carga del JS/CSS de Música para evitar servir la implementación anterior desde caché.
- No se modifica Firebase, Firestore, Storage, Auth, reglas, usuarios, documentos, colecciones, `customData.mgdMusic`, Wedding ni las invitaciones públicas.

## 2026-09-26 — Música: homologación responsive de tarjetas enriquecidas
- Se corrige únicamente la presentación móvil de Música; no cambia la lógica de catálogo ni el contrato RSVP.
- La carátula móvil deja de comprimirse a 48 px y pasa a 70 px para mantener una presencia visual equivalente a escritorio.
- Título, artista, álbum y enlace externo mantienen jerarquía visible en pantallas pequeñas; el enlace se presenta como acción compacta y táctil.
- El bloque “Solicitada por” ocupa el ancho completo de la tarjeta en móvil para evitar que quede comprimido bajo una sola columna.
- Se permite salto de línea en título, álbum, invitados y dedicatoria para evitar truncamientos innecesarios.
- Se incrementa la versión CSS de Música para invalidar caché; no se modifica Firebase, Firestore, Storage, Wedding ni datos reales.

## 2026-09-26 — Música: ajuste responsive fino 360–430 px
- Se rehace la composición móvil de las tarjetas de Música para 360, 390 y 430 px sin alterar escritorio.
- La carátula se mantiene protagonista (82 px base móvil, 76 px a 430 px y 70 px a 390 px) en vez de comportarse como un icono reducido.
- Se elevan tamaños mínimos de título, artista, álbum, estados y acciones para evitar el aspecto microscópico de la versión anterior.
- El enlace de canción pasa a una acción táctil de 28 px de alto; título, álbum, invitados y dedicatoria permiten salto de línea.
- El bloque de solicitud ocupa el ancho completo bajo la carátula y se ajustan separaciones, radios y sombras para conservar la jerarquía visual de escritorio.
- Se mantiene sin cambios la integración de catálogo, RSVP y cualquier persistencia. Se sube Música CSS a v5 para invalidar caché.

## 2026-09-26 — Música: álbum visible en responsive
- Se mantiene el álbum de la coincidencia musical también en móvil y se refuerza su jerarquía visual.
- En responsive el álbum se muestra explícitamente con la etiqueta “ÁLBUM”, sin recorte por overflow ni ellipsis y con contraste legible.
- Desktop conserva la presentación compacta existente; el cambio visual destacado aplica a pantallas móviles.
- Se incrementan las versiones de carga de Música JS/CSS para invalidar caché.
- No cambia la consulta al catálogo, RSVP, Firebase, Firestore, Storage ni datos reales.

## 2026-09-26 — Música: álbum robusto en móvil
- Se reemplaza el álbum renderizado como elemento `small` por un bloque semántico propio dentro de la tarjeta enriquecida.
- En responsive el álbum se presenta como bloque visible con etiqueta “ÁLBUM”, nombre en negrita moderada, fondo y borde sutiles, evitando que reglas tipográficas o de elementos secundarios lo hagan imperceptible.
- El nombre del álbum admite varias líneas y corte seguro de palabras largas; no usa ellipsis en móvil.
- Desktop conserva la visual compacta; no se altera la lógica de catálogo ni la fuente RSVP.
- Se incrementan Música JS a v4 y CSS a v7 para invalidar caché.

## 2026-09-26 — Música: matching tolerante y fallback por título
- Se corrige el reconocimiento de canciones cuyos artistas RSVP vienen parciales o incompletos frente al catálogo externo.
- El puntaje de artista acepta coincidencias por inclusión y solapamiento de tokens sin rebajar una coincidencia exacta de título.
- Si la búsqueda título + artista no alcanza el umbral, el adaptador realiza una segunda búsqueda solo por título y vuelve a puntuar los candidatos con el artista original como referencia.
- Esto permite reconocer casos como “Dichavate / Ya ice dilan” frente a la ficha de catálogo con múltiples artistas, conservando intacto el texto RSVP original.
- El enriquecimiento sigue siendo solo visual en memoria; no cambia Firebase, Firestore, Storage, RSVP ni datos reales.
- Se incrementan music-catalog a v2 y Música JS a v5 para invalidar caché.

## 2026-09-26 — Música: bloque de álbum siempre visible en responsive
- El bloque ÁLBUM deja de depender de que exista una coincidencia de catálogo para renderizarse.
- Cuando existe coincidencia se muestra el nombre real del álbum; cuando aún no existe, se muestra “Pendiente de identificar” en el mismo espacio.
- Esto evita que la tarjeta móvil cambie de estructura o parezca incompleta mientras el catálogo responde o cuando no existe coincidencia.
- El estado pendiente usa una presentación visual secundaria sin ocultar la sección.
- Se incrementan Música JS a v6 y CSS a v8 para invalidar caché; no se modifica RSVP, Firebase ni datos reales.

## 2026-09-26 — Música: corrección estructural del álbum en responsive
- Se elimina el selector genérico `.music-admin-song > div`, que afectaba tanto al encabezado como al bloque de álbum y provocaba comportamientos distintos en móvil.
- El encabezado de canción pasa a usar la clase explícita `.music-admin-song-head`; el álbum conserva su propio bloque independiente y ancho completo.
- Se retira el texto artificial “Pendiente de identificar”: el álbum solo se muestra cuando existe un álbum real devuelto por el catálogo.
- Desktop y responsive usan el mismo dato y el mismo markup; únicamente cambia la distribución CSS por breakpoint.
- Se incrementan Música JS a v7 y CSS a v9 para invalidar caché. No se modifica RSVP, Firebase ni persistencia.

## 2026-09-26 — Música: responsive reconstruido desde cero
- Se elimina íntegramente la implementación responsive anterior de Música, incluidas las variantes separadas para 430 px y 390 px.
- Se reconstruye una única media query móvil hasta 760 px usando la misma estructura HTML y los mismos datos que desktop; solo cambia la distribución.
- La tarjeta usa una sola cuadrícula fluida, con carátula dimensionada mediante `clamp()`, bloque de canción sin overflow y álbum como bloque visible de ancho completo dentro de la información musical.
- Se eliminan reglas móviles superpuestas por breakpoint; no se añade `!important`, no existe segunda implementación móvil y no se modifica JavaScript ni lógica de catálogo.
- Se mantiene el bloque “Solicitada por” a ancho completo debajo del contenido musical.
- Se incrementa Música CSS a v10 para invalidar caché. No se modifica RSVP, Firebase, Firestore, Storage ni datos reales.

