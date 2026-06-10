"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";
import type { UserProfile } from "@/lib/types";
import LevelProgressBar from "@/components/dashboard/shared/LevelProgressBar";
import { useUploadFile } from "@/lib/hooks/useStorage";
import { profileUpdateSchema, type ProfileUpdateFormValues } from "@/lib/validations/auth";
import { getErrorMessage } from "@/lib/utils/errorHandler";

type RoleTheme = {
  back: string;
  coverFrom: string;
  coverTo: string;
  badgeBg: string;
  badgeText: string;
};

const ROLE_THEME: Record<"hoca" | "ogrenci", RoleTheme> = {
  hoca: {
    back: "text-blue-600 hover:text-blue-700",
    coverFrom: "from-blue-400",
    coverTo: "to-sky-300",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
  ogrenci: {
    back: "text-emerald-600 hover:text-emerald-700",
    coverFrom: "from-emerald-400",
    coverTo: "to-teal-300",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
};

function Spinner() {
  return (
    <m.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export default function ProfilSayfasi() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: uploadFile, isPending: uploading } = useUploadFile();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) { router.push("/login"); return; }
      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) {
        const p = profileData as UserProfile;
        setProfile(p);
        reset({
          full_name: p.full_name || "",
          sehir: p.sehir || "",
          ilce: p.ilce || "",
          hakkinda: p.hakkinda || "",
          ders_fiyati: p.ders_fiyati != null ? String(p.ders_fiyati) : "",
          identity_number: p.identity_number || "",
          video_url: p.video_url || "",
          portfolio_url: p.portfolio_url || "",
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, [router, reset]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      const path = await uploadFile({ file, folder: `avatarlar/${profile.id}` });
      const { data } = await supabase.storage.from("kaynaklar").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (!data?.signedUrl) throw new Error("URL alınamadı.");
      const { error } = await supabase.from("users").update({ avatar_url: data.signedUrl }).eq("id", profile.id);
      if (error) throw error;
      setProfile((prev) => prev ? { ...prev, avatar_url: data.signedUrl } : null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil fotoğrafı güncellendi!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onSubmit = (values: ProfileUpdateFormValues) => {
    if (!profile) return;

    const updates: {
      full_name?: string | null;
      sehir?: string | null;
      ilce?: string | null;
      hakkinda?: string | null;
      ders_fiyati?: number | null;
      identity_number?: string | null;
      video_url?: string | null;
      portfolio_url?: string | null;
    } = {
      full_name: values.full_name?.trim() || null,
      identity_number: values.identity_number?.trim() || null,
    };

    if (profile.role === "hoca") {
      const trimmed = (values.ders_fiyati || "").trim();
      let parsedFiyat: number | null = null;
      if (trimmed !== "") {
        const n = Number(trimmed.replace(",", "."));
        if (!Number.isFinite(n) || n < 0) {
          toast.error("Saatlik fiyat 0 veya daha büyük geçerli bir sayı olmalı.");
          return;
        }
        parsedFiyat = n;
      }
      updates.sehir = values.sehir?.trim() || null;
      updates.ilce = values.ilce?.trim() || null;
      updates.hakkinda = values.hakkinda?.trim() || null;
      updates.ders_fiyati = parsedFiyat;
      updates.video_url = values.video_url?.trim() || null;
      updates.portfolio_url = values.portfolio_url?.trim() || null;
    }

    startTransition(async () => {
      const result = await updateProfile(updates);
      if (result.error) { toast.error(result.error); return; }
      setProfile((prev) => prev ? { ...prev, ...updates } as UserProfile : null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil bilgileri kaydedildi.");
    });
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) { toast.error("Şifre en az 6 karakter olmalı."); return; }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Şifreniz başarıyla değiştirildi.");
      setNewPassword("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Yükleniyor...
      </div>
    );
  }

  const role = profile?.role ?? "ogrenci";
  const theme = ROLE_THEME[role];
  const isHoca = role === "hoca";

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={isHoca ? "/hoca" : "/ogrenci"} className={`font-medium ${theme.back}`}>
            ← Panele Dön
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Profil Ayarları</h1>
        </div>
      </nav>

      <main className="mx-auto mt-6 max-w-3xl p-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className={`h-32 bg-gradient-to-r ${theme.coverFrom} ${theme.coverTo}`} />

          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-8 flex items-end justify-between">
              <div className="group relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-slate-700 p-1.5 text-white shadow-lg transition hover:bg-slate-800">
                  {uploading ? <Spinner /> : <span className="text-xs">📷</span>}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${theme.badgeBg} ${theme.badgeText}`}
                >
                  {role} Hesabı
                </span>
              </div>
            </div>

            <div className="mb-6">
              <LevelProgressBar accent="amber" title="Seviye İlerlemen" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">E-posta adresi değiştirilemez.</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="Adınız Soyadınız"
                    {...register("full_name")}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                  {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  TC Kimlik Numarası
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="11 haneli TC kimlik numaranız"
                  {...register("identity_number")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15"
                />
                {errors.identity_number && (
                  <p className="mt-1 text-sm text-red-500">{errors.identity_number.message}</p>
                )}
                <p className="mt-1 text-[10px] text-slate-400">
                  Ödeme işlemleri için zorunludur. Güvenli şekilde saklanır, üçüncü taraflarla paylaşılmaz.
                </p>
              </div>

              <AnimatePresence initial={false}>
                {isHoca && (
                  <m.section
                    key="hoca-fields"
                    initial={{ opacity: 0, y: 8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                          Eğitmen Profili
                        </span>
                        <p className="text-xs text-slate-500">
                          Bu bilgiler "Öğretmen Bul" arama sonuçlarında öğrencilere gösterilir.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Şehir (İl)</label>
                          <input
                            type="text"
                            placeholder="örn. İstanbul"
                            {...register("sehir")}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">İlçe</label>
                          <input
                            type="text"
                            placeholder="örn. Kadıköy"
                            {...register("ilce")}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Saatlik Ders Fiyatı
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              placeholder="örn. 350"
                              {...register("ders_fiyati")}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pr-14 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-400">
                              ₺ / saat
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Boş bırakırsanız fiyat kartınızda "belirtilmemiş" olarak görünür.
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Hakkımda / Kimliğim
                          </label>
                          <textarea
                            rows={5}
                            placeholder="Tecrübenizi, eğitim geçmişinizi ve ders yaklaşımınızı kısaca anlatın..."
                            {...register("hakkinda")}
                            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                          />
                          <p className="mt-1 text-[10px] text-slate-400">
                            Bu metin hoca kartınızda 3 satıra kadar gösterilir.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/60 via-white to-emerald-50/40 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700">
                          Gelişmiş Tanıtım
                        </span>
                        <p className="text-xs text-slate-500">
                          Öğrencilerin sizi daha iyi tanıması için video ve portfolyo bağlantılarınızı ekleyin.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span aria-hidden>🎬</span>
                            Tanıtım Videosu Linki (YouTube / Vimeo)
                          </label>
                          <input
                            type="url"
                            inputMode="url"
                            placeholder="https://youtu.be/..."
                            {...register("video_url")}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                          />
                          {errors.video_url && <p className="mt-1 text-sm text-red-500">{errors.video_url.message}</p>}
                          <p className="mt-1 text-[10px] text-slate-400">
                            Kendinizi kısaca tanıttığınız videonun bağlantısı.
                          </p>
                        </div>
                        <div>
                          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span aria-hidden>📂</span>
                            Portfolyo / CV Linki
                          </label>
                          <input
                            type="url"
                            inputMode="url"
                            placeholder="https://..."
                            {...register("portfolio_url")}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                          />
                          {errors.portfolio_url && <p className="mt-1 text-sm text-red-500">{errors.portfolio_url.message}</p>}
                          <p className="mt-1 text-[10px] text-slate-400">
                            LinkedIn, kişisel site veya çevrim içi CV bağlantınız olabilir.
                          </p>
                        </div>
                      </div>
                    </div>
                  </m.section>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-2">
                <m.button
                  type="submit"
                  disabled={isPending}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-70"
                >
                  {isPending && <Spinner />}
                  {isPending ? "Kaydediliyor..." : "Bilgileri Kaydet"}
                </m.button>
              </div>
            </form>

            <hr className="my-6 border-slate-100" />

            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-800">Güvenlik</h3>
              <div className="flex flex-col items-end gap-4 sm:flex-row">
                <div className="w-full flex-1">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Yeni Şifre</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800 transition focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-500/15"
                  />
                </div>
                <m.button
                  type="button"
                  onClick={updatePassword}
                  disabled={pwSaving}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-rose-50 px-6 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-70 sm:w-auto"
                >
                  {pwSaving && (
                    <m.span
                      aria-hidden
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-rose-300 border-t-rose-700"
                    />
                  )}
                  {pwSaving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                </m.button>
              </div>
            </div>
          </div>
        </m.div>
      </main>
    </div>
  );
}
