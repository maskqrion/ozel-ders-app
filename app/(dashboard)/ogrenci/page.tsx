"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import toast from "react-hot-toast";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { attachSignedUrls } from "@/lib/storage";
import type { UserProfile, Lesson, Assignment, Resource } from "@/lib/types";
import { LoaderOne } from "@/components/ui/loader";
import { awardHocaXp } from "@/app/actions/xp";

import Tabs, { type TabDef } from "@/components/dashboard/Tabs";
import GenelOzet from "@/components/dashboard/ogrenci/GenelOzet";
import Odevlerim from "@/components/dashboard/ogrenci/Odevlerim";
import DersTakvimi from "@/components/dashboard/ogrenci/DersTakvimi";
import Kaynaklar from "@/components/dashboard/ogrenci/Kaynaklar";
import CuzdanOzet from "@/components/dashboard/ogrenci/CuzdanOzet";
import NotificationBell from "@/components/dashboard/shared/NotificationBell";

const OgretmenBul = dynamic(() => import("@/components/dashboard/ogrenci/OgretmenBul"), { ssr: false });

const OGRENCI_XP_ACTION_MAP: Record<string, "odev_teslim"> = {
  "Ödev teslim edildi": "odev_teslim",
};
const Mesajlar = dynamic(() => import("@/components/dashboard/shared/Mesajlar"), { ssr: false });

export default function OgrenciPaneli() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dersler, setDersler] = useState<Lesson[]>([]);
  const [odevler, setOdevler] = useState<Assignment[]>([]);
  const [kaynaklar, setKaynaklar] = useState<Resource[]>([]);
  const [siradakiDers, setSiradakiDers] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const lessonIdsRef = useRef<Set<string>>(new Set());

  const fetchDersler = useCallback(async (ogrenciId: string) => {
    const { data } = await supabase
      .from("lessons")
      .select(`id, hoca_id, ogrenci_id, lesson_date, status, hoca:users!lessons_hoca_id_fkey (email, full_name)`)
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

  const fetchKaynaklar = useCallback(async (ogrenciId: string) => {
    const { data: connections } = await supabase
      .from("teacher_students")
      .select("hoca_id")
      .eq("ogrenci_id", ogrenciId);
    if (!connections || connections.length === 0) {
      setKaynaklar([]);
      return;
    }
    const hocaIds = connections.map((c: { hoca_id: string }) => c.hoca_id);
    const { data } = await supabase
      .from("resources")
      .select("*")
      .in("yukleyen_id", hocaIds)
      .order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "file_path", "signed_url");
      setKaynaklar(enriched as unknown as Resource[]);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/login");
    });
    return () => subscription.unsubscribe();
  }, [router]);

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

        await Promise.all([fetchDersler(currentUser.id), fetchOdevler(currentUser.id), fetchKaynaklar(currentUser.id)]);
        setLoading(false);
      } catch (err) {
        console.error("Beklenmedik hata:", err);
        router.push("/login");
      }
    };

    fetchData();
  }, [router, fetchDersler, fetchOdevler, fetchKaynaklar]);

  useEffect(() => {
    lessonIdsRef.current = new Set(dersler.map((d) => d.id));
  }, [dersler]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`ogrenci-bildirimler-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          const oldRow = payload.old as Record<string, unknown> | undefined;
          const lessonId = (newRow?.lesson_id ?? oldRow?.lesson_id) as string | undefined;
          if (!lessonId || !lessonIdsRef.current.has(lessonId)) return;

          if (payload.eventType === "INSERT") {
            toast("📚 Yeni bir ödev verildi!", { icon: "🔔", duration: 4000 });
          } else if (payload.eventType === "UPDATE") {
            const status = newRow?.status as string | undefined;
            const newScore = newRow?.score as number | null | undefined;
            const oldScore = oldRow?.score as number | null | undefined;
            if (status === "reddedildi") {
              toast.error("❌ Bir ödeviniz reddedildi!");
            } else if (newScore != null && (oldScore == null || oldScore === undefined)) {
              toast.success("✅ Bir ödeviniz puanlandı!");
            }
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
    async (_amount: number, action: string) => {
      if (!user?.id) return;
      const actionKey = OGRENCI_XP_ACTION_MAP[action];
      if (!actionKey) return;
      const result = await awardHocaXp(actionKey);
      if (!result.ok) return;
      toast.success(`+${_amount} XP — ${action}`, {
        icon: "✨",
        duration: 2500,
        style: {
          background: "#fffbeb",
          color: "#92400e",
          border: "1px solid #fde68a",
          fontWeight: 600,
        },
      });
      setProfile((prev) => {
        if (!prev) return prev;
        if (result.level > prev.level) {
          toast(`🎉 Seviye atladın! Lv ${result.level}'e ulaştın.`, {
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
        return { ...prev, level: result.level, xp: result.xp };
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
            siradakiDers={siradakiDers}
            odevler={odevler}
            dersler={dersler}
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
          <Odevlerim onAwardXp={onAwardXp} />
        ),
      },
      {
        id: "takvim",
        label: "Ders Takvimi",
        icon: "🗓️",
        content: <DersTakvimi />,
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
      {
        id: "cuzdan",
        label: "Cüzdanım",
        icon: "💳",
        content: <CuzdanOzet userId={user.id} />,
      },
    ];
  }, [user?.id, siradakiDers, odevler, dersler, kaynaklar, fetchDersler, fetchOdevler, onAwardXp]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-emerald-50">
        <LoaderOne color="#059669" size={48} />
        <p className="text-sm font-medium text-emerald-600">Yükleniyor...</p>
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
                <Image src={profile.avatar_url} alt="Profil" width={32} height={32} className="h-full w-full object-cover" />
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
          <div className="space-y-4">
            <div className="flex gap-2">
              {[80, 100, 90, 110, 80].map((w, i) => (
                <div key={i} className="animate-pulse rounded-full bg-emerald-100" style={{ width: w, height: 34 }} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-3 h-3 w-1/2 rounded-full bg-emerald-100" />
                  <div className="h-6 w-1/3 rounded-lg bg-emerald-100" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
