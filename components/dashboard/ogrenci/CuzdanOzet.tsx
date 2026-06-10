"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

type TxType = "bakiye_yukleme" | "dersten_kazanc" | "ders_odeme" | "iade";
type TxStatus = "beklemede" | "tamamlandi" | "basarisiz";

interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  status: TxStatus;
  description: string | null;
  created_at: string;
}

const TX_LABELS: Record<TxType, string> = {
  bakiye_yukleme: "Bakiye Yükleme",
  dersten_kazanc: "Ders Kazancı",
  ders_odeme:     "Ders Ödemesi",
  iade:           "İade",
};

const TX_SIGN: Record<TxType, "+" | "−"> = {
  bakiye_yukleme: "+",
  dersten_kazanc: "+",
  ders_odeme:     "−",
  iade:           "+",
};

const TX_CLS: Record<TxType, string> = {
  bakiye_yukleme: "text-emerald-600",
  dersten_kazanc: "text-sky-600",
  ders_odeme:     "text-rose-600",
  iade:           "text-amber-600",
};

const STATUS_CLS: Record<TxStatus, string> = {
  tamamlandi: "text-emerald-600",
  beklemede:  "text-amber-500",
  basarisiz:  "text-rose-500",
};

const STATUS_LABEL: Record<TxStatus, string> = {
  tamamlandi: "Tamamlandı",
  beklemede:  "Beklemede",
  basarisiz:  "Başarısız",
};

function fmtTL(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

export default function CuzdanOzet({ userId }: { userId: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        supabase.from("wallets").select("balance").eq("id", userId).maybeSingle(),
        supabase
          .from("wallet_transactions")
          .select("id, amount, type, status, description, created_at")
          .eq("wallet_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (walletRes.data) setBalance(walletRes.data.balance);
      if (txRes.data) setTransactions(txRes.data as Transaction[]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 p-6 text-white shadow-lg"
      >
        <p className="text-sm font-medium text-emerald-100">Mevcut Bakiye</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">
          {fmtTL(balance ?? 0)}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href="/ogrenci/cuzdan"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            + Bakiye Yükle
          </Link>
          <p className="text-xs text-emerald-100">
            Güvenli ödeme · 256-bit SSL · Kartınız kaydedilmez
          </p>
        </div>
      </m.div>

      {/* Transaction list */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Son İşlemler</h2>
          {transactions.length > 0 && (
            <Link
              href="/ogrenci/cuzdan"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Tümünü gör →
            </Link>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="text-3xl">💰</div>
            <p className="font-semibold text-slate-600">Henüz işlem yok</p>
            <p className="text-sm text-slate-400">Bakiye yükleyerek başlayın</p>
            <Link
              href="/ogrenci/cuzdan"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              + Bakiye Yükle
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {tx.description ?? TX_LABELS[tx.type]}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ·{" "}
                    <span className={STATUS_CLS[tx.status]}>
                      {STATUS_LABEL[tx.status]}
                    </span>
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-bold tabular-nums ${TX_CLS[tx.type]}`}>
                  {TX_SIGN[tx.type]}{fmtTL(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </m.div>
    </div>
  );
}
