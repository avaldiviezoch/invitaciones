function normalizeId(value) {
  return String(value || '').trim();
}

function eventScopedPaths(uid, eventId) {
  const userId = normalizeId(uid);
  const id = normalizeId(eventId);
  if (!userId || !id) throw new Error('UID y eventId son obligatorios.');

  return Object.freeze({
    eventRoot: `weddings/${id}`,
    membership: `weddings/${id}/members/${userId}`,
    userIndex: `users/${userId}/weddings/${id}`,
    plannerMeta: `weddings/${id}/cloudSync/main`,
    plannerChunks: `weddings/${id}/cloudChunks/*`,
    domainData: `weddings/${id}/domainData/*`,
    rsvpConfig: `weddings/${id}/rsvpConfig/main`,
    rsvpManagement: `weddings/${id}/rsvpManagement/*`
  });
}

function assessMultiEventIsolation({ uid, contexts = [] } = {}) {
  const userId = normalizeId(uid);
  const normalized = (Array.isArray(contexts) ? contexts : [])
    .map((context) => ({
      id: normalizeId(context?.id),
      ownerUid: normalizeId(context?.ownerUid),
      role: normalizeId(context?.role),
      eventType: normalizeId(context?.eventType || 'wedding')
    }))
    .filter((context) => context.id);

  const ids = normalized.map((context) => context.id);
  const uniqueIds = new Set(ids);
  const paths = normalized.map((context) => eventScopedPaths(userId, context.id));
  const eventRoots = new Set(paths.map((item) => item.eventRoot));
  const userIndexes = new Set(paths.map((item) => item.userIndex));

  return Object.freeze({
    uid: userId,
    eventCount: normalized.length,
    uniqueEventIds: uniqueIds.size === normalized.length,
    isolatedEventRoots: eventRoots.size === normalized.length,
    isolatedUserIndexes: userIndexes.size === normalized.length,
    contexts: Object.freeze(normalized.map(Object.freeze)),
    paths: Object.freeze(paths)
  });
}

function assertMultiEventIsolation(input = {}) {
  const assessment = assessMultiEventIsolation(input);
  if (!assessment.uid) throw new Error('No hay UID válido.');
  if (!assessment.uniqueEventIds) throw new Error('Hay eventId duplicados.');
  if (!assessment.isolatedEventRoots || !assessment.isolatedUserIndexes) {
    throw new Error('Los eventos no están correctamente aislados.');
  }
  return assessment;
}

export {
  eventScopedPaths,
  assessMultiEventIsolation,
  assertMultiEventIsolation
};
