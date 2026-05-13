"use client"

import { GraduationCap, Home, MessageSquare, Settings, Video } from "lucide-react"
import { LiveLessonCard } from "@/components/lobby/live-lesson-card"
import { LessonTopics } from "@/components/lobby/lesson-topics"
import { MaterialsPanel } from "@/components/lobby/materials-panel"

export default function LessonLobbyPage() {
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
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-sm">
            A
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Ders Lobisi</h1>
          <p className="text-slate-500 mt-1">
            Canlı derse katılın ve ders materyallerinizi yönetin
          </p>
        </div>

        {/* Live Lesson Card */}
        <div className="mb-6">
          <LiveLessonCard />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Lesson Topics */}
          <LessonTopics />

          {/* Right Column - Materials & Homework */}
          <MaterialsPanel />
        </div>
      </main>
    </div>
  )
}
