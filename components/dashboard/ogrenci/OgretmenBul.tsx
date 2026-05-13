"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import StarRating from "@/components/dashboard/shared/StarRating";
import HocayiDegerlendirModal from "@/components/dashboard/ogrenci/HocayiDegerlendirModal";
import VideoPlayer from "@/components/dashboard/shared/VideoPlayer";

type Hoca = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  sehir: string | null;
  ilce: string | null;
  ders_fiyati: number | null;
  hakkinda: string | null;
  video_url: string | null;
  portfolio_url: string | null;
  level: number;
  xp: number;
};

type RatingStat = { avg: number; count: number };

type Props = {
  currentUserId: string;
};

const HOCA_SELECT =
  "id, full_name, avatar_url, sehir, ilce, ders_fiyati, hakkinda, video_url, portfolio_url, level, xp";

function isSafeHttpUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFiyat(v: number | null): string {
  if (v == null) return "Fiyat belirtilmemiş";
  const formatted = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);
  return `${formatted} / saat`;
}

function initials(name: string | null): string {
  if (!name) return "H";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "H";
}

export default function OgretmenBul({ currentUserId }: Props) {
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [hocalar, setHocalar] = useState<Hoca[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [ratings, setRatings] = useState<Map<string, RatingStat>>(new Map());
  const [reviewedHocaIds, setReviewedHocaIds] = useState<Set<string>>(new Set());

  const [reviewTarget, setReviewTarget] = useState<Hoca | null>(null);
  const [videoTarget, setVideoTarget] = useState<Hoca | null>(null);

  const fetchRatings = useCallback(
    async (hocaIds: string[]) => {
      if (hocaIds.length === 0) {
        setRatings(new Map());
        setReviewedHocaIds(new Set());
        return;
      }
      const { data, error } = await supabase
        .from("reviews")
        .select("hoca_id, ogrenci_id, rating")
        .in("hoca_id", hocaIds);
      if (error) {
        // sessiz fail — kartlar yine de gösterilecek
        setRatings(new Map());
        setReviewedHocaIds(new Set());
        return;
      }

      const sums = new Map<string, { sum: number; count: number }>();
      const reviewed = new Set<string>();
      for (const r of (data ?? []) as Array<{ hoca_id: string; ogrenci_id: string; rating: number }>) {
        const cur = sums.get(r.hoca_id) ?? { sum: 0, count: 0 };
        cur.sum += r.rating;
        cur.count += 1;
        sums.set(r.hoca_id, cur);
        if (r.ogrenci_id === currentUserId) reviewed.add(r.hoca_id);
      }

      const next = new Map<string, RatingStat>();
      for (const [id, { sum, count }] of sums.entries()) {
        next.set(id, { avg: sum / count, count });
      }
      setRatings(next);
      setReviewedHocaIds(reviewed);
    },
    [currentUserId],
  );

  const fetchHocalar = useCallback(
    async (sehirQ: string, ilceQ: string) => {
      setLoading(true);
      try {
        let q = supabase.from("users").select(HOCA_SELECT).eq("role", "hoca");
        if (sehirQ.trim()) q = q.ilike("sehir", `%${sehirQ.trim()}%`);
        if (ilceQ.trim()) q = q.ilike("ilce", `%${ilceQ.trim()}%`);
        const { data, error } = await q
          .order("level", { ascending: false })
          .order("xp", { ascending: false })
          .limit(60);

        if (error) {
          toast.error("Hocalar yüklenemedi: " + error.message);
          setHocalar([]);
          setRatings(new Map());
          setReviewedHocaIds(new Set());
          return;
        }
        const list = (data as Hoca[]) ?? [];
        setHocalar(list);
        await fetchRatings(list.map((h) => h.id));
      } finally {
        setLoading(false);
        setSearched(true);
      }
    },
    [fetchRatings],
  );

  useEffect(() => {
    fetchHocalar("", "");
  }, [fetchHocalar]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHocalar(sehir, ilce);
  };

  const temizle = () => {
    setSehir("");
    setIlce("");
    fetchHocalar("", "");
  };

  const dersTalepEt = (h: Hoca) => {
    const ad = h.full_name || "Hocaya";
    toast(`${ad} ile bağlanmak için davet linki isteyin.`, { icon: "💌" });
  };

  const handleReviewSaved = useCallback(async () => {
    // Aggregations'ı tazele
    await fetchRatings(hocalar.map((h) => h.id));
  }, [fetchRatings, hocalar]);

  return (
    <div className="space-y-6">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800">Öğretmen Bul</h2>
          <p className="mt-1 text-sm text-slate-500">
            Bulunduğunuz veya gitmek istediğiniz bölgedeki hocaları keşfedin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Şehir</span>
            <input
              type="text"
              value={sehir}
              onChange={(e) => setSehir(e.target.value)}
              placeholder="örn. İstanbul"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase text-slate-500">İlçe</span>
            <input
              type="text"
              value={ilce}
              onChange={(e) => setIlce(e.target.value)}
              placeholder="örn. Kadıköy"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="h-[42px] flex-1 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
            >
              {loading ? "Aranıyor..." : "Ara"}
            </button>
            {(sehir || ilce) && (
              <button
                type="button"
                onClick={temizle}
                className="h-[42px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                title="Filtreleri temizle"
              >
                ✖
              </button>
            )}
          </div>
        </div>
      </motion.form>

      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="h-12 w-12 rounded-full bg-slate-100" />
                  <div className="mt-4 h-4 w-32 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                  <div className="mt-4 h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </motion.div>
          ) : hocalar.length === 0 && searched ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-10 text-center"
            >
              <p className="text-3xl">🔍</p>
              <p className="mt-3 font-medium text-slate-700">Sonuç bulunamadı</p>
              <p className="mt-1 text-sm text-slate-500">
                Farklı bir şehir veya ilçe deneyin. Aramayı boş bırakıp tüm hocaları görebilirsiniz.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {hocalar.map((h, i) => {
                const stat = ratings.get(h.id);
                const hasReviewed = reviewedHocaIds.has(h.id);
                return (
                  <motion.article
                    key={h.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      delay: Math.min(i * 0.05, 0.4),
                      ease: "easeOut",
                    }}
                    whileHover={{ y: -3 }}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <header className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 text-base font-bold text-emerald-700">
                        {h.avatar_url ? (
                          <img src={h.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{initials(h.full_name)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-slate-800">
                          {h.full_name || "İsimsiz Hoca"}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          {h.sehir || h.ilce ? (
                            <span className="inline-flex items-center gap-1">
                              <span aria-hidden>📍</span>
                              <span className="truncate">
                                {[h.sehir, h.ilce].filter(Boolean).join(" / ")}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Konum belirtilmemiş</span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                            ⭐ Lv {h.level}
                          </span>
                        </div>
                      </div>
                    </header>

                    {/* Ortalama puan satırı */}
                    <div className="mt-3 flex items-center gap-2">
                      {stat ? (
                        <>
                          <StarRating value={stat.avg} size="sm" />
                          <span className="text-sm font-semibold text-slate-700">
                            {stat.avg.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({stat.count} değerlendirme)
                          </span>
                        </>
                      ) : (
                        <>
                          <StarRating value={0} size="sm" />
                          <span className="text-xs text-slate-400">Henüz değerlendirme yok</span>
                        </>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-slate-600">
                      {h.hakkinda?.trim() || (
                        <span className="text-slate-400">Hoca henüz hakkında metni eklememiş.</span>
                      )}
                    </p>

                    <footer className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                          {formatFiyat(h.ders_fiyati)}
                        </span>
                        <button
                          type="button"
                          onClick={() => dersTalepEt(h)}
                          className="rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-emerald-600"
                        >
                          Ders Talep Et
                        </button>
                      </div>

                      {(isSafeHttpUrl(h.video_url) || isSafeHttpUrl(h.portfolio_url)) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {isSafeHttpUrl(h.video_url) && (
                            <motion.button
                              type="button"
                              onClick={() => setVideoTarget(h)}
                              whileHover={{
                                scale: 1.04,
                                boxShadow: "0 0 0 4px rgba(56, 189, 248, 0.18)",
                              }}
                              whileTap={{ scale: 0.97 }}
                              transition={{ type: "spring", stiffness: 320, damping: 22 }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100"
                            >
                              <span aria-hidden>▶</span>
                              Tanıtım Videosunu İzle
                            </motion.button>
                          )}
                          {isSafeHttpUrl(h.portfolio_url) && (
                            <motion.a
                              href={h.portfolio_url ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{
                                scale: 1.04,
                                boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.18)",
                              }}
                              whileTap={{ scale: 0.97 }}
                              transition={{ type: "spring", stiffness: 320, damping: 22 }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                            >
                              <span aria-hidden>📂</span>
                              Portfolyoyu Görüntüle
                              <span aria-hidden className="text-[10px] opacity-70">↗</span>
                            </motion.a>
                          )}
                        </div>
                      )}

                      {hasReviewed ? (
                        <div className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                          <span aria-hidden>✓</span>
                          Bu hocayı değerlendirdiniz
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReviewTarget(h)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                        >
                          <span aria-hidden>★</span>
                          Hocayı Değerlendir
                        </button>
                      )}
                    </footer>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <HocayiDegerlendirModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        hocaId={reviewTarget?.id ?? ""}
        hocaAdi={reviewTarget?.full_name || "Hoca"}
        ogrenciId={currentUserId}
        onSaved={handleReviewSaved}
      />

      <VideoPlayer
        open={!!videoTarget}
        onClose={() => setVideoTarget(null)}
        url={videoTarget?.video_url ?? null}
        title={videoTarget?.full_name ? `${videoTarget.full_name} — Tanıtım` : undefined}
      />
    </div>
  );
}
