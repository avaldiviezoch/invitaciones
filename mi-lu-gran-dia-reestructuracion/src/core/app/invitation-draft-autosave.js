// MGD-021: controlador de autosave independiente de UI y Firestore.
// Su uso requiere activación deliberada: no escribe datos por sí mismo.
function createInvitationDraftAutosave({ save, delay = 800, enabled = false, schedule = setTimeout, cancel = clearTimeout } = {}) {
  if (typeof save !== 'function') throw new Error('Se requiere una función save.');
  let timer = null;
  let pending = null;
  let inflight = false;
  let stopped = false;
  let epoch = 0;
  let revision = '';
  let lastError = null;
  let changeVersion = 0;
  let scope = null;
  const sameScope = (a, b) => Boolean(a && b && a.ownerUid === b.ownerUid && a.eventId === b.eventId && a.draftId === b.draftId);
  function clearPending() {
    if (timer !== null) cancel(timer);
    timer = null;
    pending = null;
  }
  function setScope(next) {
    if (stopped) throw new Error('Autosave cerrado.');
    ++epoch;
    clearPending();
    revision = String(next?.revision || '');
    lastError = null;
    scope = next ? { ownerUid:next.ownerUid, eventId:next.eventId, draftId:next.draftId } : null;
  }
  async function flush() {
    if (!enabled || stopped || inflight || !pending || !scope) return false;
    const work = pending;
    const version = changeVersion;
    let succeeded = false;
    const expectedScope = { ...scope };
    const token = epoch;
    clearPending();
    inflight = true;
    try {
      const result = await save(expectedScope, work, revision);
      succeeded = true;
      if (!stopped && token === epoch && sameScope(expectedScope, scope)) {
        revision = String(result?.revision || '');
        lastError = null;
      }
      return true;
    } catch (error) {
      if (!stopped && token === epoch && sameScope(expectedScope, scope)) {
        if (pending === null) pending = work;
        lastError = error;
      }
      throw error;
    } finally {
      inflight = false;
      if (!stopped && succeeded && pending && changeVersion !== version && scope && timer === null && enabled) {
        timer = schedule(() => { timer = null; void flush().catch(() => {}); }, delay);
      }
    }
  }
  function change(value) {
    if (!enabled || stopped || !scope) return false;
    pending = value;
    ++changeVersion;
    lastError = null;
    if (timer !== null) cancel(timer);
    timer = schedule(() => { timer = null; void flush().catch(() => {}); }, delay);
    return true;
  }
  function close() { ++epoch; clearPending(); scope = null; stopped = true; }
  return Object.freeze({ setScope, change, flush, close, getStatus: () => Object.freeze({
    enabled: enabled && !stopped, pending: pending !== null, inflight, revision, changeVersion,
    error: lastError ? String(lastError.message || lastError) : '',
    scope:scope ? { ...scope } : null
  }) });
}
export { createInvitationDraftAutosave };
