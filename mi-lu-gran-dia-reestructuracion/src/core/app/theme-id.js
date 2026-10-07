const DEFAULT_THEME_ID = 'classic-elegant';

function normalizeThemeId(value, fallback = DEFAULT_THEME_ID) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || String(fallback || DEFAULT_THEME_ID).trim().toLowerCase() || DEFAULT_THEME_ID;
}

function resolveEventPresentation({ eventType, themeId } = {}) {
  return Object.freeze({
    eventType: String(eventType || '').trim().toLowerCase() || 'wedding',
    themeId: normalizeThemeId(themeId)
  });
}

export { DEFAULT_THEME_ID, normalizeThemeId, resolveEventPresentation };
