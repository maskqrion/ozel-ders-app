"use client";

import { useCallback, useEffect, useState } from "react";
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
  ders_odeme: "Ders Ödemesi",
  iade: "İade",
};

const TX_COLORS: Record<TxType, string> = {
  bakiye_yukleme: "text-sky-600 bg-sky-50",
  dersten_kazanc: "text-emerald-600 bg-emerald-50",
  ders_odeme: "text-rose-600 bg-rose-50",
  iade: "text-amber-600 bg-amber-50",
};

const STATUS_LABELS: Record<TxStatus, string> = {
  tamamlandi: "Tamamlandı",
  beklemede: "Beklemede",
  basarisiz: "Başarısız",
};

export default function HocaCuzdani({ userId }: { userId: string }) {
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
          .limit(50),
      ]);
      if (walletRes.data) setBalance(walletRes.data.balance);
      if (txRes.data) setTransactions(txRes.data as Transaction[]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const totalEarned = transactions
    .filter((t) => t.type === "dersten_kazanc" && t.status === "tamamlandi")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-lg"
      >
        <p className="text-sm font-medium text-indigo-200">Mevcut Bakiye</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">
          ₺{(balance ?? 0).toFixed(2)}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-indigo-200">
          <span>
            Toplam Kazanç:{" "}
            <span className="font-bold text-white">₺{totalEarned.toFixed(2)}</span>
          </span>
          <span>
            İşlem:{" "}
            <span className="font-bold text-white">{transactions.length}</span>
          </span>
        </div>
      </m.div>

      {/* Transaction list */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">İşlem Geçmişi</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Henüz işlem yok.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isCredit = tx.type === "dersten_kazanc" || tx.type === "bakiye_yukleme" || tx.type === "iade";
              return (
                <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${TX_COLORS[tx.type]}`}
                  >
                    {isCredit ? "+" : "−"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
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
                      <span
                        className={
                          tx.status === "tamamlandi"
                            ? "text-emerald-600"
                            : tx.status === "basarisiz"
                              ? "text-rose-500"
                              : "text-amber-500"
                        }
                      >
                        {STATUS_LABELS[tx.status]}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {isCredit ? "+" : "−"}₺{tx.amount.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </m.div>
    </div>
  );
}
