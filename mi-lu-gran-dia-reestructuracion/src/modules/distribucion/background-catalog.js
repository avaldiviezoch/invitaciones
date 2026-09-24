const DB_NAME = 'mi_lu_gran_dia_distribution_backgrounds';
const DB_VERSION = 1;
const BACKGROUNDS_STORE = 'backgrounds';
const PREFERENCES_STORE = 'preferences';
const DEFAULT_BACKGROUND_ID = 'venue_casa_acapulco';

const DEFAULT_BACKGROUND = Object.freeze({
  id: DEFAULT_BACKGROUND_ID,
  name: 'Casa Acapulco',
  builtin: true,
  mimeType: 'image/svg+xml'
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

function casaAcapulcoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="Plano base de Casa Acapulco">
    <rect width="1200" height="900" fill="#f5f0e8"/>
    <path d="M120 105H1050V785H120Z" fill="#ebe3d6" stroke="#756f65" stroke-width="8"/>
    <path d="M210 180H865L1015 330V690H210Z" fill="#f8f5ef" stroke="#8d867b" stroke-width="5"/>
    <path d="M210 180H470V690H210Z" fill="#d9d1c3" opacity=".72"/>
    <path d="M470 180H865L1015 330V690H470Z" fill="#e8dfcf"/>
    <path d="M470 515H1015V690H470Z" fill="#c9bda8" opacity=".7"/>
    <circle cx="845" cy="300" r="58" fill="#9da889" stroke="#65705c" stroke-width="6"/>
    <circle cx="845" cy="300" r="16" fill="#716353"/>
    <path d="M665 245L935 215L995 430L700 455Z" fill="#f4ead3" stroke="#b9a57d" stroke-width="5" stroke-dasharray="14 10"/>
    <rect x="770" y="350" width="175" height="70" rx="12" fill="#88725f"/>
    <rect x="515" y="500" width="220" height="150" rx="8" fill="#d8c39e" stroke="#9d8966" stroke-width="5"/>
    <rect x="255" y="235" width="150" height="115" rx="8" fill="#d5d0c8" stroke="#8c8780" stroke-width="4"/>
    <path d="M120 735H1050" stroke="#6f7968" stroke-width="12"/>
    <text x="250" y="220" font-family="Arial,sans-serif" font-size="26" fill="#55514c">Zona de cemento</text>
    <text x="550" y="485" font-family="Arial,sans-serif" font-size="28" fill="#665f54">Empedrado</text>
    <text x="752" y="198" font-family="Arial,sans-serif" font-size="25" fill="#786d5b">Toldo tipo vela</text>
    <text x="805" y="342" font-family="Arial,sans-serif" font-size="23" fill="#4f5d48">Árbol</text>
    <text x="817" y="393" font-family="Arial,sans-serif" font-size="24" fill="#fff">Bar</text>
    <text x="574" y="585" font-family="Arial,sans-serif" font-size="27" fill="#66583f">Área social</text>
    <text x="286" y="300" font-family="Arial,sans-serif" font-size="24" fill="#555">DJ</text>
    <text x="145" y="825" font-family="Arial,sans-serif" font-size="22" fill="#6d675e">Casa Acapulco · plano base de referencia</text>
    <text x="145" y="855" font-family="Arial,sans-serif" font-size="18" fill="#8a8378">Usa la calibración y las medidas del editor para la ubicación final.</text>
  </svg>`;
}

function defaultSource() {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(casaAcapulcoSvg())}`;
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
      visible: item?.visible !== false,
      opacity: Math.max(0.1, Math.min(1, Number(item?.opacity) || 0.45))
    };
  } catch (_) {
    return { backgroundId: DEFAULT_BACKGROUND_ID, visible: true, opacity: 0.45 };
  }
}

export async function writeDistributionBackgroundPreference(scopeId, preference) {
  const value = {
    id: preferenceId(scopeId),
    backgroundId: preference?.backgroundId || DEFAULT_BACKGROUND_ID,
    visible: preference?.visible !== false,
    opacity: Math.max(0.1, Math.min(1, Number(preference?.opacity) || 0.45))
  };
  await withStore(PREFERENCES_STORE, 'readwrite', (store) => requestValue(store.put(value)));
  return value;
}

export { DEFAULT_BACKGROUND_ID };
