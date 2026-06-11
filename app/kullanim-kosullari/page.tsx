import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları — Özel Ders Pro",
  description: "Özel Ders Pro platformu kullanım koşulları ve hizmet şartları.",
};

export default function KullanimKosullariPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-800">
          ← Ana Sayfaya Dön
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">Kullanım Koşulları</h1>
        <p className="mb-10 text-sm text-slate-500">
          Son güncelleme:{" "}
          {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Kabul</h2>
            <p className="leading-relaxed">
              Özel Ders Pro platformuna (&quot;Platform&quot;) erişerek veya platform üzerinden hizmet
              kullanarak bu Kullanım Koşulları&apos;nı (&quot;Koşullar&quot;) kabul etmiş sayılırsınız.
              Koşulları kabul etmiyorsanız platformu kullanmayınız.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. Hizmet Tanımı</h2>
            <p className="leading-relaxed">
              Platform, öğretmenler ile öğrencilerin buluştuğu bir özel ders aracılık
              platformudur. Platform; ders rezervasyonu, ödeme altyapısı, mesajlaşma,
              ödev takibi ve quiz yönetimi işlevlerini sunar. Platform, öğretmen veya öğrenci
              değildir; taraflar arasındaki eğitim ilişkisine aracılık eder.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. Hesap Oluşturma</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>18 yaşından küçük kullanıcılar, veli/vasi onayıyla platforma kayıt olabilir.</li>
              <li>Hesap bilgilerinizin doğruluğundan ve güvenliğinden siz sorumlusunuz.</li>
              <li>Tek bir kişi yalnızca bir hesap oluşturabilir.</li>
              <li>Hesabınızı başkasına devredemez veya kullandıramazsınız.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. Öğretmen Sorumlulukları</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Profil bilgilerinin (uzmanlık, deneyim, ücret) doğruluğundan öğretmen sorumludur.</li>
              <li>Rezervasyona alınan dersler için zamanında hazır olunmalıdır.</li>
              <li>Öğrenci bilgileri gizli tutulmalı, üçüncü kişilerle paylaşılmamalıdır.</li>
              <li>Platform dışına çıkarma amacıyla öğrencilerle doğrudan ödeme teklif etmek yasaktır.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Öğrenci Sorumlulukları</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Rezervasyon yapılan derslere zamanında katılmak öğrencinin sorumluluğundadır.</li>
              <li>Ders başlamadan en az 24 saat önce iptal edilmeyen rezervasyonlar ücrete tabidir.</li>
              <li>Değerlendirmeler dürüst ve adil yapılmalıdır; hakaret içeren yorumlar kaldırılır.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Ödeme ve İadeler</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Ödemeler Iyzico güvenli ödeme altyapısı üzerinden gerçekleştirilir.</li>
              <li>Bakiye yüklemeleri Platform cüzdanına eklenir ve yalnızca ders ödemelerinde kullanılabilir.</li>
              <li>Ders tamamlandığında ödeme öğretmenin cüzdanına aktarılır.</li>
              <li>İade talepleri, ders tarihinden itibaren 48 saat içinde destek ekibine iletilmelidir.</li>
              <li>Platform hizmet bedeli olarak işlem tutarı üzerinden uygulanabilecek komisyon oranları ayrıca bildirilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. Yasaklı Kullanımlar</h2>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              <li>Sahte hesap oluşturma veya başkasının kimliğine bürünme</li>
              <li>Spam, taciz veya hakaret içerikli mesajlar gönderme</li>
              <li>Platform altyapısına zarar vermeye yönelik girişimler</li>
              <li>Telif hakkı ihlali içeren içerik paylaşımı</li>
              <li>Kara para aklama veya dolandırıcılık amaçlı kullanım</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">8. Fikri Mülkiyet</h2>
            <p className="leading-relaxed">
              Platform adı, logosu, tasarımı ve yazılımı Özel Ders Pro&apos;ya aittir. Öğretmenlerin
              yüklediği ders materyalleri, hazırladığı quizler ve diğer içerikler ilgili
              öğretmene aittir; Platform bu içerikleri hizmet sunumu amacıyla kullanma hakkına
              sahiptir.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">9. Hesap Askıya Alma ve Kapatma</h2>
            <p className="leading-relaxed">
              Platform, bu Koşullar&apos;ı ihlal eden hesapları önceden bildirim yapmaksızın askıya
              alabilir veya kalıcı olarak kapatabilir. Ağır ihlallerde (dolandırıcılık, taciz
              vb.) yasal işlem başlatılabilir.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">10. Sorumluluğun Sınırlandırılması</h2>
            <p className="leading-relaxed">
              Platform, öğretmen ve öğrenci arasındaki eğitim ilişkisinin içeriğinden doğrudan
              sorumlu değildir. Platform, teknik kesintilerden kaynaklanan dolaylı zararlar
              için sorumlu tutulamaz. Azami sorumluluk, kullanıcının son 30 gün içinde yaptığı
              ödemelerle sınırlıdır.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">11. Uygulanacak Hukuk</h2>
            <p className="leading-relaxed">
              Bu Koşullar, Türkiye Cumhuriyeti hukukuna tabidir. Anlaşmazlıklarda İstanbul
              Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">12. İletişim</h2>
            <p className="leading-relaxed">
              Kullanım koşullarına ilişkin sorularınız için{" "}
              <a href="mailto:destek@ozelderspro.com" className="text-blue-600 hover:underline">
                destek@ozelderspro.com
              </a>{" "}
              adresine yazabilirsiniz. Kişisel veri haklarınız için{" "}
              <Link href="/kvkk" className="text-blue-600 hover:underline">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni inceleyin.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
