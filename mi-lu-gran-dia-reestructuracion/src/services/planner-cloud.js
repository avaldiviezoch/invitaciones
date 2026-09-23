import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { weddingCapabilities } from '../core/app/permissions.js';

const CHUNK_SIZE = 180000;

function chunkText(text) {
  const chunks = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) chunks.push(text.slice(index, index + CHUNK_SIZE));
  return chunks.length ? chunks : [''];
}

async function readPlannerBackup(context) {
  if (!auth.currentUser || !context?.id) throw new Error('No hay una boda activa.');
  const metaRef = doc(db, 'weddings', context.id, 'cloudSync', 'main');
  const metaSnapshot = await getDoc(metaRef);
  if (!metaSnapshot.exists()) return { backup: null, chunkCount: 0 };

  const chunkCount = Number(metaSnapshot.data()?.chunkCount || 0);
  if (!Number.isInteger(chunkCount) || chunkCount < 0 || chunkCount > 500) {
    throw new Error('La copia de Firebase tiene un formato no válido.');
  }
  if (!chunkCount) return { backup: null, chunkCount: 0 };

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      getDoc(doc(db, 'weddings', context.id, 'cloudChunks', String(index).padStart(5, '0')))
    )
  );
  const raw = chunks.map((snapshot) => snapshot.exists() ? String(snapshot.data()?.data || '') : '').join('');
  if (!raw) return { backup: null, chunkCount };

  try {
    return { backup: JSON.parse(raw), chunkCount };
  } catch {
    throw new Error('No se pudo interpretar la copia de Firebase de esta boda.');
  }
}

function parseStoredJson(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}

async function readPlannerStorageKey(context, key) {
  const { backup } = await readPlannerBackup(context);
  return parseStoredJson(backup?.localStorage?.[key]);
}

async function writePlannerStorageKey(context, key, value) {
  if (!auth.currentUser || !context?.id) throw new Error('No hay una boda activa.');
  if (!weddingCapabilities(context.role).canEdit) throw new Error('Tu acceso es de solo lectura.');

  const { backup: currentBackup, chunkCount: oldCount } = await readPlannerBackup(context);
  const backup = currentBackup && typeof currentBackup === 'object'
    ? { ...currentBackup }
    : { type: 'migrandia_cloud_backup', version: 1, localStorage: {} };

  backup.localStorage = backup.localStorage && typeof backup.localStorage === 'object'
    ? { ...backup.localStorage }
    : {};
  backup.localStorage[key] = JSON.stringify(value);

  const raw = JSON.stringify(backup);
  const chunks = chunkText(raw);
  const chunkRef = (index) => doc(db, 'weddings', context.id, 'cloudChunks', String(index).padStart(5, '0'));

  let batch = writeBatch(db);
  let operations = 0;
  const flush = async (force = false) => {
    if (operations >= 420 || (force && operations)) {
      await batch.commit();
      batch = writeBatch(db);
      operations = 0;
    }
  };

  for (let index = 0; index < chunks.length; index += 1) {
    batch.set(chunkRef(index), { index, data: chunks[index] });
    operations += 1;
    await flush();
  }
  for (let index = chunks.length; index < oldCount; index += 1) {
    batch.delete(chunkRef(index));
    operations += 1;
    await flush();
  }
  batch.set(doc(db, 'weddings', context.id, 'cloudSync', 'main'), {
    chunkCount: chunks.length,
    bytes: raw.length,
    updatedAt: serverTimestamp(),
    version: Number(backup.version || 1)
  }, { merge: true });
  operations += 1;
  await flush(true);
}

export { readPlannerStorageKey, writePlannerStorageKey };
