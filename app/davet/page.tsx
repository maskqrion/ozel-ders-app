"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

import { UserProfile, Invitation } from "@/lib/types";

type Status = "loading" | "invalid" | "wrong-role" | "ready" | "accepting" | "done";

function DavetIcerik() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setErrorMessage("Geçersiz veya kullanılmış davet linki.");
        setStatus("invalid");
        return;
      }

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push(`/login?next=${encodeURIComponent(`/davet?token=${token}`)}`);
          return;
        }

        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (!profileData) {
          setErrorMessage("Kullanıcı profiliniz bulunamadı.");
          setStatus("invalid");
          return;
        }
        setProfile(profileData as UserProfile);

        if ((profileData as UserProfile).role !== "ogrenci") {
          setErrorMessage("Davet linki yalnızca öğrenci hesapları tarafından kabul edilebilir.");
          setStatus("wrong-role");
          return;
        }

        const { data: invitationData, error: invitationError } = await supabase
          .from("invitations")
          .select("id, hoca_id, token, is_used, created_at")
          .eq("token", token)
          .eq("is_used", false)
          .maybeSingle();

        if (invitationError || !invitationData) {
          setErrorMessage("Geçersiz veya kullanılmış davet linki.");
          setStatus("invalid");
          return;
        }

        setInvitation(invitationData as Invitation);
        setStatus("ready");
      } catch (err) {
        console.error("Davet yüklenemedi:", err);
        setErrorMessage("Geçersiz veya kullanılmış davet linki.");
        setStatus("invalid");
      }
    };

    init();
  }, [router, token]);

  const daveti_kabul_et = async () => {
    if (!invitation || !profile) return;
    setStatus("accepting");

    try {
      const { error: linkError } = await supabase.from("teacher_students").insert([
        { hoca_id: invitation.hoca_id, ogrenci_id: profile.id },
      ]);
      if (linkError && linkError.code !== "23505") {
        throw linkError;
      }

      const { error: useError } = await supabase
        .from("invitations")
        .update({ is_used: true })
        .eq("id", invitation.id)
        .eq("is_used", false);

      if (useError) throw useError;

      toast.success("Davet kabul edildi. Hoş geldiniz!");
      setStatus("done");
      router.push("/ogrenci");
    } catch (err: any) {
      toast.error("Hata: " + (err?.message ?? "Davet kabul edilemedi."));
      setStatus("ready");
    }
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

  if (status === "invalid" || status === "wrong-role") {
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
          Bir hoca sizi öğrencisi olarak eklemek istiyor. Daveti kabul ederseniz hocanız sizinle ders planlayabilir ve ödev verebilir.
        </p>
        <button
          onClick={daveti_kabul_et}
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
