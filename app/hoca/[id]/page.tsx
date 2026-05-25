import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════
   Server-side Supabase (anon key — never ships to the client).
   Uses NEXT_PUBLIC_ vars which are available in server context.
═══════════════════════════════════════════════════════════════ */
function serverDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/* ── Types ──────────────────────────────────────────────────── */
interface HocaProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  sehir: string | null;
  ilce: string | null;
  ders_fiyati: number | null;
  hakkinda: string | null;
  level: number;
  xp: number;
  video_url: string | null;
  portfolio_url: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/* ── Helpers ─────────────────────────────────────────────────  */
function initials(name: string | null): string {
  if (!name) return "Ö";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function avgRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ── Icon helpers (server-safe — no hooks) ───────────────────── */
function Ic({
  size = 24,
  sw = 1.75,
  cls = "",
  children,
}: {
  size?: number;
  sw?: number;
  cls?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function GraduationCapIcon({ size = 20, cls = "" }: { size?: number; cls?: string }) {
  return (
    <Ic size={size} cls={cls}>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </Ic>
  );
}
function ChevronLeftIcon({ size = 16, cls = "" }: { size?: number; cls?: string }) {
  return <Ic size={size} cls={cls}><path d="m15 18-6-6 6-6" /></Ic>;
}
function MapPinIcon({ size = 14, cls = "" }: { size?: number; cls?: string }) {
  return (
    <Ic size={size} cls={cls}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </Ic>
  );
}
function BadgeCheckIcon({ size = 16, cls = "" }: { size?: number; cls?: string }) {
  return (
    <Ic size={size} cls={cls}>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </Ic>
  );
}
function ShieldCheckIcon({ size = 16, cls = "" }: { size?: number; cls?: string }) {
  return (
    <Ic size={size} cls={cls}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </Ic>
  );
}
function StarFilledIcon({ size = 16, cls = "" }: { size?: number; cls?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cls}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
      />
    </svg>
  );
}
function ArrowRightIcon({ size = 16, cls = "" }: { size?: number; cls?: string }) {
  return (
    <Ic size={size} cls={cls}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Ic>
  );
}
function VideoIcon({ size = 16, cls = "" }: { size?: number; cls?: string }) {
  return (
    <Ic size={size} cls={cls}>
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </Ic>
  );
}
function ZapIcon({ size = 16, cls = "" }: { size?: number; cls?: string }) {
  return (
    <Ic size={size} cls={cls}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </Ic>
  );
}

/* ── Star row ─────────────────────────────────────────────────  */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarFilledIcon
          key={n}
          size={size}
          cls={n <= Math.round(rating) ? "text-amber-400" : "text-slate-200"}
        />
      ))}
    </span>
  );
}

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({
  profile,
  sizeCls,
  textCls,
}: {
  profile: HocaProfile;
  sizeCls: string;
  textCls: string;
}) {
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.full_name ?? "Öğretmen"}
        className={`${sizeCls} rounded-full object-cover ring-4 ring-white shadow-xl`}
      />
    );
  }
  return (
    <div
      className={`${sizeCls} rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 ring-4 ring-white shadow-xl flex items-center justify-center font-bold text-white ${textCls}`}
    >
      {initials(profile.full_name)}
    </div>
  );
}

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const db = serverDb();
    const { data } = await db.from("users").select("id").eq("role", "hoca");
    return (data ?? []).map((row: { id: string }) => ({ id: row.id }));
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════
   generateMetadata — Server, runs before page render
