// Next.js 16: middleware.ts → proxy.ts (breaking rename)
// Docs: node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md
//
// Kural özeti:
//   Korumalı (/hoca, /ogrenci/*, /profil/*, /liderlik, /destek) → oturum yoksa /login?redirect=…
//   Auth sayfaları (/login, /sifremi-unuttum)           → oturum varsa role'a göre dashboard
//   /hoca/[id] (eğitmen profili)                        → herkese açık, DOKUNMA
//   Diğer her şey                                       → serbest

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Role } from '@/lib/types'

// ─── Rota sınıflandırıcıları ─────────────────────────────────────────────────

function isProtectedPath(pathname: string): boolean {
  // /hoca EXACT — /hoca/:id herkese açık eğitmen profil sayfası
  if (pathname === '/hoca') return true
  // Öğrenci dashboard ve alt rotaları (cuzdan, vb.)
  if (pathname === '/ogrenci' || pathname.startsWith('/ogrenci/')) return true
  // Profil sayfası ve alt rotaları
  if (pathname === '/profil' || pathname.startsWith('/profil/')) return true
  // Liderlik tablosu
  if (pathname === '/liderlik') return true
  // Destek talepleri (oturum gerektirir; /yardim herkese açık)
  if (pathname === '/destek' || pathname.startsWith('/destek/')) return true
  return false
}

function isAuthPath(pathname: string): boolean {
  // Giriş yapılmışken bu sayfalara gidilirse dashboard'a yönlendir
  return pathname === '/login' || pathname === '/sifremi-unuttum'
}

// ─── Proxy fonksiyonu ────────────────────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  // Supabase token yenileme için response'u reassignable tut
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Token yenilendiğinde her iki tarafı da güncelle
          // NextRequest.cookies.set() yalnızca (name, value) alır — options yoksayılır
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // ÖNEMLI: createServerClient ile getUser() arasına KESİNLİKLE kod ekleme.
  // Eklersen oturum çerezleri tutarsız hale gelir ve kullanıcılar rastgele çıkış yapar.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // /sandbox yalnızca geliştirme ortamında erişilebilir
  if (process.env.NODE_ENV === 'production' &&
      (pathname === '/sandbox' || pathname.startsWith('/sandbox/'))) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    homeUrl.search = ''
    const redirectResponse = NextResponse.redirect(homeUrl)
    supabaseResponse.cookies
      .getAll()
      .forEach(({ name, value }) => redirectResponse.cookies.set(name, value))
    return redirectResponse
  }

  // ── Korumalı rota: oturum yoksa /login?redirect=… ─────────────────────────
  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)

    const redirectResponse = NextResponse.redirect(loginUrl)
    // Token çerezlerini redirect response'a taşı (oturum senkronizasyonu)
    supabaseResponse.cookies
      .getAll()
      .forEach(({ name, value }) => redirectResponse.cookies.set(name, value))
    return redirectResponse
  }

  // ── Auth rotası: oturum varsa role'a göre dashboard'a yönlendir ───────────
  if (isAuthPath(pathname) && user) {
    const role = (user.user_metadata?.role ?? 'ogrenci') as Role
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = role === 'hoca' ? '/hoca' : '/ogrenci'
    dashboardUrl.search = ''

    const redirectResponse = NextResponse.redirect(dashboardUrl)
    supabaseResponse.cookies
      .getAll()
      .forEach(({ name, value }) => redirectResponse.cookies.set(name, value))
    return redirectResponse
  }

  // Supabase'in güncellediği çerezleri mutlaka döndür
  return supabaseResponse
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Statik dosyalar ve Next.js dahili yollarını dışla; kalanını proxy'e ver.

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
