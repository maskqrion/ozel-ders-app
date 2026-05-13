"use client"

import { useState } from "react"
import { GraduationCap, Settings, ArrowLeft } from "lucide-react"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import { PersonalInfoForm } from "@/components/settings/personal-info-form"
import { SecurityForm } from "@/components/settings/security-form"
import { PricingForm } from "@/components/settings/pricing-form"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("personal")

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalInfoForm />
      case "security":
        return <SecurityForm />
      case "pricing":
        return <PricingForm />
      default:
        return <PersonalInfoForm />
    }
  }

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
            <a href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800">Ana Panel</a>
            <a href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800">Derslerim</a>
            <a href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800">Mesajlar</a>
            <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <Settings className="h-4 w-4" />
              Ayarlar
            </a>
          </nav>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-sm">
            A
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Page Title */}
        <div className="mb-6 lg:mb-8">
          <button className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors lg:hidden">
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Profil Ayarları</h1>
          <p className="text-slate-500 mt-1">Hesap bilgilerinizi ve tercihlerinizi yönetin</p>
        </div>

        {/* Settings Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}
