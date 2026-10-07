const EVENT_TYPES = Object.freeze([
  Object.freeze({ id: 'wedding', label: 'Boda' }),
  Object.freeze({ id: 'birthday', label: 'Cumpleaños' }),
  Object.freeze({ id: 'quince', label: '15 años' }),
  Object.freeze({ id: 'baby_shower', label: 'Baby Shower' }),
  Object.freeze({ id: 'religious', label: 'Bautizo / Primera Comunión' }),
  Object.freeze({ id: 'graduation', label: 'Graduación' }),
  Object.freeze({ id: 'corporate', label: 'Evento corporativo' }),
  Object.freeze({ id: 'custom', label: 'Otro / personalizado' })
]);

const EVENT_TYPE_IDS = Object.freeze(EVENT_TYPES.map((item) => item.id));
const EVENT_TYPE_BY_ID = Object.freeze(
  Object.fromEntries(EVENT_TYPES.map((item) => [item.id, item]))
);

function isKnownEventType(value) {
  return Object.hasOwn(EVENT_TYPE_BY_ID, String(value || '').trim().toLowerCase());
}

function eventTypeLabel(value) {
  const id = String(value || '').trim().toLowerCase();
  return EVENT_TYPE_BY_ID[id]?.label || EVENT_TYPE_BY_ID.wedding.label;
}

export { EVENT_TYPES, EVENT_TYPE_IDS, EVENT_TYPE_BY_ID, isKnownEventType, eventTypeLabel };
