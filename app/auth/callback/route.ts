import { NextRequest, NextResponse } from "next/server";
import { createServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  const supabase = await createServer();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  // Role-based redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // `next` param honored first (e.g. invite links) — open redirect protection
    const safeNext = next && /^\/[^/]/.test(next) ? next : null;
    if (safeNext) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "hoca") {
      return NextResponse.redirect(`${origin}/hoca`);
    }
    if (profile?.role === "ogrenci") {
      return NextResponse.redirect(`${origin}/ogrenci`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
