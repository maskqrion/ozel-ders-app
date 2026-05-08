"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import LessonsCalendar from "@/components/LessonsCalendar";
import { attachSignedUrls } from "@/lib/storage";
import toast from "react-hot-toast";

export default function OgrenciPaneli() {
  const [user, setUser] = useState<any>(null);
  const [dersler, setDersler] = useState<any[]>([]);
  const [odevler, setOdevler] = useState<any[]>([]);
  const [kaynaklar, setKaynaklar] = useState<any[]>([]); // Yeni eklenen state
  const [siradakiDers, setSiradakiDers] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});
  const [submissionFile, setSubmissionFile] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const router = useRouter();

  const seciliGunDersleri = useMemo(() => {
    if (!selectedDate) return [];
    return dersler.filter((d) => {
      const dd = new Date(d.lesson_date);
      return (
        dd.getFullYear() === selectedDate.getFullYear() &&
        dd.getMonth() === selectedDate.getMonth() &&
        dd.getDate() === selectedDate.getDate()
      );
    });
  }, [dersler, selectedDate]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return router.push("/login");
      setUser(currentUser);
      
      // Dersleri, Ödevleri ve Kaynakları aynı anda çekiyoruz
      await Promise.all([
        fetchDersler(currentUser.id),
        fetchOdevler(currentUser.id),
        fetchKaynaklar()
      ]);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const fetchDersler = async (ogrenciId: string) => {
    const { data } = await supabase.from("lessons").select(`id, lesson_date, status, users!lessons_hoca_id_fkey (email)`).eq("ogrenci_id", ogrenciId).order("lesson_date", { ascending: true });
    if (data) {
      setDersler(data);
      setSiradakiDers(data.find(d => d.status === 'bekliyor'));
    }
  };

  const fetchOdevler = async (ogrenciId: string) => {
    const { data } = await supabase.from("assignments").select(`id, title, description, status, submission_text, submission_file_path, submitted_at, lessons!inner(ogrenci_id, lesson_date, users!lessons_hoca_id_fkey(email))`).eq("lessons.ogrenci_id", ogrenciId).order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "submission_file_path", "submission_signed_url");
      setOdevler(enriched);
    }
  };

  // Yeni eklenen fonksiyon: Kaynakları veritabanından okur
  const fetchKaynaklar = async () => {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "file_path", "signed_url");
      setKaynaklar(enriched);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const teslimEt = async (assignmentId: string) => {
    const text = (submissionText[assignmentId] || "").trim();
    const file = submissionFile[assignmentId];

    if (!text && !file) {
      toast.error("Teslim için en az bir açıklama veya dosya ekle.");
      return;
    }
    if (!user) return;

    setSubmitting(assignmentId);
    try {
      let filePath: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop();
        filePath = `submissions/${user.id}/${assignmentId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('kaynaklar').upload(filePath, file);
        if (uploadError) throw uploadError;
      }

      const { error } = await supabase.from('assignments').update({
        submission_text: text || null,
        submission_file_path: filePath,
        submitted_at: new Date().toISOString(),
        status: 'yapildi',
      }).eq('id', assignmentId);

      if (error) throw error;

      setSubmissionText(prev => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
      setSubmissionFile(prev => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });

      await fetchOdevler(user.id);
      toast.success("Teslim alındı.");
    } catch (err: any) {
      toast.error("Hata: " + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-blue-600">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600">Öğrenci Paneli</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:inline">{user?.email}</span>
          <Link href="/profil" className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-md hover:bg-green-100 transition">Profil</Link>
          <button onClick={handleLogout} className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-md hover:bg-red-100">Çıkış Yap</button>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto mt-6 space-y-8">
        
        {/* Üst İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-green-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Sıradaki Dersim</h3>
            {siradakiDers ? (
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-800">{new Date(siradakiDers.lesson_date).toLocaleString('tr-TR')}</p>
                <p className="text-sm text-gray-600 mt-1">Hoca: {siradakiDers.users?.email}</p>
              </div>
            ) : <p className="text-lg font-medium text-gray-400 mt-2">Planlanmış ders yok</p>}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-indigo-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Bekleyen Ödevler</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{odevler.filter(o => o.status === 'verildi').length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon: Ödevler ve Kaynaklar */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ödevlerim</h2>
              <div className="space-y-4">
                {odevler.length === 0 ? (
                  <p className="text-gray-500 bg-white p-4 rounded-lg border">Henüz bir ödev tanımlanmadı.</p>
                ) : (
                  odevler.map(o => {
                    const isCompleted = o.status === 'yapildi';
                    return (
                      <div key={o.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900">{o.title}</h4>
                            {o.description && <p className="text-gray-600 text-sm mt-1">{o.description}</p>}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                            isCompleted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {isCompleted ? "Teslim Edildi" : "Bekliyor"}
                          </span>
                        </div>

                        {isCompleted ? (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            {o.submitted_at && (
                              <p className="text-xs text-gray-500">
                                Teslim: {new Date(o.submitted_at).toLocaleString('tr-TR')}
                              </p>
                            )}
                            {o.submission_text && (
                              <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 whitespace-pre-wrap">
                                {o.submission_text}
                              </div>
                            )}
                            {o.submission_signed_url && (
                              <a
                                href={o.submission_signed_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                Dosyanı görüntüle
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                            <textarea
                              placeholder="Açıklama (opsiyonel)..."
                              rows={2}
                              value={submissionText[o.id] || ""}
                              onChange={(e) => setSubmissionText(prev => ({ ...prev, [o.id]: e.target.value }))}
                              className="w-full text-sm rounded-md border border-gray-200 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition"
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <input
                                type="file"
                                onChange={(e) => setSubmissionFile(prev => ({ ...prev, [o.id]: e.target.files?.[0] || null }))}
                                className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer flex-1 min-w-0"
                              />
                              <button
                                type="button"
                                onClick={() => teslimEt(o.id)}
                                disabled={submitting === o.id}
                                className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {submitting === o.id ? "Gönderiliyor..." : "Teslim Et"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* YENİ EKLENEN KISIM: KAYNAKLAR */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ders Materyalleri ve Kaynaklar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kaynaklar.map(k => (
                  <a key={k.id} href={k.signed_url || '#'} onClick={(e) => { if (!k.signed_url) e.preventDefault(); }} target="_blank" rel="noreferrer" className="p-4 border rounded-lg bg-white hover:bg-orange-50 flex items-center gap-3 transition-colors border-orange-100 shadow-sm">
                    <div className="bg-orange-100 p-2 rounded text-orange-600">📄</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{k.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Tıkla ve Görüntüle</p>
                    </div>
                  </a>
                ))}
                {kaynaklar.length === 0 && <p className="text-gray-500 bg-white p-4 rounded-lg border col-span-2">Henüz kaynak yüklenmedi.</p>}
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Ders Takvimi */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Ders Takvimi</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <LessonsCalendar
                dersler={dersler}
                accent="green"
                value={selectedDate}
                onChange={setSelectedDate}
              />
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  {selectedDate
                    ? selectedDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'Bir gün seç'}
                </p>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {seciliGunDersleri.length === 0 && selectedDate && (
                    <p className="text-sm text-gray-400">Bu gün için ders yok.</p>
                  )}
                  {seciliGunDersleri.map(d => (
                    <div key={d.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-center">
                      <div className="text-sm min-w-0">
                        <p className="font-medium text-gray-800 truncate">{d.users?.email}</p>
                        <p className="text-gray-500 text-xs">{new Date(d.lesson_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded whitespace-nowrap ${d.status === 'bekliyor' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}