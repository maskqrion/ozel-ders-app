"use client";

import { cn } from "@/lib/utils";

interface ImagesBadgeProps {
  text: string;
  images: string[];
  className?: string;
}

export function ImagesBadge({ text, images, className }: ImagesBadgeProps) {
  const shown = images.slice(0, 4);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm",
        className,
      )}
    >
      {/* Stacked avatar ring */}
      <div className="flex items-center">
        {shown.map((src, i) => (
          <div
            key={i}
            className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30"
            style={{ marginLeft: i > 0 ? "-8px" : 0, zIndex: shown.length - i }}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ))}
        {images.length > 4 && (
          <div
            className="relative z-0 -ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-white ring-2 ring-white/30"
          >
            +{images.length - 4}
          </div>
        )}
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-white/80">{text}</span>
    </div>
  );
}
