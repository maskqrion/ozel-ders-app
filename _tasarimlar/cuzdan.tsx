"use client"

import { 
  GraduationCap, 
  Home, 
  MessageSquare, 
  Settings, 
  Video, 
  Wallet,
  Shield,
  TrendingUp
} from "lucide-react"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { BalanceCard } from "@/components/wallet/balance-card"
import { TransactionHistory } from "@/components/wallet/transaction-history"

export default function WalletPage() {
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
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"
            >
              <Wallet className="h-4 w-4" />
              Cüzdanım
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
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Cüzdanım ve Ödemeler
              </h1>
              <p className="text-slate-500">
                Bakiyenizi yönetin ve işlem geçmişinizi takip edin
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-600">256-bit SSL Güvenlik</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            <span className="text-sm text-slate-600">Anlık Bakiye Güncelleme</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Balance Card */}
          <div>
            <BalanceCard />
          </div>

          {/* Right Column - Transaction History */}
          <div className="lg:min-h-[700px]">
            <TransactionHistory />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Tüm ödemeleriniz 3D Secure ile korunmaktadır</span>
            </div>
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
