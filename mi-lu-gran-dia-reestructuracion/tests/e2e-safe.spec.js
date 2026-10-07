import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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
  "Framing 'https://www.google.com/' violates the following report-only Content Security Policy directive",
  'Failed to load resource: net::ERR_CONNECTION_RESET'
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

test('MGD-010: recuperación usa un modo propio y valida correo sin enviar solicitud', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await page.locator('#discoverSkipButton').click();
  await expect(page.locator('#authForgotPassword')).toBeVisible();
  await expect(page.locator('#authPasswordLabel')).toBeVisible();
  await expect(page.locator('#authConfirmLabel')).toBeHidden();

  await page.locator('#authForgotPassword').click();
  await expect(page.locator('#authTitle')).toHaveText('Recupera tu acceso');
  await expect(page.locator('#authPasswordLabel')).toBeHidden();
  await expect(page.locator('#authConfirmLabel')).toBeHidden();
  await expect(page.locator('#emailLoginButton')).toHaveText('Enviar enlace');
  await expect(page.locator('#authModeToggle')).toHaveText('Volver a iniciar sesión');
  await expect(page.locator('#authForgotPassword')).toBeHidden();

  await page.locator('#authEmail').fill('correo-invalido');
  await page.locator('#emailLoginButton').click();
  await expect(page.locator('#authStatus')).toHaveText('Escribe un correo válido para enviarte el enlace de recuperación.');

  await page.locator('#authModeToggle').click();
  await expect(page.locator('#authTitle')).toHaveText('Tu evento, siempre contigo');
  await expect(page.locator('#authPasswordLabel')).toBeVisible();
  await expect(page.locator('#authConfirmLabel')).toBeHidden();

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


test('MGD-017: diccionario de lenguaje cambia términos sin cambiar lógica', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const terminologyUrl = new URL('src/core/app/event-terminology.js', window.location.href).href;
    const profileUrl = new URL('src/core/app/event-profile.js', window.location.href).href;
    const { EVENT_TERMINOLOGY, getEventTerminology } = await import(terminologyUrl);
    const { getEventProfile } = await import(profileUrl);

    return {
      count: Object.keys(EVENT_TERMINOLOGY).length,
      weddingTable: getEventTerminology('wedding').primaryTable,
      quinceHost: getEventTerminology('quince').host,
      birthdayTable: getEventTerminology('birthday').primaryTable,
      babyHost: getEventTerminology('baby_shower').host,
      graduationHost: getEventTerminology('graduation').host,
      corporateGuest: getEventTerminology('corporate').guest,
      fallbackEvent: getEventTerminology('unknown').event,
      profileUsesDictionary: getEventProfile('birthday').terminology.primaryTable
    };
  });

  expect(result).toEqual({
    count: 8,
    weddingTable: 'Mesa de novios',
    quinceHost: 'quinceañera/o',
    birthdayTable: 'Mesa del homenajeado',
    babyHost: 'futuros padres',
    graduationHost: 'graduado/a',
    corporateGuest: 'asistente',
    fallbackEvent: 'boda',
    profileUsesDictionary: 'Mesa del homenajeado'
  });
  expect(errors).toEqual([]);
});


test('MGD-018: plantillas de Checklist se resuelven por evento sin duplicar motor', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const templatesUrl = new URL('src/core/app/checklist-templates.js', window.location.href).href;
    const profileUrl = new URL('src/core/app/event-profile.js', window.location.href).href;
    const { CHECKLIST_TEMPLATES, getChecklistTemplate } = await import(templatesUrl);
    const { getEventProfile } = await import(profileUrl);

    return {
      count: Object.keys(CHECKLIST_TEMPLATES).length,
      weddingMode: getChecklistTemplate('wedding').mode,
      weddingGroups: getChecklistTemplate('wedding').groups.length,
      quinceHasDress: getChecklistTemplate('quince').tasks.some((task) => task.title === 'Elegir vestido'),
      babyHasGames: getChecklistTemplate('baby_shower').tasks.some((task) => task.title === 'Definir juegos y actividades'),
      birthdayHasCake: getChecklistTemplate('birthday').tasks.some((task) => task.title === 'Elegir torta'),
      corporateUsesAttendees: getChecklistTemplate('corporate').groups.includes('Asistentes'),
      fallback: getChecklistTemplate('unknown').id,
      profileTemplate: getEventProfile('quince').checklist.id,
      immutable: Object.isFrozen(CHECKLIST_TEMPLATES.quince) && Object.isFrozen(CHECKLIST_TEMPLATES.quince.tasks)
    };
  });

  expect(result).toEqual({
    count: 8,
    weddingMode: 'legacy-rich',
    weddingGroups: 10,
    quinceHasDress: true,
    babyHasGames: true,
    birthdayHasCake: true,
    corporateUsesAttendees: true,
    fallback: 'wedding',
    profileTemplate: 'quince',
    immutable: true
  });
  expect(errors).toEqual([]);
});


test('MGD-019: catálogo universal filtra visibilidad por eventProfile sin eliminar objetos', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const catalogUrl = new URL('src/modules/distribucion/distribution-catalog.js', window.location.href).href;
    const profileUrl = new URL('src/core/app/event-profile.js', window.location.href).href;
    const { DISTRIBUTION_OBJECT_CATALOG, getVisibleCatalogGroups } = await import(catalogUrl);
    const { getEventProfile } = await import(profileUrl);
    const visibleTypes = (eventType) => getVisibleCatalogGroups(eventType).flatMap((group) => group.items.map((item) => item.type));

    return {
      catalogCount: Object.keys(DISTRIBUTION_OBJECT_CATALOG).length,
      weddingProfile: getEventProfile('wedding').distributionCatalog.eventType,
      birthdayProfile: getEventProfile('birthday').distributionCatalog.eventType,
      weddingHasCouple: visibleTypes('wedding').includes('couple'),
      birthdayHasCouple: visibleTypes('birthday').includes('couple'),
      religiousHasAltar: visibleTypes('religious').includes('altar'),
      corporateHasAltar: visibleTypes('corporate').includes('altar'),
      birthdayHasPhoto: visibleTypes('birthday').includes('photo'),
      babyHasPhoto: visibleTypes('baby_shower').includes('photo'),
      weddingHasCake: visibleTypes('wedding').includes('cake'),
      corporateHasCake: visibleTypes('corporate').includes('cake'),
      barUniversal: ['wedding','birthday','quince','baby_shower','religious','graduation','corporate','custom']
        .every((eventType) => visibleTypes(eventType).includes('bar'))
    };
  });

  expect(result).toEqual({
    catalogCount: 38,
    weddingProfile: 'wedding',
    birthdayProfile: 'birthday',
    weddingHasCouple: true,
    birthdayHasCouple: false,
    religiousHasAltar: true,
    corporateHasAltar: false,
    birthdayHasPhoto: true,
    babyHasPhoto: false,
    weddingHasCake: true,
    corporateHasCake: false,
    barUniversal: true
  });
  expect(errors).toEqual([]);
});


