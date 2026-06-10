"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user === undefined) return;

    if (user && profile && !profileLoading) {
      if (pathname === "/") {
        router.replace(profile.role === "ogrenci" ? "/ogrenci" : "/hoca");
      } else if (pathname.includes("/hoca") && profile.role === "ogrenci") {
        router.replace("/ogrenci");
      } else if (pathname.includes("/ogrenci") && profile.role === "hoca") {
        router.replace("/hoca");
      }
    }
  }, [user, profile, profileLoading, pathname, router]);

  return <>{children}</>;
}
