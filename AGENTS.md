# REGLAS OBLIGATORIAS DE DESARROLLO

Este archivo debe leerse **ANTES de modificar, agregar o eliminar cualquier código** del repositorio.

## Principio general

La invitación debe construirse con **código limpio, directo y definitivo**. No se aceptan parches visuales ni soluciones temporales para ocultar errores.

## Reglas obligatorias

1. **NO PARCHES.**
   - No agregar CSS, JavaScript, HTML, imágenes, overlays, pseudo-elementos, loaders ni capas adicionales únicamente para ocultar un problema existente.
   - No resolver un error agregando otra cosa encima del error.
   - No crear excepciones improvisadas que solamente funcionen para una pantalla, dispositivo o estado concreto.

2. **CORREGIR LA CAUSA, NO EL SÍNTOMA.**
   - Si algo está mal posicionado, se corrige su estructura, layout o regla original.
   - Si una imagen está mal, se corrige la imagen, su contenedor o su lógica de renderizado; no se coloca otra imagen encima.
   - Si una sección falla, se revisa y corrige esa sección desde su implementación original.

3. **NO SOBRESCRIBIR PARA EVITAR CAMBIAR LO QUE CORRESPONDE.**
   - No duplicar selectores CSS al final del archivo para anular reglas anteriores cuando la regla original puede modificarse correctamente.
   - No duplicar funciones o lógica para reemplazar silenciosamente una implementación defectuosa.
   - No añadir `!important` como solución rápida salvo que exista una justificación técnica real y documentada.
   - No dejar código viejo activo junto con una versión nueva que haga lo mismo.

4. **SI NO FUNCIONA, SE CAMBIA BIEN.**
   - Una implementación que no funciona debe corregirse o reemplazarse de manera limpia.
   - No conservar una solución defectuosa y luego compensarla con más código.
   - Antes de agregar código nuevo, revisar si lo correcto es modificar o eliminar código existente.

5. **NADA DE CONTENIDO PARCHADO DURANTE LA CARGA.**
   - Durante la carga de la página no debe aparecer código sin estilo, contenido duplicado, imágenes de reemplazo, imágenes superpuestas ni elementos que luego desaparezcan para simular que todo funciona.
   - Evitar FOUC, flashes de contenido incorrecto y elementos temporales visibles.
   - La experiencia de carga debe mostrar únicamente el contenido real en su estado correcto.

6. **UNA SOLA FUENTE DE VERDAD.**
   - Cada componente, sección, estilo y comportamiento debe tener una implementación clara.
   - Evitar duplicados innecesarios de HTML, CSS y JavaScript.
   - No mantener versiones paralelas de una misma sección dentro de la página.

7. **CAMBIOS PUNTUALES Y CONTROLADOS.**
   - Si se solicita cambiar una sección, no modificar otras secciones ya aprobadas salvo que sea técnicamente indispensable.
   - No rediseñar elementos que no fueron solicitados.
   - Conservar funcionalidades existentes que no formen parte del cambio solicitado.

8. **RESPONSIVE REAL.**
   - La solución debe funcionar correctamente en móvil y escritorio mediante layout responsive real.
   - No crear una segunda página escondida, una captura o una composición distinta para aparentar responsive.
   - Evitar medidas rígidas que solo funcionen en un tamaño específico de pantalla.

9. **IMÁGENES REALES, NO CAPAS DE CORRECCIÓN.**
   - No duplicar fotografías para cubrir huecos o errores de recorte.
   - No colocar capturas de secciones completas como sustituto de HTML/CSS cuando esa sección debe ser código.
   - Los recursos visuales decorativos sí pueden ser imágenes, pero no deben utilizarse para esconder errores de maquetación.

10. **LIMPIEZA ANTES DE TERMINAR.**
    - Eliminar código muerto, reglas reemplazadas, pruebas temporales y recursos sin uso.
    - Revisar que no existan duplicaciones accidentales.
    - Verificar la página en móvil antes de considerar terminado un cambio visual.

## Flujo obligatorio antes de programar

Antes de realizar cualquier cambio:

1. Leer este `AGENTS.md` completo.
2. Revisar la estructura y el código actual relacionado con el cambio.
3. Identificar la causa del problema.
4. Modificar la implementación original de forma limpia.
5. Probar que el cambio no rompa lo ya aprobado.
6. Eliminar cualquier código temporal utilizado durante la prueba.

## Regla final

> **Si para solucionar algo parece necesario poner un parche encima, detenerse y revisar la causa original. El repositorio debe quedar más limpio después de cada cambio, no más complicado.**