test('MGD-020: objetos especializados reutilizan el mismo motor espacial por evento', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const catalogUrl = new URL('src/modules/distribucion/distribution-catalog.js', window.location.href).href;
    const {
      DISTRIBUTION_OBJECT_CATALOG,
      SPECIALIZED_DISTRIBUTION_OBJECT_CATALOG,
      getVisibleCatalogGroups,
      getCatalogItem
    } = await import(catalogUrl);

    const visibleTypes = (eventType) => getVisibleCatalogGroups(eventType)
      .flatMap((group) => group.items.map((item) => item.type));

    return {
      baseCount: Object.keys(DISTRIBUTION_OBJECT_CATALOG).length,
      specializedCount: Object.keys(SPECIALIZED_DISTRIBUTION_OBJECT_CATALOG).length,
      quinceMain: visibleTypes('quince').includes('quince_main_table'),
      quinceChoreo: visibleTypes('quince').includes('quince_choreography'),
      babyGifts: visibleTypes('baby_shower').includes('baby_gifts'),
      babyGames: visibleTypes('baby_shower').includes('baby_games'),
      graduationDiplomas: visibleTypes('graduation').includes('graduation_diplomas'),
      graduationStage: visibleTypes('graduation').includes('graduation_stage'),
      birthdayNoQuinceMain: !visibleTypes('birthday').includes('quince_main_table'),
      weddingNoBabyGames: !visibleTypes('wedding').includes('baby_games'),
      sameCatalogContract: ['quince_main_table','quince_choreography','baby_gifts','baby_games','graduation_diplomas','graduation_stage']
        .every((type) => {
          const item = getCatalogItem(type);
          return Boolean(item?.dimensions?.widthM && item?.dimensions?.heightM && item?.capabilities && item?.spatialFamily);
        })
    };
  });

  expect(result).toEqual({
    baseCount: 38,
    specializedCount: 6,
    quinceMain: true,
    quinceChoreo: true,
    babyGifts: true,
    babyGames: true,
    graduationDiplomas: true,
    graduationStage: true,
    birthdayNoQuinceMain: true,
    weddingNoBabyGames: true,
    sameCatalogContract: true
  });
  expect(errors).toEqual([]);
});


test('MGD-021: motor de invitación y plantilla visual quedan separados', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const engineUrl = new URL('src/core/app/invitation-engine.js', window.location.href).href;
    const templatesUrl = new URL('src/core/app/invitation-templates.js', window.location.href).href;
    const profileUrl = new URL('src/core/app/event-profile.js', window.location.href).href;
    const { INVITATION_ENGINE_FIELDS, invitationEngineModel, hasStableInvitationEngineShape } = await import(engineUrl);
    const { INVITATION_TEMPLATES, getInvitationTemplate } = await import(templatesUrl);
    const { getEventProfile } = await import(profileUrl);

    const model = invitationEngineModel({
      event: { type: 'birthday', name: 'Cumpleaños' },
      date: '2027-01-01',
      location: { name: 'Local' },
      guest: { name: 'Invitado' },
      companions: [{ name: 'Acompañante' }],
      rsvp: { enabled: true },
      questions: [{ id: 'meal' }],
      music: { enabled: true },
      status: 'draft'
    });

    return {
      fieldCount: INVITATION_ENGINE_FIELDS.length,
      stableShape: hasStableInvitationEngineShape(model),
      modelFrozen: Object.isFrozen(model) && Object.isFrozen(model.companions),
      templateCount: Object.keys(INVITATION_TEMPLATES).length,
      templatePresentationOnly: Object.values(INVITATION_TEMPLATES).every((item) => item.presentationOnly === true),
      fallbackTemplate: getInvitationTemplate('unknown').id,
      profileEngine: getEventProfile('wedding').invitationCapabilities.engine,
      birthdayEngine: getEventProfile('birthday').invitationCapabilities.engine
    };
  });

  expect(result).toEqual({
    fieldCount: 9,
    stableShape: true,
    modelFrozen: true,
    templateCount: 3,
    templatePresentationOnly: true,
    fallbackTemplate: 'classic-elegant',
    profileEngine: 'generic-v1',
    birthdayEngine: 'generic-v1'
  });
  expect(errors).toEqual([]);
});


test('MGD-022: contrato de URL pública usa dominio Migrandia y no GitHub', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/public-invitation-url.js')).href;
  const {
    PUBLIC_INVITATION_ORIGIN,
    PUBLIC_INVITATION_PATH,
    normalizePublicInviteId,
    buildPublicInvitationUrl,
    isMigrandiaPublicInvitationUrl
  } = await import(moduleUrl);

  const url = buildPublicInvitationUrl('MGD-X7K92P');

  const result = {
    origin: PUBLIC_INVITATION_ORIGIN,
    path: PUBLIC_INVITATION_PATH,
    normalized: normalizePublicInviteId('/MGD-X7K92P/'),
    url,
    valid: isMigrandiaPublicInvitationUrl(url),
    githubRejected: isMigrandiaPublicInvitationUrl('https://avaldiviezoch.github.io/invitaciones/x'),
    customOrigin: buildPublicInvitationUrl('ABC123', { origin: 'https://invite.migrandiapp.com/' })
  };

  expect(result).toEqual({
    origin: 'https://migrandiapp.com',
    path: '/i/',
    normalized: 'MGD-X7K92P',
    url: 'https://migrandiapp.com/i/MGD-X7K92P',
    valid: true,
    githubRejected: false,
    customOrigin: 'https://invite.migrandiapp.com/i/ABC123'
  });
});


test('MGD-023: ID público independiente se valida y puede revocarse sin persistencia', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/public-invite-id.js')).href;
  const {
    createPublicInviteId,
    isValidPublicInviteId,
    createPublicInviteResolution,
    revokePublicInviteResolution,
    resolveActivePublicInvite
  } = await import(moduleUrl);

  const id = createPublicInviteId(Uint8Array.from([0, 1, 2, 3, 4, 5]));
  const resolution = createPublicInviteResolution({
    publicInviteId: id,
    eventId: 'internal-event-123',
    templateId: 'classic-elegant',
    rsvpConfig: { enabled: true }
  });
  const revoked = revokePublicInviteResolution(resolution, '2026-10-07T04:00:00Z');

  expect({
    id,
    valid: isValidPublicInviteId(id),
    rejectsEventIdAsPublicId: isValidPublicInviteId('internal-event-123'),
    activeEventId: resolveActivePublicInvite(resolution)?.eventId,
    revokedResolvesNull: resolveActivePublicInvite(revoked) === null,
    originalStillActive: resolution.revoked === false,
    revokedFlag: revoked.revoked === true
  }).toEqual({
    id: 'MGD-ABCDEF',
    valid: true,
    rejectsEventIdAsPublicId: false,
    activeEventId: 'internal-event-123',
    revokedResolvesNull: true,
    originalStillActive: true,
    revokedFlag: true
  });
});


