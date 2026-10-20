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

function collectUnexpectedErrors(page, { consoleErrors = true } = {}) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (!consoleErrors || message.type() !== 'error') return;
    const text = message.text();
    if (KNOWN_BROWSER_NOISE.some((known) => text.includes(known))) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

test('MGD-037: Música mantiene plantilla neutra y solicitudes RSVP opcionales', async () => {
  const fs = await import('node:fs/promises');
  const [html, js] = await Promise.all([
    fs.readFile(path.resolve(process.cwd(), 'src/modules/musica/index.html'), 'utf8'),
    fs.readFile(path.resolve(process.cwd(), 'src/modules/musica/index.js'), 'utf8')
  ]);
  expect(html).toContain('MÓDULO · ESPACIO DEL EVENTO');
  expect(html).not.toMatch(/MÚSICA DE BODA|Momento de la boda|música de tu boda/);
  expect(js).toContain('try { requests=requestEntries(await loadRsvpAdminSnapshot(context)); }');
  expect(js).toContain('try { coversChanged=await hydratePlaylistCovers(plan); }');
  expect(js).toContain('if(coversChanged)');
});

test('MGD-037: textos iniciales son neutros y se contextualizan por evento sin duplicar motores', async () => {
  const fs = await import('node:fs/promises');
  const [html, dashboard] = await Promise.all([
    fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8'),
    fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8')
  ]);
  expect(html).toContain('data-event-copy="space"');
  expect(html).toContain('data-event-copy="during"');
  expect(html).toContain('data-event-copy="current"');
  expect(html).toContain('data-event-copy="active"');
  for (const text of ['Checklist de boda</span>', 'Espacio de la boda</span>', 'En la boda</span>', 'LO PRÓXIMO DE TU BODA</span>', 'Cargando información de tu boda</span>']) {
    expect(html).not.toContain(text);
  }
  for (const text of ['Espacio de la boda', 'En la boda', 'LO PRÓXIMO DE TU BODA', 'ACCESOS DE LA BODA']) {
    expect(dashboard).toContain(text);
  }
  const moduleFiles = await Promise.all([
    'src/modules/checklist/index.js',
    'src/modules/cronograma/index.js',
    'src/modules/musica/index.js',
    'src/modules/presupuesto/index.js'
  ].map((file) => fs.readFile(path.resolve(process.cwd(), file), 'utf8')));
  expect(moduleFiles[0]).toContain('<h1>Checklist</h1>');
  expect(moduleFiles[1]).toContain("'Datos del evento activo · edición habilitada'");
  expect(moduleFiles[2]).toContain("musicEventType==='wedding'?'MÚSICA DE BODA':'MÚSICA DEL EVENTO'");
  expect(moduleFiles[3]).toContain("'presupuesto-evento.csv'");
  expect(dashboard).toContain("const isWeddingContext = context?.eventType === 'wedding'");
  expect(dashboard).toContain("setEventCopy('.module-link[data-module=\"checklist\"] span'");
});

test('MGD-037: módulo Música conserva sintaxis JavaScript válida', async () => {
  const fs = await import('node:fs/promises');
  const { spawnSync } = await import('node:child_process');
  const file = path.resolve(process.cwd(), 'src/modules/musica/index.js');
  const { status, stderr } = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  expect(status, stderr || 'Fallo de sintaxis del módulo Música').toBe(0);
  const code = await fs.readFile(file, 'utf8');
  expect(code).toContain("</span></a>';}).join('')");
});

test('MGD-037: Checklist usa categorías de cada evento sin alterar tareas guardadas', async () => {
  const fs = await import('node:fs/promises');
  const { getChecklistTemplate } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/checklist-templates.js')).href);
  const src = await fs.readFile(path.resolve(process.cwd(), 'src/modules/checklist/index.js'), 'utf8');
  expect(src).toContain("getChecklistTemplate(eventType).groups");
  expect(src).toContain("state.groups.forEach((name) => names.add(name))");
  expect(src).toContain("state.tasks.forEach((task, index) => names.add(taskCategory(task, index)))");
  const graduation = getChecklistTemplate('graduation').groups;
  expect(graduation).toContain('Celebración');
  expect(graduation).not.toContain('Ceremonia civil y religiosa');
  expect(getChecklistTemplate('birthday').groups).toContain('Comida y torta');
  expect(getChecklistTemplate('wedding').groups).toContain('Ceremonia civil y religiosa');
});

test('MGD-037: Checklist es siempre nombre genérico en título y acordeón', async () => {
  const fs = await import('node:fs/promises');
  const [checklist, dashboard, html] = await Promise.all([
    fs.readFile(path.resolve(process.cwd(), 'src/modules/checklist/index.js'), 'utf8'),
    fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8'),
    fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8')
  ]);
  expect(checklist).toContain('<h1>Checklist</h1>');
  expect(checklist).not.toContain('<h1>Checklist de boda</h1>');
  expect(checklist).not.toContain('<h1>Checklist del evento</h1>');
  expect(dashboard).toContain("setEventCopy('.module-link[data-module=\"checklist\"] span', 'Checklist')");
  expect(html).toContain('Checklist</span>');
});

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
  // Este test verifica únicamente validación local; reCAPTCHA/AppCheck externos pueden responder 403.
  // Conservamos todos los errores de JavaScript (pageerror), sin filtrar el resto de la suite.
  const errors = collectUnexpectedErrors(page, { consoleErrors: false });
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
    corporateRoles: ['Lo organizo para mi empresa','Soy parte del equipo organizador','Ayudo a organizar'],
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

test('MGD-026: la home publica privacidad y términos y ambas páginas responden', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const privacyLink = page.locator('a[href="privacy.html"]').first();
  const termsLink = page.locator('a[href="terms.html"]').first();
  await expect(privacyLink).toHaveText(/Privacidad/);
  await expect(termsLink).toHaveText(/Términos/);

  const privacyResponse = await page.request.get(new URL('privacy.html', page.url()).href);
  const termsResponse = await page.request.get(new URL('terms.html', page.url()).href);
  expect(privacyResponse.ok()).toBe(true);
  expect(termsResponse.ok()).toBe(true);

  const privacyHtml = await privacyResponse.text();
  const termsHtml = await termsResponse.text();
  expect(privacyHtml).toContain('<h1>Política de Privacidad</h1>');
  expect(termsHtml).toContain('<h1>Términos y Condiciones</h1>');
});


test('Presupuesto: primer gasto siempre tiene categoría visible y una sola instancia de módulo', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const budgetResponse = await page.request.get(new URL('src/modules/presupuesto/index.js?v=17', page.url()).href);
  expect(budgetResponse.ok()).toBe(true);
  const budgetSource = await budgetResponse.text();
  expect(budgetSource).toContain("const GENERAL_CATEGORY_ID='cat_general'");
  expect(budgetSource).toContain("if(!state.categories.length)ensureGeneralCategory()");
  expect(budgetSource).toContain("orphanItems.forEach(item=>{item.categoryId=GENERAL_CATEGORY_ID})");

  const dashboardResponse = await page.request.get(new URL('src/modules/dashboard/inicio.js', page.url()).href);
  expect(dashboardResponse.ok()).toBe(true);
  const dashboardSource = await dashboardResponse.text();
  expect(dashboardSource).toContain("../presupuesto/index.js?v=18");
  expect((dashboardSource.match(/presupuesto\/index\.js\?v=18/g) || []).length).toBe(2);
  expect(dashboardSource).not.toContain("../presupuesto/index.js?v=15");
  expect(dashboardSource).not.toContain("../presupuesto/index.js?v=16");
});

test('Presupuesto: total editable alimenta saldo disponible y persiste por evento', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });

  const htmlResponse = await page.request.get(new URL('src/modules/presupuesto/index.html?v=9', page.url()).href);
  expect(htmlResponse.ok()).toBe(true);
  const html = await htmlResponse.text();
  expect(html).toContain('data-budget-total-input');
  expect(html).toContain('Presupuesto total de la boda');

  const jsResponse = await page.request.get(new URL('src/modules/presupuesto/index.js?v=18', page.url()).href);
  expect(jsResponse.ok()).toBe(true);
  const source = await jsResponse.text();
  expect(source).toContain("state.settings.totalBudget=n(e.target.value)");
  expect(source).toContain("const t=grandTotals(),budget=n(state.settings.totalBudget),available=Math.max(0,budget-t.paid)");
  expect(source).toContain("void persist('Presupuesto total actualizado')");
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


