"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import StarRating from "@/components/dashboard/shared/StarRating";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  ogrenci: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
};

type Props = {
  hocaId: string;
};

function initials(name: string | null | undefined, email: string): string {
  const src = (name || email).trim();
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function relativeDate(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const day = 86_400_000;
  if (diff < day) return "bugün";
  if (diff < 2 * day) return "dün";
  if (diff < 7 * day) return `${Math.floor(diff / day)} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function OgrenciDegerlendirmeleri({ hocaId }: Props) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchReviews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, rating, comment, created_at, ogrenci:users!reviews_ogrenci_id_fkey(id, full_name, email, avatar_url)",
        )
        .eq("hoca_id", hocaId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!error && data) {
        setReviews(data as unknown as ReviewRow[]);
      }
      setLoading(false);
    };
    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [hocaId]);

  const avg =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.2 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Öğrenci Değerlendirmeleri</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Öğrencilerinizin sizinle ilgili paylaştığı geri bildirimler.
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={avg} size="md" />
            <span className="text-sm font-bold text-slate-700">{avg.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({reviews.length})</span>
          </div>
        )}
      </header>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-4">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-slate-100" />
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-emerald-50 text-2xl">
            ⭐
          </div>
          <p className="text-sm font-medium text-slate-700">Henüz bir değerlendirme almadınız</p>
          <p className="text-xs text-slate-500">
            Öğrencileriniz "Öğretmen Bul" üzerinden sizi değerlendirdikçe yorumları burada görebileceksiniz.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {reviews.map((r, idx) => {
              const ad = r.ogrenci?.full_name || r.ogrenci?.email || "Öğrenci";
              const email = r.ogrenci?.email ?? "";
              return (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-xs font-bold text-emerald-700 ring-1 ring-slate-100">
                    {r.ogrenci?.avatar_url ? (
                      <img src={r.ogrenci.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{initials(r.ogrenci?.full_name, email)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-slate-800">{ad}</span>
                      <span className="text-[11px] text-slate-400">· {relativeDate(r.created_at)}</span>
                    </div>
                    <div className="mt-1">
                      <StarRating value={r.rating} size="sm" />
                    </div>
                    {r.comment && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </motion.section>
  );
}