test('MGD-024: URL personalizada actúa como alias del ID público seguro', async () => {
  const slugModuleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/custom-invite-slug.js')).href;
  const urlModuleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/public-invitation-url.js')).href;
  const {
    normalizeCustomInviteSlug,
    isValidCustomInviteSlug,
    createCustomInviteAlias,
    revokeCustomInviteAlias,
    resolveCustomInviteAlias
  } = await import(slugModuleUrl);
  const { buildPublicInvitationUrl } = await import(urlModuleUrl);

  const alias = createCustomInviteAlias({
    slug: 'Antonio & Lucero',
    publicInviteId: 'MGD-ABCDEF'
  });
  const revoked = revokeCustomInviteAlias(alias);

  expect({
    normalized: normalizeCustomInviteSlug('Antonio & Lucero'),
    valid: isValidCustomInviteSlug('antonio-lucero'),
    url: buildPublicInvitationUrl(alias.slug),
    secureTarget: resolveCustomInviteAlias(alias),
    revokedTarget: resolveCustomInviteAlias(revoked),
    exposesEventId: Object.hasOwn(alias, 'eventId')
  }).toEqual({
    normalized: 'antonio-lucero',
    valid: true,
    url: 'https://migrandiapp.com/i/antonio-lucero',
    secureTarget: 'MGD-ABCDEF',
    revokedTarget: null,
    exposesEventId: false
  });
});


test('MGD-025 fase 1: mapa de dominios separa planner-cloud sin romper legacy', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/planner-domain-map.js')).href;
  const {
    DOMAIN_SCHEMA_VERSION,
    PLANNER_DOMAIN_BY_STORAGE_KEY,
    getPlannerDomain,
    isPlannerDomainMigrated
  } = await import(moduleUrl);

  expect({
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    mappedKeys: Object.keys(PLANNER_DOMAIN_BY_STORAGE_KEY).length,
    checklist: getPlannerDomain('planificador_bodas_checklist_v1'),
    budget: getPlannerDomain('planificador_bodas_presupuesto_v5_etiquetas'),
    guests: getPlannerDomain('planificador_bodas_invitados_v1'),
    sharedGuests: getPlannerDomain('planificador_bodas_datos_compartidos_v1'),
    distribution: getPlannerDomain('planificador_bodas_distribucion_v1'),
    ideas: getPlannerDomain('planificador_bodas_ideas_v1'),
    music: getPlannerDomain('migrandia.music.v1'),
    vendors: getPlannerDomain('planificador_bodas_proveedores_v1'),
    timeline: getPlannerDomain('planificador_bodas_cronograma_v1'),
    unknownFallback: getPlannerDomain('legacy-unknown'),
    unknownMigrated: isPlannerDomainMigrated('legacy-unknown')
  }).toEqual({
    schemaVersion: 1,
    mappedKeys: 10,
    checklist: 'checklist',
    budget: 'budget',
    guests: 'guests',
    sharedGuests: 'guests',
    distribution: 'distribution',
    ideas: 'ideas',
    music: 'music',
    vendors: 'vendors',
    timeline: 'timeline',
    unknownFallback: 'other',
    unknownMigrated: false
  });
});


test('MGD-025 fase 2: lectura nueva exige token de sincronización antes de desplazar legacy', async () => {
  const plannerSource = await import('node:fs/promises').then(({ readFile }) =>
    readFile(path.resolve(process.cwd(), 'src/services/planner-cloud.js'), 'utf8')
  );
  const domainSource = await import('node:fs/promises').then(({ readFile }) =>
    readFile(path.resolve(process.cwd(), 'src/services/planner-domain-cloud.js'), 'utf8')
  );

  expect({
    plannerReadsDomain: plannerSource.includes('readPlannerDomainEntries'),
    requiresMetaToken: plannerSource.includes('Boolean(meta.syncToken)'),
    checksTokenMatch: plannerSource.includes('candidate.syncToken === meta.syncToken'),
    keepsLegacyFallback: plannerSource.includes('readPlannerBackup(context, meta)'),
    writesSyncTokenToLegacy: plannerSource.includes('syncToken,'),
    passesTokenToShadow: plannerSource.includes('writePlannerDomainShadowEntries(context, entries, syncToken)'),
    domainStoresToken: domainSource.includes("syncToken: String(syncToken || '')"),
    domainReturnsToken: domainSource.includes("syncToken: String(snapshot.data()?.syncToken || '')")
  }).toEqual({
    plannerReadsDomain: true,
    requiresMetaToken: true,
    checksTokenMatch: true,
    keepsLegacyFallback: true,
    writesSyncTokenToLegacy: true,
    passesTokenToShadow: true,
    domainStoresToken: true,
    domainReturnsToken: true
  });
});


test('MGD-025 fase 3: fallback legacy autorrepara solo claves faltantes sin backfill masivo', async () => {
  const plannerSource = await import('node:fs/promises').then(({ readFile }) =>
    readFile(path.resolve(process.cwd(), 'src/services/planner-cloud.js'), 'utf8')
  );

  expect({
    hasMigrationEntries: plannerSource.includes('const migrationEntries = {}'),
    onlyFallbackKeys: plannerSource.includes('fallbackKeys.forEach((key) =>'),
    requiresDomainToken: plannerSource.includes('canUseDomain'),
    requiresEditCapability: plannerSource.includes('weddingCapabilities(context.role).canEdit'),
    checksLegacyPresence: plannerSource.includes('Object.prototype.hasOwnProperty.call(backup?.localStorage || {}, key)'),
    writesOnlyCollectedEntries: plannerSource.includes('writePlannerDomainShadowEntries(context, migrationEntries, meta.syncToken)'),
    nonBlocking: plannerSource.includes("void writePlannerDomainShadowEntries(context, migrationEntries, meta.syncToken)")
  }).toEqual({
    hasMigrationEntries: true,
    onlyFallbackKeys: true,
    requiresDomainToken: true,
    requiresEditCapability: true,
    checksLegacyPresence: true,
    writesOnlyCollectedEntries: true,
    nonBlocking: true
  });
});


