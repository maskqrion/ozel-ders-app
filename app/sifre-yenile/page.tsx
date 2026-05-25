"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { getErrorMessage } from "@/lib/utils/errorHandler";

export default function SifreYenilePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }
    toast.success("Şifreniz başarıyla güncellendi. Lütfen tekrar giriş yapın.");
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="font-sans min-h-screen flex bg-slate-50 text-slate-900">
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
            Yeni şifrenizi belirleyin
          </h1>
          <p className="text-white/85 text-base leading-relaxed">
            Hesabınızı korumak için güçlü ve daha önce kullanmadığınız bir şifre seçin.
          </p>
        </div>

        <p className="relative text-xs text-white/70">
          © {new Date().getFullYear()} Özel Ders Pro
        </p>
      </aside>

      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black">
              Ö
            </div>
            <span className="text-lg font-semibold tracking-tight">Özel Ders Pro</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 p-7 sm:p-9">
            <h2 className="text-2xl font-bold tracking-tight">Şifre Yenile</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Yeni şifrenizi iki kez girerek güncelleyin.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Yeni Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
