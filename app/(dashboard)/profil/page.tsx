"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";
import LevelProgressBar from "@/components/dashboard/shared/LevelProgressBar";

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
    <motion.span
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export default function ProfilSayfasi() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [dersFiyati, setDersFiyati] = useState<string>("");
  const [hakkinda, setHakkinda] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) {
        const p = profileData as UserProfile;
        setProfile(p);
        setFullName(p.full_name || "");
        setSehir(p.sehir || "");
        setIlce(p.ilce || "");
        setDersFiyati(p.ders_fiyati != null ? String(p.ders_fiyati) : "");
        setHakkinda(p.hakkinda || "");
        setVideoUrl(p.video_url || "");
        setPortfolioUrl(p.portfolio_url || "");
      }
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      toast.success("Profil fotoğrafı güncellendi!");
    } catch (error: any) {
      toast.error("Fotoğraf yüklenemedi: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!profile) return;

    const updates: Record<string, any> = { full_name: fullName.trim() || null };

    if (profile.role === "hoca") {
      const trimmed = dersFiyati.trim();
      let parsedFiyat: number | null = null;
      if (trimmed !== "") {
        const n = Number(trimmed.replace(",", "."));
        if (!Number.isFinite(n) || n < 0) {
          toast.error("Saatlik fiyat 0 veya daha büyük geçerli bir sayı olmalı.");
          return;
        }
        parsedFiyat = n;
      }
      updates.sehir = sehir.trim() || null;
      updates.ilce = ilce.trim() || null;
      updates.hakkinda = hakkinda.trim() || null;
      updates.ders_fiyati = parsedFiyat;

      const videoTrimmed = videoUrl.trim();
      const portfolioTrimmed = portfolioUrl.trim();

      const isValidHttpUrl = (raw: string): boolean => {
        try {
          const u = new URL(raw);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      };

      if (videoTrimmed && !isValidHttpUrl(videoTrimmed)) {
        toast.error("Tanıtım Videosu linki geçerli bir http/https URL'i olmalı.");
        return;
      }
      if (portfolioTrimmed && !isValidHttpUrl(portfolioTrimmed)) {
        toast.error("Portfolyo linki geçerli bir http/https URL'i olmalı.");
        return;
      }
      updates.video_url = videoTrimmed || null;
      updates.portfolio_url = portfolioTrimmed || null;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("users").update(updates).eq("id", profile.id);
      if (error) throw error;
      setProfile((prev) => (prev ? ({ ...prev, ...updates } as UserProfile) : null));
      toast.success("Profil bilgileri kaydedildi.");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı.");
      return;
    }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Şifreniz başarıyla değiştirildi.");
      setNewPassword("");
    } catch (error: any) {
      toast.error("Şifre değiştirilemedi: " + error.message);
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
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={isHoca ? "/hoca" : "/ogrenci"} className={`font-medium ${theme.back}`}>
            ← Panele Dön
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Profil Ayarları</h1>
        </div>
      </nav>

      <main className="mx-auto mt-6 max-w-3xl p-6">
        <motion.div
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
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
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
              <LevelProgressBar
                level={profile?.level ?? 1}
                xp={profile?.xp ?? 0}
                accent="amber"
                title="Seviye İlerlemen"
              />
            </div>

            <form onSubmit={updateProfile} className="space-y-6">
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                  />
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isHoca && (
                  <motion.section
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
                            value={sehir}
                            onChange={(e) => setSehir(e.target.value)}
                            placeholder="örn. İstanbul"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">İlçe</label>
                          <input
                            type="text"
                            value={ilce}
                            onChange={(e) => setIlce(e.target.value)}
                            placeholder="örn. Kadıköy"
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
                              value={dersFiyati}
                              onChange={(e) => setDersFiyati(e.target.value)}
                              placeholder="örn. 350"
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
                            value={hakkinda}
                            onChange={(e) => setHakkinda(e.target.value)}
                            placeholder="Tecrübenizi, eğitim geçmişinizi ve ders yaklaşımınızı kısaca anlatın..."
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
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://youtu.be/..."
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                          />
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
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
                          />
                          <p className="mt-1 text-[10px] text-slate-400">
                            LinkedIn, kişisel site veya çevrim içi CV bağlantınız olabilir.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-2">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
                >
                  {saving && <Spinner />}
                  {saving ? "Kaydediliyor..." : "Bilgileri Kaydet"}
                </motion.button>
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
                <motion.button
                  type="button"
                  onClick={updatePassword}
                  disabled={pwSaving}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-rose-50 px-6 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-70 sm:w-auto"
                >
                  {pwSaving && (
                    <motion.span
                      aria-hidden
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-rose-300 border-t-rose-700"
                    />
                  )}
                  {pwSaving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
