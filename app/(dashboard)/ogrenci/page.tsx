"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OgrenciPaneli() {
  const [user, setUser] = useState<any>(null);
  const [dersler, setDersler] = useState<any[]>([]);
  const [odevler, setOdevler] = useState<any[]>([]);
  const [kaynaklar, setKaynaklar] = useState<any[]>([]); // Yeni eklenen state
  const [siradakiDers, setSiradakiDers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    const { data } = await supabase.from("assignments").select(`id, title, description, status, lessons!inner(ogrenci_id, lesson_date, users!lessons_hoca_id_fkey(email))`).eq("lessons.ogrenci_id", ogrenciId).order("created_at", { ascending: false });
    if (data) setOdevler(data);
  };

  // Yeni eklenen fonksiyon: Kaynakları veritabanından okur
  const fetchKaynaklar = async () => {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (data) setKaynaklar(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-blue-600">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600">Öğrenci Paneli</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
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
                {odevler.length === 0 ? <p className="text-gray-500 bg-white p-4 rounded-lg border">Henüz bir ödev tanımlanmadı.</p> : 
                  odevler.map(o => (
                    <div key={o.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900">{o.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{o.description}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{o.status}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* YENİ EKLENEN KISIM: KAYNAKLAR */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ders Materyalleri ve Kaynaklar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kaynaklar.map(k => (
                  <a key={k.id} href={k.file_url} target="_blank" rel="noreferrer" className="p-4 border rounded-lg bg-white hover:bg-orange-50 flex items-center gap-3 transition-colors border-orange-100 shadow-sm">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-50">
              {dersler.map(d => (
                <div key={d.id} className="p-4 flex justify-between items-center">
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">{new Date(d.lesson_date).toLocaleDateString('tr-TR')}</p>
                    <p className="text-gray-500 text-xs">{new Date(d.lesson_date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${d.status === 'bekliyor' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}