test('MGD-025 fase 4: readiness impide retirar legacy si el dominio no está validado', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/planner-domain-readiness.js')).href;
  const {
    READINESS_STATUS,
    assessPlannerDomainEntry,
    summarizePlannerDomainReadiness
  } = await import(moduleUrl);

  const ready = assessPlannerDomainEntry({
    legacyHasValue: true,
    legacySyncToken: 'token-1',
    domainEntry: { exists: true, syncToken: 'token-1' }
  });
  const missing = assessPlannerDomainEntry({
    legacyHasValue: true,
    legacySyncToken: 'token-1',
    domainEntry: { exists: false, syncToken: '' }
  });
  const stale = assessPlannerDomainEntry({
    legacyHasValue: true,
    legacySyncToken: 'token-1',
    domainEntry: { exists: true, syncToken: 'token-0' }
  });
  const legacyOnly = assessPlannerDomainEntry({
    legacyHasValue: true,
    legacySyncToken: '',
    domainEntry: { exists: false, syncToken: '' }
  });
  const inaccessible = assessPlannerDomainEntry({
    legacyHasValue: true,
    legacySyncToken: 'token-1',
    domainEntry: null,
    domainError: true
  });

  const summary = summarizePlannerDomainReadiness({
    ready,
    missing,
    stale,
    legacyOnly,
    inaccessible
  });

  expect({
    statuses: [
      ready.status,
      missing.status,
      stale.status,
      legacyOnly.status,
      inaccessible.status
    ],
    readyCanRetire: ready.safeToRetireLegacy,
    missingCanRetire: missing.safeToRetireLegacy,
    staleCanRetire: stale.safeToRetireLegacy,
    legacyOnlyCanRetire: legacyOnly.safeToRetireLegacy,
    inaccessibleCanRetire: inaccessible.safeToRetireLegacy,
    summaryCanRetire: summary.safeToRetireLegacy,
    readyCount: summary.ready,
    constants: READINESS_STATUS
  }).toEqual({
    statuses: ['ready', 'missing', 'stale', 'legacy-only', 'inaccessible'],
    readyCanRetire: true,
    missingCanRetire: false,
    staleCanRetire: false,
    legacyOnlyCanRetire: false,
    inaccessibleCanRetire: false,
    summaryCanRetire: false,
    readyCount: 1,
    constants: {
      READY: 'ready',
      MISSING: 'missing',
      STALE: 'stale',
      LEGACY_ONLY: 'legacy-only',
      INACCESSIBLE: 'inaccessible'
    }
  });
});


test('MGD-025 fase 5: diagnóstico readiness es solo lectura y no retira legacy', async () => {
  const plannerSource = await import('node:fs/promises').then(({ readFile }) =>
    readFile(path.resolve(process.cwd(), 'src/services/planner-cloud.js'), 'utf8')
  );

  const start = plannerSource.indexOf('async function inspectPlannerDomainReadiness');
  const end = plannerSource.indexOf('async function readPlannerStorageKey', start);
  const diagnosticSource = plannerSource.slice(start, end);

  expect({
    exported: plannerSource.includes('inspectPlannerDomainReadiness,'),
    readsMeta: diagnosticSource.includes('readPlannerMeta(context)'),
    readsLegacy: diagnosticSource.includes('readPlannerBackup(context, meta)'),
    readsDomain: diagnosticSource.includes('readPlannerDomainEntries(context, requested)'),
    assessesEachKey: diagnosticSource.includes('assessPlannerDomainEntry({'),
    summarizes: diagnosticSource.includes('summarizePlannerDomainReadiness(entries)'),
    noWriteLegacy: !diagnosticSource.includes('writePlannerStorage'),
    noWriteDomain: !diagnosticSource.includes('writePlannerDomain'),
    noDelete: !diagnosticSource.includes('delete')
  }).toEqual({
    exported: true,
    readsMeta: true,
    readsLegacy: true,
    readsDomain: true,
    assessesEachKey: true,
    summarizes: true,
    noWriteLegacy: true,
    noWriteDomain: true,
    noDelete: true
  });
});


test('MGD-025 fase 6: domain-only queda bloqueado por defecto y exige readiness + aprobación', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/planner-domain-retirement.js')).href;
  const {
    RETIREMENT_MODE,
    getPlannerReadMode,
    canEnableDomainOnly,
    assertDomainOnlyActivation
  } = await import(moduleUrl);

  const ready = { safeToRetireLegacy: true };
  const notReady = { safeToRetireLegacy: false };

  let blockedMessage = '';
  try {
    assertDomainOnlyActivation({
      storageKey: 'planificador_bodas_checklist_v1',
      readiness: ready,
      explicitlyApproved: false
    });
  } catch (error) {
    blockedMessage = error.message;
  }

  expect({
    defaultMode: getPlannerReadMode('planificador_bodas_checklist_v1'),
    readyWithoutApproval: canEnableDomainOnly({ readiness: ready, explicitlyApproved: false }),
    approvedButNotReady: canEnableDomainOnly({ readiness: notReady, explicitlyApproved: true }),
    readyAndApproved: canEnableDomainOnly({ readiness: ready, explicitlyApproved: true }),
    activation: assertDomainOnlyActivation({
      storageKey: 'planificador_bodas_checklist_v1',
      readiness: ready,
      explicitlyApproved: true
    }),
    blockedMessage,
    constants: RETIREMENT_MODE
  }).toEqual({
    defaultMode: 'hybrid',
    readyWithoutApproval: false,
    approvedButNotReady: false,
    readyAndApproved: true,
    activation: {
      storageKey: 'planificador_bodas_checklist_v1',
      nextMode: 'domain-only'
    },
    blockedMessage: 'La clave todavía no está autorizada para retirar fallback legacy.',
    constants: {
      HYBRID: 'hybrid',
      DOMAIN_ONLY: 'domain-only'
    }
  });
});


test('MGD-025 fase 7: Checklist queda como piloto domain-only pero desactivado', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/planner-domain-pilot.js')).href;
  const {
    PILOT_CANDIDATE_STORAGE_KEY,
    getPilotCandidate,
    validatePilotActivation
  } = await import(moduleUrl);

  const candidate = getPilotCandidate();
  let blocked = false;
  try {
    validatePilotActivation({
      readiness: { safeToRetireLegacy: true },
      explicitlyApproved: false
    });
  } catch {
    blocked = true;
  }

  expect({
    storageKey: PILOT_CANDIDATE_STORAGE_KEY,
    module: candidate.module,
    enabled: candidate.enabled,
    rationale: candidate.rationale,
    blockedWithoutExplicitApproval: blocked
  }).toEqual({
    storageKey: 'planificador_bodas_checklist_v1',
    module: 'checklist',
    enabled: false,
    rationale: ['single-storage-key', 'direct-read-write', 'no-planner-subscription'],
    blockedWithoutExplicitApproval: true
  });
});


