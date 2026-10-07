const THEME_TOKENS = Object.freeze({
  'classic-elegant': Object.freeze({
    primary: '#849168',
    secondary: '#ae7480',
    accent: '#c89aa3',
    background: '#f6f3ef',
    surface: '#ffffff',
    headingFont: 'Georgia, "Times New Roman", serif',
    bodyFont: 'Arial, sans-serif',
    radius: '18px',
    decorationStyle: 'refined'
  }),
  'one-piece-elegant': Object.freeze({
    primary: '#7f8962',
    secondary: '#9aa37d',
    accent: '#d8c7b6',
    background: '#f1e5da',
    surface: '#fffaf6',
    headingFont: 'Georgia, "Times New Roman", serif',
    bodyFont: 'Arial, sans-serif',
    radius: '18px',
    decorationStyle: 'nautical-refined'
  }),
  'minimal-black': Object.freeze({
    primary: '#242424',
    secondary: '#5e5e5e',
    accent: '#9a9a9a',
    background: '#f5f5f3',
    surface: '#ffffff',
    headingFont: 'Georgia, "Times New Roman", serif',
    bodyFont: 'Arial, sans-serif',
    radius: '16px',
    decorationStyle: 'minimal'
  })
});

const TOKEN_MAP = Object.freeze({
  primary: '--event-primary',
  secondary: '--event-secondary',
  accent: '--event-accent',
  background: '--event-background',
  surface: '--event-surface',
  headingFont: '--event-heading-font',
  bodyFont: '--event-body-font',
  radius: '--event-radius',
  decorationStyle: '--event-decoration-style'
});

function getThemeTokens(themeId) {
  const id = String(themeId || '').trim().toLowerCase();
  return THEME_TOKENS[id] || THEME_TOKENS['classic-elegant'];
}

function applyEventTheme(themeId, root = document.documentElement) {
  const requested = String(themeId || '').trim().toLowerCase();
  const resolvedId = Object.hasOwn(THEME_TOKENS, requested) ? requested : 'classic-elegant';
  const tokens = THEME_TOKENS[resolvedId];
  Object.entries(TOKEN_MAP).forEach(([key, cssVariable]) => {
    root.style.setProperty(cssVariable, tokens[key]);
  });
  root.dataset.eventTheme = resolvedId;
  return resolvedId;
}

export { THEME_TOKENS, TOKEN_MAP, getThemeTokens, applyEventTheme };
