import { test, expect } from '@playwright/test';

const READ_ONLY_MODULES = [
  'checklist',
  'presupuesto',
  'proveedores',
  'invitados',
  'cronograma',
  'ideas',
  'invitaciones'
];

function collectUnexpectedErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (text === 'requestStorageAccess: Permission denied.') return;
    if (text === 'Failed to load resource: the server responded with a status of 403 ()') return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

test('E2E-02/E2E-03: sesión existente carga boda activa sin escritura', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await page.locator('#menuButton').click();
  await expect(page.locator('body')).toHaveClass(/menu-open/);
  await expect(page.locator('#activeWeddingButton')).toBeVisible();
  await expect(page.locator('#activeWeddingName')).not.toHaveText('');
  expect(errors).toEqual([]);
});

for (const moduleId of READ_ONLY_MODULES) {
  test(`lectura autenticada: ${moduleId} monta sin acciones de edición`, async ({ page }) => {
    const errors = collectUnexpectedErrors(page);
    await page.goto(`#${moduleId}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
    await expect(page).toHaveURL(new RegExp(`#${moduleId}$`));
    await expect(page.locator('#moduleWorkspace')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator(`[data-module-view="${moduleId}"]`)).toBeVisible();

    expect(errors).toEqual([]);
  });
}

test('MGD-036: reingreso autenticado conserva tema y contexto activo sin escrituras', async ({ page }) => {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await page.locator('#menuButton').click();
  const activeName = page.locator('#activeWeddingName');
  await expect(activeName).not.toHaveText('');
  const nameBefore = await activeName.textContent();
  const themeBefore = await page.locator('html').getAttribute('data-event-theme');
  expect(themeBefore).toBeTruthy();
  const tokenNames = [
    '--event-primary', '--event-secondary', '--event-accent',
    '--event-background', '--event-surface', '--event-heading-font',
    '--event-body-font', '--event-radius', '--event-decoration-style'
  ];
  const before = await page.locator('html').evaluate((el, names) => {
    const styles = getComputedStyle(el);
    return names.map((name) => styles.getPropertyValue(name).trim());
  }, tokenNames);
  expect(before.every(Boolean)).toBe(true);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await page.locator('#menuButton').click();
  await expect(activeName).toHaveText(nameBefore.trim());
  await expect(page.locator('html')).toHaveAttribute('data-event-theme', themeBefore);
  const after = await page.locator('html').evaluate((el, names) => {
    const styles = getComputedStyle(el);
    return names.map((name) => styles.getPropertyValue(name).trim());
  }, tokenNames);
  expect(after).toEqual(before);
  // Solo lectura del contexto activo y recarga. No cambia a otro evento ni llama APIs de escritura.
});

test('MGD-037: selector multi-evento muestra contexto activo sin cambiar datos', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await page.locator('#menuButton').click();
  const currentName = (await page.locator('#activeWeddingName').textContent() || '').trim();
  expect(currentName.length).toBeGreaterThan(0);
  const themeBefore = await page.locator('html').getAttribute('data-event-theme');

  await page.locator('#activeWeddingButton').click();
  await expect(page.locator('#weddingSwitcher')).toHaveClass(/show/);
  await expect(page.locator('#weddingSwitcherTitle')).toHaveText('Mis eventos');
  const current = page.locator('#weddingsList [data-wedding-id].is-current');
  await expect(current).toHaveCount(1);
  await expect(current.locator('strong')).toHaveText(currentName);
  const categories = ['Boda', 'Cumpleaños', '15 años', 'Baby Shower', 'Bautizo / Primera Comunión', 'Graduación', 'Evento corporativo', 'Otro / personalizado'];
  const categoryText = (await current.locator('small').textContent() || '').trim();
  expect(categories.some((name) => categoryText.startsWith(name + ' · '))).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-event-theme', themeBefore);
  expect(errors).toEqual([]);
  // Solo consulta listado; nunca selecciona otro weddingId ni escribe en Firestore.
});

test('MGD-037: conmutación A → B → A solo en cuenta fixture explícitamente autorizada', async ({ page }) => {
  const approved = process.env.MGD_QA_FIXTURE_SWITCH === 'AUTHORIZED_TEST_ONLY';
  const fixtureA = process.env.MGD_QA_FIXTURE_EVENT_A || '';
  const fixtureB = process.env.MGD_QA_FIXTURE_EVENT_B || '';
  test.skip(!approved || !fixtureA || !fixtureB || fixtureA === fixtureB,
    'Requiere autorización explícita y dos weddingIds ficticios de una cuenta exclusiva de QA.');
  if (!approved || !fixtureA || !fixtureB || fixtureA === fixtureB) return;
  // Esta prueba NO es de solo lectura: selectActiveWedding escribe activeWeddingId.
  // Nunca habilitar en cuenta personal, compartida o con eventos reales.
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await page.locator('#menuButton').click();
  await page.locator('#activeWeddingButton').click();
  const selector = page.locator('#weddingsList');
  const rowA = selector.locator('[data-wedding-id="' + fixtureA + '"]');
  const rowB = selector.locator('[data-wedding-id="' + fixtureB + '"]');
  await expect(rowA).toHaveCount(1);
  await expect(rowB).toHaveCount(1);
  const nameA = (await rowA.locator('strong').textContent() || '').trim();
  const nameB = (await rowB.locator('strong').textContent() || '').trim();
  expect(nameA).not.toBe(nameB);
  // El perfil guardado se inspecciona antes de escribir; solo dos fixtures preexistentes.
  const switchTo = async (id, expectedName) => {
    const row = selector.locator('[data-wedding-id="' + id + '"]');
    await row.click();
    await expect(page.locator('#activeWeddingName')).toHaveText(expectedName);
    await expect(page.locator('html')).toHaveAttribute('data-event-theme', /.+/);
    return page.locator('html').getAttribute('data-event-theme');
  };
  // Asegura que el test comienza en el contexto A; no conmutar desde un tercer evento.
  const selectedId = await selector.locator('[data-wedding-id].is-current').getAttribute('data-wedding-id');
  expect(selectedId).toBe(fixtureA);
  const themeA = await page.locator('html').getAttribute('data-event-theme');
  await switchTo(fixtureB, nameB);
  await page.locator('#activeWeddingButton').click();
  const themeRestored = await switchTo(fixtureA, nameA);
  expect(themeRestored).toBe(themeA);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await page.locator('#menuButton').click();
  await expect(page.locator('#activeWeddingName')).toHaveText(nameA);
  await expect(page.locator('html')).toHaveAttribute('data-event-theme', themeA);
  expect(errors).toEqual([]);
});
