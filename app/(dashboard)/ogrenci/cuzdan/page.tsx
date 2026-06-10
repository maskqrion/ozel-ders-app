"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { simulateDeposit } from "@/app/actions/wallet";
import { initiate3DSecureDeposit, type PaymentCard } from "@/app/actions/payment";

/* ── Types ──────────────────────────────────────────────────── */
type TxType   = "bakiye_yukleme" | "dersten_kazanc" | "ders_odeme" | "iade";
type TxStatus = "beklemede" | "tamamlandi" | "basarisiz";

interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  status: TxStatus;
  wallet_id: string;
  description: string | null;
  created_at: string;
}

/* ── Icons ──────────────────────────────────────────────────── */
type IconProps = { size?: number; strokeWidth?: number; className?: string };

const IconBase = ({
  children,
  size = 24,
  strokeWidth = 1.75,
  className = "",
}: IconProps & { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const WalletIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </IconBase>
);
const ShieldIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);
const TrendingUpIcon = (p: IconProps) => (
  <IconBase {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </IconBase>
);
const PlusIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </IconBase>
);
const ArrowDownIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </IconBase>
);
const ArrowUpIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </IconBase>
);
const LockIcon = (p: IconProps) => (
  <IconBase {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconBase>
);
const UnlockIcon = (p: IconProps) => (
  <IconBase {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 1 1 1 9.9-1" />
  </IconBase>
);
const CheckCircleIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);
const ClockIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </IconBase>
);
const XCircleIcon = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </IconBase>
);
const ArrowLeftIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </IconBase>
);
const GraduationCapIcon = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </IconBase>
);

/* ── Helpers ────────────────────────────────────────────────── */
const PRESETS = [50, 100, 250, 500] as const;

