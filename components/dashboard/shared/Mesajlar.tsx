"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { Message, Role, UserProfile } from "@/lib/types";

type Props = {
  userId: string;
  role: Role;
};

type Contact = Pick<UserProfile, "id" | "email" | "full_name" | "avatar_url" | "role">;

const displayName = (c: Pick<Contact, "full_name" | "email">) => c.full_name || c.email;

function initials(name: string | null | undefined, email: string) {
  const src = (name || email).trim();
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function Spinner({ tone = "emerald" }: { tone?: "emerald" | "slate" }) {
  const colors = tone === "emerald" ? "border-white/40 border-t-white" : "border-slate-200 border-t-slate-500";
  return (
    <motion.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={`inline-block h-3.5 w-3.5 rounded-full border-2 ${colors}`}
    />
  );
}

export default function Mesajlar({ userId, role }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // sender_id -> okunmamış mesaj sayısı
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedContactRef = useRef<Contact | null>(null);
  const contactsRef = useRef<Contact[]>([]);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // 1) Kişileri ve okunmamış mesaj sayılarını çek
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

        // Okunmamış sayım: bana gelen, henüz okunmamış mesajları sender bazında say
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
      } catch (err: any) {
        toast.error("Mesajlaşma başlatılamadı: " + (err?.message ?? "Bilinmeyen hata"));
      } finally {
        setContactsLoading(false);
      }
    };
    init();
  }, [userId, role]);

  // 2) Seçilen kişiyle olan mesajları çek + okundu olarak işaretle
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
        // sessizce yutalım — UI optimistic, network hatası ileride yeniden işaretler
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

  useEffect(() => {
    if (!selectedContact) {
      setMessages([]);
      return;
    }
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
        if (!cancelled) setMessages(((data ?? []) as Message[]));
      } catch (err: any) {
        if (!cancelled) toast.error("Mesajlar yüklenemedi: " + (err?.message ?? "Bilinmeyen hata"));
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };
    run();
    markThreadAsRead(other);

    return () => {
      cancelled = true;
    };
  }, [userId, selectedContact, markThreadAsRead]);

  // 3) Realtime: kendime gelen ve gönderdiğim mesajları dinle
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
            // Bana gelen mesaj aktif sohbette → anında okundu işaretle
            if (m.receiver_id === userId && !m.is_read) {
              supabase.from("messages").update({ is_read: true }).eq("id", m.id);
            }
            return;
          }

          // Aktif sohbet dışında bana gelen mesaj → sayacı artır + toast
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 4) Yeni mesaj geldiğinde aşağı kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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
    } catch (err: any) {
      toast.error("Mesaj gönderilemedi: " + (err?.message ?? "Bilinmeyen hata"));
    } finally {
      setSending(false);
    }
  };

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const ua = unreadCounts.get(a.id) ?? 0;
      const ub = unreadCounts.get(b.id) ?? 0;
      if (ua !== ub) return ub - ua;
      return displayName(a).localeCompare(displayName(b), "tr");
    });
  }, [contacts, unreadCounts]);

  return (
    <div className="grid h-[calc(100vh-260px)] min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-3">
      {/* Sol: Kişi listesi */}
      <aside
        className={`flex flex-col border-b border-slate-100 md:border-b-0 md:border-r ${
          selectedContact ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Kişiler</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {role === "hoca" ? "Bağlı öğrencileriniz" : "Bağlı hocalarınız"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg p-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-2.5 w-32 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedContacts.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">
              {role === "hoca"
                ? "Henüz davetinizi kabul eden bir öğrenci yok."
                : "Henüz bağlı olduğunuz bir hoca yok."}
            </p>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {sortedContacts.map((c) => {
                  const isActive = selectedContact?.id === c.id;
                  const unread = unreadCounts.get(c.id) ?? 0;
                  return (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedContact(c)}
                        className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition ${
                          isActive
                            ? "border-l-4 border-l-emerald-400 bg-emerald-50/60"
                            : "border-l-4 border-l-transparent hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-xs font-bold text-emerald-700 ring-1 ring-slate-100">
                          {c.avatar_url ? (
                            <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span>{initials(c.full_name, c.email)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {displayName(c)}
                          </p>
                          <p className="truncate text-xs text-slate-500">{c.email}</p>
                        </div>
                        {unread > 0 && (
                          <motion.span
                            key={unread}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 380, damping: 22 }}
                            className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm"
                            aria-label={`${unread} okunmamış mesaj`}
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

      {/* Sağ: Aktif sohbet */}
      <section
        className={`flex flex-col bg-slate-50/40 md:col-span-2 ${
          selectedContact ? "flex" : "hidden md:flex"
        }`}
      >
        {!selectedContact ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-2xl">
              💬
            </div>
            <p className="text-sm font-medium text-slate-700">Sohbete başlamak için bir kişi seçin</p>
            <p className="mt-1 text-xs text-slate-500">
              Soldaki listeden birine tıklayarak konuşmaya başlayabilirsiniz.
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700 md:hidden"
                aria-label="Kişi listesine dön"
              >
                ←
              </button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-xs font-bold text-emerald-700 ring-1 ring-slate-100">
                {selectedContact.avatar_url ? (
                  <img
                    src={selectedContact.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials(selectedContact.full_name, selectedContact.email)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {displayName(selectedContact)}
                </p>
                <p className="truncate text-xs text-slate-500">{selectedContact.email}</p>
              </div>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {messagesLoading ? (
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                  <Spinner tone="slate" />
                  Mesajlar yükleniyor...
                </div>
              ) : messages.length === 0 ? (
                <p className="mt-6 text-center text-sm text-slate-400">
                  Henüz mesaj yok. İlk mesajı siz gönderin.
                </p>
              ) : (
                <AnimatePresence initial={true}>
                  {messages.map((m) => {
                    const mine = m.sender_id === userId;
                    return (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ring-1 ${
                            mine
                              ? "rounded-br-sm bg-emerald-100 text-emerald-900 ring-emerald-200/60"
                              : "rounded-bl-sm bg-sky-100 text-sky-900 ring-sky-200/60"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              mine ? "text-emerald-700/70" : "text-sky-700/70"
                            }`}
                          >
                            {formatTime(m.created_at)}
                            {mine && (
                              <span className="ml-1" aria-label={m.is_read ? "Okundu" : "İletildi"}>
                                {m.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                disabled={sending || !draft.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending && <Spinner />}
                {sending ? "Gönderiliyor..." : "Gönder"}
              </motion.button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
