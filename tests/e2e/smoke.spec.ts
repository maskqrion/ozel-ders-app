import { test, expect } from '@playwright/test'

/**
 * Smoke testleri — oturum açmadan, gerçek kimlik bilgisi/ödeme/AI çağrısı
 * KULLANMADAN temel rotaların ayakta olduğunu doğrular.
 *
 * Kapsam:
 *  1. Açılış sayfası yükleniyor
 *  2. Giriş sayfası yükleniyor
 *  3. Korumalı dashboard oturumsuz kullanıcıyı /login'e yönlendiriyor
 *  4. Herkese açık eğitmen profili login'e yönlendirilmiyor (404/200 kabul)
 */

test('açılış sayfası yükleniyor', async ({ page }) => {
  const response = await page.goto('/')

  expect(response, 'sunucudan yanıt alınamadı').toBeTruthy()
  expect(response!.status(), 'açılış sayfası hata döndürdü').toBeLessThan(400)

  // Sayfa gerçekten render edildi mi (boş beyaz ekran değil)
  await expect(page.locator('body')).toBeVisible()
  await expect(page).toHaveTitle(/.+/)
})

test('giriş sayfası yükleniyor', async ({ page }) => {
  const response = await page.goto('/login')

  expect(response!.status()).toBeLessThan(400)
  // Oturum yokken /login'de kalmalı (dashboard'a yönlendirme olmamalı)
  await expect(page).toHaveURL(/\/login/)
  // Giriş formu görünür olmalı
  await expect(page.locator('input[type="email"]').first()).toBeVisible()
})

test('korumalı dashboard oturumsuz kullanıcıyı /login\'e yönlendiriyor', async ({
  page,
}) => {
  await page.goto('/ogrenci')

  // proxy.ts: oturum yoksa /login?redirect=/ogrenci
  await expect(page).toHaveURL(/\/login/)
  const url = new URL(page.url())
  expect(url.searchParams.get('redirect')).toBe('/ogrenci')
})

test('eğitmen profili herkese açık — login\'e yönlendirilmiyor', async ({
  page,
}) => {
  // Var olmayan bir UUID: amaç auth davranışını test etmek, veri değil.
  // notFound() → 404 beklenir; gerçek bir kayıt dönerse 200 de kabul.
  const response = await page.goto('/hoca/00000000-0000-0000-0000-000000000000')

  expect(response!.status(), 'sunucu hatası (5xx) olmamalı').toBeLessThan(500)
  await expect(page).not.toHaveURL(/\/login/)
})