test('MGD-025 fase 8: solicitud domain-only queda verificada pero no aplicada', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/planner-domain-activation.js')).href;
  const { buildDomainOnlyActivationRequest } = await import(moduleUrl);

  const request = buildDomainOnlyActivationRequest({
    readiness: { safeToRetireLegacy: true },
    explicitlyApproved: true
  });

  let blockedWithoutReadiness = false;
  try {
    buildDomainOnlyActivationRequest({
      readiness: { safeToRetireLegacy: false },
      explicitlyApproved: true
    });
  } catch {
    blockedWithoutReadiness = true;
  }

  expect({
    request,
    blockedWithoutReadiness
  }).toEqual({
    request: {
      storageKey: 'planificador_bodas_checklist_v1',
      requestedMode: 'domain-only',
      verifiedReady: true,
      explicitlyApproved: true,
      apply: false
    },
    blockedWithoutReadiness: true
  });
});


test('MGD-027: Ideas restringe escritura a Owner/Admin sin quitar Editor global', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/planner-domain-permissions.js')).href;
  const {
    IDEAS_STORAGE_KEY,
    canWritePlannerStorageKey,
    assertPlannerStorageWriteAllowed
  } = await import(moduleUrl);

  const checklistKey = 'planificador_bodas_checklist_v1';
  let editorIdeasBlocked = false;
  try {
    assertPlannerStorageWriteAllowed('editor', [IDEAS_STORAGE_KEY]);
  } catch {
    editorIdeasBlocked = true;
  }

  expect({
    ownerIdeas: canWritePlannerStorageKey('owner', IDEAS_STORAGE_KEY),
    adminIdeas: canWritePlannerStorageKey('admin', IDEAS_STORAGE_KEY),
    editorIdeas: canWritePlannerStorageKey('editor', IDEAS_STORAGE_KEY),
    viewerIdeas: canWritePlannerStorageKey('viewer', IDEAS_STORAGE_KEY),
    editorChecklistStillAllowed: canWritePlannerStorageKey('editor', checklistKey),
    editorIdeasBlocked
  }).toEqual({
    ownerIdeas: true,
    adminIdeas: true,
    editorIdeas: false,
    viewerIdeas: false,
    editorChecklistStillAllowed: true,
    editorIdeasBlocked: true
  });
});


test('MGD-028: límites técnicos V1 están centralizados sin enforcement destructivo', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/platform-limits.js')).href;
  const {
    PLATFORM_LIMITS_VERSION,
    PLATFORM_LIMITS,
    isWithinPlatformLimit,
    assertWithinPlatformLimit,
    assessSerializedEntry
  } = await import(moduleUrl);

  let overflowBlocked = false;
  try {
    assertWithinPlatformLimit('guestsPerEvent', PLATFORM_LIMITS.guestsPerEvent + 1);
  } catch {
    overflowBlocked = true;
  }

  const payload = assessSerializedEntry({ sample: 'ok' });

  expect({
    version: PLATFORM_LIMITS_VERSION,
    limits: PLATFORM_LIMITS,
    guestsAtLimit: isWithinPlatformLimit('guestsPerEvent', PLATFORM_LIMITS.guestsPerEvent),
    guestsOverLimit: isWithinPlatformLimit('guestsPerEvent', PLATFORM_LIMITS.guestsPerEvent + 1),
    overflowBlocked,
    payloadWithinLimit: payload.withinLimit,
    payloadLimit: payload.limit
  }).toEqual({
    version: 1,
    limits: {
      eventsPerUser: 20,
      guestsPerEvent: 2000,
      tablesPerEvent: 250,
      ideasPerEvent: 500,
      providersPerEvent: 300,
      rsvpResponsesPerEvent: 5000,
      imagesPerEvent: 500,
      distributionObjectsPerEvent: 2000,
      serializedEntryBytes: 750000,
      imageBytes: 10485760
    },
    guestsAtLimit: true,
    guestsOverLimit: false,
    overflowBlocked: true,
    payloadWithinLimit: true,
    payloadLimit: 750000
  });
});


test('MGD-029: eliminación de evento exige owner + confirmación fuerte y no ejecuta borrado', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/event-deletion-contract.js')).href;
  const {
    buildEventDeletionPhrase,
    assertStrongEventDeletionConfirmation,
    buildEventDeletionPlan
  } = await import(moduleUrl);

  const context = {
    id: 'event-123',
    name: 'Antonio & Lucero',
    role: 'owner'
  };
  const phrase = buildEventDeletionPhrase(context);

  let wrongPhraseBlocked = false;
  let nonOwnerBlocked = false;
  try {
    assertStrongEventDeletionConfirmation(context, 'Antonio & Lucero');
  } catch {
    wrongPhraseBlocked = true;
  }
  try {
    assertStrongEventDeletionConfirmation({ ...context, role: 'admin' }, phrase);
  } catch {
    nonOwnerBlocked = true;
  }

  const plan = buildEventDeletionPlan(context, phrase);

  expect({
    phrase,
    wrongPhraseBlocked,
    nonOwnerBlocked,
    execute: plan.execute,
    destructive: plan.destructive,
    hasWeddingRoot: plan.resources.includes('weddings/event-123'),
    hasMembers: plan.resources.includes('weddings/event-123/members/*'),
    hasLegacy: plan.resources.includes('weddings/event-123/cloudChunks/*'),
    hasDomainData: plan.resources.includes('weddings/event-123/domainData/*'),
    hasRsvp: plan.resources.includes('publicRsvp/{token} + responses/*')
  }).toEqual({
    phrase: 'Antonio & Lucero :: event-123',
    wrongPhraseBlocked: true,
    nonOwnerBlocked: true,
    execute: false,
    destructive: true,
    hasWeddingRoot: true,
    hasMembers: true,
    hasLegacy: true,
    hasDomainData: true,
    hasRsvp: true
  });
});


