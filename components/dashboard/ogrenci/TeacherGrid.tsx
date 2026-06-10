import { m, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Hoca, RatingStat } from "./teacher.types";
import { TeacherCard } from "./TeacherCard";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/[0.08] shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-4 w-28 rounded-full bg-white/[0.08]" />
          <div className="h-3 w-20 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-white/[0.06]" />
        <div className="h-3 w-4/5 rounded-full bg-white/[0.05]" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="h-10 rounded-2xl bg-white/[0.06]" />
      <div className="h-9 rounded-2xl bg-white/[0.04]" />
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.04] grid place-items-center mb-5">
        <Search size={24} strokeWidth={1.5} className="text-white/25" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-white/60">
        Bu filtrelerle eşleşen eğitmen bulunamadı.
      </h3>
      <p className="mt-2 text-sm text-white/30 max-w-sm">
        Filtreleri gevşetmeyi dene ya da tümünü temizle. Her gün yeni eğitmenler katılıyor.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-sm font-semibold transition-all hover:bg-emerald-500/20 hover:border-emerald-400/50"
      >
        <X size={14} strokeWidth={2.5} />
        Filtreleri temizle
      </button>
    </m.div>
  );
}

interface TeacherGridProps {
  teachers: Hoca[];
  ratings: Map<string, RatingStat>;
  faves: Set<string>;
  reviewedIds: Set<string>;
  loading: boolean;
  searched: boolean;
  onClear: () => void;
  onFav: (id: string) => void;
  onReview: (h: Hoca) => void;
  onBookLesson: (h: Hoca) => void;
  onOpenVideo: (h: Hoca) => void;
}

export function TeacherGrid({
  teachers,
  ratings,
  faves,
  reviewedIds,
  loading,
  searched,
  onClear,
  onFav,
  onReview,
  onBookLesson,
  onOpenVideo,
}: TeacherGridProps) {
  return (
    <div className="px-6 pb-8 pt-1">
      <AnimatePresence mode="wait">
        {loading ? (
          <m.div
            key="skel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </m.div>
        ) : teachers.length === 0 && searched ? (
          <m.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1"
          >
            <EmptyState onClear={onClear} />
          </m.div>
        ) : (
          <m.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {teachers.map((h, i) => (
              <TeacherCard
                key={h.id}
                h={h}
                index={i}
                stat={ratings.get(h.id)}
                hasReviewed={reviewedIds.has(h.id)}
                faved={faves.has(h.id)}
                onFav={onFav}
                onReview={onReview}
                onDersTalep={onBookLesson}
                onVideoOpen={onOpenVideo}
              />
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
