import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import { weddingCapabilities } from '../core/app/permissions.js';
import { reportError } from './observability.js?v=2';
import { readPlannerDomainEntries, writePlannerDomainShadowEntries } from './planner-domain-cloud.js?v=2';
import { assessPlannerDomainEntry, summarizePlannerDomainReadiness } from './planner-domain-readiness.js?v=1';

const CHUNK_SIZE = 180000;

function createSyncToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function chunkText(text) {
  const chunks = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) chunks.push(text.slice(index, index + CHUNK_SIZE));
  return chunks.length ? chunks : [''];
}

async function readPlannerMeta(context) {
  if (!auth.currentUser || !context?.id) throw new Error('No hay una boda activa.');
  const metaRef = doc(db, 'weddings', context.id, 'cloudSync', 'main');
  try {
    const snapshot = await getDoc(metaRef);
    if (!snapshot.exists()) return { exists: false, chunkCount: 0, syncToken: '', snapshot };
    const data = snapshot.data() || {};
    return {
      exists: true,
      chunkCount: Number(data.chunkCount || 0),
      syncToken: String(data.syncToken || ''),
      snapshot
    };
  } catch (error) {
    reportError('firebase', error, { module: 'planner-cloud', operation: 'read-meta' });
    throw error;
  }
}

async function readPlannerBackup(context, meta = null) {
  const plannerMeta = meta || await readPlannerMeta(context);
  if (!plannerMeta.exists) return { backup: null, chunkCount: 0, syncToken: '' };

  const chunkCount = Number(plannerMeta.chunkCount || 0);
  if (!Number.isInteger(chunkCount) || chunkCount < 0 || chunkCount > 500) {
    throw new Error('La copia de Firebase tiene un formato no válido.');
  }
  if (!chunkCount) return { backup: null, chunkCount: 0, syncToken: plannerMeta.syncToken };

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      getDoc(doc(db, 'weddings', context.id, 'cloudChunks', String(index).padStart(5, '0')))
    )
  );
  const raw = chunks.map((snapshot) => snapshot.exists() ? String(snapshot.data()?.data || '') : '').join('');
  if (!raw) return { backup: null, chunkCount, syncToken: plannerMeta.syncToken };

  try {
    return { backup: JSON.parse(raw), chunkCount, syncToken: plannerMeta.syncToken };
  } catch {
    throw new Error('No se pudo interpretar la copia de Firebase de esta boda.');
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

  const meta = await readPlannerMeta(context);
  const domainValues = await readPlannerDomainEntries(context, requested);
  const canUseDomain = Boolean(meta.syncToken);

  const resolved = {};
  const fallbackKeys = [];

  requested.forEach((key) => {
    const candidate = domainValues[key];
    if (canUseDomain && candidate?.exists && candidate.syncToken === meta.syncToken) {
      resolved[key] = candidate.value ?? null;
    } else {
      fallbackKeys.push(key);
    }
  });

  if (fallbackKeys.length) {
    const { backup } = await readPlannerBackup(context, meta);
    const migrationEntries = {};

    fallbackKeys.forEach((key) => {
      const rawValue = backup?.localStorage?.[key];
      const parsedValue = parseStoredJson(rawValue);
      resolved[key] = parsedValue;

      if (
        canUseDomain
        && weddingCapabilities(context.role).canEdit
        && Object.prototype.hasOwnProperty.call(backup?.localStorage || {}, key)
      ) {
        migrationEntries[key] = parsedValue;
      }
    });

    if (Object.keys(migrationEntries).length) {
      void writePlannerDomainShadowEntries(context, migrationEntries, meta.syncToken)
        .catch(() => ({ attempted: 0, fulfilled: 0 }));
    }
  }

  return Object.fromEntries(requested.map((key) => [key, resolved[key] ?? null]));
}

