const DEFAULT_EVENT_TYPE = 'wedding';

function normalizeEventType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || DEFAULT_EVENT_TYPE;
}

export { DEFAULT_EVENT_TYPE, normalizeEventType };
