import { defineConfig, devices } from '@playwright/test'

// Smoke testleri için minimal Playwright yapılandırması.
// Sunucuyu kendisi başlatır (npm run dev); zaten çalışan bir dev sunucusu varsa onu kullanır.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // İlk derleme yavaş olabilir (Sentry + büyük bağımlılıklar)
    timeout: 180 * 1000,
  },
})
