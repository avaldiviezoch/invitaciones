import { createInvitationDraftAutosave } from '../core/app/invitation-draft-autosave.js';
import { normalizeDraftInput } from '../core/app/invitation-draft-contract.js';

// Puente UI/repositorio sin proveedor ni efecto persistente por defecto.
// Prohibido activarlo hasta validar las Security Rules y el ambiente.
function createInvitationDraftSession({ repository, enabled = false, delay = 800, schedule, cancel } = {}) {
  if (!repository || typeof repository.save !== 'function' || typeof repository.read !== 'function') {
    throw new Error('Repositorio de borradores inválido.');
  }
  let identity = null;
  const saver = createInvitationDraftAutosave({
    enabled, delay, schedule, cancel,
    save: async (scope, value, revision) => {
      if (!enabled) throw new Error('Guardado de borradores no autorizado.');
      if (!identity || identity.ownerUid !== scope.ownerUid
        || identity.eventId !== scope.eventId || identity.draftId !== scope.draftId) {
        throw new Error('El contexto del borrador cambió.');
      }
      return repository.save(scope.ownerUid, scope.eventId, scope.draftId, normalizeDraftInput(value), revision);
    }
  });
  function select(context) {
    if (!context) { identity = null; saver.setScope(null); return; }
    const { ownerUid, eventId, draftId, revision = '' } = context;
    if (![ownerUid, eventId, draftId].every((value) => typeof value === 'string' && value.length)) {
      throw new Error('Falta contexto de cuenta, evento o borrador.');
    }
    saver.setScope({ ownerUid, eventId, draftId, revision });
    identity = { ownerUid, eventId, draftId };
  }
  async function recover() {
    if (!enabled) throw new Error('Recuperación de cuenta todavía no habilitada.');
    const selected = identity && { ...identity };
    if (!selected) throw new Error('No hay borrador seleccionado.');
    const record = await repository.read(selected.ownerUid, selected.eventId, selected.draftId);
    if (!identity || selected.ownerUid !== identity.ownerUid
      || selected.eventId !== identity.eventId || selected.draftId !== identity.draftId) {
      throw new Error('La sesión cambió durante la lectura.');
    }
    if (record) select({ ...selected, revision:record.revision });
    return record?.value || null;
  }
  function change(value) {
    if (!enabled) return false;
    return saver.change(normalizeDraftInput(value));
  }
  function close() { identity = null; saver.close(); }
  return Object.freeze({ select, recover, change, flush:() => saver.flush(), close, status:() => saver.getStatus() });
}
export { createInvitationDraftSession };
