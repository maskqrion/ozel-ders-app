"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import type { Message, Role, UserProfile } from "@/lib/types";

/* ============================================================
   INLINE ICONS
   ============================================================ */
const Ic = ({
  children, size = 16, sw = 2, className = "",
}: { children: React.ReactNode; size?: number; sw?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
    strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);
type IP = { size?: number; sw?: number; className?: string };

const ISend     = (p: IP) => <Ic {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Ic>;
const ISearch   = (p: IP) => <Ic {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Ic>;
const IChevLeft = (p: IP) => <Ic {...p}><path d="m15 18-6-6 6-6" /></Ic>;
const IMsg      = (p: IP) => <Ic {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Ic>;
const IDblChk   = (p: IP) => <Ic {...p}><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></Ic>;
const IChk      = (p: IP) => <Ic {...p}><path d="M20 6 9 17l-5-5" /></Ic>;
const IUsers    = (p: IP) => <Ic {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Ic>;
const IX        = (p: IP) => <Ic {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Ic>;

/* ============================================================
   TYPES
   ============================================================ */
type Props    = { userId: string; role: Role };
type Contact  = Pick<UserProfile, "id" | "email" | "full_name" | "avatar_url" | "role">;
type DayGroup = { day: string; items: Message[] };

/* ============================================================
   HELPERS
   ============================================================ */
const USER_COLORS = [
  { from: "#10b981", to: "#065f46" },
  { from: "#38bdf8", to: "#0369a1" },
  { from: "#a78bfa", to: "#6d28d9" },
  { from: "#fb923c", to: "#c2410c" },
  { from: "#f472b6", to: "#be185d" },
  { from: "#4ade80", to: "#166534" },
];
function userColor(id: string) {
  const c = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
  return USER_COLORS[c % USER_COLORS.length];
}

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
   AVATAR  (dark glass gradient)
   ============================================================ */
function Avatar({ c, size = "md" }: { c: Contact; size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "sm"
      ? "h-8 w-8 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-sm"
        : "h-10 w-10 text-xs";
  const col = userColor(c.id);
  return (
    <div
      className={`${dim} shrink-0 rounded-2xl grid place-items-center font-black text-white overflow-hidden ring-2 ring-white/10`}
      style={c.avatar_url ? undefined : { background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}
    >
      {c.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials(c.full_name, c.email)}</span>
      )}
    </div>
  );
}

/* ============================================================
   SPINNER
   ============================================================ */
function Spinner() {
  return (
    <motion.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white"
    />
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Mesajlar({ userId, role }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [contactSearch, setContactSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedContactRef = useRef<Contact | null>(null);
  const contactsRef = useRef<Contact[]>([]);

  useEffect(() => { selectedContactRef.current = selectedContact; }, [selectedContact]);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  /* ── 1) Kişileri ve okunmamış sayımları çek ── */
  useEffect(() => {
    const init = async () => {
      setContactsLoading(true);
      try {
        const linkCol  = role === "hoca" ? "hoca_id" : "ogrenci_id";
        const otherCol = role === "hoca" ? "ogrenci_id" : "hoca_id";

        const { data: linkData } = await supabase
          .from("teacher_students")
          .select(otherCol)
          .eq(linkCol, userId);

        const otherIds = ((linkData ?? []) as Array<Record<string, string>>)
          .map((r) => r[otherCol])
          .filter(Boolean);

        if (otherIds.length > 0) {
          const { data: cd } = await supabase
            .from("users")
            .select("id, email, full_name, avatar_url, role")
            .in("id", otherIds);
          setContacts((cd as Contact[]) ?? []);
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
        toast.error("Mesajlaşma başlatılamadı: " + ((err as { message?: string }).message ?? ""));
      } finally {
        setContactsLoading(false);
      }
    };
    init();
  }, [userId, role]);

  /* ── 2) Seçilen kişinin mesajlarını çek ── */
  const markThreadAsRead = useCallback(async (otherId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", otherId)
        .eq("is_read", false);
    } catch { /* sessiz */ }
    setUnreadCounts((prev) => {
      if (!prev.has(otherId)) return prev;
      const next = new Map(prev);
      next.delete(otherId);
      return next;
    });
  }, [userId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedContact) { setMessages([]); return; }
    const other = selectedContact.id;
    let cancelled = false;
    (async () => {
      setMessagesLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, receiver_id, content, is_read, created_at")
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${userId})`)
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!cancelled) setMessages((data ?? []) as Message[]);
      } catch (err: unknown) {
        if (!cancelled) toast.error("Mesajlar yüklenemedi: " + ((err as { message?: string }).message ?? ""));
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();
    markThreadAsRead(other);
    return () => { cancelled = true; };
  }, [userId, selectedContact, markThreadAsRead]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── 3) Realtime: messages + notifications dinleyici ── */
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`mesajlar-rt-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          if (m.sender_id !== userId && m.receiver_id !== userId) return;

          const active = selectedContactRef.current;
          const inThread =
            !!active &&
            ((m.sender_id === userId && m.receiver_id === active.id) ||
              (m.sender_id === active.id && m.receiver_id === userId));

          if (inThread) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
            if (m.receiver_id === userId && !m.is_read)
              supabase.from("messages").update({ is_read: true }).eq("id", m.id);
            return;
          }
          if (m.receiver_id === userId) {
            setUnreadCounts((prev) => {
              const next = new Map(prev);
              next.set(m.sender_id, (next.get(m.sender_id) ?? 0) + 1);
              return next;
            });
            const sender = contactsRef.current.find((c) => c.id === m.sender_id);
            toast(`${sender ? displayName(sender) : "Yeni mesaj"}: ${m.content.slice(0, 60)}`, { duration: 3500 });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  /* ── 4) Auto-scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  /* ── Send handler ── */
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
      toast.error("Mesaj gönderilemedi: " + ((err as { message?: string }).message ?? ""));
    } finally {
      setSending(false);
    }
  };

  /* ── Sorted + filtered contacts ── */
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

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return sortedContacts;
    return sortedContacts.filter(
      (c) => (c.full_name ?? "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [sortedContacts, contactSearch]);

  /* ── Group messages by day ── */
  const messageGroups = useMemo<DayGroup[]>(() => {
    const groups: DayGroup[] = [];
    for (const m of messages) {
      const day = new Date(m.created_at).toDateString();
      if (groups.length === 0 || groups[groups.length - 1].day !== day)
        groups.push({ day, items: [m] });
      else
        groups[groups.length - 1].items.push(m);
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
    <div
      className="grid h-[calc(100vh-240px)] min-h-[560px] grid-cols-1 overflow-hidden rounded-3xl border border-white/[0.08] md:grid-cols-[280px_1fr] relative"
      style={{ background: "linear-gradient(160deg, #030711 0%, #0a1628 55%, #071a14 100%)" }}
    >
      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-0"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* ══ SIDEBAR ══ */}
      <aside
        className={`relative z-10 flex flex-col border-white/[0.07] md:border-r ${
          selectedContact ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Sidebar header */}
        <div className="shrink-0 border-b border-white/[0.06] px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 grid place-items-center">
                <IMsg size={15} sw={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/80">Sohbetler</h3>
                <p className="text-[11px] text-white/30">
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
                className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-black text-white shadow-sm"
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </motion.span>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 h-9 focus-within:border-emerald-400/30 focus-within:shadow-[0_0_0_2px_rgba(52,211,153,0.08)] transition-all">
            <ISearch size={13} sw={2} className="text-white/25 shrink-0" />
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Ara..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/25 text-white/80"
            />
            {contactSearch && (
              <button type="button" onClick={() => setContactSearch("")} className="text-white/25 hover:text-white/55 transition-colors">
                <IX size={12} sw={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="space-y-1 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
                    <div className="h-2.5 w-32 rounded-full bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl border border-white/[0.07] bg-white/[0.03] grid place-items-center mb-3">
                <IUsers size={20} sw={1.6} className="text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white/40">
                {contactSearch ? "Sonuç bulunamadı" : role === "hoca" ? "Henüz bağlı öğrenci yok" : "Henüz bağlı hoca yok"}
              </p>
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
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all mb-0.5 ${
                          isActive
                            ? "bg-emerald-500/[0.1] border border-emerald-400/25"
                            : "hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <div className="relative">
                          <Avatar c={c} size="md" />
                          {unread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0a1628]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${isActive ? "text-emerald-300" : "text-white/75"}`}>
                            {displayName(c)}
                          </p>
                          <p className="truncate text-xs text-white/25">{c.email}</p>
                        </div>
                        {unread > 0 && (
                          <motion.span
                            key={unread}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 380, damping: 22 }}
                            className="ml-1 inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-black text-white"
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

      {/* ══ CHAT PANEL ══ */}
      <section
        className={`relative z-10 flex flex-col ${selectedContact ? "flex" : "hidden md:flex"}`}
      >
        {!selectedContact ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 h-16 w-16 rounded-3xl border border-white/[0.08] bg-white/[0.04] grid place-items-center">
              <IMsg size={26} sw={1.6} className="text-white/20" />
            </div>
            <p className="text-base font-bold text-white/40">Bir sohbet seçin</p>
            <p className="mt-1.5 text-sm text-white/20 max-w-[240px]">
              Soldaki listeden birine tıklayarak konuşmaya başlayabilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <header className="shrink-0 flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="rounded-xl p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white/70 transition md:hidden"
                aria-label="Kişi listesine dön"
              >
                <IChevLeft size={18} sw={2.3} />
              </button>
              <Avatar c={selectedContact} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white/85">
                  {displayName(selectedContact)}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-white/30">Çevrimiçi</p>
                </div>
              </div>
            </header>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            >
              {messagesLoading ? (
                <div className="flex items-center justify-center gap-2.5 mt-8 text-sm text-white/30">
                  <Spinner />
                  Mesajlar yükleniyor...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-2xl border border-white/[0.07] bg-white/[0.03] grid place-items-center mb-3">
                    <IMsg size={20} sw={1.6} className="text-white/15" />
                  </div>
                  <p className="text-sm font-semibold text-white/30">Henüz mesaj yok</p>
                  <p className="mt-1 text-xs text-white/20">İlk mesajı siz gönderin</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <AnimatePresence initial>
                    {messageGroups.map((group) => (
                      <div key={group.day}>
                        {/* Day separator */}
                        <div className="flex items-center gap-3 py-4">
                          <div className="flex-1 h-px bg-white/[0.06]" />
                          <span className="text-[10px] font-semibold text-white/25 px-2 border border-white/[0.06] rounded-full py-0.5">
                            {fmtDay(group.items[0].created_at)}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        {/* Messages */}
                        <div className="space-y-1">
                          {group.items.map((m, idx) => {
                            const mine = m.sender_id === userId;
                            const prevSame = idx > 0 && group.items[idx - 1].sender_id === m.sender_id;
                            const isFirst = !prevSame;

                            return (
                              <motion.div
                                key={m.id}
                                layout
                                initial={{ opacity: 0, scale: 0.82, y: 14 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                style={{ originX: mine ? 1 : 0, originY: 1 }}
                                className={`flex ${mine ? "justify-end" : "justify-start"} ${isFirst ? "mt-3" : "mt-0.5"}`}
                              >
                                {/* Avatar for received (first in run) */}
                                {!mine && isFirst && (
                                  <div className="mr-2 mt-auto mb-0.5 shrink-0">
                                    <Avatar c={selectedContact} size="sm" />
                                  </div>
                                )}
                                {!mine && !isFirst && <div className="w-10 mr-2 shrink-0" />}

                                {/* Bubble */}
                                <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[72%]`}>
                                  <div
                                    className={`px-4 py-2.5 text-sm leading-relaxed ${
                                      mine
                                        ? "text-white rounded-2xl rounded-br-sm"
                                        : "bg-white/[0.06] border border-white/[0.08] text-white/85 rounded-2xl rounded-bl-sm backdrop-blur-sm"
                                    }`}
                                    style={mine
                                      ? {
                                          background: "linear-gradient(135deg, #10b981, #059669)",
                                          boxShadow: "0 4px 16px -4px rgba(16,185,129,0.35)",
                                        }
                                      : undefined}
                                  >
                                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 px-1 ${mine ? "flex-row-reverse" : ""}`}>
                                    <span className="text-[10px] font-medium text-white/25 tabular-nums">
                                      {formatTime(m.created_at)}
                                    </span>
                                    {mine && (
                                      m.is_read
                                        ? <IDblChk size={12} sw={2.5} className="text-emerald-400" />
                                        : <IChk size={12} sw={2.5} className="text-white/20" />
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
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Send form */}
            <form
              onSubmit={handleSend}
              className="shrink-0 flex items-end gap-2 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm px-4 py-3"
            >
              <div className="flex-1 min-h-[42px] flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 focus-within:border-emerald-400/30 focus-within:shadow-[0_0_0_2px_rgba(52,211,153,0.08)] transition-all">
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
                  className="flex-1 resize-none bg-transparent py-2.5 text-sm text-white/80 outline-none placeholder:text-white/25"
                  style={{ maxHeight: "120px" }}
                />
              </div>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.9 }}
                disabled={sending || !draft.trim()}
                className="h-[42px] w-[42px] shrink-0 inline-flex items-center justify-center rounded-2xl text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    sending || !draft.trim()
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow:
                    draft.trim() && !sending
                      ? "0 6px 20px -6px rgba(16,185,129,0.5)"
                      : "none",
                }}
                aria-label="Gönder"
              >
                {sending ? <Spinner /> : <ISend size={16} sw={2.2} />}
              </motion.button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
