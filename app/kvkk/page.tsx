import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Özel Ders Pro",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-800">
          ← Ana Sayfaya Dön
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">KVKK Aydınlatma Metni</h1>
        <p className="mb-10 text-sm text-slate-500">
          6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında
        </p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Veri Sorumlusu</h2>
            <p className="leading-relaxed">
              Bu aydınlatma metni, <strong>Özel Ders Pro</strong> ("Platform") tarafından,
              6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi uyarınca
              hazırlanmıştır. Platform, veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda
              açıklanan amaçlar ve yöntemlerle işlemektedir.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. Toplanan Kişisel Veriler</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Kimlik bilgileri: Ad, soyad</li>
              <li>İletişim bilgileri: E-posta adresi</li>
              <li>Konum bilgisi: Şehir (opsiyonel, ödeme işlemleri için)</li>
              <li>Profil bilgileri: Fotoğraf, uzmanlık alanı, biyografi (opsiyonel)</li>
              <li>Eğitim bilgileri: Ders rezervasyonları, ödev ve quiz kayıtları</li>
              <li>Finansal bilgiler: Cüzdan bakiyesi, işlem geçmişi (kart bilgileri Platform'da saklanmaz)</li>
              <li>Teknik veriler: IP adresi, tarayıcı türü, oturum bilgileri</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. Kişisel Verilerin İşlenme Amacı</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Öğretmen-öğrenci eşleştirme ve eğitim hizmetlerinin sunulması</li>
              <li>Ders rezervasyonu, ödeme ve fatura işlemlerinin yürütülmesi</li>
              <li>Quiz, ödev ve değerlendirme sistemlerinin işletilmesi</li>
              <li>Kullanıcı hesabı oluşturma ve kimlik doğrulama</li>
              <li>Platform güvenliği ve dolandırıcılık önleme</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>Müşteri desteği ve şikâyet yönetimi</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. İşlemenin Hukuki Dayanağı</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li><strong>Sözleşmenin ifası:</strong> Ders rezervasyonu ve ödeme işlemleri için zorunlu veriler</li>
              <li><strong>Meşru menfaat:</strong> Platform güvenliği, hizmet kalitesinin iyileştirilmesi</li>
              <li><strong>Yasal yükümlülük:</strong> Vergi, muhasebe ve yasal raporlama gereklilikleri</li>
              <li><strong>Açık rıza:</strong> Pazarlama iletişimleri ve opsiyonel profil bilgileri</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Verilerin Aktarıldığı Taraflar</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>
                <strong>Supabase Inc. (ABD):</strong> Veritabanı altyapısı ve kimlik doğrulama hizmetleri.
                KVKK md. 9 kapsamında yeterli koruma tedbirleri mevcuttur.
              </li>
              <li>
                <strong>Iyzico Ödeme Hizmetleri A.Ş. (Türkiye):</strong> Ödeme işlemlerinin güvenli
                yürütülmesi amacıyla zorunlu alıcı bilgileri iletilmektedir.
              </li>
              <li>
                <strong>Sentry (Functional Software Inc., ABD):</strong> Hata izleme ve performans
                takibi amacıyla anonimleştirilmiş teknik veriler.
              </li>
              <li>
                <strong>Yetkili kamu kurum ve kuruluşları:</strong> Yasal zorunluluk hâlinde.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Kişisel Verilerin Saklanma Süresi</h2>
            <p className="leading-relaxed">
              Kişisel verileriniz, hesabınızın aktif olduğu süre boyunca ve ilgili yasal
              saklama yükümlülükleri (Türk Ticaret Kanunu, Vergi Usul Kanunu vb.) kapsamında
              gerekli süre tutulmaktadır. Hesap silme talebinde verileriniz, yasal zorunluluklar
              dışında 30 gün içinde silinir veya anonimleştirilir.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. KVKK Kapsamındaki Haklarınız</h2>
            <p className="mb-3 leading-relaxed">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>Kişisel verilerin silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">8. İletişim</h2>
            <p className="leading-relaxed">
              Haklarınızı kullanmak veya kişisel verilerinize ilişkin sorularınız için
              aşağıdaki kanallardan bize ulaşabilirsiniz:
            </p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p><strong>E-posta:</strong>{" "}
                <a href="mailto:kvkk@ozelderspro.com" className="text-blue-600 hover:underline">
                  kvkk@ozelderspro.com
                </a>
              </p>
              <p className="mt-1"><strong>Platform:</strong> Özel Ders Pro</p>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Son güncelleme: {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
