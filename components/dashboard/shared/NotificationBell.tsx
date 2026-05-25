"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import type { Notification, NotificationType } from "@/lib/types";

type Props = {
  userId: string;
};

// ─── type → left-border accent color + icon ──────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { border: string; iconBg: string; iconColor: string; svg: ReactElement }
> = {
  assignment: {
    border: "border-l-amber-400",
    iconBg: "rgba(251,191,36,0.12)",
    iconColor: "#fbbf24",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  quiz: {
    border: "border-l-violet-400",
    iconBg: "rgba(167,139,250,0.12)",
    iconColor: "#a78bfa",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  message: {
    border: "border-l-emerald-400",
    iconBg: "rgba(52,211,153,0.12)",
    iconColor: "#34d399",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  system: {
    border: "border-l-sky-400",
    iconBg: "rgba(56,189,248,0.12)",
    iconColor: "#38bdf8",
    svg: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

const FALLBACK_CONFIG = TYPE_CONFIG.system;

function getTypeConfig(type: NotificationType) {
  return TYPE_CONFIG[type as string] ?? FALLBACK_CONFIG;
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

// ─── SVG Bell ────────────────────────────────────────────────────────────────
function BellIcon({ ringing }: { ringing: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      animate={ringing ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] } : { rotate: 0 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </motion.svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [ringing, setRinging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0);

  // 1) İlk yükleme
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

  // 2) Realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}-${crypto.randomUUID()}`)
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
          setRinging(true);
          setTimeout(() => setRinging(false), 700);
          const cfg = getTypeConfig(n.type);
          toast(`${n.title}: ${n.message}`, {
            duration: 4000,
            icon: "🔔",
            style: {
              background: "rgba(13,31,56,0.95)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              fontWeight: 500,
              borderLeft: `3px solid ${cfg.iconColor}`,
            },
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 3) Outside click / ESC
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
    setNotifications((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true })));
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
      if (error) throw error;
    } catch (err: unknown) {
      setNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, is_read: false } : n)),
      );
      const msg = err instanceof Error ? err.message : "";
      toast.error("Bildirimler güncellenemedi" + (msg ? `: ${msg}` : ""));
    } finally {
      setMarking(false);
    }
  }, [notifications, unreadCount, marking]);

  const markOneAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    } catch {
      // silent — DB syncs on next open
    }
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* ── Bell button ── */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ""}`}
        aria-expanded={open}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-colors"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: open ? "0 0 0 2px rgba(52,211,153,0.28), 0 0 12px rgba(52,211,153,0.08)" : "none",
        }}
      >
        <BellIcon ringing={ringing} />

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center"
            >
              {/* Pulse ring */}
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: "rgba(239,68,68,0.5)" }}
              />
              {/* Solid badge */}
              <span
                className="relative inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 0 8px rgba(239,68,68,0.5)",
                  border: "1.5px solid rgba(3,7,17,0.9)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, scaleY: 0.88, y: -8 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.88, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{ originY: 0 }}
            role="dialog"
            aria-label="Bildirimler"
            className="absolute right-0 top-full z-50 mt-2 flex max-h-[480px] w-[min(22rem,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl"
            css-vars=""
          >
            {/* glass panel */}
            <div
              className="flex flex-1 flex-col overflow-hidden rounded-2xl"
              style={{
                background: "rgba(10,22,40,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                boxShadow:
                  "0 24px 64px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(52,211,153,0.06) inset",
              }}
            >
              {/* Header */}
              <header
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">Bildirimler</p>
                  <p className="text-[11px] text-slate-500">
                    {unreadCount > 0 ? `${unreadCount} okunmamış` : "Tümü okundu"}
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0 || marking}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed"
                  style={{
                    color: unreadCount === 0 ? "rgba(148,163,184,0.35)" : "#34d399",
                    background:
                      unreadCount === 0 ? "transparent" : "rgba(52,211,153,0.08)",
                    border:
                      unreadCount === 0
                        ? "1px solid transparent"
                        : "1px solid rgba(52,211,153,0.15)",
                  }}
                >
                  Tümünü Okundu İşaretle
                </motion.button>
              </header>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                    <div
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.12)" }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth={1.6}
                        className="h-6 w-6"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-300">Henüz bildirim yok</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Yeni bildirimler buraya canlı olarak düşer.
                    </p>
                  </div>
                ) : (
                  <ul>
                    <AnimatePresence initial={false}>
                      {notifications.map((n, i) => {
                        const cfg = getTypeConfig(n.type);
                        return (
                          <motion.li
                            key={n.id}
                            layout
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.22, delay: i < 5 ? i * 0.04 : 0 }}
                          >
                            <button
                              type="button"
                              onClick={() => !n.is_read && markOneAsRead(n.id)}
                              className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors ${cfg.border}`}
                              style={{
                                borderBottom: "1px solid rgba(255,255,255,0.04)",
                                background: n.is_read
                                  ? "transparent"
                                  : "rgba(255,255,255,0.04)",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                  "rgba(255,255,255,0.06)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = n.is_read
                                  ? "transparent"
                                  : "rgba(255,255,255,0.04)";
                              }}
                            >
                              {/* Icon circle */}
                              <span
                                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                aria-hidden
                                style={{
                                  background: cfg.iconBg,
                                  color: cfg.iconColor,
                                  border: `1px solid ${cfg.iconColor}22`,
                                }}
                              >
                                {cfg.svg}
                              </span>

                              {/* Text */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`truncate text-sm ${
                                      n.is_read
                                        ? "font-medium text-slate-400"
                                        : "font-semibold text-slate-100"
                                    }`}
                                  >
                                    {n.title}
                                  </p>
                                  {!n.is_read && (
                                    <span
                                      aria-hidden
                                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                                      style={{ background: cfg.iconColor }}
                                    />
                                  )}
                                </div>
                                <p
                                  className={`mt-0.5 line-clamp-2 text-xs ${
                                    n.is_read ? "text-slate-600" : "text-slate-400"
                                  }`}
                                >
                                  {n.message}
                                </p>
                                <p className="mt-1 text-[10px] text-slate-600">
                                  {relativeTime(n.created_at)}
                                </p>
                              </div>
                            </button>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
