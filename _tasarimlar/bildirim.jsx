"use client";

import { GraduationCap, Home, MessageSquare, Settings, Video } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">Özel Ders Pro</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              <Home className="h-4 w-4" />
              Ana Panel
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              <Video className="h-4 w-4" />
              Ders Lobisi
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              <MessageSquare className="h-4 w-4" />
              Mesajlar
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              <Settings className="h-4 w-4" />
              Ayarlar
            </a>
          </nav>
          <div className="flex items-center gap-4">
            {/* Notification Center */}
            <NotificationCenter />
            
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-sm">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Demo Area */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Bildirim Merkezi Demo
          </h1>
          <p className="text-slate-500 mt-1">
            Sag ustteki zil ikonuna tiklayarak bildirim merkezini gorebilirsiniz
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-sky-500 rounded-full" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Okunmamis Gosterge</h3>
            <p className="text-sm text-slate-500">
              Okunmamis bildirimlerin yaninda sky-500 renginde bir nokta bulunur
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-emerald-500 rounded-full" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Renkli Ikonlar</h3>
            <p className="text-sm text-slate-500">
              Onay bildirimleri emerald, mesajlar sky rengi ile gosterilir
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Toplu Islem</h3>
            <p className="text-sm text-slate-500">
              Tumunu Okundu Isaretle butonu ile tum bildirimleri okundu yapabilirsiniz
            </p>
          </div>
        </div>

        {/* Standalone Notification Panel Preview */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Panel Onizleme
          </h2>
          <div className="flex justify-center">
            <div className="w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              {/* Mini Preview Header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-800">Bildirimler</h3>
                    <span className="px-2.5 py-0.5 bg-sky-100 text-sky-600 text-xs font-medium rounded-full">
                      3 yeni
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Sample Notifications */}
              <div className="divide-y divide-slate-50">
                <div className="px-5 py-4 bg-sky-50/30">
                  <div className="flex gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">Yeni Mesaj</p>
                        <span className="w-2 h-2 bg-sky-500 rounded-full" />
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">Ahmet Yilmaz size bir mesaj gonderdi.</p>
                      <p className="text-xs text-slate-400 mt-1.5">2 dakika once</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 bg-sky-50/30">
                  <div className="flex gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">Odev Onaylandi</p>
                        <span className="w-2 h-2 bg-sky-500 rounded-full" />
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">Matematik odevi basariyla onaylandi.</p>
                      <p className="text-xs text-slate-400 mt-1.5">15 dakika once</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">Yeni Rozet Kazandiniz!</p>
                      <p className="text-sm text-slate-500 mt-0.5">5 ders tamamlama rozetini kazandiniz.</p>
                      <p className="text-xs text-slate-400 mt-1.5">1 saat once</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                <button className="w-full text-center text-sm text-sky-600 font-medium">
                  Tum Bildirimleri Gor
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
