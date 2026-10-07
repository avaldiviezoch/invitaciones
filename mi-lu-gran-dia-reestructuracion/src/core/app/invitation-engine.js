const INVITATION_ENGINE_FIELDS = Object.freeze([
  'event',
  'date',
  'location',
  'guest',
  'companions',
  'rsvp',
  'questions',
  'music',
  'status'
]);

function invitationEngineModel(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return Object.freeze({
    event: Object.freeze({ ...(source.event || {}) }),
    date: source.date || null,
    location: Object.freeze({ ...(source.location || {}) }),
    guest: Object.freeze({ ...(source.guest || {}) }),
    companions: Object.freeze([...(source.companions || [])]),
    rsvp: Object.freeze({ ...(source.rsvp || {}) }),
    questions: Object.freeze([...(source.questions || [])]),
    music: Object.freeze({ ...(source.music || {}) }),
    status: String(source.status || 'draft')
  });
}

function hasStableInvitationEngineShape(model) {
  return INVITATION_ENGINE_FIELDS.every((field) => Object.hasOwn(model || {}, field));
}

export { INVITATION_ENGINE_FIELDS, invitationEngineModel, hasStableInvitationEngineShape };
