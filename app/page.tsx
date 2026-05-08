import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-emerald-50/40 p-6 text-slate-900">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
            Ö
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Özel Ders Pro
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Dersleri planla.
          <br />
          Ödevleri takip et.
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
            Kaynakları paylaş.
          </span>
        </h1>

        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Hoca ve öğrenciler için tek panelden ders yönetimi. Modern, hızlı,
          sade.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          >
            Giriş Yap / Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
