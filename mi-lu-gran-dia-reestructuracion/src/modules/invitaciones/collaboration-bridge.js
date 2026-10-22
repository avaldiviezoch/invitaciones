import { normalizeDraftInput, DRAFT_FIELDS } from '../../core/app/invitation-draft-contract.js';

// Integración preparada para el editor. El valor por defecto es bloqueo total:
// no importa Firebase, no crea sesiones y no lee/escribe datos.
function createInvitationCollaborationBridge({ enabled = false, session = null, form = null, onRecovered = () => {} } = {}) {
  if (enabled !== true) {
    return Object.freeze({ enabled:false, select:() => false, edit:() => false,
      recover:async () => null, flush:async () => false, close:() => {} });
  }
  if (!session || !form || typeof session.select !== 'function'
    || typeof session.change !== 'function' || typeof session.recover !== 'function'
    || typeof session.flush !== 'function' || typeof session.close !== 'function') {
    throw new Error('La integración colaborativa requiere sesión y formulario válidos.');
  }
  let version = 0;
  let closed = false;
  function snapshot() {
    const values = new FormData(form);
    return normalizeDraftInput(Object.fromEntries([
      ['schema', 'migrandia-invitation-draft-v1'],
      ...DRAFT_FIELDS.map(key => [key, String(values.get(key) || '')])
    ]));
  }
  function select(context) {
    if (closed) return false;
    session.select(context);
    version++;
    return true;
  }
  function edit() {
    if (closed) return false;
    return session.change(snapshot());
  }
  async function recover() {
    if (closed) return null;
    const currentVersion = version;
    const fields = snapshot();
    const restored = await session.recover();
    if (closed || currentVersion !== version || !restored) return null;
    // El llamador debe comprobar también su indicador visual de modificaciones.
    // El puente solo aplica una recuperación si el formulario no cambió mientras se esperaba.
    if (JSON.stringify(snapshot()) !== JSON.stringify(fields)) return null;
    const clean = normalizeDraftInput(restored);
    DRAFT_FIELDS.forEach(key => { form.elements[key].value = clean[key]; });
    onRecovered(clean);
    return clean;
  }
  function close() { if (closed) return; closed = true; version++; session.close(); }
  return Object.freeze({ enabled:true, select, edit, recover, flush:() => closed?Promise.resolve(false):session.flush(), close });
}
export { createInvitationCollaborationBridge };