test('MGD-030: eliminar cuenta bloquea owners y preserva eventos compartidos', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/account-deletion-contract.js')).href;
  const {
    buildAccountDeletionPhrase,
    classifyAccountEvents,
    assertStrongAccountDeletionConfirmation,
    buildAccountDeletionPlan
  } = await import(moduleUrl);

  const user = { uid: 'user-1', email: 'antonio@example.com' };
  const contexts = [
    { id: 'owned-1', name: 'Evento propio', role: 'owner', ownerUid: 'user-1' },
    { id: 'shared-1', name: 'Evento compartido', role: 'editor', ownerUid: 'user-2' }
  ];
  const phrase = buildAccountDeletionPhrase(user);
  const classified = classifyAccountEvents(contexts, user.uid);

  let wrongPhraseBlocked = false;
  try {
    assertStrongAccountDeletionConfirmation(user, 'antonio@example.com');
  } catch {
    wrongPhraseBlocked = true;
  }

  const plan = buildAccountDeletionPlan({
    user,
    contexts,
    confirmation: phrase
  });

  expect({
    phrase,
    owned: classified.owned.map((item) => item.id),
    shared: classified.shared.map((item) => item.id),
    wrongPhraseBlocked,
    execute: plan.execute,
    blockedByOwnedEvents: plan.blockedByOwnedEvents,
    sharedPolicy: plan.responsibilities.sharedEvents,
    rsvpPolicy: plan.responsibilities.rsvp,
    authPolicy: plan.responsibilities.auth
  }).toEqual({
    phrase: 'antonio@example.com :: user-1',
    owned: ['owned-1'],
    shared: ['shared-1'],
    wrongPhraseBlocked: true,
    execute: false,
    blockedByOwnedEvents: true,
    sharedPolicy: 'remove-membership-and-user-index-only',
    rsvpPolicy: 'preserve-event-rsvp-unless-event-is-deleted',
    authPolicy: 'delete-only-after-data-plan-is-clear'
  });
});


test('MGD-031: backup formal incluye eventId y restore bloquea eventos distintos', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/event-backup-contract.js')).href;
  const {
    EVENT_BACKUP_SCHEMA_VERSION,
    createEventBackupEnvelope,
    validateEventBackupEnvelope,
    buildEventRestorePlan
  } = await import(moduleUrl);

  const context = {
    id: 'event-123',
    name: 'Antonio & Lucero',
    eventType: 'wedding',
    themeId: 'one-piece-elegant'
  };

  const backup = createEventBackupEnvelope({
    context,
    payload: { localStorage: { sample: 'ok' } },
    createdAt: '2026-10-07T05:00:00.000Z',
    sourceVersion: 1
  });

  let wrongEventBlocked = false;
  try {
    buildEventRestorePlan({
      backup,
      targetContext: { id: 'event-999' }
    });
  } catch {
    wrongEventBlocked = true;
  }

  const plan = buildEventRestorePlan({
    backup,
    targetContext: { id: 'event-123' }
  });

  expect({
    schemaVersion: EVENT_BACKUP_SCHEMA_VERSION,
    valid: validateEventBackupEnvelope(backup),
    eventId: backup.eventId,
    createdAt: backup.createdAt,
    wrongEventBlocked,
    restore: plan.restore,
    overwriteAllowed: plan.overwriteAllowed,
    sameEvent: plan.sourceEventId === plan.targetEventId
  }).toEqual({
    schemaVersion: 1,
    valid: true,
    eventId: 'event-123',
    createdAt: '2026-10-07T05:00:00.000Z',
    wrongEventBlocked: true,
    restore: false,
    overwriteAllowed: false,
    sameEvent: true
  });
});


test('MGD-032: marcha blanca define cohortes y gate sin enrolar usuarios automáticamente', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/controlled-rollout.js')).href;
  const {
    ROLLOUT_PHASES,
    ROLLOUT_METRICS,
    rolloutPhaseForUsers,
    assessRolloutGate,
    buildControlledRolloutPlan
  } = await import(moduleUrl);

  const healthyGate = {
    e2ePassed: true,
    mobilePassed: true,
    desktopPassed: true,
    criticalErrors: 0,
    permissionViolations: 0,
    persistenceFailures: 0,
    rsvpFailures: 0,
    firebaseHealthy: true,
    workersHealthy: true,
    costsWithinExpectedRange: true
  };

  const blockedGate = assessRolloutGate({
    ...healthyGate,
    persistenceFailures: 1
  });
  const plan = buildControlledRolloutPlan({
    currentUsers: 7,
    gate: healthyGate
  });

  expect({
    phases: ROLLOUT_PHASES,
    metrics: ROLLOUT_METRICS,
    sevenUsersPhase: rolloutPhaseForUsers(7).id,
    twentyUsersPhase: rolloutPhaseForUsers(20).id,
    healthyCanAdvance: plan.assessment.canAdvance,
    blockedCanAdvance: blockedGate.canAdvance,
    autoEnroll: plan.autoEnroll,
    publicBeta: plan.publicBeta
  }).toEqual({
    phases: {
      INTERNAL: { id: 'internal', minUsers: 0, maxUsers: 4 },
      EXTERNAL_SMALL: { id: 'external-small', minUsers: 5, maxUsers: 10 },
      EXTERNAL_EXPANDED: { id: 'external-expanded', minUsers: 20, maxUsers: 30 }
    },
    metrics: ['errors','firebase','workers','costs','ux','mobile','persistence','permissions','rsvp'],
    sevenUsersPhase: 'external-small',
    twentyUsersPhase: 'external-expanded',
    healthyCanAdvance: true,
    blockedCanAdvance: false,
    autoEnroll: false,
    publicBeta: false
  });
});


test('MGD-033: beta pública queda bloqueada mientras existan prerequisitos abiertos', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/public-beta-readiness.js')).href;
  const {
    PUBLIC_BETA_REQUIREMENTS,
    assessPublicBetaReadiness,
    buildPublicBetaPlan
  } = await import(moduleUrl);

  const current = assessPublicBetaReadiness({
    'MGD-002': false,
    'MGD-003': false,
    'MGD-004': true,
    'MGD-006': true,
    'MGD-008': false,
    'MGD-010': false,
    'MGD-026': false,
    multiEventBase: true,
    eventIsolation: true,
    backupTested: true,
    mobileDesktopQa: true
  });

  const allClosed = Object.fromEntries(PUBLIC_BETA_REQUIREMENTS.map((key) => [key, true]));
  const readyPlan = buildPublicBetaPlan(allClosed);

  expect({
    requirements: PUBLIC_BETA_REQUIREMENTS,
    currentPublicBeta: current.publicBeta,
    currentMissing: current.missing,
    readyPublicBeta: readyPlan.publicBeta,
    autoPublish: readyPlan.autoPublish
  }).toEqual({
    requirements: [
      'MGD-002','MGD-003','MGD-004','MGD-006','MGD-008','MGD-010','MGD-026',
      'multiEventBase','eventIsolation','backupTested','mobileDesktopQa'
    ],
    currentPublicBeta: false,
    currentMissing: ['MGD-002','MGD-003','MGD-008','MGD-010','MGD-026'],
    readyPublicBeta: true,
    autoPublish: false
  });
});


