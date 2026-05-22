"use client"

import { 
  GraduationCap, 
  Home, 
  MessageSquare, 
  Settings, 
  Video, 
  Wallet,
  Trophy
} from "lucide-react"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { PodiumCards } from "@/components/leaderboard/podium-cards"
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list"

export default function LeaderboardPage() {
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
              <Wallet className="h-4 w-4" />
              Cüzdanım
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"
            >
              <Trophy className="h-4 w-4" />
              Liderlik
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
            <NotificationCenter />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-sm">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Podium Section */}
        <PodiumCards />
        
        {/* Leaderboard List */}
        <LeaderboardList />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              2024 Özel Ders Pro. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-800 transition-colors">Yardım</a>
              <a href="#" className="hover:text-slate-800 transition-colors">Gizlilik</a>
              <a href="#" className="hover:text-slate-800 transition-colors">Kullanım Koşulları</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
