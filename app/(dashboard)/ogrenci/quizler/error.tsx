"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function QuizlerError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
        <AlertTriangle className="h-7 w-7 text-rose-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800">Quizler yüklenemedi</h2>
        <p className="mt-1 text-sm text-slate-500">Beklenmeyen bir hata oluştu.</p>
      </div>
      <button
        onClick={unstable_retry}
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