test('MGD-034: onboarding usa un solo motor con opciones adaptativas por tipo de evento', async () => {
  const onboardingUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/onboarding-profiles.js')).href;
  const eventProfileUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-profile.js')).href;
  const { ONBOARDING_ENGINE_ID, ONBOARDING_PROFILES, getOnboardingProfile } = await import(onboardingUrl);
  const { getEventProfile } = await import(eventProfileUrl);

  const ids = Object.keys(ONBOARDING_PROFILES);
  expect({
    engine: ONBOARDING_ENGINE_ID,
    ids,
    sameEngine: ids.every((id) => ONBOARDING_PROFILES[id].engine === ONBOARDING_ENGINE_ID),
    firstQuestion: ids.every((id) => ONBOARDING_PROFILES[id].firstQuestion === 'eventType'),
    weddingRoles: getOnboardingProfile('wedding').organizerRoleQuestion.options.map((item) => item.label),
    birthdayRoles: getOnboardingProfile('birthday').organizerRoleQuestion.options.map((item) => item.label),
    corporateRoles: getOnboardingProfile('corporate').organizerRoleQuestion.options.map((item) => item.label),
    fallback: getOnboardingProfile('unknown').profileId,
    profileConsumesContract: getEventProfile('graduation').onboarding.profileId,
    noIndependentEngines: new Set(ids.map((id) => ONBOARDING_PROFILES[id].engine)).size
  }).toEqual({
    engine: 'adaptive-onboarding-v1',
    ids: ['wedding','birthday','quince','baby_shower','religious','graduation','corporate','custom'],
    sameEngine: true,
    firstQuestion: true,
    weddingRoles: ['Novia','Novio','Somos la pareja','Ayudo a organizar'],
    birthdayRoles: ['Es para mí','Para mi hijo/a','Para un familiar','Para otra persona','Ayudo a organizar'],
    corporateRoles: ['Represento a la empresa','Colaborador/a','Organizador interno','Organizador / proveedor externo'],
    fallback: 'wedding',
    profileConsumesContract: 'graduation',
    noIndependentEngines: 1
  });
});


test('MGD-035: ageProfile adapta sugerencias sin cambiar permisos, identidad ni estructura', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/age-profile.js')).href;
  const onboardingUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/onboarding-profiles.js')).href;
  const {
    AGE_PROFILE_IDS,
    ageProfileFromAge,
    eventUsesAgeProfile,
    buildAgeProfile,
    suggestionHints
  } = await import(moduleUrl);
  const { getOnboardingProfile } = await import(onboardingUrl);

  const birthdayChild = buildAgeProfile({ eventType: 'birthday', age: 5 });
  const birthdayAdult = buildAgeProfile({ eventType: 'birthday', age: 34 });
  const quince = buildAgeProfile({ eventType: 'quince', age: 15 });
  const corporate = buildAgeProfile({ eventType: 'corporate', age: 40 });
  const hints = suggestionHints('child');

  expect({
    ids: AGE_PROFILE_IDS,
    child: ageProfileFromAge(5),
    teen: ageProfileFromAge(15),
    adult: ageProfileFromAge(34),
    older: ageProfileFromAge(70),
    birthdayUsesAge: eventUsesAgeProfile('birthday'),
    corporateUsesAge: eventUsesAgeProfile('corporate'),
    birthdayChild,
    birthdayAdult,
    quince,
    corporate,
    hints,
    birthdayHasQuestion: Boolean(getOnboardingProfile('birthday').ageQuestion),
    weddingHasQuestion: Boolean(getOnboardingProfile('wedding').ageQuestion)
  }).toEqual({
    ids: ['child','teen','young-adult','adult','older-adult'],
    child: 'child',
    teen: 'teen',
    adult: 'adult',
    older: 'older-adult',
    birthdayUsesAge: true,
    corporateUsesAge: false,
    birthdayChild: {
      eventType: 'birthday',
      applicable: true,
      age: 5,
      profileId: 'child',
      affectsPermissions: false,
      affectsIdentity: false,
      affectsDataShape: false
    },
    birthdayAdult: {
      eventType: 'birthday',
      applicable: true,
      age: 34,
      profileId: 'adult',
      affectsPermissions: false,
      affectsIdentity: false,
      affectsDataShape: false
    },
    quince: {
      eventType: 'quince',
      applicable: true,
      age: 15,
      profileId: 'teen',
      affectsPermissions: false,
      affectsIdentity: false,
      affectsDataShape: false
    },
    corporate: {
      eventType: 'corporate',
      applicable: false,
      age: null,
      profileId: null,
      affectsPermissions: false,
      affectsIdentity: false,
      affectsDataShape: false
    },
    hints: {
      audiencePreset: 'child',
      themeMode: 'suggest-only',
      checklistMode: 'suggest-only',
      invitationMode: 'suggest-only',
      activityMode: 'suggest-only',
      manualThemeOverride: true
    },
    birthdayHasQuestion: true,
    weddingHasQuestion: false
  });
});


test('MGD-036: preview progresiva adapta perfil y tema sin persistir automáticamente', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/onboarding-preview.js')).href;
  const { themeSuggestions, buildOnboardingPreview } = await import(moduleUrl);

  const childBirthday = buildOnboardingPreview({
    eventType: 'birthday',
    organizerRole: 'child',
    age: 5
  });

  const corporate = buildOnboardingPreview({
    eventType: 'corporate',
    organizerRole: 'company',
    age: 40
  });

  const manualTheme = buildOnboardingPreview({
    eventType: 'birthday',
    organizerRole: 'self',
    age: 34,
    themeId: 'minimal-black'
  });

  expect({
    childEventType: childBirthday.eventType,
    childAgeProfile: childBirthday.ageProfile.profileId,
    childSuggestions: childBirthday.theme.suggestedThemeIds,
    childPreviewOnly: childBirthday.previewOnly,
    childPersist: childBirthday.persist,
    corporateSuggestions: corporate.theme.suggestedThemeIds,
    corporateAgeApplicable: corporate.ageProfile.applicable,
    manualTheme: manualTheme.theme.selectedThemeId,
    manualOverrideAllowed: manualTheme.theme.manualOverrideAllowed,
    flowIndependent: themeSuggestions({ eventType: 'wedding', ageProfileId: null })
  }).toEqual({
    childEventType: 'birthday',
    childAgeProfile: 'child',
    childSuggestions: ['classic-elegant', 'one-piece-elegant'],
    childPreviewOnly: true,
    childPersist: false,
    corporateSuggestions: ['minimal-black', 'classic-elegant'],
    corporateAgeApplicable: false,
    manualTheme: 'minimal-black',
    manualOverrideAllowed: true,
    flowIndependent: ['classic-elegant', 'one-piece-elegant', 'minimal-black']
  });
});


