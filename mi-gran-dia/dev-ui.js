/*
 * MI GRAN DÍA · CAPA DEV DE INTERFAZ
 * -----------------------------------------------
 * Usar únicamente para UI, navegación, componentes y comportamiento visual.
 *
 * PROHIBIDO DESDE ESTA CAPA:
 * - inicializar/reconfigurar Firebase
 * - cambiar colecciones/documentos Firestore
 * - cambiar rutas de Storage
 * - alterar contratos de persistencia
 * - modificar localStorage/sessionStorage/IndexedDB existentes
 */

(() => {
  'use strict';
  document.documentElement.dataset.environment = 'development';
  window.MI_GRAN_DIA_DEV = Object.freeze({
    environment: 'development',
    source: 'Wedding/app_integral',
    persistencePolicy: 'protected'
  });
})();