test('Música: módulo conserva helper de hosts y HTML válido', async () => {
  const musicJs = await (await import('node:fs/promises')).readFile(path.resolve(process.cwd(), 'src/modules/musica/index.js'), 'utf8');
  const musicHtml = await (await import('node:fs/promises')).readFile(path.resolve(process.cwd(), 'src/modules/musica/index.html'), 'utf8');

  expect(musicJs).toMatch(/function\s+hostMatches\s*\(/);
  expect(musicJs).toContain("host.endsWith('.'+domain)");
  expect(musicHtml.trim().endsWith('</div>')).toBe(true);
  expect(musicHtml.includes('\n/div>')).toBe(false);
});

test('MGD-037 Fase 2a: contrato de creación nuevo evento y fallback legacy sin escrituras reales', async () => {
  const fs = await import('node:fs/promises');
  const service = await fs.readFile(path.resolve(process.cwd(), 'src/services/wedding-context.js'), 'utf8');
  const { DEFAULT_EVENT_TYPE, normalizeEventType } = await import(
    pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-type.js')).href
  );
  const { DEFAULT_THEME_ID, normalizeThemeId } = await import(
    pathToFileURL(path.resolve(process.cwd(), 'src/core/app/theme-id.js')).href
  );

  const creation = service.match(/async function createWedding\(\{[\s\S]*?\n\}\n/);
  expect(creation).not.toBeNull();
  const source = creation[0];
  expect(source).toContain('eventType = DEFAULT_EVENT_TYPE');
  expect(source).toContain('themeId = DEFAULT_THEME_ID');
  expect(source).toContain('const cleanEventType = normalizeEventType(eventType)');
  expect(source).toContain('const cleanThemeId = normalizeThemeId(themeId)');
  expect(source).toContain('batch.set(weddingRef, {');
  expect(source).toContain('date: cleanDate, eventType: cleanEventType, themeId: cleanThemeId');
  expect(source).toContain("batch.set(doc(db, 'users', user.uid, 'weddings', weddingId), {");
  expect(source).toContain('return { id: weddingId, name: cleanName, date: cleanDate, role:');
  expect(source).toContain('eventType: cleanEventType, themeId: cleanThemeId');
  expect(source).toContain('await batch.commit()');
  expect((source.match(/await batch\.commit\(\)/g) || []).length).toBe(1);
  expect(source).not.toContain('deleteDoc(');
  expect(source).not.toContain('updateDoc(');

  expect(DEFAULT_EVENT_TYPE).toBe('wedding');
  expect(DEFAULT_THEME_ID).toBe('classic-elegant');
  expect(normalizeEventType('')).toBe('wedding');
  expect(normalizeEventType(' BIRTHDAY ')).toBe('birthday');
  expect(normalizeThemeId('')).toBe('classic-elegant');
  expect(normalizeThemeId(' MINIMAL-BLACK ')).toBe('minimal-black');
  expect(service).toContain('normalizeEventType(wedding.eventType || indexData.eventType)');
  expect(service).toContain('normalizeThemeId(wedding.themeId || indexData.themeId)');
  // No se invoca createWedding ni se autentica: esta prueba no escribe Firebase.
});

test('MGD-037 fase 2b: selector de ocho tipos reutiliza el contrato existente sin nuevo motor', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const { EVENT_TYPES } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-types.js')).href);
  expect(EVENT_TYPES).toHaveLength(8);
  expect(html).toContain('id="newWeddingEventType"');
  expect(html).toContain('id="createWeddingForm"');
  expect(dashboard).toContain("import { EVENT_TYPES, isKnownEventType, eventTypeLabel } from '../../core/app/event-types.js'");
  expect(dashboard).toContain('newEventTypeField.replaceChildren(...EVENT_TYPES.map');
  expect(dashboard).toContain('if (!isKnownEventType(eventType))');
  expect(dashboard).toContain("eventType\n    });");
  expect(html).toContain('inicio.js?v=277-20261012');
  expect((dashboard.match(/async function finishOnboardingForNewUser/g) || [])).toHaveLength(1);
  // No se autentica ni se crea ningún evento durante la prueba.
});

test('MGD-034/037: el onboarding pregunta tipo de evento y reutiliza perfiles canónicos', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const { EVENT_TYPES } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-types.js')).href);
  const { getOnboardingProfile } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/onboarding-profiles.js')).href);
  expect(EVENT_TYPES).toHaveLength(8);
  expect(html.indexOf('data-question="eventType"')).toBeLessThan(html.indexOf('data-question="role"'));
  expect(html).toContain('id="discoverEventOptions"');
  expect(dashboard).toContain('getOnboardingProfile(type)');
  expect(dashboard).toContain("eventType: isKnownEventType(discoverAnswers.eventType)");
  expect(dashboard).toContain('if (!discoverAnswers.eventType && next > eventTypeSlideIndex) return');
  expect(dashboard).toContain("eventTypeLabel(discoverAnswers.eventType)");
  expect(html).toContain('inicio.js?v=277-20261012');
  for (const { id } of EVENT_TYPES) {
    expect(getOnboardingProfile(id).organizerRoleQuestion.options.length).toBeGreaterThan(0);
  }
});

test('MGD-034/035: edad opcional solo en perfiles que la necesitan, sin escritura', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const code = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const { getOnboardingProfile } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/onboarding-profiles.js')).href);
  expect(html).toContain('data-question="age" hidden');
  expect(html).toContain('id="discoverAgeInput"');
  expect(html).toContain('inicio.js?v=277-20261012');
  expect(getOnboardingProfile('wedding').ageQuestion).toBeNull();
  expect(getOnboardingProfile('baby_shower').ageQuestion).toBeNull();
  expect(getOnboardingProfile('birthday').ageQuestion.mode).toBe('optional-exact-age');
  expect(getOnboardingProfile('quince').ageQuestion.mode).toBe('optional-exact-age');
  expect(code).toContain('syncOptionalAgeQuestion()');
  expect(code).toContain('discoverAnswers.age = null');
  expect(code).toContain("if (discoverAgeSlide?.hidden && next === discoverAgeSlideIndex)");
  // Solo memoria/preview. No modifica createWedding(), saveWeddingOnboarding() ni datos reales.
});

test('MGD-034/037: navegación de rol usa el catálogo y no permite saltar sin respuesta válida', async () => {
  const fs = await import('node:fs/promises');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const { EVENT_TYPES } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-types.js')).href);
  const { getOnboardingProfile } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/onboarding-profiles.js')).href);
  expect(dashboard).toContain("allowedRoles.some(({ value }) => value === discoverAnswers.role)");
  expect(dashboard).toContain("index > roleIndex && !getOnboardingProfile");
  expect(dashboard).toContain("discoverAnswers.role = ''");
  for (const { id } of EVENT_TYPES) {
    const options = getOnboardingProfile(id).organizerRoleQuestion.options;
    expect(options.some(({ label }) => label === 'Ayudo a organizar')).toBe(true);
    expect(new Set(options.map(({ value }) => value)).size).toBe(options.length);
    if (id !== 'wedding') {
      expect(options.some(({ label }) => ['Novia', 'Novio', 'Somos la pareja'].includes(label))).toBe(false);
    }
  }
});

test('MGD-034/037: textos de invitados, fecha y presupuesto cambian con eventType', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  expect(js).toContain('function syncDiscoverQuestionCopy()');
  expect(js).toContain('syncDiscoverQuestionCopy();');
  expect(js).toContain('¿Cuántas personas asistirán al evento?');
  expect(js).toContain('¿Ya tienes fecha para el evento?');
  expect(js).toContain('¿Tienes un presupuesto aproximado?');
  expect(html).toContain('id="discoverGuestExactNote"');
  expect(html).toContain('inicio.js?v=277-20261012');
});

test('MGD-034/037: reingresar al mismo tipo conserva el rol y la edad seleccionados', async () => {
  const fs = await import('node:fs/promises');
  const code = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  expect(code).toContain('const eventChanged = discoverAnswers.eventType !== id;');
  expect(code).toContain('if (eventChanged) renderDiscoverRoleOptions();');
  expect(code).not.toContain('    renderDiscoverRoleOptions();\n    moveDiscover(1);');
});

test('MGD-034/037: al cambiar de evento se borran rol y edad previa', async () => {
  const fs = await import('node:fs/promises');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  expect(dashboard).toContain('const eventChanged = discoverAnswers.eventType !== id;');
  expect(dashboard).toContain('if (eventChanged) {');
  expect(dashboard).toContain("discoverAnswers.role = '';");
  expect(dashboard).toContain('discoverAnswers.age = null;');
  expect(dashboard).toContain("if (discoverAgeInput) discoverAgeInput.value = '';");
  expect(dashboard.indexOf('discoverAnswers.age = null;', dashboard.indexOf('if (eventChanged)'))).toBeLessThan(dashboard.indexOf('discoverAnswers.eventType = id;', dashboard.indexOf('if (eventChanged)')));
});

test('MGD-034/037: contrato local de ocultamiento y cabecera del onboarding pendiente de QA publicado', async () => {
  // CI de PR trabaja con la fuente del commit; GitHub Pages sirve main hasta fusionar.
  // Este control no sustituye la verificación visual posterior al despliegue.
  const fs = await import('node:fs/promises');
  const root = process.cwd();
  const [css, dashboard, html] = await Promise.all([
    fs.readFile(path.resolve(root, 'src/modules/dashboard/inicio.css'), 'utf8'),
    fs.readFile(path.resolve(root, 'src/modules/dashboard/inicio.js'), 'utf8'),
    fs.readFile(path.resolve(root, 'index.html'), 'utf8')
  ]);
  expect(css).toContain('.discover-options button[hidden]{display:none}');
  expect(css).toContain('grid-template-rows:minmax(0,1fr) auto');
  expect(css).toContain('.discover-skip{position:absolute;');
  expect(dashboard).toContain("roleHeading.textContent = type === 'wedding'");
  expect(dashboard).toContain("type === 'birthday' ? '¿Para quién organizas este cumpleaños?'");
  expect(dashboard).toContain('button.hidden = !isWedding');
  expect(dashboard).toContain('button.setAttribute(\'aria-pressed\', \'false\')');
  expect(html).toContain('id="discoverMenuButton"');
  expect(html).toContain('inicio.js?v=277-20261012');
});

test('MGD-034/037: al elegir el mismo rango de invitados se conserva el número exacto', async () => {
  const fs = await import('node:fs/promises');
  const code = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const start = code.indexOf("if (name === 'guests') {");
  const end = code.indexOf("if (name === 'dateStatus') {", start);
  const handler = code.slice(start, end);
  expect(handler).toContain('if (discoverAnswers.guests !== value) {');
  expect(handler).toContain('discoverAnswers.guestCount = 0;');
  expect(handler).toContain("if (discoverGuestExactInput) discoverGuestExactInput.value = '';");
  expect(handler.indexOf('if (discoverAnswers.guests !== value) {')).toBeLessThan(handler.indexOf('discoverAnswers.guests = value;'));
});

test('MGD-034/037: responder sin fecha borra fecha anterior y campo visual', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const begin = js.indexOf("if (name === 'dateStatus')");
  const end = js.indexOf("} else if (name === 'budgetStatus')", begin);
  const branch = js.slice(begin, end);
  expect(branch).toContain("if (value !== 'si') {");
  expect(branch).toContain("discoverAnswers.date = '';");
  expect(branch).toContain("if (discoverDateInput) discoverDateInput.value = '';");
  expect(branch).toContain("discoverDateField.hidden = value !== 'si'");
});

