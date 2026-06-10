"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { validateInvitation, acceptInvitation } from "@/app/actions/invitations";

type Status = "loading" | "invalid" | "ready" | "accepting" | "done";

function DavetIcerik() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus]           = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setErrorMessage("Geçersiz davet bağlantısı.");
      setStatus("invalid");
      return;
    }

    validateInvitation(token).then((result) => {
      if (!result.ok) {
        if (result.authRequired) {
          router.push(`/login?next=${encodeURIComponent(`/davet?token=${token}`)}`);
          return;
        }
        setErrorMessage(result.error);
        setStatus("invalid");
        return;
      }
      setStatus("ready");
    });
  }, [token, router]);

  const handleAccept = async () => {
    if (!token || status === "accepting" || status === "done") return;
    setStatus("accepting");

    const result = await acceptInvitation(token);
    if (!result.ok) {
      toast.error(result.error);
      setStatus("ready");
      return;
    }

    toast.success("Davet kabul edildi. Hoş geldiniz!");
    setStatus("done");
    router.push("/ogrenci");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <p className="text-gray-500 text-sm">Davet doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-100 border-t-4 border-t-red-500 p-8 max-w-md w-full">
          <h1 className="text-lg font-semibold text-gray-800 mb-2">Davet Kabul Edilemedi</h1>
          <p className="text-sm text-red-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-semibold"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 border-t-4 border-t-blue-500 p-8 max-w-md w-full">
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Hoca Daveti</h1>
        <p className="text-sm text-gray-600 mb-6">
          Bir hoca sizi öğrencisi olarak eklemek istiyor. Daveti kabul ederseniz
          hocanız sizinle ders planlayabilir ve ödev verebilir.
        </p>
        <button
          onClick={handleAccept}
          disabled={status === "accepting" || status === "done"}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
        >
          {status === "accepting" ? "Kabul ediliyor..." : "Daveti Kabul Et"}
        </button>
      </div>
    </div>
  );
}

export default function DavetSayfasi() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
            <p className="text-gray-500 text-sm">Davet yükleniyor...</p>
          </div>
        </div>
      }
    >
      <DavetIcerik />
    </Suspense>
  );
}
