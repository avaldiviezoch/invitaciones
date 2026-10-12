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
