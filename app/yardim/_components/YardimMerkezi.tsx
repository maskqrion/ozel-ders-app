"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/* ── Veri ───────────────────────────────────────────────────── */

type FaqCategoryId =
  | "ogrenciler"
  | "hocalar"
  | "rezervasyonlar"
  | "odemeler"
  | "odevler"
  | "quizler"
  | "hesap";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: FaqCategoryId;
  title: string;
  emoji: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    id: "ogrenciler",
    title: "Öğrenciler",
    emoji: "🎓",
    items: [
      {
        question: "Nasıl öğretmen bulurum?",
        answer:
          "Giriş yaptıktan sonra öğrenci panelindeki \"Öğretmen Bul\" sekmesini açın. İsim, uzmanlık alanı veya şehre göre arama yapabilir; bütçe, branş ve puana göre filtreleyebilirsiniz. Beğendiğiniz hocanın kartından \"Profili İncele\" ile detaylı profiline ulaşabilirsiniz.",
      },
      {
        question: "Hocamla ders dışında nasıl iletişim kurarım?",
        answer:
          "Öğrenci panelindeki \"Mesajlar\" sekmesinden bağlantılı olduğunuz hocalarla doğrudan mesajlaşabilirsiniz. Mesajlar gerçek zamanlı iletilir ve yeni mesajlarda bildirim alırsınız.",
      },
      {
        question: "XP ve seviye sistemi nasıl çalışır?",
        answer:
          "Ödev teslim etmek, quiz çözmek ve dersleri tamamlamak gibi etkinliklerle XP (deneyim puanı) kazanırsınız. XP biriktikçe seviyeniz yükselir ve liderlik tablosundaki sıralamanız değişir. Liderlik tablosuna panelinizden ulaşabilirsiniz.",
      },
      {
        question: "Ders kaynaklarına nereden ulaşırım?",
        answer:
          "Hocalarınızın paylaştığı ders notları ve dosyalar öğrenci panelindeki \"Kaynaklar\" sekmesinde listelenir. Dosyaları güvenli bağlantılar üzerinden indirebilirsiniz.",
      },
    ],
  },
  {
    id: "hocalar",
    title: "Hocalar",
    emoji: "👩‍🏫",
    items: [
      {
        question: "Hoca olarak nasıl kayıt olurum?",
        answer:
          "Kayıt ekranında hesap türü olarak \"Eğitmen\" seçeneğini işaretlemeniz yeterli. Kayıttan sonra profil sayfanızdan uzmanlık alanlarınızı, ders ücretinizi ve tanıtım bilgilerinizi ekleyerek profilinizi öğrencilere görünür hale getirebilirsiniz.",
      },
      {
        question: "Müsaitlik saatlerimi nasıl ayarlarım?",
        answer:
          "Hoca panelindeki \"Müsaitlik\" bölümünden haftalık ders verebileceğiniz gün ve saat aralıklarını belirleyebilirsiniz. Öğrenciler rezervasyon yaparken yalnızca müsait olduğunuz saatleri görür.",
      },
      {
        question: "Ders ücretimi nasıl belirlerim?",
        answer:
          "Profil sayfanızdan saatlik ders ücretinizi girebilirsiniz. Bu ücret herkese açık profilinizde ve öğrenci aramalarında görüntülenir. Ücret belirlemeden rezervasyon alamazsınız.",
      },
      {
        question: "Kazançlarımı nereden takip ederim?",
        answer:
          "Hoca panelindeki \"Cüzdan\" bölümünde bakiyenizi ve işlem geçmişinizi görebilirsiniz. Bir dersin ücreti, ders tamamlandı olarak işaretlendikten sonra bakiyenize aktarılır.",
      },
    ],
  },
  {
    id: "rezervasyonlar",
    title: "Rezervasyonlar",
    emoji: "📅",
    items: [
      {
        question: "Ders rezervasyonu nasıl yapılır?",
        answer:
          "Öğretmen Bul sekmesinde beğendiğiniz hocanın kartındaki \"Ders Talep Et\" butonuna tıklayın. Açılan takvimden hocanın müsait olduğu bir saat seçip talebi onaylayın. Talebiniz hocaya iletilir; hoca onayladığında ders takviminize eklenir.",
      },
      {
        question: "Hoca talebimi onaylamazsa ne olur?",
        answer:
          "Ders ücreti yalnızca ders tamamlandığında hocaya aktarılır. Talebiniz reddedilir veya ders gerçekleşmezse tutar cüzdan bakiyenize iade edilir. İade işlemlerinde sorun yaşarsanız destek talebi oluşturabilirsiniz.",
      },
      {
        question: "Yaklaşan derslerimi nereden görürüm?",
        answer:
          "Öğrenci panelindeki \"Ders Takvimi\" sekmesinde tüm geçmiş ve gelecek dersleriniz listelenir. Genel Özet sekmesi de sıradaki dersinizi gösterir; ders saatinden önce hatırlatma bildirimi alırsınız.",
      },
    ],
  },
  {
    id: "odemeler",
    title: "Ödemeler ve Cüzdan",
    emoji: "💳",
    items: [
      {
        question: "Cüzdanıma nasıl bakiye yüklerim?",
        answer:
          "Öğrenci panelindeki \"Cüzdanım\" sekmesinden (ya da Cüzdanım ve Ödemeler sayfasından) \"Bakiye Yükle\" adımlarını izleyin. Ödemeler 3D Secure doğrulamalı olarak Iyzico güvenli ödeme altyapısıyla gerçekleştirilir.",
      },
      {
        question: "Kart bilgilerim platformda saklanıyor mu?",
        answer:
          "Hayır. Kart bilgileriniz hiçbir zaman sunucularımızda saklanmaz; ödeme işlemleri PCI-DSS uyumlu Iyzico altyapısı üzerinden yürütülür.",
      },
      {
        question: "Ders ücreti ne zaman tahsil edilir?",
        answer:
          "Rezervasyon sırasında ders ücreti cüzdan bakiyenizden ayrılır, ancak hocaya aktarım yalnızca ders tamamlandığında yapılır. Gerçekleşmeyen derslerin ücreti cüzdanınıza iade edilir.",
      },
      {
        question: "İşlem geçmişimi nereden görebilirim?",
        answer:
          "Cüzdan sayfasındaki \"İşlem Geçmişi\" bölümünde bakiye yüklemeleri, ders ödemeleri, kazançlar ve iadeler tarih sırasıyla listelenir.",
      },
    ],
  },
  {
    id: "odevler",
    title: "Ödevler",
    emoji: "📝",
    items: [
      {
        question: "Ödevimi nasıl teslim ederim?",
        answer:
          "Öğrenci panelindeki \"Ödevlerim\" sekmesinde bekleyen ödevlerinizi görürsünüz. Ödev detayında metin yazabilir ve dosya ekleyerek teslim edebilirsiniz. Teslim sonrası ödevin durumu hocanızın değerlendirmesine göre güncellenir.",
      },
      {
        question: "Ödevim reddedilirse ne olur?",
        answer:
          "Hocanız ödevi reddederse gerekçesini ödev kartında görürsünüz ve ödevi düzeltip yeniden teslim edebilirsiniz. Kabul edilen ödevler puanlanır ve XP kazandırır.",
      },
      {
        question: "Hoca olarak nasıl ödev veririm?",
        answer:
          "Hoca panelindeki \"Ödevler\" bölümünden, tamamlanmış veya planlanmış derslerinize bağlı ödev oluşturabilirsiniz. Öğrenci teslim ettiğinde bildirim alır, teslimi puanlayabilir veya gerekçeyle reddedebilirsiniz.",
      },
    ],
  },
  {
    id: "quizler",
    title: "Quizler",
    emoji: "🧠",
    items: [
      {
        question: "Quiz nasıl çözerim?",
        answer:
          "Hocanızın size atadığı quizler öğrenci panelindeki Quizler sayfasında listelenir. Quize başladıktan sonra soruları yanıtlayıp gönderdiğinizde sonucunuz anında hesaplanır.",
      },
      {
        question: "Quiz sonuçlarımı nerede görürüm?",
        answer:
          "Her quizin sonunda sonuç sayfası açılır; doğru/yanlış dağılımınızı ve kazandığınız XP'yi burada görürsünüz. Geçmiş denemelerinize quiz listesinden tekrar ulaşabilirsiniz.",
      },
      {
        question: "Hocalar quiz nasıl oluşturur?",
        answer:
          "Hocalar quizleri elle soru girerek ya da yapay zekâ destekli üreticiyle oluşturabilir. AI ile üretilen sorular yayınlanmadan önce hoca tarafından gözden geçirilip düzenlenebilir.",
      },
    ],
  },
  {
    id: "hesap",
    title: "Hesap ve Güvenlik",
    emoji: "🔐",
    items: [
      {
        question: "Şifremi unuttum, ne yapmalıyım?",
        answer:
          "Giriş sayfasındaki \"Şifremi unuttum\" bağlantısına tıklayıp e-posta adresinizi girin. Size gönderilen bağlantıyla yeni şifrenizi belirleyebilirsiniz.",
      },
      {
        question: "Google hesabımla giriş yapabilir miyim?",
        answer:
          "Evet. Giriş ve kayıt ekranındaki \"Google ile giriş yap\" seçeneğiyle Google hesabınızı kullanabilirsiniz; ayrıca şifre belirlemenize gerek kalmaz.",
      },
      {
        question: "Hesap bilgilerimi nasıl güncellerim?",
        answer:
          "Panelinizin sağ üstündeki \"Profilim\" bağlantısından profil sayfanıza gidin. Ad, şehir, hakkında ve profil fotoğrafı gibi bilgilerinizi buradan güncelleyebilirsiniz.",
      },
      {
        question: "Verilerim güvende mi?",
        answer:
          "Tüm bağlantılar SSL ile şifrelenir, veritabanı erişimi satır bazlı güvenlik (RLS) politikalarıyla kısıtlanır ve şifreler geri döndürülemez şekilde saklanır. Ayrıntılar için Gizlilik Politikası ve KVKK sayfalarımıza göz atabilirsiniz.",
      },
    ],
  },
];

