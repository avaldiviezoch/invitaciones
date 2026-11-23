import { db } from './firebase-client.js';
import { weddingCapabilities } from '../core/app/permissions.js';
import { loadInvitadosSnapshot, saveInvitadosSnapshot, guestStatus } from '../modules/invitados/invitados-data.js';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch
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

const DEFAULT_MUSIC_CONFIG = Object.freeze({
  enabled: true,
  title: 'La música también la eligen ustedes',
  intro: 'Ayúdanos a preparar la fiesta. Déjanos las canciones que te gustaría escuchar para tenerlas en cuenta con el DJ o grupo y que ese día solo tengas que disfrutar.',
  maxSongs: 5,
  askArtist: true,
  askMessage: true,
  messageLabel: 'Mensaje o dedicatoria (opcional)'
});

function normalizeMusicConfig(value = {}) {
  return {
    enabled: value.enabled !== false,
    title: cleanText(value.title || DEFAULT_MUSIC_CONFIG.title, 110) || DEFAULT_MUSIC_CONFIG.title,
    intro: cleanText(value.intro || DEFAULT_MUSIC_CONFIG.intro, 500) || DEFAULT_MUSIC_CONFIG.intro,
    maxSongs: Math.max(1, Math.min(10, Math.floor(Number(value.maxSongs) || DEFAULT_MUSIC_CONFIG.maxSongs))),
    askArtist: value.askArtist !== false,
    askMessage: value.askMessage !== false,
    messageLabel: cleanText(value.messageLabel || DEFAULT_MUSIC_CONFIG.messageLabel, 90) || DEFAULT_MUSIC_CONFIG.messageLabel
  };
}

function managementDocId(token, responseId) {
  return `${cleanText(token, 180)}__${cleanText(responseId, 180)}`;
}

