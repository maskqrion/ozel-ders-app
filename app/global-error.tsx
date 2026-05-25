"use client";

import { AlertOctagon } from "lucide-react";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="tr">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-white">
          <AlertOctagon className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Kritik Hata</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenileyerek tekrar deneyin.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Sayfayı Yenile
            </button>
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
