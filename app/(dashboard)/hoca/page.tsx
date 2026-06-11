"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import toast from "react-hot-toast";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { attachSignedUrls } from "@/lib/storage";
import type { UserProfile, Lesson, Assignment, Resource } from "@/lib/types";
import { awardHocaXp } from "@/app/actions/xp";

import HocaSidebar from "@/components/dashboard/hoca/HocaSidebar";
import GenelOzet from "@/components/dashboard/hoca/GenelOzet";
import DersTakvimi from "@/components/dashboard/hoca/DersTakvimi";
import OdevYonetimi from "@/components/dashboard/hoca/OdevYonetimi";
import Kaynaklar from "@/components/dashboard/hoca/Kaynaklar";
import OgrenciDegerlendirmeleri from "@/components/dashboard/hoca/OgrenciDegerlendirmeleri";
import MusaitlikAyarlari from "@/components/dashboard/hoca/MusaitlikAyarlari";
import HocaCuzdani from "@/components/dashboard/hoca/HocaCuzdani";
import OgrenciFiltre from "@/components/dashboard/hoca/OgrenciFiltre";
import QuizSuggestionBanner from "@/components/dashboard/hoca/QuizSuggestionBanner";
import NotificationBell from "@/components/dashboard/shared/NotificationBell";
import { LoaderOne } from "@/components/ui/loader";

const QuizOlusturucu = dynamic(() => import("@/components/dashboard/hoca/QuizOlusturucu"), { ssr: false });
const Mesajlar = dynamic(() => import("@/components/dashboard/shared/Mesajlar"), { ssr: false });

const XP_ACTION_MAP: Record<string, "quiz" | "ders" | "odev"> = {
  "Yeni quiz hazırlandı": "quiz",
  "Yeni ders planlandı":  "ders",
  "Yeni ödev verildi":    "odev",
};

