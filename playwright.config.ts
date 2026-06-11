import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

// .env.local / .env dosyalarını Playwright sürecine yükle (Next'in kendi
// yükleyicisi — yeni bağımlılık yok). E2E_* değişkenleri böylece .env.local'da
// tanımlanabilir; shell'de tanımlı değişkenler her zaman önceliklidir.
loadEnvConfig(process.cwd(), true)

// E2E_BASE_URL verilirse (ör. staging) testler o adrese karşı koşar ve yerel
// dev sunucusu BAŞLATILMAZ. Verilmezse localhost:3000 + otomatik dev sunucu.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

// Smoke + kimlik doğrulamalı testler için minimal Playwright yapılandırması.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    // Not: authenticated.spec.ts trace'i dosya bazında kapatır (login isteği
    // şifre içerir; CI retry artefaktlarına sızmamalı).
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        // İlk derleme yavaş olabilir (Sentry + büyük bağımlılıklar)
        timeout: 180 * 1000,
      },
})
