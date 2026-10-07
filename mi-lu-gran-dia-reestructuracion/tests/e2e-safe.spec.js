import { test, expect } from '@playwright/test';

const MODULES = [
  'checklist',
  'presupuesto',
  'proveedores',
  'invitados',
  'distribucion',
  'cronograma',
  'invitaciones',
  'musica',
  'ideas'
];

const KNOWN_BROWSER_NOISE = [
  'requestStorageAccess: Permission denied.',
  "Framing 'https://www.google.com/' violates the following report-only Content Security Policy directive"
];

function collectUnexpectedErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (KNOWN_BROWSER_NOISE.some((known) => text.includes(known))) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

test('E2E-01: carga pública y versión formal', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#appVersion')).toHaveText('Migrandia 0.7.0');
  await expect(page.locator('#googleLoginButton')).toBeAttached();
  expect(errors).toEqual([]);
});

for (const moduleId of MODULES) {
  test(`E2E-04: ruta segura #${moduleId} carga el shell sin escritura`, async ({ page }) => {
    const errors = collectUnexpectedErrors(page);
    await page.goto(`#${moduleId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#moduleWorkspace')).toBeAttached();
    await expect(page.locator(`[data-app-module="${moduleId}"]`)).toBeAttached();
    expect(errors).toEqual([]);
  });
}

test('E2E-14: recarga pública vuelve de forma segura al inicio', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('#distribucion', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-app-module="distribucion"]')).toBeAttached();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/#distribucion$/);
  await expect(page.locator('#googleLoginButton')).toBeAttached();
  await expect(page.locator('#appVersion')).toHaveText('Migrandia 0.7.0');
  expect(errors).toEqual([]);
});

test('E2E-15: navegación responsive disponible', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#menuButton')).toBeAttached();
  await expect(page.locator('#appModuleNav')).toBeAttached();
  expect(errors).toEqual([]);
});

test('E2E-16: recorrido público no deja errores globales inesperados', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  for (const moduleId of MODULES) {
    await page.goto(`#${moduleId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(`[data-app-module="${moduleId}"]`)).toBeAttached();
  }
  expect(errors).toEqual([]);
});

test('E2E-02-pre: login Google abre el flujo sin completar autenticación', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#discoverSkipButton')).toBeVisible();
  await page.locator('#discoverSkipButton').click();
  await expect(page.locator('#googleLoginButton')).toBeVisible();

  const popupPromise = page.waitForEvent('popup', { timeout: 10000 });
  await page.locator('#googleLoginButton').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded').catch(() => {});

  expect(popup.url()).toMatch(/^https:\/\/(accounts\.google\.com|[^/]*firebaseapp\.com)\//);
  await popup.close();

  await expect(page.locator('#googleLoginButton')).toBeAttached();
  const unexpectedLoginErrors = errors.filter(
    (error) => error !== 'console: Failed to load resource: the server responded with a status of 403 ()'
  );
  expect(unexpectedLoginErrors).toEqual([]);
});


test('MGD-009: registro por correo valida UI sin crear cuenta', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await page.locator('#discoverSkipButton').click();
  await expect(page.locator('#authModeToggle')).toBeVisible();
  await page.locator('#authModeToggle').click();

  await expect(page.locator('#authTitle')).toHaveText('Crea tu cuenta');
  await expect(page.locator('#authConfirmLabel')).toBeVisible();
  await expect(page.locator('#emailLoginButton')).toHaveText('Crear cuenta');
  await expect(page.locator('#authForgotPassword')).toBeHidden();

  await page.locator('#authEmail').fill('persona@example.com');
  await page.locator('#authPassword').fill('abcdef');
  await page.locator('#authPasswordConfirm').fill('abcdefg');
  await page.locator('#emailLoginButton').click();
  await expect(page.locator('#authStatus')).toHaveText('Las contraseñas no coinciden.');

  const unexpectedRegistrationErrors = errors.filter(
    (error) => error !== 'console: Failed to load resource: the server responded with a status of 403 ()'
  );
  expect(unexpectedRegistrationErrors).toEqual([]);
});

test('MGD-010: recuperación exige correo válido sin enviar solicitud', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await page.locator('#discoverSkipButton').click();
  await expect(page.locator('#authForgotPassword')).toBeVisible();

  await page.locator('#authEmail').fill('correo-invalido');
  await page.locator('#authForgotPassword').click();
  await expect(page.locator('#authStatus')).toHaveText('Escribe un correo válido para enviarte el enlace de recuperación.');

  expect(errors).toEqual([]);
});


test('MGD-012: eventType legado cae a wedding sin persistencia', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const moduleUrl = new URL('src/core/app/event-type.js', window.location.href).href;
    const { DEFAULT_EVENT_TYPE, normalizeEventType } = await import(moduleUrl);
    return {
      defaultType: DEFAULT_EVENT_TYPE,
      empty: normalizeEventType(),
      blank: normalizeEventType('   '),
      explicitWedding: normalizeEventType('WEDDING'),
      futureType: normalizeEventType('birthday')
    };
  });

  expect(result).toEqual({
    defaultType: 'wedding',
    empty: 'wedding',
    blank: 'wedding',
    explicitWedding: 'wedding',
    futureType: 'birthday'
  });
  expect(errors).toEqual([]);
});


