import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: 1,                          // flake guard; alert rule needs 2+ failures
  workers: 1,                          // sequential — shared staging state
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.WEB_BASE ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'off',                      // replay consent applies to real users only
    actionTimeout: 10_000,
  },
})
