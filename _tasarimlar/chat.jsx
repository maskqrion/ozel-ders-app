"use client"

import { useState } from "react"
import { ChatList, contacts } from "@/components/chat/chat-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { GraduationCap, MessageSquare } from "lucide-react"

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState("1")

  const selectedContact = contacts.find((c) => c.id === selectedChatId) || null

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 bg-white">
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
            <a href="#" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800">Ödevler</a>
            <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <MessageSquare className="h-4 w-4" />
              Mesajlar
            </a>
          </nav>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-sm">
            E
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex min-h-0 flex-1">
        {/* Left Sidebar - Chat List (Desktop) */}
        <aside className="hidden w-80 shrink-0 border-r border-slate-100 lg:block xl:w-96">
          <ChatList selectedId={selectedChatId} onSelect={setSelectedChatId} />
        </aside>

        {/* Mobile View */}
        <div className="flex w-full flex-col lg:hidden">
          {!selectedChatId ? (
            <ChatList selectedId={selectedChatId} onSelect={setSelectedChatId} />
          ) : (
            <>
              <button
                onClick={() => setSelectedChatId("")}
                className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 text-left text-sm font-medium text-emerald-500"
              >
                ← Sohbetlere Dön
              </button>
              <div className="min-h-0 flex-1">
                <ChatWindow contact={selectedContact} />
              </div>
            </>
          )}
        </div>

        {/* Right Side - Chat Window (Desktop) */}
        <section className="hidden min-h-0 flex-1 lg:block">
          <ChatWindow contact={selectedContact} />
        </section>
      </main>
    </div>
  )
}
