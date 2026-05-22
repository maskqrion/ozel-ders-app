import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isDashboard =
    pathname.startsWith('/(dashboard)') ||
    pathname.startsWith('/hoca') ||
    pathname.startsWith('/ogrenci')

  // Oturumu olmayan kullanıcı korumalı sayfaya girmeye çalışıyor
  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Giriş yapmış kullanıcı login sayfasına gelirse role göre yönlendir
  if (pathname === '/login' && user) {
    const role = user.user_metadata?.role as string | undefined
    const dest = role === 'hoca' ? '/hoca' : '/ogrenci'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
