import { test, expect } from '@playwright/test';

const READ_ONLY_MODULES = [
  'checklist',
  'presupuesto',
  'proveedores',
  'invitados',
  'cronograma',
  'ideas'
];

function collectUnexpectedErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test('E2E-02/E2E-03: sesión existente carga boda activa sin escritura', async ({ page }) => {
  const errors = collectUnexpectedErrors(page);
  await page.goto('', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await expect(page.locator('#activeWeddingButton')).toBeVisible();
  await expect(page.locator('#activeWeddingName')).not.toHaveText('');
  expect(errors).toEqual([]);
});

for (const moduleId of READ_ONLY_MODULES) {
  test(`lectura autenticada: ${moduleId} monta sin acciones de edición`, async ({ page }) => {
    const errors = collectUnexpectedErrors(page);
    await page.goto('', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
    await page.locator(`[data-app-module="${moduleId}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${moduleId}$`));
    await expect(page.locator(`[data-module-view="${moduleId}"]`)).toBeVisible();
    await expect(page.locator('#moduleWorkspace')).toHaveAttribute('aria-hidden', 'false');

    expect(errors).toEqual([]);
  });
}
