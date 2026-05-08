"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User as AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

type Profile = Pick<User, "email" | "role" | "full_name">;
type Msg = { type: "success" | "error"; text: string } | null;

export default function ProfilPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const [passwordMsg, setPasswordMsg] = useState<Msg>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user;
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data, error } = await supabase
        .from("users")
        .select("email, role, full_name")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        setProfileMsg({ type: "error", text: error.message });
      } else if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);

    const trimmed = fullName.trim();
    const { error } = await supabase
      .from("users")
      .update({ full_name: trimmed || null })
      .eq("id", user.id);

    setSavingProfile(false);

    if (error) {
      setProfileMsg({ type: "error", text: error.message });
    } else {
      setProfileMsg({ type: "success", text: "Profil bilgilerin güncellendi." });
      setProfile((p) => (p ? { ...p, full_name: trimmed || null } : p));
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Şifre en az 6 karakter olmalı." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Şifreler eşleşmiyor." });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordMsg({ type: "error", text: error.message });
    } else {
      setPasswordMsg({ type: "success", text: "Şifren güncellendi." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-sans">
        Yükleniyor...
      </div>
    );
  }

  const isHoca = profile?.role === "hoca";
  const panelHref = isHoca ? "/hoca" : "/ogrenci";
  const initials = (profile?.full_name || profile?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="font-sans min-h-screen bg-slate-50 text-slate-900 pb-20">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href={panelHref}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← Panele dön
          </Link>
          <h1
            className={`text-xl font-bold ${
              isHoca ? "text-blue-600" : "text-green-600"
            }`}
          >
            Profilim
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-md hover:bg-red-100"
        >
          Çıkış Yap
        </button>
      </nav>

      <main className="p-6 max-w-3xl mx-auto mt-6 space-y-6">
        <div
          className={`bg-white p-6 rounded-lg shadow-sm border border-slate-100 border-t-4 ${
            isHoca ? "border-t-blue-500" : "border-t-green-500"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                isHoca
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                  : "bg-gradient-to-br from-green-500 to-emerald-600"
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">
                {profile?.full_name || "İsim belirtilmemiş"}
              </p>
              <p className="text-sm text-slate-500 truncate">{profile?.email}</p>
              <span
                className={`mt-1.5 inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  isHoca
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Profil Bilgileri
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            {profileMsg && (
              <div
                role={profileMsg.type === "success" ? "status" : "alert"}
                className={`rounded-lg border px-3.5 py-3 text-sm ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-red-50 border-red-100 text-red-700"
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                E-posta
              </label>
              <input
                type="email"
                disabled
                value={profile?.email ?? ""}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">
                E-posta değiştirilemez.
              </p>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-700"
              >
                Ad Soyad
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Örn. Deniz Çakın"
                maxLength={120}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Hesap Türü
              </label>
              <input
                type="text"
                disabled
                value={profile?.role ?? ""}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed capitalize"
              />
              <p className="text-xs text-slate-400 mt-1">
                Hesap türü değiştirilemez.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingProfile ? "Kaydediliyor..." : "Bilgileri Kaydet"}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Şifre Değiştir
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Yeni şifren en az 6 karakter olmalı.
          </p>
          <form onSubmit={changePassword} className="space-y-4">
            {passwordMsg && (
              <div
                role={passwordMsg.type === "success" ? "status" : "alert"}
                className={`rounded-lg border px-3.5 py-3 text-sm ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-red-50 border-red-100 text-red-700"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Yeni Şifre
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Yeni Şifre (Tekrar)
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {savingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
