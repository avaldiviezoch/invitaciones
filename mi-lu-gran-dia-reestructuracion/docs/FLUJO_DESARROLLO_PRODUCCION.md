# Flujo de desarrollo y actualización a producción

## Objetivo

Este documento define el flujo obligatorio para desarrollar, revisar y publicar cambios de **Mi Gran Día** sin afectar producción ni introducir diferencias visuales o funcionales no aprobadas.

## Entornos oficiales

### Desarrollo
- Repositorio: `avaldiviezoch/invitaciones`
- Carpeta: `mi-lu-gran-dia-reestructuracion/`
- Rama de referencia: `main`
- URL de revisión visual: `https://avaldiviezoch.github.io/invitaciones/mi-lu-gran-dia-reestructuracion/`

Este entorno es el laboratorio de trabajo. Aquí se desarrollan y prueban cambios antes de pasarlos a producción.

### Producción
- Repositorio: `avaldiviezoch/Wedding`
- Carpeta: `app_integral/`
- Rama de producción: `main`
- URL temporal Cloudflare: `https://wedding.avaldiviezoch.workers.dev`
- Dominio final: `https://migrandiapp.com`

`Wedding/app_integral` debe mantenerse como gemelo funcional y visual del reestructurado aprobado.

## Reglas no negociables

1. **No desarrollar directamente sobre `Wedding/main`.**
2. **No tocar Firebase, Firestore, Storage, reglas, usuarios ni datos** salvo solicitud expresa y justificada.
3. **No sustituir assets por criterio propio.** Si desarrollo usa un PNG, imagen, video, icono o animación concreta, producción debe usar el mismo recurso.
4. Se permite cambiar únicamente la **ubicación o ruta** de un asset cuando sea necesario para hacer `app_integral` autocontenido.
5. **No usar `!important` ni parches CSS superpuestos.**
6. No introducir funciones duplicadas, estilos encima de estilos ni soluciones temporales.
7. Desktop y móvil deben mantener la misma lógica funcional.
8. Toda modificación debe respetar los documentos de arquitectura, diseño y reglas no negociables existentes.
9. Producción solo se actualiza después de una aprobación explícita del cambio en desarrollo.
10. Ante una diferencia entre desarrollo y producción, la referencia válida es la versión de desarrollo que haya sido aprobada.

## Flujo obligatorio de actualización

### 1. Desarrollo
El cambio se implementa primero en:

`invitaciones/mi-lu-gran-dia-reestructuracion/`

Aquí se corrigen bugs, se agregan funciones y se realizan cambios visuales.

### 2. Revisión visual y funcional
Antes de producción se revisa la versión de desarrollo en:

`https://avaldiviezoch.github.io/invitaciones/mi-lu-gran-dia-reestructuracion/`

Se verifica como mínimo:
- diseño;
- iconos y assets;
- animaciones y efectos;
- desktop;
- móvil;
- persistencia;
- navegación;
- integración entre módulos;
- login y permisos cuando corresponda.

### 3. Aprobación
Solo cuando el cambio sea aprobado expresamente se inicia el pase a producción.

La frase operativa será, por ejemplo:

`Pásalo a producción.`

### 4. Auditoría previa al pase
Antes de modificar `Wedding` se compara desarrollo contra producción y se identifica exactamente:
- archivos que cambian;
- archivos nuevos;
- archivos que se eliminan;
- assets involucrados;
- diferencias de rutas necesarias para producción;
- impacto sobre módulos compartidos.

No se debe migrar nada adicional que no forme parte del cambio aprobado.

### 5. Rama de producción
Se crea una rama nueva desde `Wedding/main`.

Ejemplos:
- `update-musica-AAAA-MM-DD`
- `fix-distribucion-AAAA-MM-DD`
- `update-invitados-AAAA-MM-DD`

Nunca se desarrolla directamente sobre `main`.

### 6. Migración controlada
Se copian únicamente los archivos aprobados.

Si un archivo necesita adaptar una ruta para funcionar dentro de `app_integral`, el cambio debe limitarse a esa ruta. La lógica, estilos, contenido visual y comportamiento deben permanecer iguales al desarrollo aprobado.

### 7. Validación de gemelo
Antes del merge se comprueba:
- coincidencia de código;
- coincidencia de CSS;
- coincidencia de assets;
- rutas válidas;
- ausencia de referencias rotas;
- ausencia de archivos legacy reintroducidos;
- ausencia de `!important`;
- pruebas del repositorio;
- build de GitHub;
- build de Cloudflare.

Cuando sea posible, la comparación debe hacerse por SHA o por diff exacto.

### 8. Pull Request
Todo pase a producción debe ir mediante Pull Request hacia `Wedding/main`.

El PR debe indicar:
- qué se cambió;
- qué archivos se tocaron;
- qué se dejó intacto;
- si hubo adaptación de rutas;
- resultado de validaciones.

### 9. Merge
Solo se fusiona cuando las validaciones requeridas estén correctas.

Si una validación falla, se corrige en la rama. No se debe introducir un parche en `main` para saltarse la validación.

### 10. Despliegue
Después del merge:
- GitHub Pages debe terminar correctamente;
- Cloudflare Workers debe desplegar `main`;
- se debe comprobar la versión publicada.

### 11. Validación postproducción
Se revisa la aplicación publicada comparándola con desarrollo.

Se verifica:
- iconos;
- imágenes;
- videos;
- fuentes;
- animaciones;
- efectos;
- módulos;
- login;
- responsive;
- navegación;
- datos visibles;
- interacciones principales.

Si existe una diferencia no aprobada, se considera una regresión y debe corregirse antes de continuar con nuevos desarrollos.

## Regla de assets

Los recursos visuales forman parte del comportamiento aprobado de la aplicación.

No se debe:
- cambiar PNG por SVG;
- rediseñar iconos;
- reemplazar imágenes;
- modificar colores;
- eliminar animaciones;
- optimizar visuales cambiando su apariencia;

sin aprobación expresa.

Si producción necesita ser autocontenida, se debe copiar el mismo archivo a una ruta local dentro de `app_integral/assets/`.

## Rollback

Antes de cambios estructurales importantes debe existir una referencia clara al commit estable anterior.

Si una publicación genera una regresión grave:
1. se identifica el último commit estable;
2. se revierte el cambio mediante Git;
3. se valida nuevamente;
4. se despliega la versión estable;
5. el problema se corrige después en desarrollo.

No se debe reparar producción acumulando parches improvisados.

## Principio final

**Desarrollo define el cambio. Producción replica el cambio aprobado.**

`Wedding/app_integral` no es un segundo proyecto independiente: es la versión productiva, autocontenida y validada de `mi-lu-gran-dia-reestructuracion`.