test('MGD-034/037: resumen muestra fecha y presupuesto solamente cuando se responden', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  expect(js).toContain("items.push(['Fecha', formatDate(discoverAnswers.date)])");
  expect(js).toContain("items.push(['Fecha', 'Por definir'])");
  expect(js).toContain("items.push(['Presupuesto', 'S/ ' + onboardingBudgetNumber(discoverAnswers.budget).toLocaleString('es-PE')])");
  expect(js).toContain("items.push(['Presupuesto', 'Por definir'])");
  expect(js).toContain("discoverAnswers.budgetStatus === 'definido'");
  expect(js).toContain("discoverAnswers.dateStatus === 'si'");
});

test('MGD-034/037: contenido de preguntas desplazable sin perder footer', async () => {
  const fs = await import('node:fs/promises');
  const [css, js] = await Promise.all([
    fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.css'), 'utf8'),
    fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8')
  ]);
  expect(css).toContain('.discover-question{justify-content:flex-start;overflow-y:auto;overscroll-behavior:contain;padding-top:86px}');
  expect(css).toContain('.discover-track{position:relative;min-height:0}');
  expect(css).toContain('grid-template-rows:minmax(0,1fr) auto');
  expect(js).toContain('if (slide) slide.scrollTop = 0;');
});

test('MGD-034/037: pantalla móvil baja conserva navegación y permite desplazarse por roles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 620 });
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await slide('eventType').locator('[data-event-type="birthday"]').click();
  await expect(slide('role')).toHaveClass(/is-active/);
  const next = page.locator('#discoverNextButton');
  const back = page.locator('#discoverBackButton');
  await expect(next).toBeVisible();
  await expect(back).toBeVisible();
  const nextBox = await next.boundingBox();
  const backBox = await back.boundingBox();
  expect(nextBox).not.toBeNull();
  expect(backBox).not.toBeNull();
  expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(620);
  expect(backBox.y + backBox.height).toBeLessThanOrEqual(620);
  const role = slide('role');
  const before = await role.evaluate((node) => ({ top: node.scrollTop, overflow: node.scrollHeight - node.clientHeight }));
  expect(before.overflow).toBeGreaterThan(0);
  await role.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await expect.poll(() => role.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect(role.locator('[data-dynamic-role="organizer"]')).toBeVisible();
  await role.locator('[data-dynamic-role="organizer"]').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  // Prueba pública: sin inicio de sesión, sin Firebase ni escrituras.
});

test('MGD-034/037: mismo evento conserva rol y cambio de evento invalida selección', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await slide('eventType').locator('[data-event-type="birthday"]').click();
  await expect(slide('role')).toHaveClass(/is-active/);
  await slide('role').locator('[data-dynamic-role="organizer"]').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  await page.locator('#discoverBackButton').click();
  await page.locator('#discoverBackButton').click();
  await expect(slide('eventType')).toHaveClass(/is-active/);
  await slide('eventType').locator('[data-event-type="birthday"]').click();
  await expect(slide('role').locator('[data-dynamic-role="organizer"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#discoverBackButton').click();
  await expect(slide('eventType')).toHaveClass(/is-active/);
  await slide('eventType').locator('[data-event-type="corporate"]').click();
  await expect(slide('role')).toHaveClass(/is-active/);
  await expect(slide('role').locator('[data-dynamic-role="organizer"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#discoverNextButton').click();
  await expect(slide('role')).toHaveClass(/is-active/);
  // Sin autenticación ni escrituras.
});

test('MGD-034/037: edad opcional se conserva para mismo evento y se limpia al cambiar', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await slide('eventType').locator('[data-event-type="birthday"]').click();
  await expect(slide('role')).toHaveClass(/is-active/);
  await slide('role').locator('[data-dynamic-role="self"]').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  const age = page.locator('#discoverAgeInput');
  await age.fill('25');
  await page.locator('#discoverBackButton').click();
  await page.locator('#discoverBackButton').click();
  await expect(slide('eventType')).toHaveClass(/is-active/);
  await slide('eventType').locator('[data-event-type="birthday"]').click();
  await slide('role').locator('[data-dynamic-role="self"]').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  await expect(age).toHaveValue('25');
  await page.locator('#discoverBackButton').click();
  await page.locator('#discoverBackButton').click();
  await slide('eventType').locator('[data-event-type="quince"]').click();
  await expect(slide('role')).toHaveClass(/is-active/);
  await slide('role').locator('[data-dynamic-role="quinceanera"]').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  await expect(age).toHaveValue('');
  // Solo DOM público, sin autenticación ni escrituras.
});

test('MGD-034/037: cambiar presupuesto definido a Por definir limpia el dato y resumen', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await slide('eventType').locator('[data-event-type="birthday"]').click();
  await slide('role').locator('[data-dynamic-role="self"]').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  const budgetIndex = await slide('budget').evaluate((node) => Array.from(node.parentElement.children).indexOf(node));
  await page.locator('#discoverDots button').nth(budgetIndex).click();
  await expect(slide('budget')).toHaveClass(/is-active/);
  const budgetInput = page.locator('#discoverBudgetInput');
  await budgetInput.fill('35000');
  const finishIndex = await slide('budget').evaluate((node) => node.parentElement.children.length - 1);
  await page.locator('#discoverDots button').nth(finishIndex).click();
  await expect(page.locator('#discoverSummary')).toContainText('35,000');
  await page.locator('#discoverDots button').nth(budgetIndex).click();
  await expect(slide('budget')).toHaveClass(/is-active/);
  await slide('budget').locator('[data-answer="budgetStatus"][data-value="no-se"]').click();
  await expect(budgetInput).toHaveValue('');
  await expect(slide('budget')).toHaveClass(/is-active/);
  await page.locator('#discoverDots button').nth(finishIndex).click();
  await expect(page.locator('#discoverSummary')).toContainText('Por definir');
  await expect(page.locator('#discoverSummary')).not.toContainText('35,000');
  // Solo DOM público, sin sesión ni escrituras.
});

test('MGD-034/037: rango de invitados mantiene o limpia el número exacto', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await slide('eventType').locator('[data-event-type="wedding"]').click();
  await slide('role').locator('[data-answer="role"][data-value="novia"]').click();
  await expect(slide('stage')).toHaveClass(/is-active/);
  const guestsIndex = await slide('guests').evaluate((node) => Array.from(node.parentElement.children).indexOf(node));
  await page.locator('#discoverDots button').nth(guestsIndex).click();
  await expect(slide('guests')).toHaveClass(/is-active/);
  const options = slide('guests');
  await options.locator('[data-answer="guests"][data-value="50-100"]').click();
  const count = page.locator('#discoverGuestExactInput');
  await count.fill('82');
  // El formulario avanza automáticamente tras el evento change del input.
  // No pulsar Siguiente mientras sigue pendiente su temporizador de avance.
  await count.press('Tab');
  await expect(slide('date')).toHaveClass(/is-active/);
  await page.locator('#discoverBackButton').click();
  await expect(slide('guests')).toHaveClass(/is-active/);
  await options.locator('[data-answer="guests"][data-value="50-100"]').click();
  await expect(count).toHaveValue('82');
  await options.locator('[data-answer="guests"][data-value="100-150"]').click();
  await expect(count).toHaveValue('');
  // QA público sin autenticación ni escrituras.
});

test('MGD-034/037: fecha elegida deja de figurar al responder Todavía no', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await slide('eventType').locator('[data-event-type="wedding"]').click();
  await slide('role').locator('[data-answer="role"][data-value="novia"]').click();
  await expect(slide('stage')).toHaveClass(/is-active/);
  const dateIndex = await slide('date').evaluate((node) => Array.from(node.parentElement.children).indexOf(node));
  await page.locator('#discoverDots button').nth(dateIndex).click();
  await expect(slide('date')).toHaveClass(/is-active/);
  await slide('date').locator('[data-answer="dateStatus"][data-value="si"]').click();
  const dateInput = page.locator('#discoverDateInput');
  await dateInput.fill('2027-01-16');
  await expect(slide('budget')).toHaveClass(/is-active/);
  await page.locator('#discoverBackButton').click();
  await expect(slide('date')).toHaveClass(/is-active/);
  await expect(dateInput).toHaveValue('2027-01-16');
  await slide('date').locator('[data-answer="dateStatus"][data-value="no"]').click();
  await expect(slide('budget')).toHaveClass(/is-active/);
  await expect(dateInput).toHaveValue('');
  const finishIndex = await slide('date').evaluate((node) => node.parentElement.children.length - 1);
  await page.locator('#discoverDots button').nth(finishIndex).click();
  await expect(page.locator('#discoverSummary')).toContainText('Por definir');
  await expect(page.locator('#discoverSummary')).not.toContainText('16.01.2027');
  // Interacción pública sin autenticación ni escrituras.
});

test('MGD-034/037: los ocho eventos muestran solo sus roles reales en navegador', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await expect(slide('eventType')).toHaveClass(/is-active/);
  const { EVENT_TYPES } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-types.js')).href);
  const { getOnboardingProfile } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/onboarding-profiles.js')).href);
  for (const { id } of EVENT_TYPES) {
    await slide('eventType').locator('[data-event-type="' + id + '"]').click();
    await expect(slide('role')).toHaveClass(/is-active/);
    const role = slide('role');
    const profile = getOnboardingProfile(id);
    if (id === 'wedding') {
      await expect(role.locator('[data-answer="role"]:visible')).toHaveCount(profile.organizerRoleQuestion.options.length);
      await expect(role.locator('[data-dynamic-role]')).toHaveCount(0);
    } else {
      await expect(role.locator('[data-answer="role"]:visible')).toHaveCount(0);
      await expect(role.locator('[data-dynamic-role]:visible')).toHaveCount(profile.organizerRoleQuestion.options.length);
      await expect(role.locator('[data-dynamic-role="organizer"]')).toBeVisible();
    }
    await page.locator('#discoverBackButton').click();
    await expect(slide('eventType')).toHaveClass(/is-active/);
  }
  // Recorrido público de lectura: no necesita autenticación ni modifica Firestore.
});

