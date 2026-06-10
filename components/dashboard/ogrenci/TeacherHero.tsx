import { m } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ImagesBadge } from "@/components/ui/images-badge";

interface TeacherHeroProps {
  teacherCount: number;
  teacherAvatars: string[];
}

export function TeacherHero({ teacherCount, teacherAvatars }: TeacherHeroProps) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-72 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute left-1/2 top-4 -translate-x-1/2 w-[600px] h-52 rounded-full opacity-[0.18] blur-[90px]"
          style={{ background: "radial-gradient(ellipse, #10b981 0%, transparent 70%)" }}
        />
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative text-center max-w-2xl mx-auto z-10"
      >
        <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
            <Sparkles size={12} strokeWidth={2.5} />
            Eğitmen Keşfet
          </div>
          {teacherCount > 0 && (
            <ImagesBadge
              text={`${teacherCount}+ aktif eğitmen`}
              images={teacherAvatars}
            />
          )}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.1]">
          Sana en uygun{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
            }}
          >
            eğitmeni
          </span>{" "}
          bul.
        </h2>
        <p className="mt-3 text-sm text-white/35 max-w-md mx-auto">
          Doğrulanmış eğitmenler arasından uzmanlık alanı veya isme göre saniyeler içinde keşfet.
        </p>
      </m.div>
    </>
  );
}
