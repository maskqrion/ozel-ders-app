"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { attachSignedUrls } from "@/lib/storage";
import type { UserProfile, Lesson, Assignment, Resource } from "@/lib/types";

import Tabs, { type TabDef } from "@/components/dashboard/Tabs";
import GenelOzet from "@/components/dashboard/ogrenci/GenelOzet";
import Odevlerim from "@/components/dashboard/ogrenci/Odevlerim";
import DersTakvimi from "@/components/dashboard/ogrenci/DersTakvimi";
import Kaynaklar from "@/components/dashboard/ogrenci/Kaynaklar";
import OgretmenBul from "@/components/dashboard/ogrenci/OgretmenBul";
import Mesajlar from "@/components/dashboard/shared/Mesajlar";
import NotificationBell from "@/components/dashboard/shared/NotificationBell";

export default function OgrenciPaneli() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dersler, setDersler] = useState<Lesson[]>([]);
  const [odevler, setOdevler] = useState<Assignment[]>([]);
  const [kaynaklar, setKaynaklar] = useState<Resource[]>([]);
  const [siradakiDers, setSiradakiDers] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDersler = useCallback(async (ogrenciId: string) => {
    const { data } = await supabase
      .from("lessons")
      .select(`id, hoca_id, ogrenci_id, lesson_date, status, users!lessons_hoca_id_fkey (email)`)
      .eq("ogrenci_id", ogrenciId)
      .order("lesson_date", { ascending: true });
    if (data) {
      const typed = data as unknown as Lesson[];
      setDersler(typed);
      setSiradakiDers(typed.find((d) => d.status === "bekliyor") || null);
    }
  }, []);

  const fetchOdevler = useCallback(async (ogrenciId: string) => {
    const { data } = await supabase
      .from("assignments")
      .select(
        `id, lesson_id, title, description, status, submission_text, submission_file_path, submitted_at, rejection_reason, score, lessons!inner(hoca_id, ogrenci_id, lesson_date, users!lessons_hoca_id_fkey(email))`,
      )
      .eq("lessons.ogrenci_id", ogrenciId)
      .order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "submission_file_path", "submission_signed_url");
      setOdevler(enriched as unknown as Assignment[]);
    }
  }, []);

  const fetchKaynaklar = useCallback(async () => {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "file_path", "signed_url");
      setKaynaklar(enriched as unknown as Resource[]);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();
        if (error || !currentUser) {
          await supabase.auth.signOut();
          return router.push("/login");
        }
        setUser(currentUser);

        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        if (profileData) setProfile(profileData as UserProfile);

        await Promise.all([fetchDersler(currentUser.id), fetchOdevler(currentUser.id), fetchKaynaklar()]);
        setLoading(false);
      } catch (err) {
        console.error("Beklenmedik hata:", err);
        router.push("/login");
      }
    };

    fetchData();
  }, [router, fetchDersler, fetchOdevler, fetchKaynaklar]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("ogrenci-bildirimler")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            toast("📚 Yeni bir ödev verildi!", { icon: "🔔", duration: 4000 });
          } else if (payload.eventType === "UPDATE" && payload.new.status === "reddedildi") {
            toast.error("❌ Bir ödeviniz reddedildi!");
          }
          fetchOdevler(user.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOdevler]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const onAwardXp = useCallback(
    async (amount: number, action: string) => {
      if (!user?.id) return;
      toast.success(`+${amount} XP — ${action}`, {
        icon: "✨",
        duration: 2500,
        style: {
          background: "#fffbeb",
          color: "#92400e",
          border: "1px solid #fde68a",
          fontWeight: 600,
        },
      });
      const { data } = await supabase
        .from("users")
        .select("level, xp")
        .eq("id", user.id)
        .single();
      if (!data) return;
      setProfile((prev) => {
        if (!prev) return prev;
        if ((data.level ?? prev.level) > prev.level) {
          toast(`🎉 Seviye atladın! Lv ${data.level}'e ulaştın.`, {
            icon: "🚀",
            duration: 4500,
            style: {
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              color: "#78350f",
              border: "1px solid #fbbf24",
              fontWeight: 700,
            },
          });
        }
        return { ...prev, level: data.level ?? prev.level, xp: data.xp ?? prev.xp };
      });
    },
    [user?.id],
  );

  const tabs: TabDef[] = useMemo(() => {
    if (!user?.id) return [];
    return [
      {
        id: "ozet",
        label: "Genel Özet",
        icon: "🎯",
        content: (
          <GenelOzet
            userId={user.id}
            siradakiDers={siradakiDers}
            odevler={odevler}
            dersler={dersler}
            level={profile?.level ?? 1}
            xp={profile?.xp ?? 0}
            fullName={profile?.full_name ?? undefined}
            refetchDersler={() => fetchDersler(user.id)}
            refetchOdevler={() => fetchOdevler(user.id)}
          />
        ),
      },
      {
        id: "odevlerim",
        label: "Ödevlerim",
        icon: "📝",
        content: (
          <Odevlerim
            userId={user.id}
            odevler={odevler}
            refetchOdevler={() => fetchOdevler(user.id)}
            onAwardXp={onAwardXp}
          />
        ),
      },
      {
        id: "takvim",
        label: "Ders Takvimi",
        icon: "🗓️",
        content: <DersTakvimi dersler={dersler} />,
      },
      {
        id: "ogretmen-bul",
        label: "Öğretmen Bul",
        icon: "🔍",
        content: <OgretmenBul currentUserId={user.id} />,
      },
      {
        id: "mesajlar",
        label: "Mesajlar",
        icon: "💬",
        content: <Mesajlar userId={user.id} role="ogrenci" />,
      },
      {
        id: "kaynaklar",
        label: "Kaynaklar",
        icon: "📚",
        content: <Kaynaklar kaynaklar={kaynaklar} />,
      },
    ];
  }, [
    user?.id,
    profile?.level,
    profile?.xp,
    siradakiDers,
    odevler,
    dersler,
    kaynaklar,
    fetchDersler,
    fetchOdevler,
    onAwardXp,
  ]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-emerald-50 font-medium text-emerald-600">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/40 pb-20 font-sans text-slate-800">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-100 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-emerald-600">Öğrenci Paneli</h1>
        <div className="flex items-center gap-4">
          {user && <NotificationBell userId={user.id} />}
          <Link href="/profil" className="group flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition group-hover:border-emerald-400">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profil" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs">👤</span>
              )}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 transition group-hover:text-emerald-600 sm:inline">
              Profilim
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-md bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
          >
            Çıkış Yap
          </button>
        </div>
      </nav>

      <main className="mx-auto mt-6 max-w-6xl space-y-6 p-6">
        {user ? (
          <Tabs tabs={tabs} accent="green" />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm"
          >
            Yükleniyor...
          </motion.div>
        )}
      </main>
    </div>
  );
}
