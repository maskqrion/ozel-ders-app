"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { Message, Role, UserProfile } from "@/lib/types";

/* ============================================================
   ICON PRIMITIVES  (lucide-react yüklü değil — inline SVG)
   ============================================================ */
type IconProps = { size?: number; className?: string; strokeWidth?: number };
const Ic = ({
  size = 16, className = "", sw = 2, children,
}: { size?: number; className?: string; sw?: number; children: React.ReactNode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

const SendIcon = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </Ic>
);
const SearchIcon = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </Ic>
);
const ChevronLeft = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="m15 18-6-6 6-6" />
  </Ic>
);
const MessageSquare = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Ic>
);
const CheckCheck = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" />
  </Ic>
);
const CheckIcon = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M20 6 9 17l-5-5" />
  </Ic>
);
const UsersIcon = (p: IconProps) => (
  <Ic size={p.size} className={p.className} sw={p.strokeWidth}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Ic>
);

/* ============================================================
   PROPS & TYPES
   ============================================================ */
type Props = { userId: string; role: Role };
type Contact = Pick<UserProfile, "id" | "email" | "full_name" | "avatar_url" | "role">;

/* ============================================================
   HELPERS  — preserved exactly
   ============================================================ */
const displayName = (c: Pick<Contact, "full_name" | "email">) => c.full_name || c.email;

