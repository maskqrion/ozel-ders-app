"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-5 bg-slate-50 p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
        <AlertTriangle className="h-8 w-8 text-accent" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Bir şeyler ters gitti</h2>
        <p className="max-w-xs text-sm text-slate-500">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover active:bg-accent-deep"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