═══════════════════════════════════════════════════════════════ */
type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const db = serverDb();

  const { data } = await db
    .from("users")
    .select("full_name, hakkinda, sehir")
    .eq("id", id)
    .eq("role", "hoca")
    .maybeSingle();

  const name = data?.full_name ?? "Öğretmen";
  const city = data?.sehir ? `, ${data.sehir}` : "";
  const desc =
    data?.hakkinda
      ? data.hakkinda.slice(0, 155).trimEnd() + "…"
      : `${name}${city} ile özel ders al. Özel Ders Pro'da profili incele ve ders rezervasyonu yap.`;

  return {
    title: `${name} - Özel Ders | Özel Ders Pro`,
    description: desc,
    openGraph: {
      title: `${name} — Özel Ders Pro`,
      description: desc,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${name} — Özel Ders Pro`,
      description: desc,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   PAGE — Server Component
═══════════════════════════════════════════════════════════════ */
export default async function HocaProfilPage({ params }: PageProps) {
  const { id } = await params;
  const db = serverDb();

  /* Parallel fetch: profile + reviews */
  const [profileRes, reviewsRes] = await Promise.all([
    db
      .from("users")
      .select("id, full_name, avatar_url, sehir, ilce, ders_fiyati, hakkinda, level, xp, video_url, portfolio_url")
      .eq("id", id)
      .eq("role", "hoca")
      .maybeSingle(),
    db
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("hoca_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!profileRes.data) notFound();

  const hoca    = profileRes.data as HocaProfile;
  const reviews = (reviewsRes.data ?? []) as Review[];
  const avg     = avgRating(reviews);
  const location = [hoca.sehir, hoca.ilce].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Left: Back + Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/ogrenci"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <ChevronLeftIcon />
              Geri
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm">
                <GraduationCapIcon size={16} cls="text-white" />
              </div>
              <span className="text-base font-bold text-slate-800">Özel Ders Pro</span>
            </div>
          </div>
          {/* Right: CTA */}
          <Link
            href="/login"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Giriş Yap
          </Link>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div
        className="h-40 sm:h-52"
        style={{
          background:
            "linear-gradient(135deg, #10b981 0%, #0ea5e9 50%, #6366f1 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Profile Header ── */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar */}
          <Avatar profile={hoca} sizeCls="h-28 w-28 sm:h-32 sm:w-32 shrink-0" textCls="text-2xl" />

          {/* Name + badges */}
          <div className="flex flex-1 flex-col gap-2 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {hoca.full_name ?? "Öğretmen"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
                <BadgeCheckIcon size={13} cls="text-sky-500" />
                Doğrulanmış Öğretmen
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon cls="text-slate-400" />
                  {location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ZapIcon size={13} cls="text-amber-400" />
                Lv {hoca.level}
              </span>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1">
                  <Stars rating={avg} size={13} />
                  <span className="font-semibold text-slate-700">{avg.toFixed(1)}</span>
                  <span className="text-slate-400">({reviews.length} yorum)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Left: Content (2/3) ── */}
          <div className="space-y-8 lg:col-span-2">

            {/* Hakkında */}
            {hoca.hakkinda && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Hakkında</h2>
                <p className="whitespace-pre-line leading-relaxed text-slate-600">
                  {hoca.hakkinda}
                </p>
              </section>
            )}

            {/* Stats chips */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Profil Bilgileri</h2>
              <div className="flex flex-wrap gap-3">
                {hoca.ders_fiyati != null && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
                    <span className="text-lg font-extrabold text-emerald-600">
                      {hoca.ders_fiyati.toLocaleString("tr-TR")} ₺
                    </span>
                    <span className="text-xs text-emerald-700">/saat</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                    <MapPinIcon cls="text-slate-400" />
                    {location}
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700">
                  <ZapIcon size={14} cls="text-amber-400" />
                  Seviye {hoca.level}
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700">
                    <StarFilledIcon size={14} cls="text-amber-400" />
                    {avg.toFixed(1)} / 5.0
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-2.5 text-sm text-violet-700">
                  <VideoIcon size={14} cls="text-violet-400" />
                  Online Ders
                </div>
              </div>
            </section>

            {/* Reviews */}
            {reviews.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Öğrenci Yorumları</h2>
                  <div className="flex items-center gap-2">
                    <Stars rating={avg} size={15} />
                    <span className="font-bold text-slate-800">{avg.toFixed(1)}</span>
                    <span className="text-sm text-slate-400">({reviews.length})</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {/* Anonymous reviewer */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                            Ö
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              Doğrulanmış Öğrenci
                            </p>
                            <p className="text-xs text-slate-400">{fmtDate(review.created_at)}</p>
                          </div>
                        </div>
                        <Stars rating={review.rating} size={13} />
                      </div>
                      {review.comment && (
                        <p className="text-sm leading-relaxed text-slate-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No bio/reviews placeholder */}
            {!hoca.hakkinda && reviews.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <p className="text-slate-400">Bu öğretmen henüz profil bilgilerini doldurmamış.</p>
              </div>
            )}
          </div>

          {/* ── Right: Booking Card (1/3) ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">

              {/* Price + CTA */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Card header */}
                <div className="bg-gradient-to-br from-emerald-500 to-sky-500 p-5 text-white">
                  <p className="text-sm font-medium text-emerald-100">Ders Ücreti</p>
                  {hoca.ders_fiyati != null ? (
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold">
                        {hoca.ders_fiyati.toLocaleString("tr-TR")}
                      </span>
                      <span className="text-lg font-semibold text-emerald-100">₺</span>
                      <span className="text-sm text-emerald-200">/saat</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xl font-bold">Fiyat için iletişime geçin</p>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {/* Trust signals */}
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <BadgeCheckIcon size={14} cls="text-emerald-500 shrink-0" />
                      Kimlik doğrulaması yapıldı
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon size={14} cls="text-sky-500 shrink-0" />
                      Güvenli ödeme sistemi
                    </div>
                    <div className="flex items-center gap-2">
                      <VideoIcon size={14} cls="text-violet-500 shrink-0" />
                      Online ders imkânı
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
                  >
                    Ders Talep Et
                    <ArrowRightIcon size={15} cls="text-white" />
                  </Link>
                  <p className="text-center text-xs text-slate-400">
                    Giriş yaparak ders rezervasyonu oluşturabilirsiniz
                  </p>
                </div>
              </div>

              {/* Profile stats */}
              {reviews.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Değerlendirme
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-slate-900">{avg.toFixed(1)}</p>
                      <Stars rating={avg} size={12} />
                      <p className="mt-1 text-xs text-slate-400">{reviews.length} yorum</p>
                    </div>
                    {/* Star breakdown */}
                    <div className="flex-1 px-4 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => r.rating === star).length;
                        const pct   = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="w-2 shrink-0 text-right text-xs text-slate-500">{star}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-4 shrink-0 text-xs text-slate-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-12 border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              {
                title: "Platform",
                links: ["Nasıl Çalışır?", "Eğitmen Ol", "Fiyatlandırma"],
              },
              {
                title: "Destek",
                links: ["Yardım Merkezi", "İletişim", "SSS"],
              },
              {
                title: "Yasal",
                links: ["Gizlilik Politikası", "Kullanım Koşulları", "KVKK"],
              },
              {
                title: "Sosyal Medya",
                links: ["Instagram", "Twitter", "LinkedIn"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-3 text-sm font-semibold text-slate-800">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-slate-500 transition hover:text-slate-800">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
                <GraduationCapIcon size={14} cls="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Özel Ders Pro</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Özel Ders Pro. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
