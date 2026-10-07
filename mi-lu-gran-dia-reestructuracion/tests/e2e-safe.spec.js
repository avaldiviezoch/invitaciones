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