function fmtTL(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── Transaction display config ─────────────────────────────── */
const TX_CFG: Record<
  TxType,
  { label: string; sign: "+" | "-"; amountCls: string; iconBg: string; iconCls: string; Icon: (p: IconProps) => React.JSX.Element }
> = {
  bakiye_yukleme:  { label: "Bakiye Yükleme",    sign: "+", amountCls: "text-emerald-600 font-bold", iconBg: "bg-emerald-50", iconCls: "text-emerald-500", Icon: ArrowDownIcon  },
  ders_odeme:      { label: "Ders Ödemesi",       sign: "-", amountCls: "text-rose-600 font-bold",    iconBg: "bg-rose-50",    iconCls: "text-rose-500",    Icon: ArrowUpIcon    },
  dersten_kazanc:  { label: "Ders Kazancı",       sign: "+", amountCls: "text-sky-600 font-bold",     iconBg: "bg-sky-50",     iconCls: "text-sky-500",     Icon: UnlockIcon     },
  iade:            { label: "İade",               sign: "+", amountCls: "text-amber-600 font-bold",   iconBg: "bg-amber-50",   iconCls: "text-amber-500",   Icon: LockIcon       },
};

const STATUS_CFG: Record<
  TxStatus,
  { label: string; cls: string; Icon: (p: IconProps) => React.JSX.Element }
> = {
  tamamlandi: { label: "Tamamlandı", cls: "bg-emerald-50 text-emerald-700", Icon: CheckCircleIcon },
  beklemede:  { label: "Beklemede",  cls: "bg-amber-50 text-amber-700",     Icon: ClockIcon       },
  basarisiz:  { label: "Başarısız",  cls: "bg-rose-50 text-rose-700",       Icon: XCircleIcon     },
};

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
type PaymentMode = "simulate" | "card";

export default function CuzdanPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [userId,       setUserId]       = useState<string | null>(null);
  const [balance,      setBalance]      = useState(0);
  const [updatedAt,    setUpdatedAt]    = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [depositing,   setDepositing]   = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount,   setCustomAmount]   = useState("");

  // 3DS card form state
  const isIyzicoEnabled = process.env.NEXT_PUBLIC_IYZICO_ENABLED === "true";
  const [paymentMode,  setPaymentMode]  = useState<PaymentMode>(isIyzicoEnabled ? "card" : "simulate");
  const [cardHolder,   setCardHolder]   = useState("");
  const [cardNumber,   setCardNumber]   = useState("");
  const [expireMonth,  setExpireMonth]  = useState("");
  const [expireYear,   setExpireYear]   = useState("");
  const [cvc,          setCvc]          = useState("");

  // 3DS iframe
  const [tdsHtml,      setTdsHtml]      = useState<string | null>(null);

  /* ── Fetch transactions only (used after deposit) ── */
  const fetchTransactions = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("wallet_transactions")
      .select("id, amount, type, status, wallet_id, description, created_at")
      .eq("wallet_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setTransactions(data as unknown as Transaction[]);
  }, []);

  /* ── Full data fetch (wallet + transactions) ── */
  const fetchData = useCallback(
    async (uid: string) => {
      const [walletRes] = await Promise.all([
        supabase
          .from("wallets")
          .select("balance, updated_at")
          .eq("id", uid)
          .maybeSingle(),
        fetchTransactions(uid),
      ]);

      if (walletRes.data) {
        setBalance(walletRes.data.balance as number);
        setUpdatedAt(walletRes.data.updated_at as string);
      }
    },
    [fetchTransactions],
  );

  /* ── Auth guard ── */
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          await supabase.auth.signOut();
          return router.push("/login");
        }
        setUserId(user.id);
        await fetchData(user.id);
      } catch (err: unknown) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, fetchData]);

  /* ── 3DS callback sonucu ── */
  const callbackSuccess = searchParams.get("success");
  const callbackError   = searchParams.get("error");

  useEffect(() => {
    if (!userId) return;
    if (callbackSuccess === "1") {
      toast.success("Ödeme başarılı! Bakiyeniz güncellendi.", { icon: "🔒" });
      fetchData(userId);
    } else if (callbackError) {
      const msgs: Record<string, string> = {
        "3ds_failed":          "3D Secure doğrulaması başarısız.",
        "payment_failed":      "Ödeme tamamlanamadı. Lütfen tekrar deneyin.",
        "deposit_failed":      "Bakiye güncellenemedi. Destek ekibiyle iletişime geçin.",
        "intent_not_found":    "Ödeme oturumu bulunamadı. Lütfen tekrar deneyin.",
        "unexpected":          "Beklenmeyen bir hata oluştu.",
        "callback_parse":      "Ödeme yanıtı işlenemedi. Lütfen tekrar deneyin.",
        "missing_conversation": "Ödeme oturumu eksik. Lütfen tekrar başlatın.",
        "already_processed":   "Bu ödeme zaten işlendi.",
      };
      const msg = msgs[callbackError] ?? "Ödeme başarısız oldu.";
      if (callbackError === "already_processed") {
        toast(msg, { icon: "ℹ️" });
        fetchData(userId);
      } else {
        toast.error(msg);
      }
    }
  }, [userId, fetchData, callbackSuccess, callbackError]);

  /* ── Simüle deposit ── */
  const handleSimDeposit = async () => {
    const rawAmount = selectedPreset ?? parseFloat(customAmount.replace(",", "."));
    if (!userId || !rawAmount || rawAmount <= 0) {
      toast.error("Lütfen geçerli bir tutar seçin.");
      return;
    }
    if (depositing) return;
    setDepositing(true);
    try {
      const result = await simulateDeposit(rawAmount);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBalance(result.newBalance);
      setUpdatedAt(new Date().toISOString());
      await fetchTransactions(userId);
      setSelectedPreset(null);
      setCustomAmount("");
      toast.success(`+${fmtTL(rawAmount)} bakiyenize eklendi!`, {
        icon: "💰",
        style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 600 },
      });
    } finally {
      setDepositing(false);
    }
  };

  /* ── 3DS deposit ── */
  const handle3DSDeposit = async () => {
    const rawAmount = selectedPreset ?? parseFloat(customAmount.replace(",", "."));
    if (!rawAmount || rawAmount <= 0) {
      toast.error("Lütfen geçerli bir tutar seçin.");
      return;
    }
    if (!cardHolder || !cardNumber || !expireMonth || !expireYear || !cvc) {
      toast.error("Lütfen tüm kart bilgilerini doldurun.");
      return;
    }
    if (depositing) return;
    setDepositing(true);
    try {
      const card: PaymentCard = {
        cardHolderName: cardHolder,
        cardNumber:     cardNumber.replace(/\s/g, ""),
        expireMonth,
        expireYear,
        cvc,
      };
      const result = await initiate3DSecureDeposit(rawAmount, card);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // base64 decode → bank HTML
      try {
        const decoded = atob(result.htmlContent);
        setTdsHtml(decoded);
      } catch {
        toast.error("3DS sayfası yüklenemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setDepositing(false);
    }
  };

  const handleDeposit = () =>
    paymentMode === "simulate" ? handleSimDeposit() : handle3DSDeposit();

  const depositAmount = selectedPreset ?? (customAmount ? parseFloat(customAmount.replace(",", ".")) : null);
  const depositValid  = depositAmount !== null && depositAmount > 0 && !isNaN(depositAmount);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-emerald-50 font-medium text-emerald-600">
        Yükleniyor...
      </div>
    );
  }

  /* ── Page ── */
  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800">

      {/* ── 3DS iframe modal ── */}
      <AnimatePresence>
        {tdsHtml && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4"
          >
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl bg-white overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <LockIcon size={16} strokeWidth={2} className="text-emerald-500" />
                  <span className="font-semibold text-slate-800 text-sm">3D Secure Doğrulama</span>
                </div>
                <button
                  onClick={() => setTdsHtml(null)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="px-5 py-3 text-xs text-slate-500 bg-emerald-50 border-b border-emerald-100">
                Bankanızın güvenlik sayfasına yönlendiriliyorsunuz. Bu pencereyi kapatmayın.
              </p>
              <iframe
                srcDoc={tdsHtml}
                className="w-full h-[420px] border-0"
                sandbox="allow-forms allow-scripts allow-top-navigation allow-same-origin"
                title="3D Secure Doğrulama"
              />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-100 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/ogrenci"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
          >
            <ArrowLeftIcon size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Panele Dön</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
              <GraduationCapIcon size={14} strokeWidth={2.2} className="text-white" />
            </div>
            <span className="font-bold text-emerald-600">Cüzdanım</span>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Page title */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-400 shadow-lg shadow-emerald-500/20">
            <WalletIcon size={22} strokeWidth={2} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
              Cüzdanım ve Ödemeler
            </h1>
            <p className="text-sm text-slate-500">
              Bakiyenizi yönetin ve işlem geçmişinizi takip edin
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mb-8 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2 shadow-sm">
            <ShieldIcon size={16} strokeWidth={2} className="text-emerald-500" />
            <span className="text-sm text-slate-600">256-bit SSL Güvenlik</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2 shadow-sm">
            <TrendingUpIcon size={16} strokeWidth={2} className="text-sky-500" />
            <span className="text-sm text-slate-600">Anlık Bakiye Güncelleme</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ── Left: Balance Card ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Card header */}
            <div className="rounded-t-2xl bg-gradient-to-br from-emerald-500 to-sky-500 p-6">
              <div className="mb-1 flex items-center gap-2 text-emerald-100">
                <WalletIcon size={16} strokeWidth={2} />
                <span className="text-sm font-medium uppercase tracking-wide">Mevcut Bakiye</span>
              </div>
              <div className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                {fmtTL(balance)}
              </div>
              {updatedAt && (
                <p className="mt-2 text-xs text-emerald-100/80">
                  Son güncelleme: {fmtDate(updatedAt)}
                </p>
              )}
            </div>

            {/* Deposit section */}
            <div className="flex flex-1 flex-col gap-5 p-6">
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">Hızlı Yükleme</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedPreset(selectedPreset === amount ? null : amount);
                        setCustomAmount("");
                      }}
                      className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                        selectedPreset === amount
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/60"
                      }`}
                    >
                      {amount}₺
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Özel Tutar</p>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-emerald-400 focus-within:bg-white transition">
                  <span className="text-sm font-bold text-slate-400">₺</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0,00"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPreset(null);
                    }}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <AnimatePresence>
                {depositValid && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <span className="font-semibold">{fmtTL(depositAmount!)}</span> bakiyenize eklenecek.
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {/* ── Ödeme modu seçici ── */}
              {isIyzicoEnabled && (
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  {(["card", "simulate"] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`flex-1 py-2 text-xs font-semibold transition ${
                        paymentMode === mode
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {mode === "card" ? "🔒 Kredi Kartı (3DS)" : "🧪 Simülasyon"}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Kart formu (3DS) ── */}
              <AnimatePresence>
                {paymentMode === "card" && (
                  <m.div
                    key="card-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-1">Kart Bilgileri</p>
                      <input
                        type="text"
                        placeholder="Kart Sahibi Adı Soyadı"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                        autoComplete="cc-name"
                      />
                      <input
                        type="text"
                        placeholder="Kart Numarası"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-emerald-400"
                        autoComplete="cc-number"
                        maxLength={16}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Ay (01-12)"
                          value={expireMonth}
                          onChange={(e) => setExpireMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                          autoComplete="cc-exp-month"
                          maxLength={2}
                        />
                        <input
                          type="text"
                          placeholder="Yıl (YYYY)"
                          value={expireYear}
                          onChange={(e) => setExpireYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                          autoComplete="cc-exp-year"
                          maxLength={4}
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                          autoComplete="cc-csc"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleDeposit}
                disabled={!depositValid || depositing}
                className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition ${
                  depositValid && !depositing
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
                    : "cursor-not-allowed bg-slate-200 text-slate-400"
                }`}
              >
                {depositing ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                    </svg>
                    {paymentMode === "card" ? "3DS hazırlanıyor..." : "Yükleniyor..."}
                  </span>
                ) : (
                  <>
                    {paymentMode === "card" ? (
                      <><LockIcon size={16} strokeWidth={2.5} /> 3D Secure ile Öde</>
                    ) : (
                      <><PlusIcon size={16} strokeWidth={2.5} /> Bakiye Yükle</>
                    )}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                {paymentMode === "card"
                  ? "256-bit SSL şifrelemeli güvenli ödeme · Kartınız kaydedilmez"
                  : "Simülasyon modu — gerçek ödeme alınmaz"}
              </p>
            </div>
          </m.div>

          {/* ── Right: Transaction History ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:min-h-[600px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-800">İşlem Geçmişi</h2>
              {transactions.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {transactions.length} işlem
                </span>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <WalletIcon size={24} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600">Henüz işlem yok</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Bakiye yükleyerek başlayın
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  <AnimatePresence initial={false}>
                    {transactions.map((tx) => {
                      const txCfg     = TX_CFG[tx.type];
                      const statusCfg = STATUS_CFG[tx.status];
                      const TxIcon    = txCfg.Icon;
                      const StIcon    = statusCfg.Icon;
                      return (
                        <m.li
                          key={tx.id}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition"
                        >
                          {/* Icon */}
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${txCfg.iconBg}`}
                          >
                            <TxIcon size={16} strokeWidth={2} className={txCfg.iconCls} />
                          </div>

                          {/* Info */}
                          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-semibold text-slate-700 truncate">
                              {txCfg.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              {fmtDateShort(tx.created_at)}
                            </span>
                          </div>

                          {/* Amount + Status */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-sm ${txCfg.amountCls}`}>
                              {txCfg.sign}{fmtTL(tx.amount)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusCfg.cls}`}
                            >
                              <StIcon size={10} strokeWidth={2.5} />
                              {statusCfg.label}
                            </span>
                          </div>
                        </m.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </m.div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldIcon size={14} strokeWidth={2} className="text-emerald-500" />
              <span>Tüm ödemeleriniz 3D Secure ile korunmaktadır</span>
            </div>
            <div className="flex items-center gap-5 text-sm text-slate-400">
              <a href="mailto:destek@ozelderspro.com" className="transition hover:text-slate-700">Yardım</a>
              <a href="/gizlilik" className="transition hover:text-slate-700">Gizlilik</a>
              <a href="/kullanim-kosullari" className="transition hover:text-slate-700">Kullanım Koşulları</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
