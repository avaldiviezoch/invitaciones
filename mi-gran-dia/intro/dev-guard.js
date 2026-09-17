(() => {
  'use strict';

  const PROD_MARKERS = [
    'migrandia.firebaseapp.com',
    'migrandia.firebasestorage.app',
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com'
  ];

  const isProductionService = (value) => {
    const url = String(value || '').toLowerCase();
    return PROD_MARKERS.some((marker) => url.includes(marker));
  };

  // Bloqueo de red defensivo. Si código DEV futuro intenta llamar al backend real,
  // la petición falla antes de salir del navegador.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (isProductionService(url)) {
      console.error('[DEV GUARD] Bloqueada petición a producción:', url);
      return Promise.reject(new Error('DEV GUARD: acceso a Firebase/Firestore de producción bloqueado'));
    }
    return nativeFetch(input, init);
  };

  const NativeXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = class DevSafeXHR extends NativeXHR {
    open(method, url, ...rest) {
      if (isProductionService(url)) {
        throw new Error('DEV GUARD: XMLHttpRequest a producción bloqueado');
      }
      return super.open(method, url, ...rest);
    }
  };

  const NativeWebSocket = window.WebSocket;
  window.WebSocket = class DevSafeWebSocket extends NativeWebSocket {
    constructor(url, protocols) {
      if (isProductionService(url)) {
        throw new Error('DEV GUARD: WebSocket a producción bloqueado');
      }
      super(url, protocols);
    }
  };

  // Impide que scripts añadidos accidentalmente importen los módulos productivos.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node?.tagName === 'SCRIPT' && isProductionService(node.src)) {
          node.remove();
          console.error('[DEV GUARD] Script productivo bloqueado:', node.src);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.MiGranDiaDev = Object.freeze({
    environment: 'development',
    productionFirebaseEnabled: false,
    productionFirestoreEnabled: false,
    productionStorageEnabled: false,
    productionAuthEnabled: false,
    productionDataWritesEnabled: false
  });

  console.info('[Mi Gran Día DEV] Aislamiento activo. Producción bloqueada.');
})();
