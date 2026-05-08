"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import LessonsCalendar from "@/components/LessonsCalendar";
import { attachSignedUrls } from "@/lib/storage";
import toast from "react-hot-toast";

export default function HocaPaneli() {
  const [user, setUser] = useState<any>(null);
  const [ogrenciler, setOgrenciler] = useState<any[]>([]);
  const [dersler, setDersler] = useState<any[]>([]);
  const [odevler, setOdevler] = useState<any[]>([]);
  const [kaynaklar, setKaynaklar] = useState<any[]>([]);
  
  // State'ler
  const [secilenOgrenci, setSecilenOgrenci] = useState("");
  const [dersTarihi, setDersTarihi] = useState("");
  const [dersLoading, setDersLoading] = useState(false);

  const [secilenDersId, setSecilenDersId] = useState("");
  const [odevBaslik, setOdevBaslik] = useState("");
  const [odevAciklama, setOdevAciklama] = useState("");
  const [odevLoading, setOdevLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [uploading, setUploading] = useState(false);

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

      const { data: ogrenciData } = await supabase.from("users").select("id, email").eq("role", "ogrenci");
      if (ogrenciData) setOgrenciler(ogrenciData);

      fetchDersler(currentUser.id);
      fetchOdevler(currentUser.id);
      fetchKaynaklar();
    };
    fetchData();
  }, [router]);

  const fetchDersler = async (hocaId: string) => {
    const { data } = await supabase.from("lessons").select(`id, lesson_date, status, users!lessons_ogrenci_id_fkey (email)`).eq("hoca_id", hocaId).order("lesson_date", { ascending: true });
    if (data) setDersler(data);
  };

  const fetchOdevler = async (hocaId: string) => {
    const { data } = await supabase.from("assignments").select(`id, title, description, status, submission_text, submission_file_path, submitted_at, lessons!inner(hoca_id, lesson_date, users!lessons_ogrenci_id_fkey(email))`).eq("lessons.hoca_id", hocaId).order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "submission_file_path", "submission_signed_url");
      setOdevler(enriched);
    }
  };

  const fetchKaynaklar = async () => {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (data) {
      const enriched = await attachSignedUrls(data, "file_path", "signed_url");
      setKaynaklar(enriched);
    }
  };

  const dersPlanla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secilenOgrenci || !dersTarihi) return toast.error("Öğrenci ve tarih seçin.");
    setDersLoading(true);
    const { error } = await supabase.from("lessons").insert([{ hoca_id: user.id, ogrenci_id: secilenOgrenci, lesson_date: dersTarihi, status: "bekliyor" }]);
    setDersLoading(false);
    if (error) toast.error("Hata: " + error.message);
    else { toast.success("Ders planlandı."); setSecilenOgrenci(""); setDersTarihi(""); fetchDersler(user.id); }
  };

  const odevVer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secilenDersId || !odevBaslik) return toast.error("Ders ve başlık seçmek zorunludur.");
    setOdevLoading(true);
    const { error } = await supabase.from("assignments").insert([{ lesson_id: secilenDersId, title: odevBaslik, description: odevAciklama, status: "verildi" }]);
    setOdevLoading(false);
    if (error) toast.error("Hata: " + error.message);
    else { toast.success("Ödev verildi."); setSecilenDersId(""); setOdevBaslik(""); setOdevAciklama(""); fetchOdevler(user.id); }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileTitle) return toast.error("Dosya ve başlık gerekli.");
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('kaynaklar').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from('resources').insert([{ yukleyen_id: user.id, title: fileTitle, file_path: filePath }]);
      if (dbError) throw dbError;
      toast.success("Dosya yüklendi."); setFileTitle(""); setFile(null); fetchKaynaklar();
    } catch (error: any) { toast.error("Hata: " + error.message); } 
    finally { setUploading(false); }
  };

  // YENİ EKLENEN ÖZELLİK: Dersi Tamamlama Fonksiyonu
  const dersiTamamla = async (dersId: string) => {
    const { error } = await supabase.from("lessons").update({ status: "tamamlandi" }).eq("id", dersId);
    if (error) toast.error("Hata: " + error.message);
    else fetchDersler(user.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Hoca Paneli</h1>
        <div className="flex items-center gap-2">
          <Link href="/profil" className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition">Profil</Link>
          <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-md hover:bg-red-100 transition">Çıkış Yap</button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL KOLON: Ders & Ödev Planlama */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 border-t-4 border-t-blue-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Yeni Ders Planla</h2>
            <form onSubmit={dersPlanla} className="space-y-3">
              <select value={secilenOgrenci} onChange={e => setSecilenOgrenci(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Öğrenci Seçin</option>
                {ogrenciler.map(o => <option key={o.id} value={o.id}>{o.email}</option>)}
              </select>
              <input type="datetime-local" value={dersTarihi} onChange={e => setDersTarihi(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              <button type="submit" disabled={dersLoading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Dersi Planla</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100 border-t-4 border-t-indigo-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ödev Ver</h2>
            <form onSubmit={odevVer} className="space-y-3">
              <select value={secilenDersId} onChange={e => setSecilenDersId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="">Hangi Ders İçin?</option>
                {dersler.filter(d => d.status === 'bekliyor').map(d => <option key={d.id} value={d.id}>{d.users?.email} - {new Date(d.lesson_date).toLocaleDateString()}</option>)}
              </select>
              <input type="text" placeholder="Ödev Başlığı" value={odevBaslik} onChange={e => setOdevBaslik(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              <textarea placeholder="Açıklama" rows={2} value={odevAciklama} onChange={e => setOdevAciklama(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm"></textarea>
              <button type="submit" disabled={odevLoading} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm">Ödevi Gönder</button>
            </form>
          </div>
        </div>

        {/* ORTA KOLON: Kaynak Yükleme & Ders Listesi */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 border-t-4 border-t-orange-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Kaynak Paylaş</h2>
            <form onSubmit={handleFileUpload} className="space-y-3">
              <input type="text" value={fileTitle} onChange={e => setFileTitle(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Dosya Başlığı" />
              <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
              <button type="submit" disabled={uploading} className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 text-sm">Yükle</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ders Takvimi</h2>
            <LessonsCalendar
              dersler={dersler}
              accent="blue"
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
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{d.users?.email}</p>
                      <p className="text-xs text-gray-500">{new Date(d.lesson_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded whitespace-nowrap ${d.status === 'bekliyor' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{d.status}</span>
                      {d.status === 'bekliyor' && (
                        <button onClick={() => dersiTamamla(d.id)} className="bg-green-500 text-white w-6 h-6 rounded flex items-center justify-center hover:bg-green-600 shrink-0" title="Dersi Tamamla">✓</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: Ödevler & Kaynaklar Listesi */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Verilen Ödevler</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {odevler.length === 0 && <p className="text-sm text-gray-400">Henüz ödev verilmedi.</p>}
              {odevler.map(o => {
                const isCompleted = o.status === 'yapildi';
                return (
                  <div key={o.id} className={`p-3 rounded-md border ${isCompleted ? "bg-green-50 border-green-100" : "bg-indigo-50 border-indigo-100"}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm truncate ${isCompleted ? "text-green-900" : "text-indigo-900"}`}>{o.title}</p>
                        <p className="text-xs text-gray-600 mt-1 truncate">{o.lessons?.users?.email}</p>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded whitespace-nowrap ${isCompleted ? "bg-green-200 text-green-800" : "bg-yellow-100 text-yellow-700"}`}>
                        {isCompleted ? "Teslim" : "Bekliyor"}
                      </span>
                    </div>
                    {isCompleted && (
                      <div className="mt-2 pt-2 border-t border-green-200/50 space-y-1.5">
                        {o.submitted_at && <p className="text-[10px] text-gray-500">{new Date(o.submitted_at).toLocaleString('tr-TR')}</p>}
                        {o.submission_text && <p className="text-xs text-gray-700 whitespace-pre-wrap">{o.submission_text}</p>}
                        {o.submission_signed_url && (
                          <a href={o.submission_signed_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline inline-block">
                            Teslim dosyasını aç
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Kaynaklar</h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {kaynaklar.map(k => (
                <a key={k.id} href={k.signed_url || '#'} onClick={(e) => { if (!k.signed_url) e.preventDefault(); }} target="_blank" rel="noreferrer" className="p-3 border rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors">
                  <span className="text-orange-500">📄</span>
                  <span className="text-gray-700 truncate">{k.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}