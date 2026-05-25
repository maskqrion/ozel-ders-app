"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Beklenmeyen bir hata oluştu</h2>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Bir şeyler ters gitti. Lütfen tekrar deneyin.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
