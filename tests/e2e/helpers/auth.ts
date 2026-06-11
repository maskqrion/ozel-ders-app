import { expect, type Page } from '@playwright/test'

/**
 * Kimlik doğrulamalı E2E testleri için yardımcılar.
 *
 * Güvenlik kuralları:
 *  - Kimlik bilgileri YALNIZCA ortam değişkenlerinden okunur; koda, loglara
 *    veya test başlıklarına asla yazılmaz.
 *  - Gerçek/production hesabı kullanmayın — yalnızca staging/test Supabase
 *    projesindeki, gerçek veri içermeyen test hesapları (bkz. docs/e2e-testing.md).
 *  - authenticated.spec.ts trace kaydını kapatır: login isteğinin gövdesi
 *    şifre içerir ve trace artefaktına sızmamalıdır.
 */

export interface E2ECredentials {
  email: string
  password: string
}

function readCredentials(
  emailVar: string,
  passwordVar: string,
): E2ECredentials | null {
  const email = process.env[emailVar]?.trim()
  const password = process.env[passwordVar]?.trim()
  if (!email || !password) return null
  return { email, password }
}

/** E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD tanımlı değilse null döner. */
export function getStudentCredentials(): E2ECredentials | null {
  return readCredentials('E2E_STUDENT_EMAIL', 'E2E_STUDENT_PASSWORD')
}

/** E2E_TEACHER_EMAIL / E2E_TEACHER_PASSWORD tanımlı değilse null döner. */
export function getTeacherCredentials(): E2ECredentials | null {
  return readCredentials('E2E_TEACHER_EMAIL', 'E2E_TEACHER_PASSWORD')
}

/**
 * /login üzerinden e-posta + şifre ile giriş yapar ve role'a uygun dashboard'a
 * yönlendirilmeyi bekler.
 *
 * Rate limit uyarısı: app/actions/auth.ts signInWithEmail IP başına dakikada
 * 5 deneme ile sınırlıdır. Bu yüzden her describe grubu beforeAll içinde
 * yalnızca BİR kez giriş yapmalı ve testler aynı oturumu paylaşmalıdır.
 */
export async function loginWithEmail(
  page: Page,
  creds: E2ECredentials,
  expectedDashboardUrl: RegExp,
): Promise<void> {
  await page.goto('/login')

  // Aktif oturum varsa proxy /login'i dashboard'a yönlendirir — giriş gereksiz.
  if (expectedDashboardUrl.test(page.url())) return

  await page.locator('#email').fill(creds.email)
  await page.locator('#password').fill(creds.password)
  await page.locator('button[type="submit"]').click()

  // Dev sunucusunda dashboard'un ilk derlemesi yavaş olabilir → cömert timeout.
  // Hata mesajı bilinçli olarak kimlik bilgisi İÇERMEZ.
  await expect(
    page,
    'Giriş sonrası dashboard yönlendirmesi gerçekleşmedi — E2E_*_EMAIL / ' +
      'E2E_*_PASSWORD değerlerinin geçerli bir TEST hesabına ait olduğundan ' +
      've hesabın doğru role sahip olduğundan emin olun',
  ).toHaveURL(expectedDashboardUrl, { timeout: 45_000 })
}
