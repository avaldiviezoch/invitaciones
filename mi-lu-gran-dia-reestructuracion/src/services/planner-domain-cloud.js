import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { auth, db } from './firebase-client.js';
import {
  DOMAIN_SCHEMA_VERSION,
  getPlannerDomain,
  isPlannerDomainMigrated,
  plannerDomainEntryId
} from './planner-domain-map.js';

function domainEntryRef(context, storageKey) {
  if (!auth.currentUser || !context?.id) throw new Error('No hay una boda activa.');
  const domain = getPlannerDomain(storageKey);
  const entryId = plannerDomainEntryId(storageKey);
  if (!entryId) throw new Error('Clave de dominio inválida.');
  return doc(db, 'weddings', context.id, 'domainData', domain, 'entries', entryId);
}

async function readPlannerDomainEntry(context, storageKey) {
  if (!isPlannerDomainMigrated(storageKey)) return { exists: false, value: null };
  const snapshot = await getDoc(domainEntryRef(context, storageKey));
  if (!snapshot.exists()) return { exists: false, value: null };
  return {
    exists: true,
    value: snapshot.data()?.value ?? null,
    schemaVersion: Number(snapshot.data()?.schemaVersion || 0)
  };
}

async function writePlannerDomainShadow(context, storageKey, value) {
  if (!isPlannerDomainMigrated(storageKey)) return false;
  await setDoc(domainEntryRef(context, storageKey), {
    storageKey: plannerDomainEntryId(storageKey),
    domain: getPlannerDomain(storageKey),
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    value,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return true;
}

async function writePlannerDomainShadowEntries(context, entries) {
  const candidates = Object.entries(entries || {})
    .filter(([storageKey]) => isPlannerDomainMigrated(storageKey));
  if (!candidates.length) return { attempted: 0, fulfilled: 0 };

  const results = await Promise.allSettled(
    candidates.map(([storageKey, value]) =>
      writePlannerDomainShadow(context, storageKey, value)
    )
  );

  return {
    attempted: results.length,
    fulfilled: results.filter((result) => result.status === 'fulfilled').length
  };
}

export {
  readPlannerDomainEntry,
  writePlannerDomainShadow,
  writePlannerDomainShadowEntries
};
