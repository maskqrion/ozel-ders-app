import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Özel Ders Pro",
  description: "Özel Ders Pro gizlilik politikası ve verilerinizin nasıl korunduğu.",
};

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-800">
          ← Ana Sayfaya Dön
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">Gizlilik Politikası</h1>
        <p className="mb-10 text-sm text-slate-500">
          Son güncelleme:{" "}
          {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Genel Bakış</h2>
            <p className="leading-relaxed">
              Özel Ders Pro olarak gizliliğinize saygı duyuyor ve kişisel verilerinizin
              güvenliğini ön planda tutuyoruz. Bu politika, platformumuzu kullandığınızda
              hangi verileri topladığımızı, nasıl kullandığımızı ve nasıl koruduğumuzu açıklar.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. Topladığımız Veriler</h2>
            <h3 className="mb-2 font-medium text-slate-800">Hesap Oluşturma Sırasında</h3>
            <ul className="mb-4 list-disc space-y-1 pl-5 leading-relaxed">
              <li>Ad ve soyad</li>
              <li>E-posta adresi</li>
              <li>Şifre (şifrelenmiş olarak saklanır, düz metin olarak hiçbir zaman görülmez)</li>
              <li>Kullanıcı rolü (öğretmen veya öğrenci)</li>
            </ul>
            <h3 className="mb-2 font-medium text-slate-800">Platform Kullanımı Sırasında</h3>
            <ul className="list-disc space-y-1 pl-5 leading-relaxed">
              <li>Profil bilgileri (fotoğraf, biyografi, uzmanlık alanları)</li>
              <li>Ders rezervasyonları ve takvim bilgileri</li>
              <li>Mesajlaşma içerikleri</li>
              <li>Quiz ve ödev kayıtları</li>
              <li>Cüzdan işlem geçmişi</li>
              <li>IP adresi ve tarayıcı bilgileri (güvenlik amaçlı)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. Verilerinizi Nasıl Kullanıyoruz</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Öğretmen-öğrenci eşleştirmesi ve randevu yönetimi</li>
              <li>Güvenli ödeme işlemlerinin gerçekleştirilmesi</li>
              <li>Platform özelliklerinin (quiz, ödev, mesajlaşma) sunulması</li>
              <li>Hesap güvenliğinin sağlanması</li>
              <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. Veri Güvenliği</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Tüm veriler 256-bit SSL/TLS şifrelemesiyle iletilir</li>
              <li>Şifreler bcrypt algoritmasıyla hashlenerek saklanır</li>
              <li>Ödeme kartı bilgileri platformumuzda saklanmaz; Iyzico güvenli altyapısı kullanılır</li>
              <li>Veritabanı erişimi Row Level Security (RLS) politikalarıyla kısıtlanmıştır</li>
              <li>Hassas işlemler yalnızca sunucu tarafı güvenli fonksiyonlarla yürütülür</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Çerezler</h2>
            <p className="leading-relaxed">
              Platform, oturum yönetimi için zorunlu çerezler kullanır. Bu çerezler oturumunuzu
              açık tutmak için gereklidir ve kapatılamaz. Analitik veya reklam amaçlı üçüncü
              taraf çerezler kullanılmamaktadır.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Üçüncü Taraf Hizmetler</h2>
            <p className="mb-3 leading-relaxed">
              Platformumuz aşağıdaki üçüncü taraf hizmetlerden yararlanmaktadır:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li><strong>Supabase:</strong> Veritabanı ve kimlik doğrulama altyapısı</li>
              <li><strong>Iyzico:</strong> Ödeme işlemleri (PCI-DSS uyumlu)</li>
              <li><strong>Sentry:</strong> Hata takibi (kişisel veriler anonimleştirilir)</li>
              <li><strong>Anthropic Claude:</strong> Yapay zeka destekli quiz üretimi (kullanıcı kimliği gönderilmez)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. Haklarınız</h2>
            <p className="mb-3 leading-relaxed">
              Verileriniz üzerinde aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Verilerinize erişim ve kopyasını alma</li>
              <li>Yanlış verilerin düzeltilmesini talep etme</li>
              <li>Hesabınızın ve verilerinizin silinmesini isteme</li>
              <li>Veri işlemeye itiraz etme</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Bu haklarınızı kullanmak için{" "}
              <a href="mailto:gizlilik@ozelderspro.com" className="text-blue-600 hover:underline">
                gizlilik@ozelderspro.com
              </a>{" "}
              adresine e-posta gönderebilir veya{" "}
              <Link href="/kvkk" className="text-blue-600 hover:underline">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni inceleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">8. Değişiklikler</h2>
            <p className="leading-relaxed">
              Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler için kayıtlı
              e-posta adresinize bildirim göndeririz. Politikanın güncel sürümü her zaman bu
              sayfada yayınlanır.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
