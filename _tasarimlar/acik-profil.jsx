"use client";

import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileContent } from "@/components/profile/profile-content";
import { BookingCard } from "@/components/profile/booking-card";
import {
  GraduationCap,
  Home,
  Search,
  ChevronLeft,
} from "lucide-react";

const teacherData = {
  name: "Dr. Ayşe Yılmaz",
  title: "Matematik & Geometri Uzmanı",
  location: "İstanbul, Türkiye",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
  banner: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&h=400&fit=crop",
  rating: 4.9,
  reviewCount: 127,
  studentCount: 245,
  isVerified: true,
};

const bio = `Merhaba! Ben Ayşe, 8 yılı aşkın süredir özel ders veren tutkulu bir matematik eğitmeniyim. İstanbul Üniversitesi Matematik Bölümü'nden mezun olduktan sonra, yüksek lisansımı Matematik Eğitimi alanında tamamladım.

Öğretim felsefem, her öğrencinin benzersiz bir öğrenme tarzına sahip olduğu inancına dayanır. Derslerde sadece formül ezberletmek yerine, matematiğin mantığını ve gerçek hayattaki uygulamalarını göstermeye çalışırım.

YKS, LGS ve okul sınavlarına hazırlık konusunda yüzlerce öğrenciye yardımcı oldum. Birçok öğrencim hedefledikleri üniversitelere ve liselere yerleşti.

Benimle çalışmaya başladığınızda, sadece bir öğretmen değil, sizin başarınız için gerçekten çabalayan bir mentor kazanacaksınız!`;

const expertise = [
  "YKS Matematik",
  "LGS Matematik",
  "Geometri",
  "Analitik Geometri",
  "Türev & İntegral",
  "Olasılık",
  "Sayısal Mantık",
  "Temel Matematik",
];

const reviews = [
  {
    id: "1",
    author: "Mehmet K.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    date: "2 hafta önce",
    content: "Ayşe hocam sayesinde matematik artık kabusumdan en sevdiğim derse dönüştü. Sabırla ve farklı yöntemlerle anlatıyor, ta ki gerçekten kavrayana kadar.",
    subject: "YKS Matematik",
  },
  {
    id: "2",
    author: "Zeynep A.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    date: "1 ay önce",
    content: "LGS sınavına hazırlanırken Ayşe hocayla çalıştım ve hedeflediğim liseye yerleştim! Geometri konusundaki açıkları kapatmam için çok yardımcı oldu.",
    subject: "LGS Matematik",
  },
  {
    id: "3",
    author: "Can D.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    date: "2 ay önce",
    content: "Türev ve integral konularında çok zorlanıyordum. Ayşe hoca konuyu sıfırdan, temelden başlayarak anlattı. Şimdi sınıfın en iyilerinden biriyim.",
    subject: "Türev & İntegral",
  },
  {
    id: "4",
    author: "Elif S.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    date: "3 ay önce",
    content: "Ders materyalleri çok kaliteli ve organize. Her dersten sonra konu özetleri ve çözülmüş sorular paylaşıyor. Kesinlikle tavsiye ederim.",
    subject: "Geometri",
  },
];

export default function PublicProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Geri
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-slate-800">Özel Ders Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Search className="h-4 w-4" />
              Eğitmen Ara
            </button>
            <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <Home className="h-4 w-4" />
              Ana Sayfa
            </button>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
              Giriş Yap
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <ProfileHero teacher={teacherData} />

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content - Wide Column */}
          <div className="lg:col-span-2">
            <ProfileContent bio={bio} expertise={expertise} reviews={reviews} />
          </div>

          {/* Right Sidebar - Sticky Booking Card */}
          <div className="lg:col-span-1">
            <BookingCard
              hourlyRate={350}
              availability="Hafta içi 15:00 - 21:00"
              responseTime="Genellikle 1 saat içinde"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white mt-12">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-800 transition-colors">Nasıl Çalışır?</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">Eğitmen Ol</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">Fiyatlandırma</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Destek</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-800 transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">SSS</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Yasal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-800 transition-colors">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">Kullanım Koşulları</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">KVKK</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Sosyal Medya</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-800 transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-slate-800 transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Özel Ders Pro</span>
            </div>
            <p className="text-sm text-slate-500">
              2024 Özel Ders Pro. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
