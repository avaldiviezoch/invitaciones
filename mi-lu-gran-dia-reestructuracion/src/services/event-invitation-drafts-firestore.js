import { normalizeDraftInput } from '../core/app/invitation-draft-contract.js';

// Puerto experimental para invitaciones COLABORATIVAS por boda/evento.
// NUNCA usado por la UI y SIEMPRE bloqueado por defecto. Rules del emulador
// no son las Rules desplegadas en Firebase.
function createEventInvitationDraftPort({ db, sdk, currentUid, enabled = false } = {}) {
  const validId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
  const gate = (eventId) => {
    if (enabled !== true) throw new Error('Persistencia compartida de borradores no habilitada.');
    if (!db || !sdk || typeof currentUid !== 'function' || !currentUid()) throw new Error('Sesión o proveedor no disponible.');
    if (!validId(eventId)) throw new Error('Identificador de evento inválido.');
    return currentUid();
  };
  const collectionRef = (eventId) => sdk.collection(db, 'weddings', eventId, 'invitationDrafts');
  const ref = (eventId, draftId) => {
    if (!validId(draftId)) throw new Error('Identificador de borrador inválido.');
    return sdk.doc(collectionRef(eventId), draftId);
  };
  const parse = (eventId, snapshot) => {
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (data.eventId !== eventId || !validId(data.ownerUid) || !/^[1-9][0-9]*$/.test(String(data.revision))) {
      throw new Error('Borrador con metadatos inválidos.');
    }
    return Object.freeze({ id:snapshot.id, eventId, ownerUid:data.ownerUid, revision:String(data.revision),
      value:normalizeDraftInput(data.value) });
  };
  return Object.freeze({
    async list(eventId) {
      const uid = gate(eventId);
      const result = await sdk.getDocs(collectionRef(eventId));
      if (gate(eventId) !== uid) throw new Error('La sesión cambió durante la lectura.');
      return Object.freeze(result.docs.map((snapshot) => parse(eventId, snapshot)));
    },
    async read(eventId, draftId) {
      const uid = gate(eventId);
      const result = await sdk.getDoc(ref(eventId, draftId));
      if (gate(eventId) !== uid) throw new Error('La sesión cambió durante la lectura.');
      return parse(eventId, result);
    },
    async save(eventId, draftId, value, expectedRevision = '') {
      const uid = gate(eventId);
      const draft = normalizeDraftInput(value);
      const documentRef = ref(eventId, draftId);
      const result = await sdk.runTransaction(db, async (tx) => {
        const snap = await tx.get(documentRef);
        const old = snap.exists() ? snap.data() : null;
        if ((old ? String(old.revision) : '') !== String(expectedRevision)) throw new Error('Conflicto de revisión.');
        if (old && (old.eventId !== eventId || !validId(old.ownerUid))) throw new Error('Metadatos inválidos.');
        const revision = String(Number(old?.revision || 0) + 1);
        if (!Number.isSafeInteger(Number(revision))) throw new Error('Revisión inválida.');
        if (gate(eventId) !== uid) throw new Error('La sesión cambió durante la escritura.');
        tx.set(documentRef, { eventId, ownerUid:old?.ownerUid || uid,
          value:draft, revision, updatedAt:sdk.serverTimestamp() });
        return { id:draftId, eventId, ownerUid:old?.ownerUid || uid, value:draft, revision };
      });
      if (gate(eventId) !== uid) throw new Error('La sesión cambió durante la escritura.');
      return Object.freeze(result);
    },
    async remove(eventId, draftId, expectedRevision) {
      const uid = gate(eventId);
      const documentRef = ref(eventId, draftId);
      const result = await sdk.runTransaction(db, async (tx) => {
        const snap = await tx.get(documentRef);
        if (!snap.exists()) return false;
        const old = snap.data();
        if (old.eventId !== eventId || String(old.revision) !== String(expectedRevision)) throw new Error('Conflicto de revisión.');
        if (gate(eventId) !== uid) throw new Error('La sesión cambió durante la escritura.');
        tx.delete(documentRef);
        return true;
      });
      if (gate(eventId) !== uid) throw new Error('La sesión cambió durante la escritura.');
      return result;
    }
  });
}
export { createEventInvitationDraftPort };