test('MGD-034/037: navegación pública adaptativa boda y cumpleaños sin autenticación', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const overlay = page.locator('#discoverOverlay');
  await expect(overlay).toBeVisible();
  const slide = (name) => page.locator('[data-discover-slide][data-question="' + name + '"]');
  for (let i = 0; i < 4; i++) await page.locator('#discoverNextButton').click();
  await expect(slide('eventType')).toHaveClass(/is-active/);

  await slide('eventType').locator('[data-event-type="birthday"]').click();
  await expect(slide('role')).toHaveClass(/is-active/);
  await expect(slide('role').locator('[data-dynamic-role="self"]')).toBeVisible();
  await slide('role').locator('[data-dynamic-role="self"]').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  await expect(slide('age')).toBeVisible();
  await page.locator('#discoverAgeInput').fill('25');
  await page.locator('#discoverNextButton').click();
  await expect(slide('stage')).toHaveClass(/is-active/);

  await page.locator('#discoverBackButton').click();
  await expect(slide('age')).toHaveClass(/is-active/);
  await page.locator('#discoverBackButton').click();
  await page.locator('#discoverBackButton').click();
  await expect(slide('eventType')).toHaveClass(/is-active/);
  await slide('eventType').locator('[data-event-type="wedding"]').click();
  await expect(slide('role').locator('[data-answer="role"][data-value="novia"]')).toBeVisible();
  await slide('role').locator('[data-answer="role"][data-value="novia"]').click();
  await expect(slide('stage')).toHaveClass(/is-active/);
  await expect(slide('age')).toBeHidden();
  // Se prueban únicamente navegación y DOM públicos, nunca se autentica ni escribe Firestore.
});

test('MGD-036: vista previa de paleta aislada usa motor canónico sin persistir', async () => {
  const fs = await import('node:fs/promises');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const { getEventProfile } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/event-profile.js')).href);
  const { getThemeTokens } = await import(pathToFileURL(path.resolve(process.cwd(), 'src/core/app/theme-tokens.js')).href);
  for (const type of ['wedding', 'birthday', 'quince', 'baby_shower', 'religious', 'graduation', 'corporate', 'custom']) {
    const profile = getEventProfile(type);
    const palette = getThemeTokens(profile.theme.defaultThemeId);
    expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/i);
  }
  expect(dashboard).toContain('getThemeTokens(profile.theme.defaultThemeId)');
  expect(dashboard).toContain("preview.className = 'discover-theme-preview'");
  expect(dashboard).toContain('discoverSummary.append(preview)');
  expect(html).toContain('inicio.js?v=277-20261012');
  // No writes, no automatic theme switching, no change to an existing event's themeId.
});

test('MGD-036: paletas de boda y cumpleaños se renderizan en onboarding sin autenticación', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const next = page.locator('#discoverNextButton');
  for (let i = 0; i < 4; i++) await next.click();
  const finishDot = page.locator('#discoverDots button').last();
  const choose = async (type) => {
    await expect(page.locator('[data-question="eventType"]')).toHaveClass(/is-active/);
    await expect(page.locator('[data-discover-kind="finish"]')).toBeHidden();
    // El cambio de slide tiene animación; esperar que la tarjeta sea visible
    // evita intentar pulsarla mientras el slide aún está oculto.
    const eventOption = page.locator('[data-question="eventType"] [data-event-type="' + type + '"]');
    await expect(eventOption).toBeVisible();
    await eventOption.click();
    const roleSelector = type === 'wedding'
      ? '[data-question="role"] [data-answer="role"][data-value="novia"]'
      : '[data-question="role"] [data-dynamic-role="self"]';
    await page.locator(roleSelector).click();
    // El clic del rol programa un avance con setTimeout(170 ms). Esperar su
    // finalización evita que ese avance tardío oculte eventType tras volver
    // desde el resumen en el viewport móvil.
    await expect(page.locator('[data-question="' + (type === 'birthday' ? 'age' : 'stage') + '"]')).toHaveClass(/is-active/);
    await finishDot.click();
    const preview = page.locator('#discoverSummary .discover-theme-preview');
    await expect(preview).toBeVisible();
    const swatches = preview.locator('.discover-theme-swatches span');
    await expect(swatches).toHaveCount(3);
    return swatches.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).backgroundColor));
  };
  const birthday = await choose('birthday');
  await page.locator('#discoverDots button').nth(4).click();
  const wedding = await choose('wedding');
  expect(birthday).not.toEqual(wedding);
  await expect(page.locator('#discoverOverlay')).toBeVisible();
  // No login, writes, change of persisted themeId, or Firebase operation.
});

test('MGD-036: alternar contextos restablece todos los tokens sin arrastrar tema anterior', async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'src/core/app/theme-tokens.js')).href;
  const { applyEventTheme, TOKEN_MAP, getThemeTokens } = await import(moduleUrl);
  const values = new Map();
  const root = {
    dataset: {},
    style: { setProperty: (name, value) => values.set(name, value) }
  };
  const check = (themeId, expectedId) => {
    expect(applyEventTheme(themeId, root)).toBe(expectedId);
    expect(root.dataset.eventTheme).toBe(expectedId);
    const tokens = getThemeTokens(expectedId);
    for (const [property, cssName] of Object.entries(TOKEN_MAP)) {
      expect(values.get(cssName)).toBe(tokens[property]);
    }
    expect(values.size).toBe(Object.keys(TOKEN_MAP).length);
  };
  check('one-piece-elegant', 'one-piece-elegant');
  check('minimal-black', 'minimal-black');
  check('classic-elegant', 'classic-elegant');
  check(undefined, 'classic-elegant'); // logout / sin contexto activo
  check('tema-no-existente', 'classic-elegant'); // fallback seguro
  // DOM simulado; no Auth, navegación, Firestore ni datos reales.
});

test('MGD-036: restauración de contexto toma themeId/eventType del evento, no de la pantalla anterior', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/services/wedding-context.js'), 'utf8');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  expect(source).toContain('themeId: normalizeThemeId(wedding.themeId || indexData.themeId)');
  expect(source).toContain('eventType: normalizeEventType(wedding.eventType || indexData.eventType)');
  expect(dashboard).toContain('function applyWeddingContext(context)');
  expect(dashboard).toContain('applyEventTheme(context?.themeId)');
  expect(dashboard).toContain('const context = await selectActiveWedding(button.dataset.weddingId)');
  expect(dashboard).toContain('applyWeddingContext(context)');
  expect(dashboard).toContain('const context = await loadActiveWeddingContext(user)');
  // Invariantes de lectura; la reentrada autenticada real sigue pendiente.
});

test('MGD-037: selector multi-evento muestra tipo y texto neutral sin alterar contrato', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  expect(html).toContain('id="weddingSwitcherTitle">Mis eventos</h2>');
  expect(html).toContain('data-wedding-view="mine">Mis eventos</button>');
  expect(html).toContain('inicio.js?v=277-20261012');
  expect(dashboard).toContain('eventTypeLabel(item.eventType)');
  expect(dashboard).toContain('Todavía no tienes eventos disponibles.');
  expect(dashboard).toContain('No se pudieron cargar tus eventos.');
  expect(dashboard).toContain('const context = await selectActiveWedding(button.dataset.weddingId)');
  expect(dashboard).toContain('applyWeddingContext(context)');
  // Solo etiquetas existentes; se conservan IDs, servicios y datos.
});

test('MGD-037: invitaciones recibidas tienen fallback neutro multi-evento', async () => {
  const fs = await import('node:fs/promises');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  expect(dashboard).toContain("invite.weddingName || 'Evento compartido'");
  expect(dashboard).not.toContain("'Boda compartida'");
  expect(dashboard).toContain('No se pudo cargar el evento activo:');
  expect(html).toContain('inicio.js?v=277-20261012');
  // El nombre real de la invitación conserva precedencia; no cambia ninguna escritura.
});

test('MGD-037: contratos de aislamiento por contexto de invitados, mesas y presupuesto', async () => {
  const fs = await import('node:fs/promises');
  const source = async (file) => fs.readFile(path.resolve(process.cwd(), file), 'utf8');
  const cloud = await source('src/services/planner-cloud.js');
  const guests = await source('src/modules/invitados/invitados-data.js');
  const budget = await source('src/modules/presupuesto/index.js');
  const distribution = await source('src/modules/distribucion/index.js');
  const dashboard = await source('src/modules/dashboard/inicio.js');

  // Una sola ruta de nube por contexto; nunca una clave global compartida entre eventos.
  expect(cloud).toContain("doc(db, 'weddings', context.id, 'cloudSync', 'main')");
  expect(cloud).toContain("doc(db, 'weddings', context.id, 'cloudChunks'");
  expect(cloud).toContain('readPlannerStorageKeys(context, [key])');
  expect(cloud).toContain('function subscribePlannerStorageKey(context, key, onValue, onError)');
  expect(cloud).toContain('if (stopped || generation !== readGeneration) return');

  // Invitados y mesas canónicas heredan la identidad del contexto recibido.
  expect(guests).toContain('readPlannerStorageKeys(context, [GUEST_STORAGE_KEY, SHARED_STORAGE_KEY])');
  expect(guests).toContain('writePlannerStorageKeys(context, {');
  expect(guests).toContain('async function updateCanonicalTable(context, tableId, mutateTable)');

  // Presupuesto invalida lecturas asincrónicas iniciadas para otro weddingId.
  expect(budget).toContain('const epoch=++mountEpoch');
  expect(budget).toContain('activeContext=context');
  expect(budget).toContain('if(epoch!==mountEpoch||activeContext?.id!==context.id)return false');

  // Distribución lee y escucha únicamente el contexto activo y desmonta los listeners.
  expect(distribution).toContain('subscribePlannerStorageKey(context, DISTRIBUTION_STORAGE_KEY');
  expect(distribution).toContain('subscribePlannerStorageKey(context, GUEST_STORAGE_KEY');
  expect(distribution).toContain('registerCleanup(() => distributionCloudUnsubscribe?.())');
  expect(distribution).toContain('registerCleanup(() => canonicalCloudUnsubscribe?.())');

  // La portada descarta un resumen devuelto fuera de su epoch/contexto.
  expect(dashboard).toContain('if (epoch !== homeSummaryEpoch || weddingContext?.id !== weddingId) return');
  // Solo comprueba contratos de código; no certifica aislamiento E2E con datos.
});

