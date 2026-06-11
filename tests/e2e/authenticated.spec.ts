import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import {
  getStudentCredentials,
  getTeacherCredentials,
  loginWithEmail,
} from './helpers/auth'

/**
 * Kimlik doğrulamalı smoke testleri — test hesabı varsa çalışır, yoksa atlanır.
 *
 * Ortam değişkenleri (bkz. docs/e2e-testing.md):
 *   E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD  → öğrenci testleri
 *   E2E_TEACHER_EMAIL / E2E_TEACHER_PASSWORD  → hoca testleri
 *
 * Güvenlik garantileri:
 *  - Testler SALT OKUNUR davranır: rezervasyon onaylanmaz, ödeme/bakiye
 *    yükleme yapılmaz, mesaj gönderilmez, ödev/quiz oluşturulmaz, dosya
 *    yüklenmez, AI çağrılmaz.
 *  - Login isteğinin gövdesinde şifre bulunduğu için bu dosyada trace kapalı
 *    (CI retry'larında bile artefakta kimlik bilgisi sızmaz).
 *  - Her rol için yalnızca 1 giriş yapılır (auth rate limit: 5 deneme/dk/IP).
 */

// Trace ağ kayıtları login isteğinin gövdesini (şifre) içerir — bu dosyada kapalı.
test.use({ trace: 'off' })

const STUDENT = getStudentCredentials()
const TEACHER = getTeacherCredentials()

// Dashboard URL'leri sonda eşleşmeli; /login?redirect=/ogrenci yanlış pozitif vermesin.
const OGRENCI_URL = /\/ogrenci(\?.*)?$/
const HOCA_URL = /\/hoca(\?.*)?$/

/* ═══════════════════════════════════════════════════════════════
   ÖĞRENCİ AKIŞLARI
═══════════════════════════════════════════════════════════════ */

test.describe('Öğrenci — kimlik doğrulamalı akışlar', () => {
  test.skip(
    !STUDENT,
    'E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD tanımlı değil — öğrenci testleri atlandı',
  )
  // Tek oturum + tek giriş paylaşılır → testler sıralı koşmalı.
  test.describe.configure({ mode: 'serial' })

  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    if (!STUDENT) return
    test.setTimeout(120_000) // dev sunucusunda ilk derleme yavaş olabilir
    context = await browser.newContext()
    page = await context.newPage()
    await loginWithEmail(page, STUDENT, OGRENCI_URL)
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test.beforeEach(async () => {
    test.setTimeout(90_000) // dev modunda rota başına ilk derleme payı
  })

  test('öğrenci girişi başarılı ve dashboard yükleniyor', async () => {
    await expect(page).toHaveURL(OGRENCI_URL)
    // Panel sekmeleri veri yüklendikten sonra görünür
    await expect(page.getByRole('tab', { name: 'Genel Özet' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('tab', { name: 'Öğretmen Bul' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Cüzdanım' })).toBeVisible()
  })

  test('öğretmen arama sekmesi yükleniyor', async () => {
    await page.goto('/ogrenci?tab=ogretmen-bul')
    await expect(
      page.getByPlaceholder('İsim, uzmanlık alanı veya şehir ara...'),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('rezervasyon modali açılıyor — onay/ödeme YAPILMADAN terk ediliyor', async () => {
    await page.goto('/ogrenci?tab=ogretmen-bul')
    await expect(
      page.getByPlaceholder('İsim, uzmanlık alanı veya şehir ara...'),
    ).toBeVisible({ timeout: 30_000 })

    // Hoca listesi veriye bağlı: sonuç yoksa testi atla (ortamda hoca kaydı yok).
    const dersTalepEt = page
      .getByRole('button', { name: 'Ders Talep Et' })
      .first()
    const hocaVar = await dersTalepEt
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false)
    test.skip(!hocaVar, 'Arama sonucunda hoca yok — rezervasyon modali bu ortamda doğrulanamadı')

    await dersTalepEt.click()
    await expect(page.getByText('Ders Rezervasyonu').first()).toBeVisible({
      timeout: 15_000,
    })

    // ÖNEMLİ: slot seçilmez, "Dersi Onayla" tıklanmaz — modal hiçbir işlem
    // yapılmadan sayfadan ayrılarak kapatılır.
    await page.goto('/ogrenci')
    await expect(page.getByRole('tab', { name: 'Genel Özet' })).toBeVisible({
      timeout: 30_000,
    })
  })

  test('cüzdan sayfası yükleniyor — bakiye yükleme/ödeme YAPILMIYOR', async () => {
    await page.goto('/ogrenci/cuzdan')
    await expect(
      page.getByRole('heading', { name: 'Cüzdanım ve Ödemeler' }),
    ).toBeVisible({ timeout: 30_000 })
    // Salt okunur doğrulama: işlem geçmişi bölümü render ediliyor.
    await expect(
      page.getByRole('heading', { name: 'İşlem Geçmişi' }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('mesajlar bölümü yükleniyor — mesaj GÖNDERİLMİYOR', async () => {
    await page.goto('/ogrenci?tab=mesajlar')
    await expect(page.getByRole('heading', { name: 'Sohbetler' })).toBeVisible({
      timeout: 30_000,
    })
  })

  test('herkese açık eğitmen profili oturumla da erişilebilir', async () => {
    // Var olmayan UUID — amaç auth davranışı: login'e atılmamalı, 5xx olmamalı.
    const response = await page.goto(
      '/hoca/00000000-0000-0000-0000-000000000000',
    )
    expect(response!.status()).toBeLessThan(500)
    await expect(page).not.toHaveURL(/\/login/)
  })
})

/* ═══════════════════════════════════════════════════════════════
   HOCA AKIŞLARI
═══════════════════════════════════════════════════════════════ */

test.describe('Hoca — kimlik doğrulamalı akışlar', () => {
  test.skip(
    !TEACHER,
    'E2E_TEACHER_EMAIL / E2E_TEACHER_PASSWORD tanımlı değil — hoca testleri atlandı',
  )
  test.describe.configure({ mode: 'serial' })

  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    if (!TEACHER) return
    test.setTimeout(120_000)
    context = await browser.newContext()
    page = await context.newPage()
    await loginWithEmail(page, TEACHER, HOCA_URL)
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test.beforeEach(async () => {
    test.setTimeout(90_000)
  })

  test('hoca girişi başarılı ve hoca paneli yükleniyor', async () => {
    await expect(page).toHaveURL(HOCA_URL)
    await expect(
      page.getByRole('heading', { name: 'Hoca Paneli' }),
    ).toBeVisible({ timeout: 30_000 })
    // Üst menü öğeleri: panel gerçekten render edildi
    await expect(page.getByRole('button', { name: 'Çıkış Yap' })).toBeVisible()
  })
})
