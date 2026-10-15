import { createInvitationDraftRepository } from './invitation-drafts-repository.js';

// Adaptador Firestore preparado, NO activado: enabled=false por defecto.
// Debe aprobarse Rules y probarse aislamiento autenticado antes de habilitarlo.
function createFirestoreInvitationDraftRepository({ firestore, sdk, currentUid, enabled = false } = {}) {
  const assertEnabled = (scope) => {
    if (enabled !== true) throw new Error('La persistencia de borradores todavía no está habilitada.');
    if (!firestore || !sdk || typeof currentUid !== 'function') throw new Error('Proveedor Firestore no configurado.');
    if (!currentUid() || currentUid() !== scope.ownerUid) throw new Error('La cuenta activa no coincide con el borrador.');
  };
  const collectionRef = (scope) => sdk.collection(firestore, ...scope.proposedCollectionPath.split('/'));
  const documentRef = (scope, id) => {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('Identificador de borrador inválido.');
    return sdk.doc(collectionRef(scope), id);
  };
  const recordFromSnapshot = (scope, snapshot) => {
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return { id: snapshot.id, ownerUid: data.ownerUid, eventId: data.eventId,
      value: data.value, revision: String(data.revision ?? '') };
  };
  const port = {
    async list(scope) {
      assertEnabled(scope);
      const snapshot = await sdk.getDocs(collectionRef(scope));
      assertEnabled(scope);
      return snapshot.docs.map((item) => recordFromSnapshot(scope, item));
    },
    async read(scope, id) {
      assertEnabled(scope);
      const snapshot = await sdk.getDoc(documentRef(scope, id));
      assertEnabled(scope);
      return recordFromSnapshot(scope, snapshot);
    },
    async save(scope, id, value, revision) {
      assertEnabled(scope);
      const ref = documentRef(scope, id);
      const result = await sdk.runTransaction(firestore, async (transaction) => {
        const previous = await transaction.get(ref);
        const old = previous.exists() ? previous.data() : null;
        if ((old ? String(old.revision ?? '') : '') !== revision) throw new Error('Conflicto de revisión: vuelve a cargar el borrador.');
        if (old && (old.ownerUid !== scope.ownerUid || old.eventId !== scope.eventId)) throw new Error('Borrador de otro contexto.');
        const nextRevision = String(Number(old?.revision || 0) + 1);
        if (!Number.isSafeInteger(Number(nextRevision))) throw new Error('Revisión inválida.');
        assertEnabled(scope);
        transaction.set(ref, { ownerUid: scope.ownerUid, eventId: scope.eventId,
          value, revision: nextRevision, updatedAt: sdk.serverTimestamp() });
        return { id, ownerUid: scope.ownerUid, eventId: scope.eventId, value, revision: nextRevision };
      });
      assertEnabled(scope);
      return result;
    },
    async remove(scope, id, revision) {
      assertEnabled(scope);
      const ref = documentRef(scope, id);
      const result = await sdk.runTransaction(firestore, async (transaction) => {
        const previous = await transaction.get(ref);
        if (!previous.exists()) return false;
        const old = previous.data();
        if (old.ownerUid !== scope.ownerUid || old.eventId !== scope.eventId) throw new Error('Borrador de otro contexto.');
        if (String(old.revision ?? '') !== revision) throw new Error('Conflicto de revisión: vuelve a cargar el borrador.');
        assertEnabled(scope);
        transaction.delete(ref);
        return true;
      });
      assertEnabled(scope);
      return result;
    }
  };
  return createInvitationDraftRepository(port);
}
export { createFirestoreInvitationDraftRepository };
