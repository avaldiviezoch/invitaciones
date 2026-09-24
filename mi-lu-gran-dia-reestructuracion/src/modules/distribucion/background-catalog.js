const DB_NAME = 'mi_lu_gran_dia_distribution_backgrounds';
const DB_VERSION = 1;
const BACKGROUNDS_STORE = 'backgrounds';
const PREFERENCES_STORE = 'preferences';
const DEFAULT_BACKGROUND_ID = 'venue_casa_acapulco';

const DEFAULT_BACKGROUND = Object.freeze({
  id: DEFAULT_BACKGROUND_ID,
  name: 'Casa Acapulco',
  builtin: true,
  mimeType: 'image/png'
});

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BACKGROUNDS_STORE)) {
        database.createObjectStore(BACKGROUNDS_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(PREFERENCES_STORE)) {
        database.createObjectStore(PREFERENCES_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir el catálogo local de planos.'));
  });
}

function requestValue(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo leer el catálogo local de planos.'));
  });
}

async function withStore(storeName, mode, operation) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = await operation(store);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('No se pudo actualizar el catálogo local de planos.'));
      transaction.onabort = () => reject(transaction.error || new Error('Se canceló la actualización del catálogo local de planos.'));
    });
    return result;
  } finally {
    database.close();
  }
}

function defaultSource() {
  return new URL('../../../assets/distribucion/casa-acapulco.png?v=1', import.meta.url).href;
}

function preferenceId(scopeId) {
  return `selection:${String(scopeId || 'default')}`;
}

export function defaultDistributionBackground() {
  return { ...DEFAULT_BACKGROUND, source: defaultSource() };
}

export async function listDistributionBackgrounds() {
  let custom = [];
  try {
    custom = await withStore(BACKGROUNDS_STORE, 'readonly', (store) => requestValue(store.getAll()));
  } catch (_) {
    custom = [];
  }
  return [
    defaultDistributionBackground(),
    ...custom
      .filter((item) => item?.id && item?.blob instanceof Blob)
      .map((item) => ({ id: item.id, name: item.name || 'Plano personalizado', builtin: false, mimeType: item.blob.type || '' }))
  ];
}

export async function loadDistributionBackground(id) {
  if (!id || id === DEFAULT_BACKGROUND_ID) return defaultDistributionBackground();
  const item = await withStore(BACKGROUNDS_STORE, 'readonly', (store) => requestValue(store.get(id)));
  if (!item?.blob) return defaultDistributionBackground();
  return { id: item.id, name: item.name || 'Plano personalizado', builtin: false, mimeType: item.blob.type || '', blob: item.blob };
}

export async function addDistributionBackground(file) {
  if (!(file instanceof Blob) || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('El plano debe ser PNG, JPG o WebP.');
  }
  const id = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const name = String(file.name || 'Plano personalizado').replace(/\.[^.]+$/, '').trim() || 'Plano personalizado';
  await withStore(BACKGROUNDS_STORE, 'readwrite', (store) => requestValue(store.put({ id, name, blob: file, createdAt: Date.now() })));
  return { id, name, builtin: false, mimeType: file.type };
}

export async function removeDistributionBackground(id) {
  if (!id || id === DEFAULT_BACKGROUND_ID) return false;
  await withStore(BACKGROUNDS_STORE, 'readwrite', (store) => requestValue(store.delete(id)));
  return true;
}

export async function readDistributionBackgroundPreference(scopeId) {
  try {
    const item = await withStore(PREFERENCES_STORE, 'readonly', (store) => requestValue(store.get(preferenceId(scopeId))));
    return {
      backgroundId: item?.backgroundId || DEFAULT_BACKGROUND_ID,
      visible: item?.visible !== false
    };
  } catch (_) {
    return { backgroundId: DEFAULT_BACKGROUND_ID, visible: true };
  }
}

export async function writeDistributionBackgroundPreference(scopeId, preference) {
  const value = {
    id: preferenceId(scopeId),
    backgroundId: preference?.backgroundId || DEFAULT_BACKGROUND_ID,
    visible: preference?.visible !== false
  };
  await withStore(PREFERENCES_STORE, 'readwrite', (store) => requestValue(store.put(value)));
  return value;
}

export { DEFAULT_BACKGROUND_ID };
