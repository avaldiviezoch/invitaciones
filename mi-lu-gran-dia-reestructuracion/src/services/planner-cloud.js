import {
  doc,
  getDoc,
  serverTimestamp,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { weddingCapabilities } from '../core/app/permissions.js';

const CHUNK_SIZE = 180000;
const backupReadInFlight = new Map();

function chunkText(text) {
  const chunks = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) chunks.push(text.slice(index, index + CHUNK_SIZE));
  return chunks.length ? chunks : [''];
}

async function readPlannerBackup(context) {
  if (!auth.currentUser || !context?.id) throw new Error('No hay una boda activa.');
  const readKey = `${auth.currentUser.uid}:${context.id}`;
  const existing = backupReadInFlight.get(readKey);
  if (existing) return existing;

  const readPromise = (async () => {
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
  })();

  backupReadInFlight.set(readKey, readPromise);
  try {
    return await readPromise;
  } finally {
    if (backupReadInFlight.get(readKey) === readPromise) backupReadInFlight.delete(readKey);
  }
}

function parseStoredJson(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}

async function readPlannerStorageKeys(context, keys) {
  const requested = Array.isArray(keys) ? [...new Set(keys.map(String).filter(Boolean))] : [];
  if (!requested.length) return {};
  const { backup } = await readPlannerBackup(context);
  return Object.fromEntries(requested.map((key) => [key, parseStoredJson(backup?.localStorage?.[key])]));
}

async function readPlannerStorageKey(context, key) {
  const values = await readPlannerStorageKeys(context, [key]);
  return values[String(key)];
}

async function writePlannerStorageKeys(context, entries) {
  if (!auth.currentUser || !context?.id) throw new Error('No hay una boda activa.');
  if (!weddingCapabilities(context.role).canEdit) throw new Error('Tu acceso es de solo lectura.');
  if (!entries || typeof entries !== 'object' || Array.isArray(entries) || !Object.keys(entries).length) {
    throw new Error('No hay datos para guardar.');
  }

  const metaRef = doc(db, 'weddings', context.id, 'cloudSync', 'main');
  const chunkRef = (index) => doc(db, 'weddings', context.id, 'cloudChunks', String(index).padStart(5, '0'));

  await runTransaction(db, async (transaction) => {
    const metaSnapshot = await transaction.get(metaRef);
    const oldCount = metaSnapshot.exists() ? Number(metaSnapshot.data()?.chunkCount || 0) : 0;
    if (!Number.isInteger(oldCount) || oldCount < 0 || oldCount > 500) {
      throw new Error('La copia de Firebase tiene un formato no válido.');
    }

    const oldChunks = [];
    for (let index = 0; index < oldCount; index += 1) {
      oldChunks.push(await transaction.get(chunkRef(index)));
    }

    const currentRaw = oldChunks.map((snapshot) => snapshot.exists() ? String(snapshot.data()?.data || '') : '').join('');
    let currentBackup = null;
    if (currentRaw) {
      try {
        currentBackup = JSON.parse(currentRaw);
      } catch {
        throw new Error('No se pudo interpretar la copia de Firebase de esta boda.');
      }
    }

    const backup = currentBackup && typeof currentBackup === 'object'
      ? { ...currentBackup }
      : { type: 'migrandia_cloud_backup', version: 1, localStorage: {} };

    backup.localStorage = backup.localStorage && typeof backup.localStorage === 'object'
      ? { ...backup.localStorage }
      : {};

    Object.entries(entries).forEach(([key, value]) => {
      backup.localStorage[key] = JSON.stringify(value);
    });

    const raw = JSON.stringify(backup);
    const chunks = chunkText(raw);
    const operations = Math.max(oldCount, chunks.length) + 1;
    if (operations > 500) {
      throw new Error('La copia de Firebase es demasiado grande para guardarse de forma atómica.');
    }

    for (let index = 0; index < chunks.length; index += 1) {
      transaction.set(chunkRef(index), { index, data: chunks[index] });
    }
    for (let index = chunks.length; index < oldCount; index += 1) {
      transaction.delete(chunkRef(index));
    }
    transaction.set(metaRef, {
      chunkCount: chunks.length,
      bytes: raw.length,
      updatedAt: serverTimestamp(),
      version: Number(backup.version || 1)
    }, { merge: true });
  });
}

async function writePlannerStorageKey(context, key, value) {
  return writePlannerStorageKeys(context, { [key]: value });
}

export { readPlannerStorageKey, readPlannerStorageKeys, writePlannerStorageKey, writePlannerStorageKeys };