test('MGD-037: Presupuesto y selector conservan redacción neutral multi-evento', async () => {
  const fs = await import('node:fs/promises');
  const budget = await fs.readFile(path.resolve(process.cwd(), 'src/modules/presupuesto/index.js'), 'utf8');
  const dashboard = await fs.readFile(path.resolve(process.cwd(), 'src/modules/dashboard/inicio.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
  expect(budget).toContain('Datos del evento activo · edición habilitada');
  expect(budget).not.toContain('Datos de la boda activa · edición habilitada');
  expect(dashboard).toContain('No se pudo cambiar de evento:');
  expect(html).toContain('inicio.js?v=277-20261012');
  // Cambios solo de texto visible y consola, sin tocar módulos de persistencia.
});

test('MGD-037: comandos QA mantienen separadas las pruebas con escrituras', async () => {
  const fs = await import('node:fs/promises');
  const pkg = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'package.json'), 'utf8'));
  const spec = await fs.readFile(path.resolve(process.cwd(), 'tests/e2e-auth-readonly.spec.js'), 'utf8');
  const scripts = pkg.scripts || {};
  expect(scripts['test:e2e:auth-readonly']).toContain('--grep-invert @fixture');
  expect(scripts['test:e2e:fixture-preflight']).toContain('--grep @fixture-preflight');
  expect(scripts['test:e2e:fixture-switch']).toContain('--grep @fixture-switch');
  const switchTests = [...spec.matchAll(/test\(['"]([^'"]*@fixture-switch[^'"]*)['"]/g)];
  const preflightTests = [...spec.matchAll(/test\(['"]([^'"]*@fixture-preflight[^'"]*)['"]/g)];
  expect(switchTests).toHaveLength(3);
  expect(preflightTests).toHaveLength(1);
  for (const match of switchTests) {
    const start = match.index;
    const next = spec.indexOf("\ntest(", start + match[0].length);
    const block = spec.slice(start, next < 0 ? undefined : next);
    expect(block).toContain("AUTHORIZED_TEST_ONLY");
    expect(block).toMatch(/test\.skip\(!(?:valid|approved)/);
    expect(block).toContain("MGD_QA_FIXTURE_ACCOUNT_EMAIL");
  }
});


test('MGD-018/037: tareas sin categoría no heredan grupos históricos de boda en otros eventos', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/modules/checklist/index.js'), 'utf8');
  const template = await fs.readFile(path.resolve(process.cwd(), 'src/core/app/checklist-templates.js'), 'utf8');
  expect(source).toContain("return activeContext?.eventType === 'wedding' ? (legacyBaseCategory(index) || 'Sin categoría') : 'Sin categoría';");
  expect(source).toContain('if (explicit) return explicit;');
  expect(source).toContain('state.groups.forEach((name) => names.add(name));');
  expect(template).toContain('function getChecklistTemplate(eventType)');
  // Invariante de código: no escribe ni modifica datos históricos ni fixtures.
});

test('MGD-018: sugerencias de Checklist requieren confirmación y no se insertan al montar', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/modules/checklist/index.js'), 'utf8');
  expect(source).toContain('function pendingTemplateSuggestions()');
  expect(source).toContain("eventType === 'wedding'");
  expect(source).toContain("data-checklist-suggestions");
  expect(source).toContain('window.confirm(');
  expect(source).toContain('!weddingCapabilities(activeContext?.role).canEdit || saving');
  expect(source).toContain('const previousTasks = [...state.tasks]');
  expect(source).toContain('state.tasks = previousTasks');
  const mount = source.slice(source.indexOf('async function mountChecklist(context)'));
  expect(mount).not.toContain('pendingTemplateSuggestions(');
  expect(mount).not.toContain('writePlannerStorageKey(');
});

test('MGD-021: editor preliminar multievento sin escrituras ni RSVP', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  expect(html).toContain('data-invitations-editor-form');
  expect(html).toContain('data-invitations-editor-preview');
  for (const id of ['wedding','birthday','quince','baby_shower','religious','graduation','corporate','custom']) {
    expect(html).toContain('value="' + id + '"');
  }
  expect(js).toContain('function renderEditorPreview()');
  expect(js).toContain('escapeHtml(name)');
  expect(js).toContain("createButton.addEventListener('click', openLocalEditor");
  expect(js).toContain('editorForm.reset()');
  const previewBlock = js.slice(js.indexOf('function renderEditorPreview()'), js.indexOf('  let invitations = []'));
  expect(previewBlock).not.toContain('addPersonalInvitation(');
  expect(previewBlock).not.toContain('writePlannerStorageKey(');
});

test('MGD-021: vista previa usa motor y plantilla canónicos sin guardado', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  expect(source).toContain("import { invitationEngineModel, hasStableInvitationEngineShape }");
  expect(source).toContain("import { getInvitationTemplate }");
  expect(source).toContain('const model = invitationEngineModel({');
  expect(source).toContain("status: 'draft'");
  expect(source).toContain('editorPreview.dataset.template = template.id;');
  expect(source).toContain('escapeHtml(template.label)');
  const render = source.slice(source.indexOf('function renderEditorPreview()'),source.indexOf("  editorForm.addEventListener('input'"));
  expect(render).not.toContain('addPersonalInvitation(');
  expect(render).not.toContain('writePlannerStorageKey(');
});

test('MGD-021: vista previa visual encapsulada y responsive sin publicación', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  const css = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/editor-preview.css'), 'utf8');
  expect(html).toContain('src/modules/invitaciones/editor-preview.css');
  expect(js).toContain('editorPreview.dataset.eventType = type');
  expect(js).toContain('invitations-editor-title');
  expect(js).toContain('escapeHtml(name)');
  expect(js).toContain('escapeHtml(place)');
  expect(css).toContain('data-template="minimal-black"');
  expect(css).toContain('data-template="one-piece-elegant"');
  expect(css).toContain('@media(max-width:600px)');
  expect(css).not.toContain('!important');
  const preview = js.slice(js.indexOf('function renderEditorPreview()'),js.indexOf("  editorForm.addEventListener('input'"));
  expect(preview).not.toContain('addPersonalInvitation(');
  expect(preview).not.toContain('writePlannerStorageKey(');
});

test('MGD-021: personalización del borrador local sin escritura ni HTML inseguro', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  const css = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/editor-preview.css'), 'utf8');
  expect(html).toContain('name="message" maxlength="240"');
  expect(html).toContain('name="fontStyle"');
  expect(js).toContain("editorPreview.dataset.fontStyle = fontStyle");
  expect(js).toContain('escapeHtml(message)');
  expect(css).toContain('data-font-style="sans"');
  expect(css).not.toContain('!important');
  const preview = js.slice(js.indexOf('function renderEditorPreview()'), js.indexOf("  editorForm.addEventListener('input'"));
  expect(preview).not.toContain('addPersonalInvitation(');
  expect(preview).not.toContain('writePlannerStorageKey(');
});

test('MGD-021: paleta local por evento y selector sin persistencia', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  const css = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/editor-preview.css'), 'utf8');
  expect(html).toContain('name="colorPalette"');
  for (const palette of ['auto','ivory','sage','rose','navy']) expect(html).toContain('value="' + palette + '"');
  expect(js).toContain('editorPreview.dataset.palette = allowedPalettes.includes(paletteChoice)');
  for (const id of ['wedding','birthday','quince','baby_shower','religious','graduation','corporate','custom']) expect(js).toContain(id + ':');
  for (const palette of ['ivory','sage','rose','navy']) expect(css).toContain('data-palette="' + palette + '"');
  expect(css).not.toContain('!important');
  const preview = js.slice(js.indexOf('function renderEditorPreview()'), js.indexOf("  editorForm.addEventListener('input'"));
  expect(preview).not.toContain('addPersonalInvitation(');
});

test('MGD-021: workspace de editor y vista previa responsive conserva el editor local', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  const css = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/editor-preview.css'), 'utf8');
  expect(html).toContain('class="invitations-editor-workspace"');
  expect(html).toContain('class="invitations-editor-preview-side"');
  expect(html).toContain('data-invitations-editor-form');
  expect(html).toContain('data-invitations-editor-preview');
  expect(css).toContain('grid-template-columns:minmax(0,1fr) minmax(280px,1fr)');
  expect(css).toContain('@media(max-width:780px)');
  expect(css).not.toContain('!important');
});

test('MGD-021: conmutador de preview móvil/escritorio no altera datos', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  const css = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/editor-preview.css'), 'utf8');
  expect(html).toContain('data-editor-viewport="mobile"');
  expect(html).toContain('data-editor-viewport="desktop"');
  expect(js).toContain("editorPreview.dataset.viewport = viewport");
  expect(js).toContain("item.setAttribute('aria-pressed', String(item === button))");
  expect(css).toContain('data-viewport="desktop"');
  expect(css).not.toContain('!important');
});

test('MGD-021: textos contextuales por evento sin modificar invitaciones guardadas', async () => {
  const fs = await import('node:fs/promises');
  const config = await fs.readFile(path.resolve(process.cwd(), 'src/core/app/invitation-copy.js'), 'utf8');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  for (const id of ['wedding','birthday','quince','baby_shower','religious','graduation','corporate','custom']) {
    expect(config).toContain(id + ': Object.freeze(');
  }
  expect(js).toContain('getInvitationCopy(type)');
  expect(js).toContain("trim() || copy.greeting");
  expect(js).toContain('escapeHtml(copy.dateLabel)');
  expect(js).toContain('escapeHtml(message)');
  const preview = js.slice(js.indexOf('function renderEditorPreview()'), js.indexOf("  editorForm.addEventListener('input'"));
  expect(preview).not.toContain('addPersonalInvitation(');
  expect(preview).not.toContain('writePlannerStorageKey(');
});

test('MGD-021: exportar borrador no implica persistencia ni publicación', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  expect(html).toContain('data-invitations-export-draft');
  const start = js.indexOf("  root.querySelector('[data-invitations-export-draft]')");
  const end = js.indexOf("  editorForm.addEventListener('input'", start);
  const handler = js.slice(start, end);
  expect(handler).toContain('migrandia-invitation-draft-v1');
  expect(handler).toContain('JSON.stringify(draft, null, 2)');
  expect(handler).toContain('URL.createObjectURL(');
  expect(handler).not.toContain('writePlannerStorageKey(');
  expect(handler).not.toContain('addPersonalInvitation(');
});