test('MGD-013: catálogo inicial contiene exactamente 8 tipos canónicos', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const moduleUrl = new URL('src/core/app/event-types.js', window.location.href).href;
    const { EVENT_TYPES, EVENT_TYPE_IDS, isKnownEventType, eventTypeLabel } = await import(moduleUrl);
    return {
      count: EVENT_TYPES.length,
      ids: EVENT_TYPE_IDS,
      uniqueCount: new Set(EVENT_TYPE_IDS).size,
      weddingKnown: isKnownEventType('wedding'),
      birthdayKnown: isKnownEventType('BIRTHDAY'),
      unknownKnown: isKnownEventType('festival'),
      religiousLabel: eventTypeLabel('religious')
    };
  });

  expect(result).toEqual({
    count: 8,
    ids: ['wedding', 'birthday', 'quince', 'baby_shower', 'religious', 'graduation', 'corporate', 'custom'],
    uniqueCount: 8,
    weddingKnown: true,
    birthdayKnown: true,
    unknownKnown: false,
    religiousLabel: 'Bautizo / Primera Comunión'
  });
  expect(errors).toEqual([]);
});


test('MGD-014: eventProfile central cubre 8 tipos con una forma estable', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const moduleUrl = new URL('src/core/app/event-profile.js', window.location.href).href;
    const { CURRENT_MODULES, EVENT_PROFILES, getEventProfile } = await import(moduleUrl);
    const ids = Object.keys(EVENT_PROFILES);
    const requiredKeys = ['type', 'terminology', 'modules', 'checklist', 'distributionCatalog', 'theme', 'onboarding', 'invitationCapabilities', 'audienceProfile'];
    return {
      ids,
      moduleCount: CURRENT_MODULES.length,
      allHaveShape: ids.every((id) => requiredKeys.every((key) => Object.hasOwn(EVENT_PROFILES[id], key))),
      weddingType: getEventProfile('wedding').type,
      birthdayTerm: getEventProfile('birthday').terminology.event,
      unknownFallback: getEventProfile('festival').type,
      sameWeddingModules: getEventProfile('wedding').modules === CURRENT_MODULES
    };
  });

  expect(result).toEqual({
    ids: ['wedding', 'birthday', 'quince', 'baby_shower', 'religious', 'graduation', 'corporate', 'custom'],
    moduleCount: 9,
    allHaveShape: true,
    weddingType: 'wedding',
    birthdayTerm: 'cumpleaños',
    unknownFallback: 'wedding',
    sameWeddingModules: true
  });
  expect(errors).toEqual([]);
});


test('MGD-015: eventType y themeId permanecen independientes', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const moduleUrl = new URL('src/core/app/theme-id.js', window.location.href).href;
    const { DEFAULT_THEME_ID, normalizeThemeId, resolveEventPresentation } = await import(moduleUrl);
    return {
      defaultTheme: DEFAULT_THEME_ID,
      normalized: normalizeThemeId(' ONE-PIECE-ELEGANT '),
      weddingOnePiece: resolveEventPresentation({ eventType: 'wedding', themeId: 'one-piece-elegant' }),
      birthdayMinimal: resolveEventPresentation({ eventType: 'birthday', themeId: 'minimal-black' }),
      sameThemeDifferentType: [
        resolveEventPresentation({ eventType: 'wedding', themeId: 'minimal-black' }).themeId,
        resolveEventPresentation({ eventType: 'birthday', themeId: 'minimal-black' }).themeId
      ]
    };
  });

  expect(result).toEqual({
    defaultTheme: 'classic-elegant',
    normalized: 'one-piece-elegant',
    weddingOnePiece: { eventType: 'wedding', themeId: 'one-piece-elegant' },
    birthdayMinimal: { eventType: 'birthday', themeId: 'minimal-black' },
    sameThemeDifferentType: ['minimal-black', 'minimal-black']
  });
  expect(errors).toEqual([]);
});


test('MGD-016: tema global aplica tokens visuales sin persistencia', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const moduleUrl = new URL('src/core/app/theme-tokens.js', window.location.href).href;
    const { THEME_TOKENS, applyEventTheme, getThemeTokens } = await import(moduleUrl);
    const probe = document.createElement('div');
    document.body.appendChild(probe);

    const applied = applyEventTheme('one-piece-elegant', probe);
    const onePiece = {
      primary: probe.style.getPropertyValue('--event-primary'),
      background: probe.style.getPropertyValue('--event-background'),
      theme: probe.dataset.eventTheme
    };

    const fallback = applyEventTheme('tema-inexistente', probe);
    const classic = getThemeTokens('classic-elegant');
    probe.remove();

    return {
      presetCount: Object.keys(THEME_TOKENS).length,
      applied,
      onePiece,
      fallback,
      classicPrimary: classic.primary,
      classicBackground: classic.background
    };
  });

  expect(result).toEqual({
    presetCount: 3,
    applied: 'one-piece-elegant',
    onePiece: {
      primary: '#7f8962',
      background: '#f1e5da',
      theme: 'one-piece-elegant'
    },
    fallback: 'classic-elegant',
    classicPrimary: '#849168',
    classicBackground: '#f6f3ef'
  });
  expect(errors).toEqual([]);
});
