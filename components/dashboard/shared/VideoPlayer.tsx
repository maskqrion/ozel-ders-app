"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, m } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string | null | undefined;
  title?: string;
};

type EmbedInfo =
  | { kind: "youtube"; src: string }
  | { kind: "vimeo"; src: string }
  | { kind: "unknown"; src: null };

function parseEmbed(rawUrl: string | null | undefined): EmbedInfo {
  if (!rawUrl) return { kind: "unknown", src: null };
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { kind: "unknown", src: null };
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
  // youtube.com/embed/ID
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    let id: string | null = null;
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      id = url.pathname.split("/")[2] ?? null;
    } else if (url.pathname.startsWith("/shorts/")) {
      id = url.pathname.split("/")[2] ?? null;
    }
    if (id && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
      return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
    }
  }
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    if (id && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
      return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
    }
  }

  // Vimeo: vimeo.com/ID, player.vimeo.com/video/ID
  if (host === "vimeo.com") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    if (id && /^[0-9]+$/.test(id)) {
      return { kind: "vimeo", src: `https://player.vimeo.com/video/${id}` };
    }
  }
  if (host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("video");
    const id = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
    if (id && /^[0-9]+$/.test(id)) {
      return { kind: "vimeo", src: `https://player.vimeo.com/video/${id}` };
    }
  }

  return { kind: "unknown", src: null };
}

export default function VideoPlayer({ open, onClose, url, title }: Props) {
  const embed = useMemo(() => parseEmbed(url), [url]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Body scroll kilidi (modal açıkken arka plan kaymasın)
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200/70 p-4 backdrop-blur-sm"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-player-title"
            className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-2xl ring-1 ring-sky-200/40"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-5 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-sky-600">
                  Tanıtım Videosu
                </p>
                <h2
                  id="video-player-title"
                  className="mt-0.5 truncate text-sm font-semibold text-slate-800"
                >
                  {title || "Hoca Tanıtım Videosu"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="shrink-0 rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700"
              >
                ✕
              </button>
            </header>

            <div className="bg-slate-50">
              {embed.src ? (
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  <iframe
                    key={embed.src}
                    src={embed.src}
                    title={title || "Tanıtım Videosu"}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
                  <span aria-hidden className="text-3xl">🎬</span>
                  <p className="font-medium text-slate-700">Video oynatılamıyor</p>
                  <p className="max-w-sm text-sm text-slate-500">
                    Yalnızca YouTube ve Vimeo bağlantıları desteklenmektedir. Lütfen geçerli bir bağlantı
                    girildiğinden emin olun.
                  </p>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      Bağlantıyı yeni sekmede aç ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
