"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import StarRating from "@/components/dashboard/shared/StarRating";

type Props = {
  open: boolean;
  onClose: () => void;
  hocaId: string;
  hocaAdi: string;
  ogrenciId: string;
  onSaved: () => void | Promise<void>;
};

function Spinner() {
  return (
    <motion.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

const RATING_LABEL: Record<number, string> = {
  1: "Bekleneni karşılamadı",
  2: "İyileştirilmesi gereken yönler var",
  3: "Yeterli",
  4: "Çok iyi",
  5: "Mükemmel",
};

export default function HocayiDegerlendirModal({
  open,
  onClose,
  hocaId,
  hocaAdi,
  ogrenciId,
  onSaved,
}: Props) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Modal her açıldığında temizle
  useEffect(() => {
    if (open) {
      setRating(5);
      setComment("");
      setSaving(false);
    }
  }, [open]);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  const handleSave = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Lütfen 1-5 arası bir puan seçin.");
      return;
    }
    setSaving(true);
    try {
      const trimmed = comment.trim();
      const { error } = await supabase.from("reviews").insert([
        {
          hoca_id: hocaId,
          ogrenci_id: ogrenciId,
          rating,
          comment: trimmed || null,
        },
      ]);
      if (error) throw error;
      toast.success("Değerlendirmeniz kaydedildi.");
      await onSaved();
      onClose();
    } catch (err: any) {
      // 23505 = unique_violation → aynı hocaya tekrar yorum
      if (err?.code === "23505") {
        toast.error("Bu hocayı zaten değerlendirmişsiniz.");
      } else {
        toast.error("Değerlendirme kaydedilemedi: " + (err?.message ?? ""));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-emerald-50 px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                  Hocayı Değerlendir
                </p>
                <h2 id="review-modal-title" className="mt-0.5 text-base font-semibold text-slate-800">
                  {hocaAdi}
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                aria-label="Kapat"
                className="rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 disabled:opacity-50"
              >
                ✕
              </button>
            </header>

            <div className="px-6 py-5">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-slate-700">
                  Hocanızı nasıl değerlendirirsiniz?
                </p>
                <StarRating value={rating} onChange={setRating} size="lg" />
                <motion.p
                  key={rating}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm font-medium text-amber-700"
                >
                  {RATING_LABEL[rating]}
                </motion.p>
              </div>

              <div className="mt-5">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Yorum (opsiyonel)
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tecrübenizi diğer öğrencilerle paylaşın..."
                  className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                />
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
              >
                İptal
              </button>
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-sky-600 disabled:opacity-70"
              >
                {saving && <Spinner />}
                {saving ? "Kaydediliyor..." : "Değerlendirmeyi Gönder"}
              </motion.button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
