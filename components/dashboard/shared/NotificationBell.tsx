"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { Notification, NotificationType } from "@/lib/types";

type Props = {
  userId: string;
};

const TYPE_ICON: Record<string, string> = {
  assignment: "📝",
  quiz: "🧠",
  message: "💬",
  system: "🔔",
};

function iconFor(type: NotificationType): string {
  return TYPE_ICON[type as string] ?? "🔔";
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "şimdi";
  if (diff < hour) return `${Math.floor(diff / min)} dk önce`;
  if (diff < day) return `${Math.floor(diff / hour)} sa önce`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0);

  // 1) İlk yükleme: son 30 bildirim
  useEffect(() => {
    let cancelled = false;
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, title, message, type, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled && !error && data) {
        setNotifications(data as Notification[]);
      }
    };
    fetchInitial();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 2) Realtime: yeni bildirim → state'e ekle + toast
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) =>
            prev.some((x) => x.id === n.id) ? prev : [n, ...prev].slice(0, 60),
          );
          toast(`🔔 ${n.title}: ${n.message}`, {
            duration: 4000,
            style: {
              background: "#f0f9ff",
              color: "#0c4a6e",
              border: "1px solid #bae6fd",
              fontWeight: 500,
            },
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 3) Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0 || marking) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setMarking(true);
    // Optimistik
    setNotifications((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true })));
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
      if (error) throw error;
    } catch (err: any) {
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, is_read: false } : n)),
      );
      toast.error("Bildirimler güncellenemedi: " + (err?.message ?? ""));
    } finally {
      setMarking(false);
    }
  }, [notifications, unreadCount, marking]);

  const markOneAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    } catch {
      // Sessiz fail — bir sonraki açılışta DB doğru yansıtır
    }
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ""}`}
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-lg text-slate-600 ring-1 ring-slate-100 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center">
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
            />
            <span className="relative inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="dialog"
            aria-label="Bildirimler"
            className="absolute right-0 top-full z-50 mt-2 flex max-h-[480px] w-[min(22rem,calc(100vw-32px))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Bildirimler</p>
                <p className="text-[11px] text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} okunmamış` : "Tümü okundu"}
                </p>
              </div>
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || marking}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                Tümünü Okundu İşaretle
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-xl">
                    🔔
                  </div>
                  <p className="text-sm font-medium text-slate-700">Henüz bildirim yok</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Yeni bildirimler buraya canlı olarak düşer.
                  </p>
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => (
                      <motion.li
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          type="button"
                          onClick={() => !n.is_read && markOneAsRead(n.id)}
                          className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition ${
                            n.is_read
                              ? "bg-white hover:bg-slate-50"
                              : "bg-sky-50 hover:bg-sky-100/70"
                          }`}
                        >
                          <span
                            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base ring-1 ring-slate-100"
                            aria-hidden
                          >
                            {iconFor(n.type)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`truncate text-sm ${
                                  n.is_read ? "font-medium text-slate-700" : "font-semibold text-slate-900"
                                }`}
                              >
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <span
                                  aria-hidden
                                  className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                                />
                              )}
                            </div>
                            <p
                              className={`mt-0.5 line-clamp-2 text-xs ${
                                n.is_read ? "text-slate-500" : "text-slate-700"
                              }`}
                            >
                              {n.message}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {relativeTime(n.created_at)}
                            </p>
                          </div>
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