export default function HocaPaneli() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user,           setUser]           = useState<User | null>(null);
  const [profile,        setProfile]        = useState<UserProfile | null>(null);
  const [ogrenciler,     setOgrenciler]     = useState<UserProfile[]>([]);
  const [dersler,        setDersler]        = useState<Lesson[]>([]);
  const [odevler,        setOdevler]        = useState<Assignment[]>([]);
  const [kaynaklar,      setKaynaklar]      = useState<Resource[]>([]);
  const [filtreOgrenci,  setFiltreOgrenci]  = useState<string>("");
  const [ogrenciArama,   setOgrenciArama]   = useState<string>("");
  const [loading,        setLoading]        = useState(true);
  const [activeView,     setActiveView]     = useState("ozet");

  const [quizModalOpen,       setQuizModalOpen]       = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [createdSuggestions,   setCreatedSuggestions]   = useState<Set<string>>(new Set());

  // React Compiler: dep dizilerinde optional chain (user?.id) memoizasyonu bozuyor;
  // tek bir primitive değişkene çıkarıp her yerde onu kullanıyoruz.
  const userId = user?.id;

  const derslerRef = useRef<Lesson[]>([]);
  useEffect(() => { derslerRef.current = dersler; }, [dersler]);

  const fetchDersler = useCallback(async (hocaId: string) => {
    const { data } = await supabase
      .from("lessons")
      .select(`id, hoca_id, ogrenci_id, lesson_date, status, users!lessons_ogrenci_id_fkey (email)`)
      .eq("hoca_id", hocaId)
      .order("lesson_date", { ascending: true });
    if (data) setDersler(data as unknown as Lesson[]);
  }, []);

  const fetchOdevler = useCallback(async (hocaId: string) => {
    const { data } = await supabase
      .from("assignments")
      .select(`id, lesson_id, title, description, status, submission_text, submission_file_path, submitted_at, rejection_reason, score, lessons!inner(hoca_id, ogrenci_id, lesson_date, users!lessons_ogrenci_id_fkey(email))`)
      .eq("lessons.hoca_id", hocaId)
      .order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "submission_file_path", "submission_signed_url");
      setOdevler(enriched as unknown as Assignment[]);
    }
  }, []);

  const fetchKaynaklar = useCallback(async (hocaId: string) => {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("yukleyen_id", hocaId)
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
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error || !currentUser) {
          await supabase.auth.signOut();
          return router.push("/login");
        }
        setUser(currentUser);

        const [profileAndStudents] = await Promise.all([
          Promise.all([
            supabase.from("users").select("*").eq("id", currentUser.id).single(),
            supabase.from("teacher_students").select("ogrenci_id").eq("hoca_id", currentUser.id),
          ]),
          Promise.all([
            fetchDersler(currentUser.id),
            fetchOdevler(currentUser.id),
            fetchKaynaklar(currentUser.id),
          ]),
        ]);

        const [profileResult, bagliResult] = profileAndStudents;

        if (profileResult.data) {
          setProfile(profileResult.data as UserProfile);
          queryClient.setQueryData(["profile"], profileResult.data);
        }

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
  }, [router, fetchDersler, fetchOdevler, fetchKaynaklar, queryClient]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`hoca-bildirimler-${userId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "assignments" }, (payload) => {
        const hocaLessonIds = new Set(derslerRef.current.map(d => d.id));
        if (
          payload.new.status === "yapildi" &&
          payload.old.status !== "yapildi" &&
          hocaLessonIds.has(payload.new.lesson_id)
        ) {
          toast.success("✅ Bir öğrenci ödevini teslim etti!", { duration: 4000 });
          fetchOdevler(userId);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchOdevler]);

  const gosterilecekDersler = useMemo(() =>
    filtreOgrenci ? dersler.filter(d => d.ogrenci_id === filtreOgrenci) : dersler,
    [dersler, filtreOgrenci],
  );

  const gosterilecekOdevler = useMemo(() =>
    filtreOgrenci ? odevler.filter(o => o.lessons?.ogrenci_id === filtreOgrenci) : odevler,
    [odevler, filtreOgrenci],
  );

  const quizSuggestion = useMemo(() => {
    // Öğrenci başına "yapildi" ödev sayıları (Map lokal — dep olarak geçirmek
    // React Compiler memoizasyonunu bozuyordu). Döngü içinden erken return da
    // memoizasyonu bozduğu için tek çıkış noktası kullanılıyor.
    const yapildiSayilari = new Map<string, number>();
    for (const o of odevler) {
      if (o.status === "yapildi" && o.lessons?.ogrenci_id) {
        yapildiSayilari.set(o.lessons.ogrenci_id, (yapildiSayilari.get(o.lessons.ogrenci_id) ?? 0) + 1);
      }
    }
    let suggestion: { ogrenci: UserProfile; count: number; key: string } | null = null;
    for (const [ogrenciId, count] of yapildiSayilari) {
      if (count <= 0 || count % 4 !== 0) continue;
      const key = `${ogrenciId}-${count}`;
      if (dismissedSuggestions.has(key) || createdSuggestions.has(key)) continue;
      const ogrenci = ogrenciler.find(o => o.id === ogrenciId);
      if (!ogrenci) continue;
      suggestion = { ogrenci, count, key };
      break;
    }
    return suggestion;
  }, [odevler, ogrenciler, dismissedSuggestions, createdSuggestions]);

  const onAwardXp = useCallback(async (_amount: number, action: string) => {
    if (!userId) return;
    const actionKey = XP_ACTION_MAP[action];
    if (!actionKey) return;
    const result = await awardHocaXp(actionKey);
    if (!result.ok) return;
    toast.success(`+${_amount} XP — ${action}`, {
      icon: "✨", duration: 2500,
      style: { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", fontWeight: 600 },
    });
    setProfile(prev => {
      if (!prev) return prev;
      if (result.level > prev.level) {
        toast(`🎉 Seviye atladın! Lv ${result.level}'e ulaştın.`, {
          icon: "🚀", duration: 4500,
          style: { background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", color: "#78350f", border: "1px solid #fbbf24", fontWeight: 700 },
        });
      }
      return { ...prev, level: result.level, xp: result.xp };
    });
  }, [userId]);

  const onQuizSaved = useCallback(async (_quizId: string) => {
    toast.success("🧠 Quiz hazır! Hayırlı olsun.", { duration: 3500 });
    if (quizSuggestion) {
      setCreatedSuggestions(prev => { const next = new Set(prev); next.add(quizSuggestion.key); return next; });
    }
    await onAwardXp(50, "Yeni quiz hazırlandı");
  }, [onAwardXp, quizSuggestion]);

  const contentMap = useMemo(() => {
    if (!userId) return {} as Record<string, React.ReactNode>;
    return {
      ozet: (
        <GenelOzet
          ogrenciler={ogrenciler}
          odevler={gosterilecekOdevler}
          hocaId={userId}
        />
      ),
      takvim: (
        <DersTakvimi ogrenciler={ogrenciler} onAwardXp={onAwardXp} />
      ),
      odevler: (
        <OdevYonetimi dersler={gosterilecekDersler} onAwardXp={onAwardXp} />
      ),
      mesajlar: <Mesajlar userId={userId} role="hoca" />,
      degerlendirmeler: <OgrenciDegerlendirmeleri hocaId={userId} />,
      kaynaklar: <Kaynaklar kaynaklar={kaynaklar} />,
      cuzdan: <HocaCuzdani userId={userId} />,
      musaitlik: <MusaitlikAyarlari userId={userId} />,
    } as Record<string, React.ReactNode>;
  }, [userId, ogrenciler, gosterilecekDersler, gosterilecekOdevler, kaynaklar, onAwardXp]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <LoaderOne color="#3b82f6" size={48} />
        <p className="text-sm font-medium text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <nav className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm z-50">
        <h1 className="text-xl font-bold text-blue-600">Hoca Paneli</h1>
        <div className="flex items-center gap-4">
          {user && <NotificationBell userId={user.id} />}
          <Link
            href="/destek"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-blue-600 sm:inline"
          >
            Destek
          </Link>
          <Link href="/profil" className="group flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition group-hover:border-blue-400">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profil" width={32} height={32} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-sm text-slate-400">👤</span>
              )}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 transition group-hover:text-blue-600 sm:inline">
              Profilim
            </span>
          </Link>
          <button
            onClick={() => { supabase.auth.signOut(); router.push("/login"); }}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Çıkış Yap
          </button>
        </div>
      </nav>

      {/* ── Sidebar + content ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <HocaSidebar activeId={activeView} onSelect={setActiveView} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-6 pb-24 space-y-4">
            {/* Student filter — shown when students exist */}
            {ogrenciler.length > 0 && (
              <OgrenciFiltre
                ogrenciler={ogrenciler.filter(o =>
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

            {/* Quiz suggestion banner */}
            <AnimatePresence>
              {quizSuggestion && (
                <QuizSuggestionBanner
                  key={quizSuggestion.key}
                  ogrenciAdi={quizSuggestion.ogrenci.full_name || quizSuggestion.ogrenci.email}
                  count={quizSuggestion.count}
                  onCreate={() => setQuizModalOpen(true)}
                  onDismiss={() =>
                    setDismissedSuggestions(prev => { const next = new Set(prev); next.add(quizSuggestion.key); return next; })
                  }
                />
              )}
            </AnimatePresence>

            {/* Page content with smooth transition */}
            {user && (
              <AnimatePresence mode="wait">
                <m.div
                  key={activeView}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {contentMap[activeView]}
                </m.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* Quiz modal — rendered outside scroll container */}
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
