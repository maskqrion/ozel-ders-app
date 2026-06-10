"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createInvitation } from "@/app/actions/invitations";

// hocaId prop: geriye dönük uyumluluk için korunur; kota/auth sunucu tarafında
// createInvitation() içinde session'dan doğrulanır.
export default function DavetKarti({ hocaId: _ }: { hocaId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const result = await createInvitation();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      setLink(`${base}/davet?token=${result.token}`);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Davet linki kopyalandı!");
  };

  return (
    <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <p className="mb-3 text-sm font-bold text-blue-700">Öğrenci Davet Et</p>

      {!link ? (
        <button
          onClick={generateLink}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            "🔗"
          )}
          Davet Linki Oluştur
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
            />
            <button
              onClick={copyLink}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Kopyala
            </button>
            <button
              onClick={() => { setLink(null); generateLink(); }}
              className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Yeni Link
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-blue-500">
        Bu linki öğrencinizle paylaşın; link tek kullanımlıktır, 7 gün geçerlidir ve hesabına otomatik bağlanır.
      </p>
    </div>
  );
}
