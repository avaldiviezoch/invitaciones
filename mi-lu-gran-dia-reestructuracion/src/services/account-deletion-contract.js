function normalizeText(value) {
  return String(value || '').trim();
}

function buildAccountDeletionPhrase(user) {
  const email = normalizeText(user?.email).toLowerCase();
  const uid = normalizeText(user?.uid);
  if (!uid) throw new Error('No hay una cuenta válida para eliminar.');
  return email ? `${email} :: ${uid}` : uid;
}

function classifyAccountEvents(contexts = [], uid = '') {
  const userId = normalizeText(uid);
  const owned = [];
  const shared = [];

  (Array.isArray(contexts) ? contexts : []).forEach((context) => {
    const ownerUid = normalizeText(context?.ownerUid);
    const role = normalizeText(context?.role).toLowerCase();
    const item = Object.freeze({
      id: normalizeText(context?.id),
      name: normalizeText(context?.name),
      role,
      ownerUid
    });

    if (role === 'owner' || (userId && ownerUid === userId)) owned.push(item);
    else shared.push(item);
  });

  return Object.freeze({
    owned: Object.freeze(owned),
    shared: Object.freeze(shared)
  });
}

function assertStrongAccountDeletionConfirmation(user, confirmation) {
  const expected = buildAccountDeletionPhrase(user);
  const received = normalizeText(confirmation);

  if (!received || received !== expected) {
    throw new Error('La confirmación de eliminación de cuenta no coincide.');
  }

  return true;
}

function buildAccountDeletionPlan({ user, contexts = [], confirmation } = {}) {
  assertStrongAccountDeletionConfirmation(user, confirmation);
  const uid = normalizeText(user?.uid);
  const events = classifyAccountEvents(contexts, uid);

  return Object.freeze({
    uid,
    execute: false,
    destructive: true,
    blockedByOwnedEvents: events.owned.length > 0,
    ownedEvents: events.owned,
    sharedEvents: events.shared,
    responsibilities: Object.freeze({
      ownedEvents: 'transfer-or-delete-before-account',
      sharedEvents: 'remove-membership-and-user-index-only',
      members: 'remove-user-membership-from-shared-events',
      rsvp: 'preserve-event-rsvp-unless-event-is-deleted',
      files: 'inventory-owner-scoped-files-before-delete',
      auth: 'delete-only-after-data-plan-is-clear'
    }),
    resources: Object.freeze([
      `users/${uid}`,
      `users/${uid}/weddings/*`,
      `users/${uid}/invitations/*`,
      'weddings/{sharedEventId}/members/{uid}',
      'auth/users/{uid}'
    ])
  });
}

export {
  buildAccountDeletionPhrase,
  classifyAccountEvents,
  assertStrongAccountDeletionConfirmation,
  buildAccountDeletionPlan
};