test('MGD-021: recuperación de borrador JSON es local y validada', async () => {
  const fs = await import('node:fs/promises');
  const html = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.html'), 'utf8');
  const js = await fs.readFile(path.resolve(process.cwd(), 'src/modules/invitaciones/index.js'), 'utf8');
  expect(html).toContain('data-invitations-import-draft');
  expect(html).toContain('data-invitations-import-status');
  const start = js.indexOf("  root.querySelector('[data-invitations-import-draft]')");
  const end = js.indexOf("  editorForm.addEventListener('input'", start);
  const handler = js.slice(start, end);
  expect(handler).toContain('normalizeDraftInput(record)');
  expect(handler).toContain('file.size > 32 * 1024');
  expect(handler).toContain('for (const key of DRAFT_FIELDS)');
  expect(handler).toContain('renderEditorPreview()');
  expect(handler).not.toContain('writePlannerStorageKey(');
  expect(handler).not.toContain('addPersonalInvitation(');
});

test('MGD-021: contrato de borradores restringe esquema y contexto antes de persistir', async () => {
  const { normalizeDraftInput, draftStorageScope, isDraftInScope } =
    await import('../src/core/app/invitation-draft-contract.js');
  const sample = {
    schema: 'migrandia-invitation-draft-v1', eventType: 'birthday',
    eventName: 'Cumpleaños', date: '', location: '', guestName: '',
    message: 'Te esperamos', templateId: 'classic-elegant',
    fontStyle: 'serif', colorPalette: 'auto'
  };
  expect(normalizeDraftInput(sample)).toEqual(sample);
  expect(() => normalizeDraftInput({ ...sample, unknownField: 'x' })).toThrow();
  expect(() => normalizeDraftInput({ ...sample, eventType: 'wedding/../../x' })).toThrow();
  expect(() => normalizeDraftInput({ ...sample, message: 'x'.repeat(241) })).toThrow();
  const a = draftStorageScope('uidA','eventoA');
  const b = draftStorageScope('uidA','eventoB');
  const otherUser = draftStorageScope('uidB','eventoA');
  expect(a.proposedCollectionPath).not.toBe(b.proposedCollectionPath);
  expect(a.proposedCollectionPath).not.toBe(otherUser.proposedCollectionPath);
  expect(isDraftInScope({ ownerUid:'uidA', eventId:'eventoA' }, a)).toBe(true);
  expect(isDraftInScope({ ownerUid:'uidA', eventId:'eventoA' }, b)).toBe(false);
  expect(isDraftInScope({ ownerUid:'uidA', eventId:'eventoA' }, otherUser)).toBe(false);
  expect(() => draftStorageScope('uidA','../eventoB')).toThrow();
});

test('MGD-021: adaptador de borradores valida ámbito y revisiones sin Firebase', async () => {
  const { createInvitationDraftRepository } = await import('../src/services/invitation-drafts-repository.js');
  const value = { schema:'migrandia-invitation-draft-v1', eventType:'birthday',
    eventName:'Fiesta', date:'', location:'', guestName:'', message:'',
    templateId:'classic-elegant', fontStyle:'serif', colorPalette:'auto' };
  const records = new Map();
  const port = {
    list: async (scope) => [...records.values()].filter((r) => r.ownerUid === scope.ownerUid && r.eventId === scope.eventId),
    read: async (scope, id) => records.get(scope.proposedCollectionPath + '/' + id) ?? null,
    save: async (scope, id, draft, revision) => {
      const key = scope.proposedCollectionPath + '/' + id;
      const previous = records.get(key);
      if (previous && previous.revision !== revision) throw new Error('Conflicto de revisión.');
      const record = { id, ownerUid:scope.ownerUid, eventId:scope.eventId, value:draft, revision:String(Number(revision || 0) + 1) };
      records.set(key, record);
      return record;
    },
    remove: async (scope, id, revision) => {
      const key = scope.proposedCollectionPath + '/' + id;
      if (records.get(key)?.revision !== revision) throw new Error('Conflicto de revisión.');
      return records.delete(key);
    }
  };
  const adapter = createInvitationDraftRepository(port);
  const first = await adapter.save('uid1','eventoA','borrador1',value);
  expect(first.revision).toBe('1');
  expect((await adapter.list('uid1','eventoB'))).toEqual([]);
  expect((await adapter.list('uid2','eventoA'))).toEqual([]);
  await expect(adapter.save('uid1','eventoA','borrador1',value,'0')).rejects.toThrow('Conflicto');
  expect((await adapter.read('uid1','eventoA','borrador1')).value).toEqual(value);
  await expect(adapter.read('uid1','eventoB','borrador1')).resolves.toBeNull();
  await adapter.remove('uid1','eventoA','borrador1','1');
  expect(await adapter.list('uid1','eventoA')).toEqual([]);
  const badPort = { ...port, read: async () => ({ ...first, ownerUid:'uid2' }) };
  await expect(createInvitationDraftRepository(badPort).read('uid1','eventoA','x')).rejects.toThrow('no pertenece');
});

test('MGD-021: puerto Firestore desactivado y bloqueo de escrituras hasta aprobar Rules', async () => {
  const { createFirestoreInvitationDraftRepository } =
    await import('../src/services/invitation-drafts-firestore.js');
  let calls = 0;
  const sdk = {
    collection: (...parts) => parts.slice(1).join('/'),
    doc: (parent,id) => parent + '/' + id,
    getDocs: async () => { calls += 1; return { docs: [] }; },
    getDoc: async () => { calls += 1; return { exists: () => false }; },
    runTransaction: async () => { calls += 1; throw new Error('No se deben ejecutar transacciones.'); },
    serverTimestamp: () => null
  };
  const port = createFirestoreInvitationDraftRepository({
    firestore: {}, sdk, currentUid: () => 'uidA'
  });
  const draft = { schema:'migrandia-invitation-draft-v1', eventType:'birthday',
    eventName:'Fiesta', date:'', location:'', guestName:'', message:'',
    templateId:'classic-elegant', fontStyle:'serif', colorPalette:'auto' };
  await expect(port.list('uidA','eventoA')).rejects.toThrow('no está habilitada');
  await expect(port.read('uidA','eventoA','draft1')).rejects.toThrow('no está habilitada');
  await expect(port.save('uidA','eventoA','draft1',draft)).rejects.toThrow('no está habilitada');
  await expect(port.remove('uidA','eventoA','draft1')).rejects.toThrow('no está habilitada');
  expect(calls).toBe(0);
  const enabledPort = createFirestoreInvitationDraftRepository({
    firestore: {}, sdk, currentUid: () => 'uidA', enabled:true
  });
  await expect(enabledPort.list('uidB','eventoA')).rejects.toThrow('cuenta activa');
  expect(calls).toBe(0);
});

test('MGD-021: transacciones de borradores validan revision y cambio de usuario', async () => {
  const { createFirestoreInvitationDraftRepository } = await import('../src/services/invitation-drafts-firestore.js');
  const entries = new Map();
  let uid = 'cuentaA';
  const sdk = {
    collection: (_, ...parts) => parts.join('/'),
    doc: (parent, id) => parent + '/' + id,
    getDocs: async () => ({ docs: [] }),
    getDoc: async () => ({ exists: () => false }),
    serverTimestamp: () => 'test-timestamp',
    runTransaction: async (_, operation) => operation({
      get: async (ref) => ({
        exists: () => entries.has(ref),
        data: () => entries.get(ref)
      }),
      set: (ref, data) => { entries.set(ref, data); },
      delete: (ref) => { entries.delete(ref); }
    })
  };
  const repository = createFirestoreInvitationDraftRepository({
    firestore: {}, sdk, currentUid: () => uid, enabled: true
  });
  const value = {
    schema: 'migrandia-invitation-draft-v1', eventType: 'birthday',
    eventName: 'Fiesta', date: '', location: '', guestName: '',
    message: '', templateId: 'classic-elegant', fontStyle: 'serif', colorPalette: 'auto'
  };
  const first = await repository.save('cuentaA', 'eventoA', 'borrador1', value);
  expect(first.revision).toBe('1');
  await expect(repository.save('cuentaA', 'eventoA', 'borrador1', value, '')).rejects.toThrow('Conflicto');
  const second = await repository.save('cuentaA', 'eventoA', 'borrador1', value, '1');
  expect(second.revision).toBe('2');
  await expect(repository.remove('cuentaA', 'eventoA', 'borrador1', '1')).rejects.toThrow('Conflicto');
  uid = 'cuentaB';
  await expect(repository.save('cuentaA', 'eventoA', 'borrador1', value, '2')).rejects.toThrow('cuenta activa');
  await expect(repository.read('cuentaA', 'eventoA', 'borrador1')).rejects.toThrow('cuenta activa');
  uid = 'cuentaA';
  expect(await repository.remove('cuentaA', 'eventoA', 'borrador1', '2')).toBe(true);
  expect(await repository.read('cuentaA', 'eventoA', 'borrador1')).toBeNull();
});

test('MGD-021: autosave bloqueado por defecto y aislado al cambiar de evento', async () => {
  const { createInvitationDraftAutosave } = await import('../src/core/app/invitation-draft-autosave.js');
  const tasks = new Map();
  let id = 0;
  const schedule = (callback) => { tasks.set(++id, callback); return id; };
  const cancel = (key) => tasks.delete(key);
  const calls = [];
  const save = async (scope, value, revision) => {
    calls.push({ scope, value, revision });
    return { revision: String(Number(revision || 0) + 1) };
  };
  const disabled = createInvitationDraftAutosave({ save, schedule, cancel });
  disabled.setScope({ ownerUid:'a',eventId:'A',draftId:'1' });
  expect(disabled.change({ title:'no guardar' })).toBe(false);
  expect(await disabled.flush()).toBe(false);
  expect(calls).toEqual([]);
  const controller = createInvitationDraftAutosave({ save, schedule, cancel, enabled:true });
  controller.setScope({ ownerUid:'a',eventId:'A',draftId:'1' });
  expect(controller.change('primero')).toBe(true);
  controller.change('segundo');
  expect(controller.getStatus().pending).toBe(true);
  controller.setScope({ ownerUid:'a',eventId:'B',draftId:'1' });
  expect(controller.getStatus().pending).toBe(false);
  controller.change('nuevo evento');
  await controller.flush();
  expect(calls).toHaveLength(1);
  expect(calls[0].scope.eventId).toBe('B');
  expect(calls[0].value).toBe('nuevo evento');
  expect(controller.getStatus().revision).toBe('1');
  controller.close();
  expect(controller.change('luego de cerrar')).toBe(false);
});

