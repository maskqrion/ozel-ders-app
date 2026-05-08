"use client";

import { useState } from "react";
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
    <div className="font-sans min-h-screen flex bg-slate-50 text-slate-900">
      {/* SOL: Marka paneli (sadece desktop) */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-12 flex-col justify-between text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-black text-lg ring-1 ring-white/20">
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

      {/* SAĞ: Form */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black">
              Ö
            </div>
            <span className="text-lg font-semibold tracking-tight">Özel Ders Pro</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 p-7 sm:p-9">
            <h2 className="text-2xl font-bold tracking-tight">
              {isLogin ? "Tekrar hoş geldin" : "Hesabını oluştur"}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {isLogin
                ? "E-posta ve şifrenle giriş yap."
                : "Birkaç bilgiyle hesabını oluştur, hemen başla."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-sm font-medium">
              <button
                type="button"
                onClick={() => switchMode(true)}
                className={`py-2 rounded-md transition-all ${
                  isLogin
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => switchMode(false)}
                className={`py-2 rounded-md transition-all ${
                  !isLogin
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleAuth}>
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700"
                >
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
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
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
              </div>

              {!isLogin && (
                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-1.5">
                    Hesap Türü
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium text-center transition ${
                        role === "ogrenci"
                          ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/15"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                      className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium text-center transition ${
                        role === "hoca"
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/15"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "İşlem yapılıyor..." : isLogin ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              {isLogin ? (
                <>
                  Hesabın yok mu?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className="font-semibold text-blue-600 hover:text-blue-700"
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
                    className="font-semibold text-blue-600 hover:text-blue-700"
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
