import { normalizeDraftInput, draftStorageScope, isDraftInScope } from '../core/app/invitation-draft-contract.js';

// MGD-021: adaptador independiente del proveedor. No conecta a Firebase.
// La implementación del puerto se realizará tras aprobar Rules y permisos.
function createInvitationDraftRepository(port) {
  if (!port || typeof port.list !== 'function' || typeof port.read !== 'function'
    || typeof port.save !== 'function' || typeof port.remove !== 'function') {
    throw new Error('Puerto de borradores incompleto.');
  }
  function scopeFor(uid, eventId) {
    return draftStorageScope(uid, eventId);
  }
  function assertDraftRecord(record, scope) {
    if (!isDraftInScope(record, scope) || typeof record.id !== 'string' || !record.id.trim()) {
      throw new Error('El borrador no pertenece a la cuenta y evento activos.');
    }
    return Object.freeze({ id: record.id, ownerUid: scope.ownerUid, eventId: scope.eventId,
      value: normalizeDraftInput(record.value), revision: String(record.revision || '') });
  }
  return Object.freeze({
    async list(uid, eventId) {
      const scope = scopeFor(uid, eventId);
      const records = await port.list(scope);
      if (!Array.isArray(records)) throw new Error('Listado de borradores inválido.');
      return Object.freeze(records.map((item) => assertDraftRecord(item, scope)));
    },
    async read(uid, eventId, draftId) {
      const scope = scopeFor(uid, eventId);
      if (typeof draftId !== 'string' || !draftId.trim()) throw new Error('Identificador inválido.');
      const record = await port.read(scope, draftId);
      return record == null ? null : assertDraftRecord(record, scope);
    },
    async save(uid, eventId, draftId, value, revision = '') {
      const scope = scopeFor(uid, eventId);
      if (typeof draftId !== 'string' || !draftId.trim()) throw new Error('Identificador inválido.');
      const clean = normalizeDraftInput(value);
      if (clean.eventType === '') throw new Error('Tipo de evento obligatorio.');
      const result = await port.save(scope, draftId, clean, String(revision));
      return assertDraftRecord(result, scope);
    },
    async remove(uid, eventId, draftId, revision = '') {
      const scope = scopeFor(uid, eventId);
      if (typeof draftId !== 'string' || !draftId.trim()) throw new Error('Identificador inválido.');
      return port.remove(scope, draftId, String(revision));
    }
  });
}
export { createInvitationDraftRepository };
