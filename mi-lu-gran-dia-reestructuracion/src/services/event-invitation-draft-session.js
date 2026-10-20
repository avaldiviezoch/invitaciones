import { createInvitationDraftAutosave } from '../core/app/invitation-draft-autosave.js';
import { normalizeDraftInput } from '../core/app/invitation-draft-contract.js';

// Puente de sesión para el puerto COMPARTIDO por evento (sin conectar a UI).
// Bloqueado por defecto; activar solo tras validar Rules desplegadas y QA.
function createEventInvitationDraftSession({ repository, currentUid, enabled = false, delay = 800, schedule, cancel } = {}) {
  if (!repository || typeof repository.read !== 'function' || typeof repository.save !== 'function'
    || typeof currentUid !== 'function') throw new Error('Proveedor de sesión incompleto.');
  let context = null;
  let contextVersion = 0;
  const assertSession = (selected, token) => {
    if (!enabled) throw new Error('Persistencia por evento no habilitada.');
    if (!selected || !currentUid() || currentUid() !== selected.uid
      || contextVersion !== token || context?.uid !== selected.uid
      || context?.eventId !== selected.eventId || context?.draftId !== selected.draftId) {
      throw new Error('La sesión o el evento cambió.');
    }
  };
  const saver = createInvitationDraftAutosave({
    enabled, delay, schedule, cancel,
    save: async (scope, value, revision) => {
      const selected = { uid:scope.ownerUid, eventId:scope.eventId, draftId:scope.draftId };
      const token = contextVersion;
      assertSession(selected, token);
      const result = await repository.save(selected.eventId, selected.draftId, normalizeDraftInput(value), revision);
      assertSession(selected, token);
      return result;
    }
  });
  function select(next, { discardPending = false } = {}) {
    if (!next) { context = null; contextVersion++; saver.setScope(null); return; }
    const { eventId, draftId, revision = '' } = next;
    const uid = currentUid();
    if (!uid || typeof eventId !== 'string' || !eventId || typeof draftId !== 'string' || !draftId) {
      throw new Error('Cuenta, evento o borrador no disponibles.');
    }
    const switching = context && (context.uid !== uid || context.eventId !== eventId || context.draftId !== draftId);
    // Reseleccionar el mismo borrador no debe reiniciar autosave ni perder ediciones.
    if (context && !switching) return;
    const status = saver.getStatus();
    if (switching && !discardPending && (status.pending || status.inflight)) {
      throw new Error('Hay cambios pendientes: guarda o descarta antes de cambiar de borrador.');
    }
    contextVersion++;
    saver.setScope({ ownerUid:uid, eventId, draftId, revision });
    context = { uid, eventId, draftId };
  }
  async function recover() {
    const selected = context && { ...context };
    const token = contextVersion;
    assertSession(selected, token);
    if (saver.getStatus().pending || saver.getStatus().inflight) {
      throw new Error('Hay cambios pendientes: guarda o descarta antes de recuperar.');
    }
    const editVersion = saver.getStatus().changeVersion;
    const item = await repository.read(selected.eventId, selected.draftId);
    assertSession(selected, token);
    if (saver.getStatus().pending || saver.getStatus().inflight
      || saver.getStatus().changeVersion !== editVersion) {
      throw new Error('Hay cambios pendientes o ediciones recientes: no se reemplazó el borrador local.');
    }
    if (item) saver.setScope({ ownerUid:selected.uid, eventId:selected.eventId, draftId:selected.draftId, revision:item.revision });
    return item?.value ? normalizeDraftInput(item.value) : null;
  }
  function change(value) { return !enabled ? false : saver.change(normalizeDraftInput(value)); }
  function close() { context = null; contextVersion++; saver.close(); }
  return Object.freeze({ select, recover, change, flush:() => saver.flush(), close, status:() => saver.getStatus() });
}
export { createEventInvitationDraftSession };
