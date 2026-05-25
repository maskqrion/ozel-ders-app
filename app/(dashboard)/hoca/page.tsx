"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { attachSignedUrls } from "@/lib/storage";
import type { UserProfile, Lesson, Assignment, Resource } from "@/lib/types";

import Tabs, { type TabDef } from "@/components/dashboard/Tabs";
import GenelOzet from "@/components/dashboard/hoca/GenelOzet";
import DersTakvimi from "@/components/dashboard/hoca/DersTakvimi";
import OdevYonetimi from "@/components/dashboard/hoca/OdevYonetimi";
import Kaynaklar from "@/components/dashboard/hoca/Kaynaklar";
import OgrenciFiltre from "@/components/dashboard/hoca/OgrenciFiltre";
import QuizSuggestionBanner from "@/components/dashboard/hoca/QuizSuggestionBanner";
import NotificationBell from "@/components/dashboard/shared/NotificationBell";

const QuizOlusturucu = dynamic(() => import("@/components/dashboard/hoca/QuizOlusturucu"), { ssr: false });
const Mesajlar = dynamic(() => import("@/components/dashboard/shared/Mesajlar"), { ssr: false });

export default function HocaPaneli() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ogrenciler, setOgrenciler] = useState<UserProfile[]>([]);
  const [dersler, setDersler] = useState<Lesson[]>([]);
  const [odevler, setOdevler] = useState<Assignment[]>([]);
  const [kaynaklar, setKaynaklar] = useState<Resource[]>([]);
  const [filtreOgrenci, setFiltreOgrenci] = useState<string>("");
  const [ogrenciArama, setOgrenciArama] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Quiz öneri / oluşturucu state'i
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [createdSuggestions, setCreatedSuggestions] = useState<Set<string>>(new Set());

  const fetchDersler = useCallback(async (hocaId: string) => {
    const { data } = await supabase
      .from("lessons")
      .select(
        `id, hoca_id, ogrenci_id, lesson_date, status, users!lessons_ogrenci_id_fkey (email)`,
      )
      .eq("hoca_id", hocaId)
      .order("lesson_date", { ascending: true });
    if (data) setDersler(data as unknown as Lesson[]);
  }, []);

  const fetchOdevler = useCallback(async (hocaId: string) => {
    const { data } = await supabase
      .from("assignments")
      .select(
        `id, lesson_id, title, description, status, submission_text, submission_file_path, submitted_at, rejection_reason, score, lessons!inner(hoca_id, ogrenci_id, lesson_date, users!lessons_ogrenci_id_fkey(email))`,
      )
      .eq("lessons.hoca_id", hocaId)
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

        // Tüm bağımsız istekleri aynı anda başlat
        const profileAndStudentsPromise = Promise.all([
          supabase.from("users").select("*").eq("id", currentUser.id).single(),
          supabase.from("teacher_students").select("ogrenci_id").eq("hoca_id", currentUser.id),
        ]);
        const dataFetchesPromise = Promise.all([
          fetchDersler(currentUser.id),
          fetchOdevler(currentUser.id),
          fetchKaynaklar(),
        ]);

        const [[profileResult, bagliResult]] = await Promise.all([
          profileAndStudentsPromise,
          dataFetchesPromise,
        ]);

        if (profileResult.data) setProfile(profileResult.data as UserProfile);

        const ogrenciIdleri = (bagliResult.data ?? []).map((r: { ogrenci_id: string }) => r.ogrenci_id);
        if (ogrenciIdleri.length > 0) {
          const { data: ogrenciData } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url")
            .in("id", ogrenciIdleri);
          if (ogrenciData) setOgrenciler(ogrenciData as UserProfile[]);
        } else {
          setOgrenciler([]);
        }
      } catch (err) {
        console.error("Beklenmedik hata:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, fetchDersler, fetchOdevler, fetchKaynaklar]);

  useEffect(() => {
    if (!user?.id) return;

    const hocaLessonIds = new Set(dersler.map((d) => d.id));

    const channel = supabase
      .channel(`hoca-bildirimler-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "assignments" },
        (payload) => {
          if (
            payload.new.status === "yapildi" &&
            hocaLessonIds.has(payload.new.lesson_id)
          ) {
            toast.success("✅ Bir öğrenci ödevini teslim etti!", { duration: 4000 });
            fetchOdevler(user.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOdevler, dersler]);

  const gosterilecekDersler = useMemo(() => {
    if (!filtreOgrenci) return dersler;
    return dersler.filter((d) => d.ogrenci_id === filtreOgrenci);
  }, [dersler, filtreOgrenci]);

  const gosterilecekOdevler = useMemo(() => {
    if (!filtreOgrenci) return odevler;
    return odevler.filter((o) => o.lessons?.ogrenci_id === filtreOgrenci);
  }, [odevler, filtreOgrenci]);

  // "yapildi" durumundaki ödev sayısı → öğrenci başına
  const yapildiSayilari = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of odevler) {
      if (o.status === "yapildi" && o.lessons?.ogrenci_id) {
        map.set(o.lessons.ogrenci_id, (map.get(o.lessons.ogrenci_id) ?? 0) + 1);
      }
    }
    return map;
  }, [odevler]);

  // 4'ün katına ulaşan ilk öğrencinin önerisi (oturumda kapatılmamış / quiz açılmamış)
  const quizSuggestion = useMemo(() => {
    for (const [ogrenciId, count] of yapildiSayilari.entries()) {
      if (count <= 0 || count % 4 !== 0) continue;
      const key = `${ogrenciId}-${count}`;
      if (dismissedSuggestions.has(key) || createdSuggestions.has(key)) continue;
      const ogrenci = ogrenciler.find((o) => o.id === ogrenciId);
      if (!ogrenci) continue;
      return { ogrenci, count, key };
    }
    return null;
  }, [yapildiSayilari, ogrenciler, dismissedSuggestions, createdSuggestions]);

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
      const { data } = await supabase.rpc("add_user_xp", { amount });
      if (!data) return;
      setProfile((prev) => {
        if (!prev) return prev;
        if (data.level > prev.level) {
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
        return { ...prev, level: data.level, xp: data.xp };
      });
    },
    [user?.id],
  );

  const onQuizSaved = useCallback(
    async (_quizId: string) => {
      toast.success("🧠 Quiz hazır! Hayırlı olsun.", { duration: 3500 });
      if (quizSuggestion) {
        setCreatedSuggestions((prev) => {
          const next = new Set(prev);
          next.add(quizSuggestion.key);
          return next;
        });
      }
      await onAwardXp(50, "Yeni quiz hazırlandı");
    },
    [onAwardXp, quizSuggestion],
  );

  const tabs: TabDef[] = useMemo(() => {
    if (!user?.id) return [];
    return [
      {
        id: "ozet",
        label: "Genel Özet",
        icon: "📊",
        content: (
          <GenelOzet
            ogrenciler={ogrenciler}
            odevler={gosterilecekOdevler}
          />
        ),
      },
      {
        id: "takvim",
        label: "Ders Takvimi",
        icon: "🗓️",
        content: (
          <DersTakvimi
            ogrenciler={ogrenciler}
            onAwardXp={onAwardXp}
          />
        ),
      },
      {
        id: "odevler",
        label: "Ödev Yönetimi",
        icon: "📝",
        content: (
          <OdevYonetimi
            dersler={gosterilecekDersler}
            onAwardXp={onAwardXp}
          />
        ),
      },
      {
        id: "mesajlar",
        label: "Mesajlar",
        icon: "💬",
        content: <Mesajlar userId={user.id} role="hoca" />,
      },
      {
        id: "kaynaklar",
        label: "Kaynaklar",
        icon: "📚",
        content: <Kaynaklar kaynaklar={kaynaklar} />,
      },
    ];
  }, [user?.id, ogrenciler, gosterilecekDersler, gosterilecekOdevler, kaynaklar, onAwardXp]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* Nav skeleton */}
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="h-6 w-28 animate-pulse rounded-lg bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
        <main className="mx-auto mt-4 max-w-7xl p-6">
          {/* Tab bar skeleton */}
          <div className="mb-6 flex gap-2">
            {[80, 100, 120, 80, 90].map((w, i) => (
              <div
                key={i}
                className="animate-pulse rounded-full bg-slate-200"
                style={{ width: w, height: 36, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
          {/* Stats row skeleton */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-white p-5 shadow-sm"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-3 h-3 w-16 rounded-full bg-slate-200" />
                <div className="h-7 w-10 rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
          {/* Content card skeletons */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-white p-5 shadow-sm"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-full rounded-full bg-slate-100" />
                  <div className="h-2.5 w-4/5 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">Hoca Paneli</h1>
        <div className="flex items-center gap-4">
          {user && <NotificationBell userId={user.id} />}
          <Link href="/profil" className="group flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profil" width={32} height={32} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-sm text-slate-400">👤</span>
              )}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 hover:text-blue-600 sm:inline">
              Profilim
            </span>
          </Link>
          <button
            onClick={() => {
              supabase.auth.signOut();
              router.push("/login");
            }}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Çıkış Yap
          </button>
        </div>
      </nav>

      <main className="mx-auto mt-4 max-w-7xl p-6">
        {ogrenciler.length > 0 && (
          <OgrenciFiltre
            ogrenciler={ogrenciler.filter((o) =>
              ogrenciArama
                ? (o.full_name ?? o.email ?? "").toLowerCase().includes(ogrenciArama.toLowerCase())
                : true,
            )}
            value={filtreOgrenci}
            onChange={setFiltreOgrenci}
            searchText={ogrenciArama}
            onSearchChange={setOgrenciArama}
          />
        )}

        <AnimatePresence>
          {quizSuggestion && (
            <QuizSuggestionBanner
              key={quizSuggestion.key}
              ogrenciAdi={quizSuggestion.ogrenci.full_name || quizSuggestion.ogrenci.email}
              count={quizSuggestion.count}
              onCreate={() => setQuizModalOpen(true)}
              onDismiss={() =>
                setDismissedSuggestions((prev) => {
                  const next = new Set(prev);
                  next.add(quizSuggestion.key);
                  return next;
                })
              }
            />
          )}
        </AnimatePresence>

        {user ? (
          <Tabs tabs={tabs} accent="blue" />
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              {[80, 100, 120, 80].map((w, i) => (
                <div key={i} className="animate-pulse rounded-full bg-slate-200" style={{ width: w, height: 34 }} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-3 h-3 w-1/2 rounded-full bg-slate-200" />
                  <div className="h-6 w-1/3 rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <QuizOlusturucu
        open={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        defaultTitle={
          quizSuggestion
            ? `${quizSuggestion.ogrenci.full_name || quizSuggestion.ogrenci.email} için Pekiştirme Quiz'i`
            : ""
        }
        onSaved={onQuizSaved}
      />
    </div>
  );
}
