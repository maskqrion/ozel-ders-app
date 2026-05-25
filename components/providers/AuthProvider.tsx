"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";

const PUBLIC_PATHS = ["/", "/login", "/sifre-yenile", "/sifremi-unuttum", "/davet"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/davet/"));
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    if (!session) {
      if (!isPublic(pathname)) router.replace("/login");
      return;
    }

    if (pathname === "/") {
      router.replace(profile?.role === "ogrenci" ? "/ogrenci" : "/hoca");
      return;
    }

    if (!profile || profileLoading) return;

    if (pathname.includes("/hoca") && profile.role === "ogrenci") {
      router.replace("/ogrenci");
    } else if (pathname.includes("/ogrenci") && profile.role === "hoca") {
      router.replace("/hoca");
    }
  }, [session, profile, profileLoading, pathname, router]);

  // Only block rendering on private routes while session state is unknown.
  // Public routes always render immediately; profile-based redirects run via
  // the useEffect above and land after the first paint, not before.
  const blocking = session === undefined && !isPublic(pathname);

  if (blocking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
