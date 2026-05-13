"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Role = "ogrenci" | "hoca";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<Role>("ogrenci");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const switchMode = (next: boolean) => {
    setIsLogin(next);
    setError("");
    setSuccess("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (userError) throw userError;

        if (userData.role === "hoca") {
          router.push("/hoca");
        } else {
          router.push("/ogrenci");
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: insertError } = await supabase.from("users").insert([
            {
              id: data.user.id,
              email: email,
              role: role,
            },
          ]);

          if (insertError) throw insertError;

          setSuccess("Kayıt başarılı! Şimdi giriş yapabilirsin.");
          setIsLogin(true);
          setPassword("");
        }
      }
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    // bg-slate-50 kaldırıldı, layout'taki gradient arka planın görünmesi sağlandı
    <div className="font-sans min-h-screen flex text-slate-900">
      {/* SOL: Marka paneli (sadece desktop) - Fade In Animasyonu Eklendi */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-12 flex-col justify-between text-white animate-fadeIn">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" />

        <div className="relative flex items-center gap-2.5 animate-popIn">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-black text-lg ring-1 ring-white/20 shadow-lg">
            Ö
          </div>
          <span className="text-lg font-semibold tracking-tight">Özel Ders Pro</span>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Dersleri planla, ödevleri takip et, kaynakları paylaş.
          </h1>
          <p className="text-white/85 text-base leading-relaxed">
            Hoca ve öğrenciler için tek panelden ders yönetimi. Modern, hızlı, sade.
          </p>
          <ul className="space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Rol bazlı paneller (Hoca / Öğrenci)
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              PDF ve dosya kaynaklarını anında paylaş
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Ders ve ödev durumlarını canlı takip
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-white/70">
          © {new Date().getFullYear()} Özel Ders Pro
        </p>
      </aside>

      {/* SAĞ: Form - Slide Up Animasyonu Eklendi */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 animate-slideUp">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 animate-popIn">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black shadow-md">
              Ö
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-800">Özel Ders Pro</span>
          </div>

          {/* Form Kartına Buzlu Cam (Glassmorphism) ve Premium Gölge Eklendi */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/5 ring-1 ring-white/50 p-7 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {isLogin ? "Tekrar hoş geldin" : "Hesabını oluştur"}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {isLogin
                ? "E-posta ve şifrenle giriş yap."
                : "Birkaç bilgiyle hesabını oluştur, hemen başla."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-1 p-1 bg-slate-100/80 rounded-xl text-sm font-medium">
              <button
                type="button"
                onClick={() => switchMode(true)}
                className={`py-2.5 rounded-lg transition-all duration-300 ${
                  isLogin
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => switchMode(false)}
                className={`py-2.5 rounded-lg transition-all duration-300 ${
                  !isLogin
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleAuth}>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fadeIn"
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fadeIn"
                >
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@eposta.com"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-300 hover:bg-white focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Şifre
                  </label>
                  {isLogin && (
                    <Link
                      href="/sifremi-unuttum"
                      className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
                    >
                      Şifremi Unuttum
                    </Link>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-300 hover:bg-white focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
              </div>

              {!isLogin && (
                <div className="animate-fadeIn">
                  <span className="block text-sm font-semibold text-slate-700 mb-2">
                    Hesap Türü
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                        role === "ogrenci"
                          ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20 shadow-sm"
                          : "border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="ogrenci"
                        checked={role === "ogrenci"}
                        onChange={() => setRole("ogrenci")}
                        className="sr-only"
                      />
                      Öğrenci
                    </label>
                    <label
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                        role === "hoca"
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-sm"
                          : "border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="hoca"
                        checked={role === "hoca"}
                        onChange={() => setRole("hoca")}
                        className="sr-only"
                      />
                      Hoca
                    </label>
                  </div>
                </div>
              )}

              {/* Butona Hover ve Gölge Efektleri Eklendi */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? "İşlem yapılıyor..." : isLogin ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
              {isLogin ? (
                <>
                  Hesabın yok mu?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className="font-bold text-blue-600 transition-colors hover:text-blue-800"
                  >
                    Hemen oluştur
                  </button>
                </>
              ) : (
                <>
                  Zaten hesabın var mı?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className="font-bold text-blue-600 transition-colors hover:text-blue-800"
                  >
                    Giriş yap
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}