test('MGD-021: autosave retiene la edición reciente y no repite errores indefinidamente', async () => {
  const { createInvitationDraftAutosave } = await import('../src/core/app/invitation-draft-autosave.js');
  const tasks = new Map();
  let next = 0;
  const schedule = (fn) => { const id = ++next; tasks.set(id, fn); return id; };
  const cancel = (id) => tasks.delete(id);
  let release;
  const calls = [];
  const save = async (_scope, value, revision) => {
    calls.push({ value, revision });
    if (value === 'primera') return new Promise((resolve) => { release = resolve; });
    if (value === 'con conflicto') throw new Error('Conflicto de revisión');
    return { revision:'2' };
  };
  const c = createInvitationDraftAutosave({ save, enabled:true, schedule, cancel });
  c.setScope({ ownerUid:'u', eventId:'e', draftId:'d' });
  c.change('primera');
  const first = c.flush();
  c.change('segunda');
  release({ revision:'1' });
  await first;
  expect(c.getStatus().revision).toBe('1');
  expect(c.getStatus().pending).toBe(true);
  await c.flush();
  expect(calls.map((v) => v.value)).toEqual(['primera','segunda']);
  expect(calls[1].revision).toBe('1');
  c.change('con conflicto');
  await expect(c.flush()).rejects.toThrow('Conflicto');
  expect(c.getStatus().pending).toBe(true);
  expect(c.getStatus().error).toContain('Conflicto');
  expect(tasks.size).toBe(0);
  c.change('recuperada');
  await c.flush();
  expect(c.getStatus().error).toBe('');
  expect(c.getStatus().revision).toBe('2');
  c.close();
});

test('MGD-021: editor identifica cambios sin guardar y exige confirmacion antes de descartarlos', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve('src/modules/invitaciones/index.js'), 'utf8');
  const html = await fs.readFile(path.resolve('src/modules/invitaciones/index.html'), 'utf8');
  expect(html).toContain('data-invitations-draft-status');
  expect(js).toContain("editorForm.addEventListener('input', markChanged");
  expect(js).toContain("updateDraftStatus(true)");
  expect(js).toContain("window.confirm('Este borrador tiene cambios");
  expect(js).toContain("updateDraftStatus(false)");
});

test('MGD-021: cierre de pestaña advierte por cambios no exportados y limpia listener', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve('src/modules/invitaciones/index.js'), 'utf8');
  expect(js).toContain("window.addEventListener('beforeunload', warnOnUnsavedDraft, { signal })");
  expect(js).toContain("if (editor.hidden || !dirtyDraft) return;");
  expect(js).toContain("event.returnValue = '';");
  expect(js).toContain("controller.abort();");
});

test('MGD-021: editor importa y exporta usando contrato canonico de borradores', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(path.resolve('src/modules/invitaciones/index.js'), 'utf8');
  expect(source).toContain("import { normalizeDraftInput, DRAFT_FIELDS }");
  expect(source).toContain('const draft = normalizeDraftInput(record)');
  expect(source).toContain('const draft = normalizeDraftInput({');
  expect(source).toContain('for (const key of DRAFT_FIELDS)');
  const { normalizeDraftInput } = await import('../src/core/app/invitation-draft-contract.js');
  const valid = { schema:'migrandia-invitation-draft-v1', eventType:'wedding', eventName:'Ceremonia',
    date:'2027-01-16', location:'Casa', guestName:'', message:'Te esperamos',
    templateId:'classic-elegant', fontStyle:'serif', colorPalette:'auto' };
  expect(normalizeDraftInput(JSON.parse(JSON.stringify(normalizeDraftInput(valid))))).toEqual(valid);
  expect(() => normalizeDraftInput({ ...valid, extra:'unsafe' })).toThrow();
});

test('MGD-021: lectura tardia de borradores se descarta si cambio la cuenta', async () => {
  const { createFirestoreInvitationDraftRepository } = await import('../src/services/invitation-drafts-firestore.js');
  let uid = 'userA';
  let deliver;
  const sdk = {
    collection: (_db, ...parts) => parts.join('/'),
    doc: (parent, id) => parent + '/' + id,
    getDocs: () => new Promise((resolve) => { deliver = resolve; }),
    getDoc: () => new Promise((resolve) => { deliver = resolve; }),
    runTransaction: async () => { throw new Error('No se deben iniciar escrituras.'); }
  };
  const repo = createFirestoreInvitationDraftRepository({ firestore:{}, sdk, currentUid:() => uid, enabled:true });
  const list = repo.list('userA','eventA');
  uid = 'userB';
  deliver({ docs:[] });
  await expect(list).rejects.toThrow('cuenta activa');
  uid = 'userA';
  const read = repo.read('userA','eventA','draft1');
  uid = 'userB';
  deliver({ exists:() => false });
  await expect(read).rejects.toThrow('cuenta activa');
});

test('MGD-021: puente de persistencia impide guardar y recuperar antes de activar Rules', async () => {
  const { createInvitationDraftSession } = await import('../src/services/invitation-draft-session.js');
  let reads = 0; let writes = 0;
  const repository = {
    read: async () => { reads++; return null; },
    save: async () => { writes++; return { revision:'1' }; }
  };
  const bridge = createInvitationDraftSession({ repository });
  bridge.select({ ownerUid:'uidA',eventId:'eventA',draftId:'draftA' });
  const draft = { schema:'migrandia-invitation-draft-v1',eventType:'wedding',eventName:'Evento',
    date:'',location:'',guestName:'',message:'',templateId:'classic-elegant',fontStyle:'serif',colorPalette:'auto' };
  expect(bridge.change(draft)).toBe(false);
  expect(await bridge.flush()).toBe(false);
  await expect(bridge.recover()).rejects.toThrow('no habilitada');
  bridge.select({ ownerUid:'uidA',eventId:'eventB',draftId:'draftA' });
  bridge.close();
  expect(reads).toBe(0);
  expect(writes).toBe(0);
});

test('MGD-021: matriz de permisos de borradores por membresia y evento', async () => {
  const { assessInvitationDraftAccess: allowed } = await import('../src/core/app/invitation-draft-permissions.js');
  const ctx = (role, operation, overrides = {}) => ({
    authenticated: true, membershipStatus: 'active', memberEventId: 'eventA',
    eventId: 'eventA', role, operation, ...overrides
  });
  for (const role of ['owner', 'admin', 'editor']) {
    for (const operation of ['read', 'list', 'create', 'update', 'delete']) {
      expect(allowed(ctx(role, operation))).toBe(true);
    }
  }
  for (const role of ['provider', 'viewer']) {
    expect(allowed(ctx(role, 'read'))).toBe(true);
    for (const operation of ['create', 'update', 'delete']) expect(allowed(ctx(role, operation))).toBe(false);
  }
  for (const operation of ['read', 'create', 'delete']) {
    expect(allowed(ctx('owner', operation, { authenticated: false }))).toBe(false);
    expect(allowed(ctx('owner', operation, { membershipStatus: 'inactive' }))).toBe(false);
    expect(allowed(ctx('owner', operation, { eventId: 'eventB' }))).toBe(false);
    expect(allowed(ctx('outsider', operation))).toBe(false);
  }
  expect(allowed(ctx('owner', 'unexpected-operation'))).toBe(false);
});

test('MGD-021: puerto compartido por evento bloqueado y revisiones colaborativas', async () => {
  const { createEventInvitationDraftPort } = await import('../src/services/event-invitation-drafts-firestore.js');
  const docs = new Map();
  let uid = 'owner'; let calls = 0;
  const sdk = {
    collection: (_db, ...parts) => parts.join('/'),
    doc: (parent, id) => parent + '/' + id,
    getDocs: async (path) => { calls++; return { docs:[...docs.entries()].filter(([k]) => k.startsWith(path+'/')).map(([k,data])=>({id:k.split('/').at(-1),exists:()=>true,data:()=>data})) }; },
    getDoc: async (path) => { calls++; return {id:path.split('/').at(-1),exists:()=>docs.has(path),data:()=>docs.get(path)}; },
    serverTimestamp: () => 'fixture-timestamp',
    runTransaction: async (_db, fn) => { calls++; return fn({
      get: async (key) => ({exists:()=>docs.has(key),data:()=>docs.get(key)}),
      set: (key,val) => docs.set(key,val),
      delete: (key) => docs.delete(key)
    }); }
  };
  const value = {schema:'migrandia-invitation-draft-v1',eventType:'wedding',eventName:'Boda',
    date:'',location:'',guestName:'',message:'',templateId:'classic-elegant',fontStyle:'serif',colorPalette:'auto'};
  const closed = createEventInvitationDraftPort({db:{},sdk,currentUid:()=>uid});
  await expect(closed.list('eventA')).rejects.toThrow('no habilitada');
  await expect(closed.save('eventA','draft1',value)).rejects.toThrow('no habilitada');
  expect(calls).toBe(0);
  const port = createEventInvitationDraftPort({db:{},sdk,currentUid:()=>uid,enabled:true});
  const initial = await port.save('eventA','draft1',value);
  expect(initial.revision).toBe('1');
  uid='editor';
  expect((await port.read('eventA','draft1')).ownerUid).toBe('owner');
  const edited=await port.save('eventA','draft1',{...value,message:'Actualizado'},'1');
  expect(edited.ownerUid).toBe('owner');
  expect(edited.revision).toBe('2');
  await expect(port.save('eventA','draft1',value,'1')).rejects.toThrow('Conflicto');
  expect(await port.list('eventB')).toEqual([]);
  await port.remove('eventA','draft1','2');
  expect(await port.read('eventA','draft1')).toBeNull();
  await expect(port.save('bad/event','draft1',value)).rejects.toThrow('inválido');
});

