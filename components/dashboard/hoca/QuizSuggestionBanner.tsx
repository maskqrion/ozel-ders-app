"use client";

import { motion } from "framer-motion";
import { ImagesBadge } from "@/components/ui/images-badge";

type Props = {
  ogrenciAdi: string;
  count: number;
  onCreate: () => void;
  onDismiss: () => void;
};

export default function QuizSuggestionBanner({ ogrenciAdi, count, onCreate, onDismiss }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-5 shadow-sm"
    >
      <motion.span
        aria-hidden
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/40 blur-2xl"
      />
      <motion.span
        aria-hidden
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.18 }}
        className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-sky-200/40 blur-2xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              🎉 Yeni Kilometre Taşı
            </p>
            <ImagesBadge
              text={`${count} Ödev`}
              images={[]}
              className="border-emerald-400/40 bg-emerald-500/80"
            />
          </div>
          <p className="mt-1 text-base font-semibold text-slate-800">
            {ogrenciAdi} {count} ödevi tamamladı!
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            Öğrendiklerini pekiştirmesi için hızlıca bir Quiz hazırlamak ister misiniz?
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onDismiss}
            className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
          >
            Şimdi Değil
          </button>
          <motion.button
            onClick={onCreate}
            whileTap={{ scale: 0.97 }}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-sky-600"
          >
            Quiz Hazırla →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