test('MGD-026: branding de acceso es multi-evento y no expone Firebase en la UI propia', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await page.locator('#discoverSkipButton').click();

  await expect(page.locator('#authTitle')).toHaveText('Tu evento, siempre contigo');
  await expect(page.locator('#authIntro')).toHaveText('Inicia sesión para acceder a Mi Gran Día.');
  await expect(page.locator('#googleLoginButton')).toHaveText('Continuar con Google');

  const bodyText = await page.locator('body').innerText();
  expect(bodyText.includes('Firebase')).toBe(false);

  const branding = await page.evaluate(async () => {
    const moduleUrl = new URL('src/core/app/auth-branding.js', window.location.href).href;
    const { AUTH_BRANDING } = await import(moduleUrl);
    return AUTH_BRANDING;
  });

  expect({
    productName: branding.productName,
    platformName: branding.platformName,
    loginTitle: branding.loginTitle,
    googleButtonLabel: branding.googleButtonLabel
  }).toEqual({
    productName: 'Mi Gran Día',
    platformName: 'Migrandia',
    loginTitle: 'Tu evento, siempre contigo',
    googleButtonLabel: 'Continuar con Google'
  });

  expect(errors).toEqual([]);
});


test('MGD-011: un UID admite múltiples eventos con rutas aisladas por eventId', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-context-isolation.js')).href;
  const {
    eventScopedPaths,
    assessMultiEventIsolation,
    assertMultiEventIsolation
  } = await import(moduleUrl);

  const uid = 'user-1';
  const contexts = [
    { id: 'event-a', role: 'owner', ownerUid: uid, eventType: 'wedding' },
    { id: 'event-b', role: 'owner', ownerUid: uid, eventType: 'birthday' },
    { id: 'event-c', role: 'editor', ownerUid: 'user-2', eventType: 'baby_shower' }
  ];

  const assessment = assessMultiEventIsolation({ uid, contexts });
  const eventA = eventScopedPaths(uid, 'event-a');
  const eventB = eventScopedPaths(uid, 'event-b');

  let duplicateBlocked = false;
  try {
    assertMultiEventIsolation({
      uid,
      contexts: [
        { id: 'event-a', role: 'owner' },
        { id: 'event-a', role: 'editor' }
      ]
    });
  } catch {
    duplicateBlocked = true;
  }

  expect({
    eventCount: assessment.eventCount,
    uniqueEventIds: assessment.uniqueEventIds,
    isolatedEventRoots: assessment.isolatedEventRoots,
    isolatedUserIndexes: assessment.isolatedUserIndexes,
    distinctRoots: eventA.eventRoot !== eventB.eventRoot,
    distinctIndexes: eventA.userIndex !== eventB.userIndex,
    distinctPlanner: eventA.plannerMeta !== eventB.plannerMeta,
    duplicateBlocked
  }).toEqual({
    eventCount: 3,
    uniqueEventIds: true,
    isolatedEventRoots: true,
    isolatedUserIndexes: true,
    distinctRoots: true,
    distinctIndexes: true,
    distinctPlanner: true,
    duplicateBlocked: true
  });
});


test('MGD-002: runtime separa Worker DEV y API PROD sin mezclar hosting estático', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/services/runtime-environment.js')).href;
  const source = await import(moduleUrl);

  const originalLocation = globalThis.location;
  try {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { hostname: 'avaldiviezoch.github.io' }
    });
    const dev = source.currentEnvironment();
    const devUrl = source.serviceUrl('/api/music-preview');

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { hostname: 'migrandiapp.com' }
    });
    const prod = source.currentEnvironment();
    const prodUrl = source.serviceUrl('/api/music-preview');

    expect({
      devName: dev.name,
      devBase: dev.serviceBaseUrl,
      devUrl,
      prodName: prod.name,
      prodBase: prod.serviceBaseUrl,
      prodUrl,
      prodUsesStaticWorker: prodUrl.includes('wedding.avaldiviezoch.workers.dev')
    }).toEqual({
      devName: 'development',
      devBase: 'https://migrandia-dev.avaldiviezoch.workers.dev',
      devUrl: 'https://migrandia-dev.avaldiviezoch.workers.dev/api/music-preview',
      prodName: 'production',
      prodBase: 'https://migrandia-api.avaldiviezoch.workers.dev',
      prodUrl: 'https://migrandia-api.avaldiviezoch.workers.dev/api/music-preview',
      prodUsesStaticWorker: false
    });
  } finally {
    if (originalLocation === undefined) delete globalThis.location;
    else Object.defineProperty(globalThis, 'location', { configurable: true, value: originalLocation });
  }
});


test('MGD-003: infraestructura RSVP anti-abuso está configurada en DEV y PROD sin activar UX productiva', async () => {
  const fs = await import('node:fs/promises');
  const worker = await fs.readFile(path.resolve(process.cwd(), 'cloudflare/migrandia-worker.js'), 'utf8');
  const dev = JSON.parse((await fs.readFile(path.resolve(process.cwd(), 'cloudflare/wrangler.jsonc'), 'utf8')).replace(/^\s*\/\/.*$/gm, ''));
  const prod = JSON.parse((await fs.readFile(path.resolve(process.cwd(), 'cloudflare/wrangler.prod.jsonc'), 'utf8')).replace(/^\s*\/\/.*$/gm, ''));

  const devRsvp = dev.ratelimits.find((item) => item.name === 'RSVP_RATE_LIMIT');
  const prodRsvp = prod.ratelimits.find((item) => item.name === 'RSVP_RATE_LIMIT');

  expect({
    hasVerifyEndpoint: worker.includes('/api/rsvp/verify'),
    hasTurnstileSecret: worker.includes('TURNSTILE_SECRET_KEY'),
    hasSiteverify: worker.includes('https://challenges.cloudflare.com/turnstile/v0/siteverify'),
    hasRsvpRateLimit: worker.includes('RSVP_RATE_LIMIT'),
    hasNoStore: worker.includes('Cache-Control') && worker.includes('no-store'),
    allowsMigrandia: worker.includes('https://migrandiapp.com') && worker.includes('https://www.migrandiapp.com'),
    devWorker: dev.name,
    prodWorker: prod.name,
    devLimit: devRsvp?.simple,
    prodLimit: prodRsvp?.simple,
    separateNamespaces: devRsvp?.namespace_id !== prodRsvp?.namespace_id
  }).toEqual({
    hasVerifyEndpoint: true,
    hasTurnstileSecret: true,
    hasSiteverify: true,
    hasRsvpRateLimit: true,
    hasNoStore: true,
    allowsMigrandia: true,
    devWorker: 'migrandia-dev',
    prodWorker: 'migrandia-api',
    devLimit: { limit: 5, period: 60 },
    prodLimit: { limit: 5, period: 60 },
    separateNamespaces: true
  });
});
