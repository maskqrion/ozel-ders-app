"use client";

// Jitsi Meet entegrasyonu — API anahtarı gerektirmez, meet.jit.si üzerinden çalışır.
// Ders saatinden 15 dk önce açılır, 1 saat sonrasına kadar erişilebilir.

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";

interface Props {
  lessonId:     string;
  meetingRoomId: string;
  lessonDate:   string;
  userName:     string;
  isHost:       boolean;
  onClose?:     () => void;
}

type JitsiApi = {
  executeCommand: (command: string) => void;
  dispose: () => void;
  addListener: (event: string, handler: () => void) => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement;
        userInfo: { displayName: string };
        configOverwrite: Record<string, unknown>;
        interfaceConfigOverwrite: Record<string, unknown>;
        lang: string;
      }
    ) => JitsiApi;
  }
}

function getMeetingWindow(lessonDate: string): {
  canJoin: boolean;
  minutesUntilStart: number;
  isOver: boolean;
} {
  const now       = Date.now();
  const start     = new Date(lessonDate).getTime();
  const openAt    = start - 15 * 60 * 1000;   // 15 dk önce
  const closeAt   = start + 90 * 60 * 1000;   // 90 dk sonra
  const canJoin   = now >= openAt && now <= closeAt;
  const isOver    = now > closeAt;
  const minutesUntilStart = Math.max(0, Math.ceil((openAt - now) / 60000));
  return { canJoin, minutesUntilStart, isOver };
}

export default function VideoGorüsme({
  lessonId,
  meetingRoomId,
  lessonDate,
  userName,
  isHost,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef       = useRef<JitsiApi | null>(null);
  const [status,    setStatus]    = useState<"idle" | "loading" | "active" | "left">("idle");
  const [, forceUpdate]           = useState(0);

  // Oda adı lesson ID tabanlı, tahmin edilemez format
  const roomName = `odp-${meetingRoomId}-${lessonId.slice(0, 8)}`;

  const { canJoin, minutesUntilStart, isOver } = getMeetingWindow(lessonDate);

  // Her dakika durum güncelle
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadJitsi = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) { resolve(); return; }
      const script = document.createElement("script");
      script.src   = "https://meet.jit.si/external_api.js";
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error("Jitsi yüklenemedi"));
      document.head.appendChild(script);
    });
  }, []);

  const joinMeeting = useCallback(async () => {
    if (!containerRef.current || !canJoin) return;
    setStatus("loading");

    try {
      await loadJitsi();

      if (!window.JitsiMeetExternalAPI) {
        throw new Error("JitsiMeetExternalAPI bulunamadı");
      }

      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: containerRef.current,
        userInfo: { displayName: userName },
        lang: "tr",
        configOverwrite: {
          prejoinPageEnabled:       false,
          disableDeepLinking:       true,
          startWithAudioMuted:      false,
          startWithVideoMuted:      false,
          enableWelcomePage:        false,
          toolbarButtons: [
            "microphone", "camera", "closedcaptions", "desktop",
            "fullscreen", "fodeviceselection", "hangup", "chat",
            "settings", "raisehand", "videoquality", "tileview",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK:    false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK:    false,
          BRAND_WATERMARK_LINK:    "",
          MOBILE_APP_PROMO:        false,
          APP_NAME:                "Özel Ders Pro",
          NATIVE_APP_NAME:         "Özel Ders Pro",
          LANG_DETECTION:          true,
          DEFAULT_REMOTE_DISPLAY_NAME: "Katılımcı",
          DISABLE_FOCUSED_INDICATOR: true,
        },
      });

      apiRef.current.addListener("readyToClose", () => {
        setStatus("left");
        apiRef.current?.dispose();
        apiRef.current = null;
      });

      setStatus("active");
    } catch {
      setStatus("idle");
    }
  }, [canJoin, loadJitsi, roomName, userName]);

  const leaveMeeting = useCallback(() => {
    apiRef.current?.executeCommand("hangup");
    apiRef.current?.dispose();
    apiRef.current = null;
    setStatus("left");
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, []);

  const startLabel = new Date(lessonDate).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-base">
          🎥
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Video Görüşme</p>
          <p className="text-xs text-slate-500 truncate">
            {isHost ? "Hoca" : "Öğrenci"} • {startLabel}
          </p>
        </div>
        {status === "active" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Canlı
          </span>
        )}
      </div>

      {/* Jitsi container */}
      <AnimatePresence>
        {status === "active" && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 480, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div ref={containerRef} className="h-[480px] w-full" />
          </m.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="px-4 py-3">
        {isOver ? (
          <p className="text-sm text-slate-400 text-center py-1">Ders süresi doldu.</p>
        ) : !canJoin ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {minutesUntilStart > 0
                ? `Görüşme ${minutesUntilStart} dakika sonra açılacak`
                : "Görüşme yakında başlayacak"}
            </p>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Bekleniyor
            </span>
          </div>
        ) : status === "idle" || status === "left" ? (
          <button
            onClick={joinMeeting}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
          >
            {status === "left" ? "Tekrar Katıl" : "Derse Gir"}
          </button>
        ) : status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-1 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/40 border-t-blue-600" />
            Bağlanıyor...
          </div>
        ) : (
          <button
            onClick={leaveMeeting}
            className="w-full rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Dersten Çık
          </button>
        )}
      </div>
    </div>
  );
}
