import { auth } from '../../services/firebase-client.js';

const DB_NAME = 'mi_lu_gran_dia_distribution_backgrounds';
const DB_VERSION = 2;
const BACKGROUNDS_STORE = 'backgrounds_v2';
const NONE_BACKGROUND_ID = '';
const LEGACY_DEFAULT_BACKGROUND_ID = 'venue_casa_acapulco';

const BUILTIN_ASSET_ROOT = 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_0/assets/espacios%20de%20distribucion/';
const BUILTIN_BACKGROUNDS = Object.freeze([
  { id:'venue_beach', name:'Playa', group:'Playa y mar', file:'Playa.png' },
  { id:'venue_beach_resort', name:'Playa en complejo turístico', group:'Playa y mar', file:'playa_en_complejo_turistico.png' },
  { id:'venue_seaside_terrace', name:'Terraza frente al mar', group:'Playa y mar', file:'terraza_frente_al_mar.png' },
  { id:'venue_rustic_area', name:'Área rústica', group:'Campo y bosque', file:'area_rustica.png' },
  { id:'venue_forest', name:'Bosque', group:'Campo y bosque', file:'bosque.png' },
  { id:'venue_forest_2', name:'Bosque · opción 2', group:'Campo y bosque', file:'bosque_2.png' },
  { id:'venue_country_1', name:'Casa de campo · opción 1', group:'Casas y jardines', file:'casa de campo1.png' },
  { id:'venue_country_2', name:'Casa de campo · opción 2', group:'Casas y jardines', file:'casa de campo2.png' },
  { id:'venue_country_3', name:'Casa de campo · opción 3', group:'Casas y jardines', file:'casa de campo3.png' },
  { id:'venue_stone_house', name:'Casa con empedrado', group:'Casas y jardines', file:'casa_empedrada.png' },
  { id:'venue_large_garden', name:'Casa con jardín grande', group:'Casas y jardines', file:'casa_jardin_grande.png' },
  { id:'venue_path_patio', name:'Patio con camino', group:'Patios', file:'patio_con camino.png' },
  { id:'venue_front_patio', name:'Patio con entrada frontal', group:'Patios', file:'patio_con_entrada_frontal.png' },
  { id:'venue_farm_patio', name:'Patio de granja', group:'Patios', file:'patio_granja.png' },
  { id:'venue_backyard', name:'Patio trasero', group:'Patios', file:'patio_trasero.png' },
  { id:'venue_backyard_2', name:'Patio trasero · opción 2', group:'Patios', file:'patio_trasero_2.png' },
  { id:'venue_pool_backyard', name:'Patio trasero con piscina', group:'Patios', file:'patrio_trasero_con_piscina.png' },
  { id:'venue_rooftop', name:'Rooftop', group:'Terrazas', file:'rofftop.png' },
  { id:'venue_event_hall', name:'Salón de eventos interior', group:'Salones', file:'salon de eventos interior.png' },
  { id:'venue_rustic_hall_1', name:'Salón rústico · opción 1', group:'Salones', file:'salon rustico1.png' },
  { id:'venue_rustic_hall_2', name:'Salón rústico · opción 2', group:'Salones', file:'salon rustico2.png' },
  { id:'venue_rustic_hall_3', name:'Salón rústico · opción 3', group:'Salones', file:'salon rustico3.png' },
  { id:'venue_rustic_hall_4', name:'Salón rústico · opción 4', group:'Salones', file:'salon rustico4.png' },
  { id:'venue_rustic_hall_5', name:'Salón rústico · opción 5', group:'Salones', file:'salon rustico5.png' }
]);

function currentUid() {
  return auth.currentUser?.uid || '';
}

function personalKey(id) {
  const uid = currentUid();
  if (!uid || !id) throw new Error('No hay usuario autenticado para el catálogo personal.');
  return `${uid}::${id}`;
}

function builtinSource(file) {
  return BUILTIN_ASSET_ROOT + encodeURIComponent(file).replaceAll('%2F', '/');
}

function builtinBackgrounds() {
  return BUILTIN_BACKGROUNDS.map((item) => ({ ...item, builtin:true, mimeType:'image/png', source:builtinSource(item.file) }));
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BACKGROUNDS_STORE)) {
        database.createObjectStore(BACKGROUNDS_STORE, { keyPath: 'key' });
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

async function withStore(mode, operation) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(BACKGROUNDS_STORE, mode);
    const store = transaction.objectStore(BACKGROUNDS_STORE);
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

export function listDistributionBackgrounds() {
  return (async () => {
    let custom = [];
    const uid = currentUid();
    if (uid) {
      try {
        custom = await withStore('readonly', (store) => requestValue(store.getAll()));
      } catch (_) {
        custom = [];
      }
    }
    return [
      ...builtinBackgrounds(),
      ...custom
        .filter((item) => item?.ownerUid === uid && item?.id && item?.blob instanceof Blob)
        .map((item) => ({
          id: item.id,
          name: item.name || 'Plano personalizado',
          builtin: false,
          mimeType: item.blob.type || ''
        }))
    ];
  })();
}

export async function loadDistributionBackground(id) {
  if (!id) return null;
  const builtin = builtinBackgrounds().find((item) => item.id === id);
  if (builtin) return builtin;
  const uid = currentUid();
  if (!uid) return null;
  const item = await withStore('readonly', (store) => requestValue(store.get(personalKey(id))));
  if (!item?.blob || item.ownerUid !== uid) return null;
  return { id: item.id, name: item.name || 'Plano personalizado', builtin: false, mimeType: item.blob.type || '', blob: item.blob };
}

export async function addDistributionBackground(file) {
  if (!(file instanceof Blob) || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('El plano debe ser PNG, JPG o WebP.');
  }
  const uid = currentUid();
  if (!uid) throw new Error('Debes iniciar sesión para guardar un plano personal.');
  const id = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const name = String(file.name || 'Plano personalizado').replace(/\.[^.]+$/, '').trim() || 'Plano personalizado';
  await withStore('readwrite', (store) => requestValue(store.put({
    key: personalKey(id),
    id,
    ownerUid: uid,
    name,
    blob: file,
    createdAt: Date.now()
  })));
  return { id, name, builtin: false, mimeType: file.type };
}

export async function removeDistributionBackground(id) {
  if (!id || BUILTIN_BACKGROUNDS.some((item) => item.id === id)) return false;
  const uid = currentUid();
  if (!uid) return false;
  await withStore('readwrite', (store) => requestValue(store.delete(personalKey(id))));
  return true;
}

export { NONE_BACKGROUND_ID, LEGACY_DEFAULT_BACKGROUND_ID };