test('MGD-021: sesion de borrador colaborativo bloqueada y aisla evento y cuenta', async () => {
  const { createEventInvitationDraftSession } = await import('../src/services/event-invitation-draft-session.js');
  let uid = 'uA', reads = 0, writes = 0;
  let releaseRead;
  const repository = {
    read: async () => { reads++; return new Promise((resolve) => { releaseRead = resolve; }); },
    save: async () => { writes++; return { revision:'1' }; }
  };
  const draft = { schema:'migrandia-invitation-draft-v1',eventType:'wedding',eventName:'Boda',
    date:'',location:'',guestName:'',message:'',templateId:'classic-elegant',fontStyle:'serif',colorPalette:'auto' };
  const closed = createEventInvitationDraftSession({ repository, currentUid:() => uid });
  closed.select({ eventId:'A',draftId:'uno' });
  expect(closed.change(draft)).toBe(false);
  expect(await closed.flush()).toBe(false);
  await expect(closed.recover()).rejects.toThrow('no habilitada');
  expect(reads).toBe(0);
  expect(writes).toBe(0);
  const enabled = createEventInvitationDraftSession({ repository, currentUid:() => uid, enabled:true });
  enabled.select({ eventId:'A',draftId:'uno' });
  const pending = enabled.recover();
  enabled.select({ eventId:'B',draftId:'dos' });
  releaseRead({ revision:'1',value:draft });
  await expect(pending).rejects.toThrow('cambió');
  const pending2 = enabled.recover();
  uid = 'uB';
  releaseRead({ revision:'1',value:draft });
  await expect(pending2).rejects.toThrow('cambió');
  enabled.close();
});

test('MGD-021: integracion sesion y puerto colaborativo con cambios entre eventos', async () => {
  const { createEventInvitationDraftSession } = await import('../src/services/event-invitation-draft-session.js');
  const { createEventInvitationDraftPort } = await import('../src/services/event-invitation-drafts-firestore.js');
  const docs = new Map();
  let uid = 'organizador';
  const sdk = {
    collection: (_db,...parts) => parts.join('/'),
    doc: (parent,id) => parent+'/'+id,
    serverTimestamp: () => 'timestamp-test',
    getDoc: async (key) => ({ id:key.split('/').at(-1), exists:()=>docs.has(key), data:()=>docs.get(key) }),
    getDocs: async (path) => ({ docs:[...docs].filter(([key])=>key.startsWith(path+'/')).map(([key,val])=>({
      id:key.split('/').at(-1),exists:()=>true,data:()=>val
    })) }),
    runTransaction: async (_db,fn) => fn({
      get:async(key)=>({exists:()=>docs.has(key),data:()=>docs.get(key)}),
      set:(key,data)=>docs.set(key,data),
      delete:(key)=>docs.delete(key)
    })
  };
  const port = createEventInvitationDraftPort({ db:{},sdk,currentUid:()=>uid,enabled:true });
  const session = createEventInvitationDraftSession({ repository:port,currentUid:()=>uid,enabled:true });
  const draft = { schema:'migrandia-invitation-draft-v1', eventType:'wedding',
    eventName:'Boda A',date:'',location:'',guestName:'',message:'Original',
    templateId:'classic-elegant',fontStyle:'serif',colorPalette:'auto' };
  session.select({eventId:'eventA',draftId:'draft1'});
  expect(session.change(draft)).toBe(true);
  expect(await session.flush()).toBe(true);
  expect(session.status().revision).toBe('1');
  session.select({eventId:'eventB',draftId:'draft1'});
  expect(await session.recover()).toBeNull();
  session.select({eventId:'eventA',draftId:'draft1'});
  expect(await session.recover()).toEqual(draft);
  expect(session.status().revision).toBe('1');
  uid='editor';
  await expect(session.recover()).rejects.toThrow('cambió');
  session.select({eventId:'eventA',draftId:'draft1'});
  expect(await session.recover()).toEqual(draft);
  expect(session.status().revision).toBe('1');
  expect(session.change({...draft,message:'Editado por colaborador'})).toBe(true);
  expect(await session.flush()).toBe(true);
  expect(session.status().revision).toBe('2');
  expect((await port.read('eventA','draft1')).ownerUid).toBe('organizador');
  session.close();
});

test('MGD-021: recuperar nunca descarta ediciones locales pendientes o creadas durante lectura', async () => {
  const { createEventInvitationDraftSession } = await import('../src/services/event-invitation-draft-session.js');
  let release;
  const draft = { schema:'migrandia-invitation-draft-v1',eventType:'wedding',eventName:'Boda',
    date:'',location:'',guestName:'',message:'',templateId:'classic-elegant',fontStyle:'serif',colorPalette:'auto' };
  const session = createEventInvitationDraftSession({
    enabled:true, currentUid:()=>'owner',
    repository:{save:async()=>({revision:'1'}), read:async()=>new Promise(resolve=>{release=resolve})},
    schedule:()=>1, cancel:()=>{}
  });
  session.select({eventId:'eventA',draftId:'draft1'});
  session.change(draft);
  await expect(session.recover()).rejects.toThrow('cambios pendientes');
  expect(session.status().pending).toBe(true);
  session.select({eventId:'eventA',draftId:'draft1'});
  const reading = session.recover();
  session.change({...draft,message:'edición reciente'});
  release({revision:'4',value:draft});
  await expect(reading).rejects.toThrow('cambios pendientes');
  expect(session.status().pending).toBe(true);
  expect(session.status().revision).toBe('');
  session.close();
});


test('MGD-021: lectura tardía no sobrescribe revisión tras completarse autosave', async () => {
  const { createEventInvitationDraftSession } = await import('../src/services/event-invitation-draft-session.js');
  let release;
  const draft = { schema:'migrandia-invitation-draft-v1',eventType:'wedding',eventName:'Boda',
    date:'',location:'',guestName:'',message:'',templateId:'classic-elegant',fontStyle:'serif',colorPalette:'auto' };
  const session = createEventInvitationDraftSession({ enabled:true, currentUid:()=>'owner',
    repository:{ save:async()=>({revision:'8'}), read:()=>new Promise(resolve=>{ release=resolve; }) },
    schedule:()=>1, cancel:()=>{} });
  session.select({ eventId:'eventA',draftId:'draft1' });
  const reading = session.recover();
  session.change({...draft,message:'Edición nueva'});
  expect(await session.flush()).toBe(true);
  expect(session.status().pending).toBe(false);
  expect(session.status().inflight).toBe(false);
  expect(session.status().revision).toBe('8');
  release({ revision:'3',value:draft });
  await expect(reading).rejects.toThrow('ediciones recientes');
  expect(session.status().revision).toBe('8');
  session.close();
});


test('MGD-021: importación local protege cambios y descarta lectura asíncrona obsoleta', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(path.resolve('src/modules/invitaciones/index.js'), 'utf8');
  expect(source).toContain("dirtyDraft && !window.confirm('Tienes cambios sin descargar.");
  expect(source).toContain('currentImport !== importVersion');
  expect(source).toContain('currentEdit !== editorChangeVersion');
  expect(source).toContain('signal.aborted || editor.hidden');
  expect(source).toContain('editorChangeVersion++; renderEditorPreview()');
  expect(source).toContain('Importación cancelada. Se conservaron tus cambios.');
});


test('MGD-021: HTML offline escapa datos y no carga dependencias remotas', async () => {
  const { renderOfflineInvitationDraft } = await import('../src/core/app/invitation-offline-preview.js');
  const draft = { schema:'migrandia-invitation-draft-v1',eventType:'birthday', eventName:'<script>alert(1)</script>',
    date:'2027-01-16',location:'Salón & jardín',guestName:'<img src=x onerror=alert(1)>',
    message:'Te esperamos',templateId:'classic-elegant',fontStyle:'serif',colorPalette:'auto' };
  const html = renderOfflineInvitationDraft(draft);
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&lt;img');
  expect(html).toContain('Salón &amp; jardín');
  expect(html).not.toContain('<script');
  expect(html).not.toContain('src="http');
  expect(html).toContain('Borrador sin publicar');
  expect(html).toContain('<meta name="robots" content="noindex,nofollow">');
  expect(() => renderOfflineInvitationDraft({...draft,colorPalette:'invalid'})).toThrow();
});


test('MGD-021: precarga de evento activo es opt-in, solo lectura y protege ediciones', async () => {
  const fs = await import('node:fs/promises');
  const code = await fs.readFile(path.resolve('src/modules/invitaciones/index.js'), 'utf8');
  const html = await fs.readFile(path.resolve('src/modules/invitaciones/index.html'), 'utf8');
  expect(html).toContain('data-invitations-use-active-event');
  expect(code).toContain('await loadActiveWeddingContext()');
  expect(code).toContain('dirtyDraft && !window.confirm');
  expect(code).toContain('expectedEdit !== editorChangeVersion');
  expect(code).toContain('expectedImport !== importVersion');
  expect(code).toContain('auth.currentUser?.uid !== userUid');
  expect(code).toContain("editorForm.elements.eventType.value = active.eventType || 'wedding'");
  expect(code).toContain('updateDraftStatus(true)');
  expect(code).not.toContain('selectActiveWedding(');
});

test('MGD-021: vista completa abre borrador local sin publicar ni escribir datos', async () => {
  const fs = await import('node:fs/promises');
  const js = await fs.readFile(path.resolve('src/modules/invitaciones/index.js'), 'utf8');
  const html = await fs.readFile(path.resolve('src/modules/invitaciones/index.html'), 'utf8');
  expect(html).toContain('data-invitations-preview-full');
  expect(js).toContain("root.querySelector('[data-invitations-preview-full]')");
  expect(js).toContain("link.target = '_blank'");
  expect(js).toContain("link.rel = 'noopener noreferrer'");
  expect(js).toContain('renderOfflineInvitationDraft(draft)');
  expect(js).toContain('URL.revokeObjectURL(url)');
});