function initials(name: string | null | undefined, email: string) {
  const src = (name || email).trim();
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Bugün";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/* ============================================================
   SPINNER  — preserved exactly
   ============================================================ */
function Spinner({ tone = "emerald" }: { tone?: "emerald" | "slate" }) {
  const colors =
    tone === "emerald"
      ? "border-white/40 border-t-white"
      : "border-slate-200 border-t-slate-500";
  return (
    <motion.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={`inline-block h-3.5 w-3.5 rounded-full border-2 ${colors}`}
    />
  );
}

/* ============================================================
   AVATAR
   ============================================================ */
function Avatar({ c, size = "md" }: { c: Contact; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-10 w-10 text-xs";
  return (
    <div className={`${dim} shrink-0 rounded-xl overflow-hidden grid place-items-center font-bold text-emerald-700 bg-gradient-to-br from-emerald-50 to-sky-50 ring-1 ring-slate-100`}>
      {c.avatar_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials(c.full_name, c.email)}</span>
      )}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Mesajlar({ userId, role }: Props) {
  /* ── Preserved state ── */
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  /* ── UI-only state (new) ── */
  const [contactSearch, setContactSearch] = useState("");

  /* ── Preserved refs ── */
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedContactRef = useRef<Contact | null>(null);
  const contactsRef = useRef<Contact[]>([]);

  useEffect(() => { selectedContactRef.current = selectedContact; }, [selectedContact]);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  /* ── 1) Preserved: Kişileri ve okunmamış sayımları çek ── */
  useEffect(() => {
    const init = async () => {
      setContactsLoading(true);
      try {
        const linkColumn = role === "hoca" ? "hoca_id" : "ogrenci_id";
        const otherColumn = role === "hoca" ? "ogrenci_id" : "hoca_id";

        const { data: linkData } = await supabase
          .from("teacher_students")
          .select(otherColumn)
          .eq(linkColumn, userId);

        const otherIds = ((linkData ?? []) as Array<Record<string, string>>)
          .map((r) => r[otherColumn])
          .filter(Boolean);

        if (otherIds.length > 0) {
          const { data: contactData } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url, role")
            .in("id", otherIds);
          setContacts((contactData as Contact[]) ?? []);
        } else {
          setContacts([]);
        }

        const { data: unreadRows } = await supabase
          .from("messages")
          .select("sender_id")
          .eq("receiver_id", userId)
          .eq("is_read", false);

        const counts = new Map<string, number>();
        for (const row of (unreadRows ?? []) as Array<{ sender_id: string }>) {
          counts.set(row.sender_id, (counts.get(row.sender_id) ?? 0) + 1);
        }
        setUnreadCounts(counts);
      } catch (err: unknown) {
        toast.error(
          "Mesajlaşma başlatılamadı: " +
            ((err as { message?: string }).message ?? "Bilinmeyen hata"),
        );
      } finally {
        setContactsLoading(false);
      }
    };
    init();
  }, [userId, role]);

  /* ── 2) Preserved: Seçilen kişinin mesajlarını çek + okundu işaretle ── */
  const markThreadAsRead = useCallback(
    async (otherId: string) => {
      try {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("receiver_id", userId)
          .eq("sender_id", otherId)
          .eq("is_read", false);
      } catch {
        // sessizce yutalım — optimistic UI
      }
      setUnreadCounts((prev) => {
        if (!prev.has(otherId)) return prev;
        const next = new Map(prev);
        next.delete(otherId);
        return next;
      });
    },
    [userId],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedContact) { setMessages([]); return; }
    const other = selectedContact.id;
    let cancelled = false;
    const run = async () => {
      setMessagesLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, receiver_id, content, is_read, created_at")
          .or(
            `and(sender_id.eq.${userId},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${userId})`,
          )
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!cancelled) setMessages((data ?? []) as Message[]);
      } catch (err: unknown) {
        if (!cancelled)
          toast.error(
            "Mesajlar yüklenemedi: " +
              ((err as { message?: string }).message ?? "Bilinmeyen hata"),
          );
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };
    run();
    markThreadAsRead(other);
    return () => { cancelled = true; };
  }, [userId, selectedContact, markThreadAsRead]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── 3) Preserved: Realtime dinleyici ── */
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`mesajlar-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          if (m.sender_id !== userId && m.receiver_id !== userId) return;

          const active = selectedContactRef.current;
          const isInActiveThread =
            !!active &&
            ((m.sender_id === userId && m.receiver_id === active.id) ||
              (m.sender_id === active.id && m.receiver_id === userId));

          if (isInActiveThread) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
            if (m.receiver_id === userId && !m.is_read) {
              supabase.from("messages").update({ is_read: true }).eq("id", m.id);
            }
            return;
          }

          if (m.receiver_id === userId) {
            setUnreadCounts((prev) => {
              const next = new Map(prev);
              next.set(m.sender_id, (next.get(m.sender_id) ?? 0) + 1);
              return next;
            });
            const sender = contactsRef.current.find((c) => c.id === m.sender_id);
            const ad = sender ? displayName(sender) : "Yeni mesaj";
            toast(`💬 ${ad}: ${m.content.slice(0, 60)}`, { duration: 3500 });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  /* ── 4) Preserved: Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  /* ── Preserved: Send handler ── */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([{ sender_id: userId, receiver_id: selectedContact.id, content }])
        .select("id, sender_id, receiver_id, content, is_read, created_at")
        .single();
      if (error) throw error;
      if (data) {
        const m = data as Message;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
      setDraft("");
    } catch (err: unknown) {
      toast.error(
        "Mesaj gönderilemedi: " +
          ((err as { message?: string }).message ?? "Bilinmeyen hata"),
      );
    } finally {
      setSending(false);
    }
  };

  /* ── Preserved: Sorted contacts ── */
  const sortedContacts = useMemo(
    () =>
      [...contacts].sort((a, b) => {
        const ua = unreadCounts.get(a.id) ?? 0;
        const ub = unreadCounts.get(b.id) ?? 0;
        if (ua !== ub) return ub - ua;
        return displayName(a).localeCompare(displayName(b), "tr");
      }),
    [contacts, unreadCounts],
  );

  /* ── UI-only: filtered contacts (search) ── */
  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return sortedContacts;
    return sortedContacts.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [sortedContacts, contactSearch]);

  /* ── UI-only: group messages by day ── */
  type DayGroup = { day: string; items: Message[] };
  const messageGroups = useMemo<DayGroup[]>(() => {
    const groups: DayGroup[] = [];
    for (const m of messages) {
      const day = new Date(m.created_at).toDateString();
      if (groups.length === 0 || groups[groups.length - 1].day !== day) {
        groups.push({ day, items: [m] });
      } else {
        groups[groups.length - 1].items.push(m);
      }
    }
    return groups;
  }, [messages]);

  const totalUnread = useMemo(
    () => [...unreadCounts.values()].reduce((a, b) => a + b, 0),
    [unreadCounts],
  );

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="grid h-[calc(100vh-240px)] min-h-[560px] grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm md:grid-cols-3">

      {/* ══════════════════════════════════════════════════════
          LEFT SIDEBAR — contact list
          ══════════════════════════════════════════════════════ */}
      <aside
        className={`flex flex-col border-slate-100 md:border-r ${
          selectedContact ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Sidebar header */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
                <MessageSquare size={16} strokeWidth={2.1} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Sohbetler</h3>
                <p className="text-[11px] text-slate-400">
                  {role === "hoca" ? "Öğrencilerim" : "Hocalarım"}
                </p>
              </div>
            </div>
            {totalUnread > 0 && (
              <motion.span
                key={totalUnread}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-extrabold text-white shadow-sm"
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </motion.span>
            )}
          </div>

          {/* Search input */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 h-9 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition">
            <SearchIcon size={14} className="text-slate-400 shrink-0" />
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Ara..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="space-y-1 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-2.5 w-32 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 grid place-items-center mb-3">
                <UsersIcon size={20} className="text-slate-400" strokeWidth={1.8} />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {contactSearch ? "Sonuç bulunamadı" : role === "hoca"
                  ? "Henüz bağlı öğrenci yok"
                  : "Henüz bağlı hoca yok"}
              </p>
              {!contactSearch && (
                <p className="mt-1 text-xs text-slate-400">
                  {role === "hoca"
                    ? "Davet linki oluşturup paylaşın."
                    : "Davet bağlantısıyla bağlanın."}
                </p>
              )}
            </div>
          ) : (
            <ul className="p-2">
              <AnimatePresence initial={false}>
                {filteredContacts.map((c) => {
                  const isActive = selectedContact?.id === c.id;
                  const unread = unreadCounts.get(c.id) ?? 0;
                  return (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedContact(c)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition mb-0.5 ${
                          isActive
                            ? "bg-emerald-50 border border-emerald-200/70"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <Avatar c={c} size="md" />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-semibold ${
                              isActive ? "text-emerald-800" : "text-slate-800"
                            }`}
                          >
                            {displayName(c)}
                          </p>
                          <p className="truncate text-xs text-slate-400">{c.email}</p>
                        </div>
                        {unread > 0 && (
                          <motion.span
                            key={unread}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 380, damping: 22 }}
                            className="ml-1 inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-extrabold text-white shadow-sm"
                            aria-label={`${unread} okunmamış`}
                          >
                            {unread > 99 ? "99+" : unread}
                          </motion.span>
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — active chat window
          ══════════════════════════════════════════════════════ */}
      <section
        className={`flex flex-col md:col-span-2 ${
          selectedContact ? "flex" : "hidden md:flex"
        }`}
        style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%)" }}
      >
        {!selectedContact ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-sky-100">
              <MessageSquare size={28} strokeWidth={1.8} className="text-emerald-500" />
            </div>
            <p className="text-base font-bold text-slate-700">Bir sohbet seçin</p>
            <p className="mt-1.5 text-sm text-slate-400 max-w-[240px]">
              Soldaki listeden birine tıklayarak konuşmaya başlayabilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <header className="shrink-0 flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition md:hidden"
                aria-label="Kişi listesine dön"
              >
                <ChevronLeft size={18} strokeWidth={2.3} />
              </button>
              <Avatar c={selectedContact} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">
                  {displayName(selectedContact)}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-xs text-slate-400">Çevrimiçi</p>
                </div>
              </div>
            </header>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messagesLoading ? (
                <div className="flex items-center justify-center gap-2.5 mt-8 text-sm text-slate-400">
                  <Spinner tone="slate" />
                  Mesajlar yükleniyor...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm grid place-items-center mb-3">
                    <MessageSquare size={20} className="text-slate-300" strokeWidth={1.8} />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Henüz mesaj yok</p>
                  <p className="mt-1 text-xs text-slate-400">İlk mesajı siz gönderin 👋</p>
                </div>
              ) : (
                <AnimatePresence initial>
                  {messageGroups.map((group) => (
                    <div key={group.day}>
                      {/* Day separator */}
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px bg-slate-200/70" />
                        <span className="text-[11px] font-semibold text-slate-400 px-2">
                          {fmtDay(group.items[0].created_at)}
                        </span>
                        <div className="flex-1 h-px bg-slate-200/70" />
                      </div>

                      {/* Messages in group */}
                      <div className="space-y-1.5">
                        {group.items.map((m, idx) => {
                          const mine = m.sender_id === userId;
                          const prevMine = idx > 0 && group.items[idx - 1].sender_id === userId;
                          const isFirstInRun = !prevMine || group.items[idx - 1].sender_id !== m.sender_id;

                          return (
                            <motion.div
                              key={m.id}
                              layout
                              initial={{ opacity: 0, y: 12, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                              className={`flex ${mine ? "justify-end" : "justify-start"} ${isFirstInRun ? "mt-3" : "mt-0.5"}`}
                            >
                              {/* Avatar for received (first in run) */}
                              {!mine && isFirstInRun && (
                                <div className="mr-2 mt-auto mb-0.5 shrink-0">
                                  <Avatar c={selectedContact} size="sm" />
                                </div>
                              )}
                              {!mine && !isFirstInRun && <div className="w-10 mr-2 shrink-0" />}

                              {/* Bubble */}
                              <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[72%]`}>
                                <div
                                  className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                    mine
                                      ? "bg-emerald-500 text-white rounded-2xl rounded-br-sm"
                                      : "bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-sm"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                </div>
                                <div className={`flex items-center gap-1 mt-1 px-1 ${mine ? "flex-row-reverse" : ""}`}>
                                  <span className={`text-[10px] font-medium ${mine ? "text-slate-400" : "text-slate-400"}`}>
                                    {formatTime(m.created_at)}
                                  </span>
                                  {mine && (
                                    m.is_read
                                      ? <CheckCheck size={12} strokeWidth={2.5} className="text-emerald-400" />
                                      : <CheckIcon size={12} strokeWidth={2.5} className="text-slate-300" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send form */}
            <form
              onSubmit={handleSend}
              className="shrink-0 flex items-end gap-2 border-t border-slate-100 bg-white px-4 py-3"
            >
              <div className="flex-1 min-h-[42px] flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100 focus-within:bg-white">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="Mesajınızı yazın..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  style={{ maxHeight: "120px" }}
                />
              </div>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.93 }}
                disabled={sending || !draft.trim()}
                className="h-[42px] w-[42px] shrink-0 inline-flex items-center justify-center rounded-2xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: sending || !draft.trim()
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
                aria-label="Gönder"
              >
                {sending ? <Spinner /> : <SendIcon size={17} strokeWidth={2.2} />}
              </motion.button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
