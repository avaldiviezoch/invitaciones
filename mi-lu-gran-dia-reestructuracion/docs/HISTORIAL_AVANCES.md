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
