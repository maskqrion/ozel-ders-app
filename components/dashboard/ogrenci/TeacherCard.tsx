import { m } from "framer-motion";
import { Hoca, RatingStat } from "./teacher.types";
import { avatarColors, initials, isSafeHttpUrl } from "./teacher.helpers";
import { BadgeCheck, MapPin, Heart, Sparkles, ArrowRight, Eye, Play, ExternalLink, Check, Star } from "lucide-react";

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-white/[0.08] text-white/[0.08]"
          }
        />
      ))}
    </div>
  );
}

interface TeacherCardProps {
  h: Hoca;
  index: number;
  stat: RatingStat | undefined;
  hasReviewed: boolean;
  faved: boolean;
  onFav: (id: string) => void;
  onReview: (h: Hoca) => void;
  onDersTalep: (h: Hoca) => void;
  onVideoOpen: (h: Hoca) => void;
}

export function TeacherCard({
  h,
  index,
  stat,
  hasReviewed,
  faved,
  onFav,
  onReview,
  onDersTalep,
  onVideoOpen,
}: TeacherCardProps) {
  const colors = avatarColors(h.id);
  const isSuperHoca = stat && stat.avg >= 4.8 && stat.count >= 5;

  return (
    <m.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.06, 0.45),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { type: "spring", stiffness: 320, damping: 22 },
      }}
      className="relative flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl overflow-hidden group"
      style={{
        boxShadow:
          "0 4px 40px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Hover glow border */}
      <div className="absolute inset-0 rounded-3xl border border-emerald-400/0 group-hover:border-emerald-400/20 transition-colors duration-500 pointer-events-none z-10" />

      {/* Super eğitmen top accent */}
      {isSuperHoca && (
        <div
          className="h-[2px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.from} 40%, transparent)`,
          }}
        />
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="h-16 w-16 rounded-2xl grid place-items-center text-[15px] font-black text-white overflow-hidden ring-2 ring-white/10"
              style={
                h.avatar_url
                  ? undefined
                  : {
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                    }
              }
            >
              {h.avatar_url ? (
                <img src={h.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(h.full_name)
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a1628] bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[16px] font-bold tracking-tight text-white truncate">
                    {h.full_name || "İsimsiz Hoca"}
                  </h3>
                  <BadgeCheck size={14} strokeWidth={2.4} className="text-sky-400 shrink-0" />
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-white/35">
                  <MapPin size={11} strokeWidth={2} />
                  {h.sehir || h.ilce
                    ? [h.sehir, h.ilce].filter(Boolean).join(" / ")
                    : "Konum belirtilmemiş"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onFav(h.id)}
                aria-label={faved ? "Favoriden çıkar" : "Favorile"}
                className={`shrink-0 h-8 w-8 grid place-items-center rounded-xl border transition-all duration-200 ${
                  faved
                    ? "bg-rose-500/15 border-rose-400/30 text-rose-400"
                    : "border-white/10 bg-white/[0.04] text-white/25 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/[0.08]"
                }`}
              >
                <Heart size={14} strokeWidth={2.2} className={faved ? "fill-rose-400" : ""} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Stars value={stat?.avg ?? 0} />
              {stat ? (
                <>
                  <span className="text-sm font-bold text-amber-400">
                    {stat.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-white/30">({stat.count})</span>
                </>
              ) : (
                <span className="text-xs text-white/20">Henüz değerlendirme yok</span>
              )}
            </div>
          </div>
        </div>

        {/* Super badge */}
        {isSuperHoca && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <Sparkles size={10} strokeWidth={2.5} />
              Süper Eğitmen
            </span>
          </div>
        )}

        {/* Bio */}
        <p className="mt-3.5 text-sm text-white/40 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {h.hakkinda?.trim() || (
            <span className="italic text-white/20">
              Hoca henüz hakkında metni eklememiş.
            </span>
          )}
        </p>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {[
            { label: "Seviye", value: `Lv ${h.level}` },
            { label: "Puan", value: stat ? stat.avg.toFixed(1) : "—" },
            { label: "XP", value: h.xp.toLocaleString("tr-TR") },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2.5 text-center"
            >
              <div className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">
                {label}
              </div>
              <div className="mt-0.5 text-sm font-black text-white/75 font-mono">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Price + Ders talep */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">
              Saatlik ücret
            </div>
            <div className="text-lg font-black text-white tracking-tight leading-tight">
              {h.ders_fiyati != null ? (
                <>
                  ₺{h.ders_fiyati.toLocaleString("tr-TR")}
                  <span className="text-xs font-normal text-white/25 ml-1">/ saat</span>
                </>
              ) : (
                <span className="text-sm font-medium text-white/20">Belirtilmemiş</span>
              )}
            </div>
          </div>
          <m.button
            type="button"
            onClick={() => onDersTalep(h)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="text-white text-sm font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shrink-0"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              boxShadow: "0 6px 24px -8px rgba(16,185,129,0.5)",
            }}
          >
            Ders Talep Et
            <ArrowRight size={13} strokeWidth={2.5} />
          </m.button>
        </div>

        {/* Profili İncele */}
        <a
          href={`/hoca/${h.id}`}
          className="mt-3 flex items-center justify-center gap-2 w-full rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-emerald-400/30 hover:bg-emerald-500/[0.06] py-2.5 text-sm font-semibold text-white/40 hover:text-emerald-300 transition-all duration-200"
        >
          <Eye size={14} strokeWidth={2} />
          Profili İncele
        </a>

        {/* Video + Portfolio */}
        {(isSafeHttpUrl(h.video_url) || isSafeHttpUrl(h.portfolio_url)) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isSafeHttpUrl(h.video_url) && (
              <button
                type="button"
                onClick={() => onVideoOpen(h)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5 text-xs font-semibold text-sky-400 hover:border-sky-400/35 hover:bg-sky-400/[0.12] transition-all"
              >
                <Play size={11} strokeWidth={2.5} />
                Tanıtım Videosu
              </button>
            )}
            {isSafeHttpUrl(h.portfolio_url) && (
              <a
                href={h.portfolio_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:border-emerald-400/35 hover:bg-emerald-400/[0.12] transition-all"
              >
                <ExternalLink size={11} strokeWidth={2.5} />
                Portfolyo
              </a>
            )}
          </div>
        )}

        {/* Review */}
        <div className="mt-3">
          {hasReviewed ? (
            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/25 w-full">
              <Check size={11} strokeWidth={3} className="text-emerald-500" />
              Bu hocayı değerlendirdiniz
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onReview(h)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1.5 text-xs font-semibold text-amber-400 hover:border-amber-400/35 hover:bg-amber-400/[0.12] transition-all"
            >
              <Star size={11} strokeWidth={1.5} className="fill-amber-400 text-amber-400" />
              Hocayı Değerlendir
            </button>
          )}
        </div>
      </div>
    </m.article>
  );
}
