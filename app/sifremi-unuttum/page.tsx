"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/app/actions/auth";

export default function SifremiUnuttumPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    const result = await sendPasswordResetEmail(values.email);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    reset();
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
            Şifrenizi mi unuttunuz?
          </h1>
          <p className="text-white/85 text-base leading-relaxed">
            E-posta adresinizi girin, size yeni bir şifre oluşturmanız için bir bağlantı gönderelim.
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
            <h2 className="text-2xl font-bold tracking-tight">Şifremi Unuttum</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Hesabınıza bağlı e-posta adresini girin. Sıfırlama bağlantısını göndereceğiz.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@eposta.com"
                  {...register("email")}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Giriş ekranına dön{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
