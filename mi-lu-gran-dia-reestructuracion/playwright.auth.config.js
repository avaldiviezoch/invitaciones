import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://avaldiviezoch.github.io/invitaciones/mi-lu-gran-dia-reestructuracion/',
    storageState: 'tests/.auth/storage-state.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-auth', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }
  ]
});
