# Reglas no negociables

## 1. Datos

La prioridad absoluta es **no perder ni alterar datos existentes**.

No tocar Firebase, Firestore, Storage, autenticación, reglas, usuarios, backups ni almacenamientos locales salvo una tarea específica de integración de datos expresamente autorizada.

Un cambio de UI jamás es permiso para cambiar persistencia.

## 2. Sin parches

No se aceptan:
- parches encima de parches;
- duplicar una función para evitar arreglarla;
- nuevas capas visuales para ocultar la anterior;
- listeners duplicados;
- estilos que solo funcionen por orden accidental de carga;
- soluciones “temporales” que queden sin documentar.

Si algo debe reemplazarse, se reemplaza de forma controlada.

## 3. Sin `!important`

`!important` no se utilizará como solución de arquitectura CSS.

Si aparece un conflicto se corrige:
- alcance del selector;
- jerarquía de componentes;
- tokens;
- orden deliberado de capas;
- encapsulación del módulo.

## 4. Una fuente de verdad

Cada entidad debe tener un dueño lógico:
- invitado → Invitados;
- respuesta RSVP → Confirmaciones;
- mesa/silla → Mesas;
- posición/rotación → Distribución;
- presupuesto → Presupuesto;
- tarea → Checklist;
- evento → Cronograma.

Los módulos consumen referencias; no crean copias independientes.

## 5. Integración mediante adaptadores

Los módulos nuevos no conocerán directamente claves legacy ni detalles de Firestore.

La compatibilidad futura se hará mediante adaptadores explícitos.

## 6. Código

- sin JS grande inline;
- sin CSS grande inline;
- sin duplicar versión desktop/móvil;
- sin dependencias nuevas si HTML/CSS/JS nativo resuelve el problema;
- cleanup obligatorio de listeners, observers y timers;
- componentes compartidos antes de crear variantes.

## 7. Entrega de cada módulo

Antes de declararlo listo:
- comportamiento esperado documentado;
- responsive validado;
- accesibilidad básica;
- consola sin errores;
- sin duplicaciones;
- tests de invariantes;
- persistencia real todavía aislada, salvo autorización expresa.

## 8. Aislamiento obligatorio por boda

Todo dato operativo o personal creado dentro de Migrandia pertenece a una única boda identificada por `weddingId`. La información de una boda nunca puede aparecer, heredarse, reutilizarse ni permanecer activa al cambiar a otra boda o a otro usuario.

Esto aplica tanto a persistencia como a estado de frontend:
- Firebase/Firestore y cualquier adaptador de persistencia deben resolver los datos mediante la boda activa;
- listeners y suscripciones deben quedar vinculados a la boda activa;
- estado JavaScript, cachés y componentes montados no pueden conservar información de una boda anterior;
- operaciones asíncronas iniciadas para una boda anterior deben invalidarse al cambiar de contexto;
- al cambiar de `weddingId` o cerrar sesión, los módulos con estado propio deben ejecutar su cleanup y posteriormente cargar el nuevo contexto.

La privacidad es por **boda**, no necesariamente por usuario: varios usuarios con permisos válidos pueden trabajar sobre la misma boda.

Los únicos datos que pueden ser compartidos entre bodas son los catálogos o recursos definidos explícitamente como globales por arquitectura.

### Excepción explícita: biblioteca personal de Invitaciones

El módulo **Invitaciones** mantiene una biblioteca personal de enlaces publicada a nivel de **cuenta (`uid`)**, no a nivel de boda. Esta excepción está definida por diseño: una misma cuenta puede administrar varias bodas y conservar sus referencias de invitaciones sin duplicarlas entre bodas.

- Ruta canónica: `users/{uid}/invitations/{invitationId}`.
- El propietario del dato es el usuario autenticado (`uid`).
- Una invitación guardada por un usuario no debe aparecer para otro usuario.
- Cambiar de usuario debe desmontar la suscripción anterior y cargar exclusivamente la biblioteca del nuevo `uid`.
- Esta biblioteca no sustituye ni duplica los datos operativos propios de una boda.
- La futura creación de invitaciones también deberá definir explícitamente si el recurso pertenece a la cuenta o a una boda antes de persistirlo.

Esta es una excepción documentada al aislamiento operativo por `weddingId`; no autoriza a otros módulos a usar `uid` como sustituto de `weddingId`.

### Prueba obligatoria de aislamiento

Todo módulo que persista o mantenga estado específico de una boda debe validar como mínimo:
1. Boda A → crear dato A.
2. Boda B → comprobar que A no aparece.
3. Boda B → crear dato B.
4. Volver a Boda A → comprobar que solo aparece A.
5. Usuario A → cerrar sesión.
6. Usuario B → comprobar que ningún dato de A aparece en su boda.

No se declara un módulo listo para producción si falla cualquiera de estas pruebas.

## 9. Referencia de Firebase / Firestore

La arquitectura y reglas observadas de Firebase/Firestore están documentadas en `docs/FIREBASE_RULES.md`.

Ese documento es de referencia para desarrollo y QA y **no sustituye** el archivo realmente desplegado. No modificar ni desplegar Firebase, Firestore, Auth, Storage o Rules sin autorización explícita y sin comparar previamente la versión documentada, la versionada y la realmente desplegada.