async function inspectPlannerDomainReadiness(context, keys) {
  const requested = Array.isArray(keys) ? [...new Set(keys.map(String).filter(Boolean))] : [];
  if (!requested.length) {
    return Object.freeze({
      entries: Object.freeze({}),
      summary: summarizePlannerDomainReadiness({})
    });
  }

  const meta = await readPlannerMeta(context);
  const [{ backup }, domainValues] = await Promise.all([
    readPlannerBackup(context, meta),
    readPlannerDomainEntries(context, requested)
  ]);

  const entries = Object.fromEntries(requested.map((key) => {
    const legacyStorage = backup?.localStorage || {};
    const legacyHasValue = Object.prototype.hasOwnProperty.call(legacyStorage, key);
    const domainEntry = domainValues[key] || { exists: false, value: null, syncToken: '' };
    return [
      key,
      assessPlannerDomainEntry({
        legacyHasValue,
        legacySyncToken: meta.syncToken,
        domainEntry,
        domainError: false
      })
    ];
  }));

  return Object.freeze({
    entries: Object.freeze(entries),
    summary: summarizePlannerDomainReadiness(entries)
  });
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
  const syncToken = createSyncToken();
  const chunkRef = (index) => doc(db, 'weddings', context.id, 'cloudChunks', String(index).padStart(5, '0'));

  try {
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
        syncToken,
        version: Number(backup.version || 1)
      }, { merge: true });
    });
  } catch (error) {
    reportError('firebase', error, { module: 'planner-cloud', operation: 'write-transaction' });
    throw error;
  }

  // MGD-025 fase sombra: el backup legacy sigue siendo autoritativo.
  // La copia por dominio es best-effort y nunca invalida una escritura legacy exitosa.
  await writePlannerDomainShadowEntries(context, entries, syncToken).catch(() => ({ attempted: 0, fulfilled: 0 }));
}

async function writePlannerStorageKey(context, key, value) {
  return writePlannerStorageKeys(context, { [key]: value });
}

function subscribePlannerStorageKey(context, key, onValue, onError) {
  if (!auth.currentUser || !context?.id) return () => {};
  const metaRef = doc(db, 'weddings', context.id, 'cloudSync', 'main');
  let stopped = false;
  let initialized = false;
  let lastMetaSignature = '';
  let lastValueSignature = null;
  let readGeneration = 0;

  const readCurrentValue = async ({ notify }) => {
    const generation = ++readGeneration;
    try {
      const value = await readPlannerStorageKey(context, key);
      if (stopped || generation !== readGeneration) return;
      const valueSignature = JSON.stringify(value ?? null);
      if (lastValueSignature === null) {
        lastValueSignature = valueSignature;
        return;
      }
      if (valueSignature === lastValueSignature) return;
      lastValueSignature = valueSignature;
      if (notify) onValue?.(value);
    } catch (error) {
      if (!stopped && generation === readGeneration) {
        reportError('firebase', error, { module: 'planner-cloud', operation: 'subscription-read' });
        onError?.(error);
      }
    }
  };

  const unsubscribe = onSnapshot(metaRef, (snapshot) => {
    if (!snapshot.exists() || stopped) return;
    const meta = snapshot.data() || {};
    const updatedAt = typeof meta.updatedAt?.toMillis === 'function'
      ? meta.updatedAt.toMillis()
      : String(meta.updatedAt || '');
    const metaSignature = `${Number(meta.chunkCount || 0)}:${Number(meta.bytes || 0)}:${updatedAt}`;

    if (!initialized) {
      initialized = true;
      lastMetaSignature = metaSignature;
      void readCurrentValue({ notify: false });
      return;
    }
    if (metaSignature === lastMetaSignature) return;
    lastMetaSignature = metaSignature;
    void readCurrentValue({ notify: true });
  }, (error) => {
    if (!stopped) {
      reportError('firebase', error, { module: 'planner-cloud', operation: 'snapshot' });
      onError?.(error);
    }
  });

  return () => {
    stopped = true;
    readGeneration += 1;
    unsubscribe();
  };
}

export {
  inspectPlannerDomainReadiness,
  readPlannerStorageKey,
  readPlannerStorageKeys,
  subscribePlannerStorageKey,
  writePlannerStorageKey,
  writePlannerStorageKeys
};