/* ── Yardımcılar ─────────────────────────────────────────────── */

function normalize(text: string): string {
  return text.toLocaleLowerCase("tr-TR");
}

/* ── Bileşen ─────────────────────────────────────────────────── */

export default function YardimMerkezi() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategoryId | "all">("all");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return FAQ_DATA.map((cat) => ({
      ...cat,
      items:
        activeCategory !== "all" && cat.id !== activeCategory
          ? []
          : q
            ? cat.items.filter(
                (item) =>
                  normalize(item.question).includes(q) ||
                  normalize(item.answer).includes(q),
              )
            : cat.items,
    })).filter((cat) => cat.items.length > 0);
  }, [query, activeCategory]);

  const totalResults = filtered.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Üst bölüm */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 pt-10 pb-12">
          <Link
            href="/"
            className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-800"
          >
            ← Ana Sayfaya Dön
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Yardım Merkezi
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Özel Ders Pro hakkında sıkça sorulan sorular. Aradığınızı
            bulamazsanız bize bir destek talebi gönderebilirsiniz.
          </p>

          {/* Arama */}
          <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-emerald-400 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,.12)]">
            <span aria-hidden className="text-slate-400">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sorunuzu arayın... (ör. bakiye, ödev, şifre)"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              aria-label="Sıkça sorulan sorularda ara"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Kategori filtreleri */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeCategory === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tümü
            </button>
            {FAQ_DATA.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.emoji} {cat.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        {totalResults === 0 ? (
          /* Boş durum */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="text-4xl" aria-hidden>🤔</div>
            <h2 className="mt-3 text-lg font-bold text-slate-800">
              Aramanızla eşleşen soru bulunamadı
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Farklı bir anahtar kelime deneyin veya sorunuzu bize doğrudan iletin.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              className="mt-5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Aramayı temizle
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filtered.map((cat) => (
              <section key={cat.id} aria-labelledby={`faq-${cat.id}`}>
                <h2
                  id={`faq-${cat.id}`}
                  className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"
                >
                  <span aria-hidden>{cat.emoji}</span>
                  {cat.title}
                </h2>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <details
                      key={item.question}
                      className="group rounded-xl border border-slate-200 bg-white shadow-sm open:border-emerald-200"
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <span
                          aria-hidden
                          className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                        >
                          ▾
                        </span>
                      </summary>
                      <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Destek CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-8 text-white sm:px-8">
          <h2 className="text-xl font-bold">Sorunuz yanıtlanmadı mı?</h2>
          <p className="mt-1.5 max-w-xl text-sm text-emerald-50">
            Destek ekibimize bir talep gönderin; en kısa sürede size dönüş
            yapalım. Talep oluşturmak için giriş yapmanız gerekir.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/destek"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Destek Talebi Oluştur
            </Link>
            <a
              href="mailto:destek@ozelderspro.com"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              destek@ozelderspro.com
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          Ayrıca bkz.{" "}
          <Link href="/gizlilik" className="underline hover:text-slate-600">
            Gizlilik Politikası
          </Link>{" "}
          ·{" "}
          <Link href="/kvkk" className="underline hover:text-slate-600">
            KVKK
          </Link>{" "}
          ·{" "}
          <Link href="/kullanim-kosullari" className="underline hover:text-slate-600">
            Kullanım Koşulları
          </Link>
        </div>
      </div>
    </div>
  );
}
