import { db } from './firebase-client.js';
import { weddingCapabilities } from '../core/app/permissions.js';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

function cleanText(value, max = 300) {
  return String(value ?? '').trim().slice(0, max);
}

function requireContext(context) {
  if (!context?.id) throw new Error('No hay una boda activa disponible para RSVP.');
  return context;
}

function requireEditor(context) {
  requireContext(context);
  if (!weddingCapabilities(context.role).canEdit) {
    throw new Error('Tu acceso es de solo lectura.');
  }
  return context;
}

function responseFromSnap(snap) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    ...data,
    submittedAtDate: data.submittedAt?.toDate?.() || null,
    updatedAtDate: data.updatedAt?.toDate?.() || null
  };
}

function isMusicOnlyResponse(item) {
  return item?.source === 'music-widget' && !item?.attendance && !cleanText(item?.name);
}

function managementDocId(token, responseId) {
  return `${cleanText(token, 180)}__${cleanText(responseId, 180)}`;
}

async function loadRsvpAdminSnapshot(context) {
  requireContext(context);
  const configSnap = await getDoc(doc(db, 'weddings', context.id, 'rsvpConfig', 'main'));
  if (!configSnap.exists()) return { config: null, token: '', responses: [], musicResponses: [], management: [] };

  const config = { ...(configSnap.data() || {}) };
  const token = cleanText(config.token, 160);
  if (!token) return { config, token: '', responses: [], musicResponses: [], management: [] };

  const responseRequest = (async () => {
    try {
      return await getDocs(query(collection(db, 'publicRsvp', token, 'responses'), orderBy('submittedAt', 'desc')));
    } catch {
      return getDocs(collection(db, 'publicRsvp', token, 'responses'));
    }
  })();
  const managementRequest = getDocs(collection(db, 'weddings', context.id, 'rsvpManagement'));
  const [responseSnaps, managementSnaps] = await Promise.all([responseRequest, managementRequest]);
  const allResponses = responseSnaps.docs.map(responseFromSnap);
  const responses = allResponses
    .filter((item) => !isMusicOnlyResponse(item))
    .sort((a, b) => {
      const ta = a.submittedAtDate?.getTime?.() || a.updatedAtDate?.getTime?.() || new Date(a.clientDate || 0).getTime() || 0;
      const tb = b.submittedAtDate?.getTime?.() || b.updatedAtDate?.getTime?.() || new Date(b.clientDate || 0).getTime() || 0;
      return tb - ta;
    });

  const management = managementSnaps.docs
    .map((snap) => ({ id: snap.id, ...(snap.data() || {}) }))
    .filter((item) => item.token === token);

  const musicResponses = allResponses.filter((item) => Boolean(item?.customData?.mgdMusic) && (item?.attendance === 'confirmed' || item?.source === 'music-widget'));

  return { config, token, responses, musicResponses, management };
}

async function saveRsvpManagement(context, token, responseId, input = {}) {
  requireEditor(context);
  const linkedGuestIds = Array.isArray(input.linkedGuestIds)
    ? [...new Set(input.linkedGuestIds.map((item) => cleanText(item, 180)).filter(Boolean))].slice(0, 40)
    : [];
  const side = ['novio','novia','ambos'].includes(input.side) ? input.side : '';
  const group = ['familia','amigos','trabajo','otros'].includes(input.group) ? input.group : '';
  const payload = {
    version: 1,
    token: cleanText(token, 160),
    responseId: cleanText(responseId, 180),
    weddingId: context.id,
    side,
    group,
    familyLabel: cleanText(input.familyLabel, 100),
    linkedGuestIds,
    reviewed: true,
    updatedAt: serverTimestamp()
  };

  await setDoc(
    doc(db, 'weddings', context.id, 'rsvpManagement', managementDocId(token, responseId)),
    payload,
    { merge: true }
  );
  return payload;
}

async function deleteRsvpManagement(context, token, responseId) {
  requireEditor(context);
  await deleteDoc(doc(db, 'weddings', context.id, 'rsvpManagement', managementDocId(token, responseId)));
}

async function restoreRsvpManagement(context, token, responseId, previous) {
  requireEditor(context);
  const ref = doc(db, 'weddings', context.id, 'rsvpManagement', managementDocId(token, responseId));
  if (previous && typeof previous === 'object') {
    const { id: _memoryId, ...stored } = previous;
    await setDoc(ref, { ...stored, updatedAt: serverTimestamp() }, { merge: false });
    return;
  }
  await deleteDoc(ref);
}

export { loadRsvpAdminSnapshot, saveRsvpManagement, deleteRsvpManagement, restoreRsvpManagement };