"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { createSupportTicket } from "@/app/actions/support";
import {
  createSupportTicketSchema,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  type CreateSupportTicketInput,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
} from "@/lib/validations/support";
import type { Database } from "@/lib/types/supabase";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

/* ── Türkçe etiketler ───────────────────────────────────────── */

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  account: "Hesap",
  reservation: "Rezervasyon",
  payment: "Ödeme / Cüzdan",
  assignment: "Ödev",
  quiz: "Quiz",
  messaging: "Mesajlaşma",
  technical: "Teknik Sorun",
  other: "Diğer",
};

const PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  urgent: "Acil",
};

const PRIORITY_BADGES: Record<SupportPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-sky-50 text-sky-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-rose-50 text-rose-700",
};

const STATUS_LABELS: Record<SupportStatus, string> = {
  open: "Açık",
  in_progress: "İnceleniyor",
  resolved: "Çözüldü",
  closed: "Kapatıldı",
};

const STATUS_BADGES: Record<SupportStatus, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-sky-50 text-sky-700 border-sky-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status as SupportStatus] ?? status;
}

function statusBadge(status: string): string {
  return STATUS_BADGES[status as SupportStatus] ?? STATUS_BADGES.closed;
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as SupportCategory] ?? category;
}

function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority as SupportPriority] ?? priority;
}

function priorityBadge(priority: string): string {
  return PRIORITY_BADGES[priority as SupportPriority] ?? PRIORITY_BADGES.normal;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Sayfa ──────────────────────────────────────────────────── */

export default function DestekPage() {
  const router = useRouter();

  const [dashboardHref, setDashboardHref] = useState("/ogrenci");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupportTicketInput>({
    resolver: zodResolver(createSupportTicketSchema),
    defaultValues: { priority: "normal" },
  });

  // watch() React Compiler ile uyumsuz; useWatch abonelik temelli ve güvenli
  const messageValue = useWatch({ control, name: "message" });
  const messageLength = messageValue?.length ?? 0;

  const fetchTickets = useCallback(async () => {
    setTicketsError(false);
    // RLS: yalnızca kullanıcının kendi talepleri döner
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setTicketsError(true);
    } else {
      setTickets(data ?? []);
    }
    setTicketsLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/login");
        return;
      }
      const role = (user.user_metadata?.role as string | undefined) ?? "ogrenci";
      setDashboardHref(role === "hoca" ? "/hoca" : "/ogrenci");
      await fetchTickets();
    };
    init();
  }, [router, fetchTickets]);

  const onSubmit = async (values: CreateSupportTicketInput) => {
    const result = await createSupportTicket(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Destek talebiniz alındı. En kısa sürede dönüş yapacağız.");
    reset({ priority: "normal", category: values.category, subject: "", message: "" });
    setTicketsLoading(true);
    await fetchTickets();
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,.12)]";
  const labelCls = "mb-1.5 block text-[12px] font-semibold text-slate-700";
  const errorCls = "mt-1 text-sm text-red-500";

  return (
    <div className="min-h-screen bg-emerald-50/40 pb-20 font-sans text-slate-800">
      {/* Üst nav — panel düzeniyle uyumlu */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-100 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-emerald-600">Destek</h1>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/yardim" className="text-slate-600 transition hover:text-emerald-600">
            Yardım Merkezi
          </Link>
          <Link
            href={dashboardHref}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200"
          >
            Panele Dön
          </Link>
        </div>
      </nav>

      <main className="mx-auto mt-8 max-w-3xl space-y-8 px-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Size nasıl yardımcı olabiliriz?</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Sorununuzu aşağıdaki formla bize iletin. Sık sorulan sorular için{" "}
            <Link href="/yardim" className="font-semibold text-emerald-700 hover:underline">
              Yardım Merkezi
            </Link>
            <span>&apos;ne göz atabilirsiniz.</span>
          </p>
        </div>

        {/* ── Yeni talep formu ─────────────────────────────────── */}
        <section
          aria-labelledby="yeni-talep"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 id="yeni-talep" className="mb-5 text-lg font-bold text-slate-900">
            Yeni Destek Talebi
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className={labelCls}>
                  Kategori
                </label>
                <select
                  id="category"
                  {...register("category")}
                  defaultValue=""
                  className={inputCls}
                >
                  <option value="" disabled>
                    Kategori seçin...
                  </option>
                  {SUPPORT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
                {errors.category && <p className={errorCls}>{errors.category.message}</p>}
              </div>

              <div>
                <label htmlFor="priority" className={labelCls}>
                  Öncelik
                </label>
                <select id="priority" {...register("priority")} className={inputCls}>
                  {SUPPORT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                {errors.priority && <p className={errorCls}>{errors.priority.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className={labelCls}>
                Konu
              </label>
              <input
                id="subject"
                type="text"
                {...register("subject")}
                placeholder="Sorununuzu kısaca özetleyin"
                maxLength={120}
                className={inputCls}
              />
              {errors.subject && <p className={errorCls}>{errors.subject.message}</p>}
            </div>

            <div>
              <label htmlFor="message" className={labelCls}>
                Mesajınız
              </label>
              <textarea
                id="message"
                {...register("message")}
                rows={5}
                placeholder="Sorununuzu ayrıntılı olarak anlatın. Varsa hata mesajını ve hangi adımda karşılaştığınızı ekleyin."
                maxLength={2000}
                className={`${inputCls} resize-y`}
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.message ? (
                  <p className="text-sm text-red-500">{errors.message.message}</p>
                ) : (
                  <span className="text-[12px] text-slate-400">En az 20 karakter</span>
                )}
                <span className="text-[12px] tabular-nums text-slate-400">
                  {messageLength}/2000
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl px-5 py-3 text-sm font-bold text-white transition sm:w-auto ${
                isSubmitting
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSubmitting ? "Gönderiliyor..." : "Talebi Gönder"}
            </button>
          </form>
        </section>

        {/* ── Talep listesi ────────────────────────────────────── */}
        <section aria-labelledby="taleplerim">
          <h3 id="taleplerim" className="mb-4 text-lg font-bold text-slate-900">
            Taleplerim
          </h3>

          {ticketsLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-3 h-4 w-1/3 rounded-full bg-slate-100" />
                  <div className="h-3 w-2/3 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : ticketsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center">
              <p className="text-sm font-medium text-rose-700">
                Talepleriniz yüklenemedi. Lütfen sayfayı yenileyin.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTicketsLoading(true);
                  fetchTickets();
                }}
                className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
              >
                Tekrar Dene
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <div className="text-3xl" aria-hidden>📨</div>
              <p className="mt-3 text-sm font-medium text-slate-600">
                Henüz bir destek talebiniz yok.
              </p>
              <p className="mt-1 text-[13px] text-slate-400">
                Bir sorunla karşılaştığınızda yukarıdaki formla bize ulaşabilirsiniz.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => (
                <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadge(t.status)}`}
                    >
                      {statusLabel(t.status)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {categoryLabel(t.category)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priorityBadge(t.priority)}`}
                    >
                      {priorityLabel(t.priority)} öncelik
                    </span>
                    <span className="ml-auto text-[12px] text-slate-400">
                      {fmtDate(t.created_at)}
                    </span>
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-900">{t.subject}</h4>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {t.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
