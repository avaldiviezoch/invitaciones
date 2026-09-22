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