async function loadRsvpAdminSnapshot(context) {
  requireContext(context);
  const configSnap = await getDoc(doc(db, 'weddings', context.id, 'rsvpConfig', 'main'));
  if (!configSnap.exists()) return { config: null, token: '', responses: [], musicResponses: [], management: [] };

  const config = { ...(configSnap.data() || {}), musicConfig: normalizeMusicConfig(configSnap.data()?.musicConfig || {}) };
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

async function saveRsvpMusicConfig(context, input = {}) {
  requireEditor(context);
  const privateRef = doc(db, 'weddings', context.id, 'rsvpConfig', 'main');
  const current = await getDoc(privateRef);
  if (!current.exists()) throw new Error('RSVP aún no está configurado para esta boda.');
  const token = cleanText(current.data()?.token, 160);
  const musicConfig = normalizeMusicConfig(input);
  const batch = writeBatch(db);
  batch.set(privateRef, { musicConfig, updatedAt: serverTimestamp() }, { merge: true });
  if (token) batch.set(doc(db, 'publicRsvp', token), { musicConfig, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  return { token, musicConfig };
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

// Gestionar el vínculo con los datos canónicos de Invitados, no con la vista de diagnóstico.
function withoutRsvpLink(guest, responseId, attendance = '') {
  if (String(guest?.rsvpResponseId || '') !== String(responseId)) return { ...guest };
  const updated = { ...guest };
  const expectedStatus = attendance === 'confirmed' ? 'confirmed'
    : attendance === 'declined' ? 'declined'
    : attendance === 'tentative' ? 'tentative' : '';
  // Solo revertir el estado que coincide con la respuesta anulada.
  // No convertir a pendiente un estado manual diferente al RSVP original.
  if (expectedStatus && guestStatus(updated) === expectedStatus) updated.status = 'pending';
  for (const key of ['rsvpResponseId', 'rsvpResponseName', 'rsvpGroup', 'rsvpFamilyLabel', 'rsvpTags', 'rsvpLinkedAt']) {
    delete updated[key];
  }
  updated.notes = String(updated.notes || '').split('\n')
    .filter((line) => !line.trim().startsWith('[RSVP]')).join('\n').trim();
  return updated;
}

function canonicalCopy(snapshot) {
  const original = snapshot?.canonical;
  if (!original || !Array.isArray(original.guests)) throw new Error('No se pudo leer la lista canónica de invitados.');
  return { ...original, guests: original.guests.map((guest) => ({ ...guest })) };
}

async function deleteRsvpResponseExceptional(context, token, responseId) {
  requireEditor(context);
  const safeToken = cleanText(token, 160);
  const safeResponseId = cleanText(responseId, 180);
  if (!safeToken || !safeResponseId) throw new Error('No se pudo identificar la respuesta RSVP a eliminar.');
  const activeConfig = await getDoc(doc(db, 'weddings', context.id, 'rsvpConfig', 'main'));
  if (!activeConfig.exists() || cleanText(activeConfig.data()?.token, 160) !== safeToken) {
    throw new Error('El token RSVP no pertenece a la boda activa. Actualiza las confirmaciones antes de eliminar.');
  }
  const responseRef = doc(db, 'publicRsvp', safeToken, 'responses', safeResponseId);
  const managementRef = doc(db, 'weddings', context.id, 'rsvpManagement', managementDocId(safeToken, safeResponseId));
  const [responseSnap, managementSnap, guestSnapshot] = await Promise.all([
    getDoc(responseRef), getDoc(managementRef), loadInvitadosSnapshot(context)
  ]);
  if (!responseSnap.exists()) throw new Error('La respuesta RSVP ya no existe. Actualiza el diagnóstico.');
  const original = canonicalCopy(guestSnapshot);
  const changed = canonicalCopy(guestSnapshot);
  const attendance = cleanText(responseSnap.data()?.attendance, 30);
  const linkedIds = new Set(Array.isArray(managementSnap.data()?.linkedGuestIds)
    ? managementSnap.data().linkedGuestIds.map(String) : []);
  const affected = changed.guests.filter((guest) => String(guest.rsvpResponseId || '') === safeResponseId);
  // Un vínculo administrativo sin metadata canónica no autoriza cambiar un estado manual.
  changed.guests = changed.guests.map((guest) =>
    String(guest.rsvpResponseId || '') === safeResponseId
      ? withoutRsvpLink(guest, safeResponseId, attendance) : guest
  );
  let guestSaved = false;
  try {
    if (affected.length) {
      await saveInvitadosSnapshot(context, changed);
      guestSaved = true;
    }
    const batch = writeBatch(db);
    batch.delete(responseRef);
    batch.delete(managementRef);
    await batch.commit();
  } catch (error) {
    if (guestSaved) {
      try {
        await saveInvitadosSnapshot(context, original);
      } catch (rollbackError) {
        throw new Error('No se pudo completar la eliminación y la restauración automática de Invitados falló. Detén las modificaciones y revisa los datos. ' + (rollbackError?.message || ''));
      }
    }
    throw error;
  }
  return { unlinkedGuestIds: affected.map((guest) => String(guest.id)), managementLinkedIds: [...linkedIds] };
}

function withoutOrphanRsvpLink(guest) {
  const next = { ...guest };
  const hasRsvpEvidence = Boolean(guest.rsvpLinkedAt)
    || String(guest.notes || '').split('\n').some((line) => line.trim().startsWith('[RSVP]'));
  if (hasRsvpEvidence && guestStatus(next) === 'confirmed') next.status = 'pending';
  for (const key of ['rsvpResponseId', 'rsvpResponseName', 'rsvpGroup', 'rsvpFamilyLabel', 'rsvpTags', 'rsvpLinkedAt']) delete next[key];
  next.notes = String(next.notes || '').split('\n').filter((line) => !line.trim().startsWith('[RSVP]')).join('\n').trim();
  return next;
}

async function verifyRsvpGuestAvailability(context, token, responseId, guestIds = []) {
  requireEditor(context);
  const safeToken = cleanText(token, 160);
  const targetId = cleanText(responseId, 180);
  const ids = [...new Set(guestIds.map(id => cleanText(id, 180)).filter(Boolean))];
  if (!safeToken || !targetId || !ids.length || ids.length > 40) {
    throw new Error('La selección de invitados RSVP no es válida.');
  }
  const [config, snapshot, target] = await Promise.all([
    getDoc(doc(db, 'weddings', context.id, 'rsvpConfig', 'main')),
    loadInvitadosSnapshot(context),
    getDoc(doc(db, 'publicRsvp', safeToken, 'responses', targetId))
  ]);
  if (!config.exists() || cleanText(config.data()?.token, 160) !== safeToken || !target.exists()) {
    throw new Error('La configuración o respuesta RSVP cambió. Actualiza las confirmaciones.');
  }
  const guests = new Map(snapshot.canonical.guests.map(g => [String(g.id), g]));
  const oldIds = new Set();
  for (const id of ids) {
    const guest = guests.get(id);
    if (!guest) throw new Error('La lista de invitados cambió. Actualízala antes de vincular.');
    const oldId = cleanText(guest.rsvpResponseId, 180);
    if (oldId && oldId !== targetId) oldIds.add(oldId);
  }
  const existing = await Promise.all([...oldIds].map(id =>
    getDoc(doc(db, 'publicRsvp', safeToken, 'responses', id))
  ));
  if (existing.some(item => item.exists())) {
    throw new Error('Alguno de los invitados está vinculado a una confirmación vigente. No se modificó ningún vínculo.');
  }
  const management = await getDocs(collection(db, 'weddings', context.id, 'rsvpManagement'));
  const activeOwners = management.docs.map(item => item.data() || {})
    .filter(item => item.token === safeToken && String(item.responseId || '') !== targetId
      && Array.isArray(item.linkedGuestIds) && item.linkedGuestIds.some(id => ids.includes(String(id))));
  if (activeOwners.length) {
    const active = await Promise.all(activeOwners.map(item =>
      getDoc(doc(db, 'publicRsvp', safeToken, 'responses', String(item.responseId)))
    ));
    if (active.some(item => item.exists())) {
      throw new Error('Alguno de los invitados sigue vinculado a otra respuesta vigente.');
    }
  }
  return { availableGuestIds: ids };
}

async function releaseOrphanedRsvpGuest(context, guestId, expectedResponseId) {
  requireEditor(context);
  const id = cleanText(guestId, 180);
  const oldId = cleanText(expectedResponseId, 180);
  if (!id || !oldId) throw new Error('Selecciona un invitado con una referencia RSVP antigua.');
  const [snapshot, config] = await Promise.all([
    loadInvitadosSnapshot(context),
    getDoc(doc(db, 'weddings', context.id, 'rsvpConfig', 'main'))
  ]);
  const token = cleanText(config.data()?.token, 160);
  if (!config.exists() || !token) throw new Error('No se pudo verificar la configuración RSVP activa.');
  const guest = snapshot.canonical.guests.find(item => String(item.id) === id);
  if (!guest || String(guest.rsvpResponseId || '') !== oldId) {
    throw new Error('La vinculación del invitado cambió. Actualiza y comprueba de nuevo.');
  }
  const oldResponse = await getDoc(doc(db, 'publicRsvp', token, 'responses', oldId));
  if (oldResponse.exists()) {
    throw new Error('Esta respuesta RSVP todavía existe. No puede liberarse como huérfana; desvincúlala desde su confirmación.');
  }
  const canonical = canonicalCopy(snapshot);
  canonical.guests = canonical.guests.map(item => String(item.id) === id ? withoutOrphanRsvpLink(item) : item);
  await saveInvitadosSnapshot(context, canonical);
  return { releasedGuestId: id };
}

async function cleanOrphanedRsvpLinks(context, expectedGuestIds = []) {
  requireEditor(context);
  const [guestSnapshot, rsvpSnapshot] = await Promise.all([
    loadInvitadosSnapshot(context), loadRsvpAdminSnapshot(context)
  ]);
  if (!rsvpSnapshot.token || !rsvpSnapshot.config) {
    throw new Error('No hay configuración RSVP activa comprobable. No se modificaron invitados.');
  }
  const activeResponseIds = new Set(rsvpSnapshot.responses.map((response) => String(response.id)));
  const original = canonicalCopy(guestSnapshot);
  const orphans = original.guests.filter((guest) => {
    const responseId = String(guest.rsvpResponseId || '').trim();
    return responseId && !activeResponseIds.has(responseId);
  });
  const expected = [...new Set(expectedGuestIds.map(String))].sort();
  const actual = orphans.map((guest) => String(guest.id)).sort();
  if (expected.length !== actual.length || expected.some((id, index) => id !== actual[index])) {
    throw new Error('El diagnóstico cambió desde la última revisión. Actualiza la lista y vuelve a comprobar los nombres.');
  }
  if (!orphans.length) return { cleanedGuestIds: [] };
  // Las respuestas históricas ya eliminadas no permiten demostrar qué estado
  // fue asignado por RSVP: evitar degradar confirmaciones manuales sin evidencia.
  const changed = canonicalCopy(guestSnapshot);
  changed.guests = changed.guests.map((guest) => {
    const id = String(guest.rsvpResponseId || '').trim();
    if (!id || activeResponseIds.has(id)) return guest;
    return withoutOrphanRsvpLink(guest);
  });
  await saveInvitadosSnapshot(context, changed);
  return { cleanedGuestIds: orphans.map((guest) => String(guest.id)) };
}

export { loadRsvpAdminSnapshot, saveRsvpMusicConfig, saveRsvpManagement, deleteRsvpManagement, restoreRsvpManagement, deleteRsvpResponseExceptional, cleanOrphanedRsvpLinks, releaseOrphanedRsvpGuest, verifyRsvpGuestAvailability };