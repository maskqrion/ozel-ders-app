"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Tabs } from "@/components/ui/tabs";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Timeline } from "@/components/ui/timeline";

const ArchitectureGraph = dynamic(
  () => import("@/components/ArchitectureGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-caption text-grey-brown animate-pulse">Graf yükleniyor…</span>
      </div>
    ),
  }
);

// ── Framer Motion Variants ─────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const tile = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE },
  },
};

// ── Inline SVG Icons ───────────────────────────────────────────────────────
function ICalendar({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="16" height="15" rx="2" />
      <path d="M2 8h16M7 2v2M13 2v2" />
    </svg>
  );
}
function IClock({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v4l2.5 2.5" />
    </svg>
  );
}
function IUser({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="6" r="3" />
      <path d="M3 18c0-4 3-6 7-6s7 2 7 6" />
    </svg>
  );
}
function IZap({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L4 12h6l-2 6 8-10h-6z" />
    </svg>
  );
}
function ISearch({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M14 14l3.5 3.5" />
    </svg>
  );
}
function IPlus({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
function IArrowTrendUp({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M1 11l4-4 3 3 5-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4h3v3" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IBookOpen({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 4c2-1 5-1 8 1 3-2 6-2 8-1v12c-2-1-5-1-8 1-3-2-6-2-8-1V4z" />
      <path d="M10 5v13" />
    </svg>
  );
}

// ── Sidebar Demo ───────────────────────────────────────────────────────────

function IHome({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M7 18v-6h6v6" />
    </svg>
  );
}
function IUserCircle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="8" />
      <circle cx="10" cy="7.5" r="2.5" />
      <path d="M4.5 16c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  );
}
function ISettings({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
    </svg>
  );
}
function ILogout({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 4h3a1 1 0 011 1v10a1 1 0 01-1 1h-3" />
      <path d="M9 14l4-4-4-4" />
      <path d="M3 10h10" />
    </svg>
  );
}
function IBook({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 4c2-1 5-1 8 1 3-2 6-2 8-1v12c-2-1-5-1-8 1-3-2-6-2-8-1V4z" />
      <path d="M10 5v13" />
    </svg>
  );
}

const SIDEBAR_LINKS = [
  { label: "Ana Sayfa", href: "#", icon: <IHome /> },
  { label: "Derslerim", href: "#", icon: <IBook /> },
  { label: "Profil", href: "#", icon: <IUserCircle /> },
  { label: "Ayarlar", href: "#", icon: <ISettings /> },
  { label: "Çıkış", href: "#", icon: <ILogout /> },
];

// ── Tabs Demo ──────────────────────────────────────────────────────────────

const DERSLER = [
  { konu: "Türev ve İntegral", hoca: "Ayşe Kaya", gun: "Bugün 14:00", durum: "Yaklaşıyor" },
  { konu: "Mekanik Dalgalar", hoca: "Mert Demir", gun: "Bugün 16:30", durum: "Yaklaşıyor" },
  { konu: "İngilizce Gramer", hoca: "Selin Arslan", gun: "Yarın 10:00", durum: "Planlandı" },
  { konu: "Analitik Geometri", hoca: "Caner Yıldız", gun: "Cuma 13:00", durum: "Planlandı" },
];

const ODEVLER = [
  { baslik: "Limit Alıştırmaları", ders: "Matematik", teslim: "Yarın", tamamlandi: true },
  { baslik: "Newton Yasaları Özeti", ders: "Fizik", teslim: "2 gün", tamamlandi: false },
  { baslik: "Essay Taslağı", ders: "İngilizce", teslim: "3 gün", tamamlandi: false },
  { baslik: "Koordinat Geometrisi", ders: "Matematik", teslim: "1 hafta", tamamlandi: false },
];

const ISTATISTIKLER = [
  { etiket: "Toplam Ders Saati", deger: "128 saat", delta: "+12 bu ay" },
  { etiket: "Tamamlanan Ödev", deger: "34 / 41", delta: "%82 tamamlama" },
  { etiket: "Ortalama Not", deger: "87,4", delta: "+3,2 puan ↑" },
  { etiket: "Aktif Öğretmen", deger: "4 hoca", delta: "Matematik, Fizik +" },
  { etiket: "Bu Haftaki XP", deger: "+450 XP", delta: "Seviye 7" },
];

function TabDersler() {
  return (
    <div className="p-6 min-h-[280px]">
      <p className="text-caption text-grey-brown uppercase tracking-[0.14em] mb-4">
        Bu haftaki dersler
      </p>
      <ul className="space-y-2">
        {DERSLER.map((d) => (
          <li
            key={d.konu}
            className="flex items-center gap-4 rounded-[8px] px-4 py-3"
            style={{
              borderLeft: "2px solid #dc5000",
              background: "rgba(220,80,0,0.04)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-body text-warm-cream font-medium leading-none truncate">
                {d.konu}
              </p>
              <p className="text-caption text-grey-brown mt-1">{d.hoca}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-caption text-burnt-sienna tabular-nums">{d.gun}</p>
              <p className="text-caption text-grey-brown mt-0.5">{d.durum}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabOdevler() {
  return (
    <div className="p-6 min-h-[280px]">
      <p className="text-caption text-grey-brown uppercase tracking-[0.14em] mb-4">
        Bekleyen ödevler
      </p>
      <ul className="space-y-2">
        {ODEVLER.map((o) => (
          <li
            key={o.baslik}
            className="flex items-center gap-3 rounded-[8px] px-4 py-3"
            style={{
              border: "1px solid rgba(255,237,215,0.06)",
              background: "rgba(255,237,215,0.02)",
              opacity: o.tamamlandi ? 0.45 : 1,
            }}
          >
            {/* Checkbox dot */}
            <span
              className="shrink-0 h-4 w-4 rounded-full flex items-center justify-center"
              style={{
                border: o.tamamlandi ? "none" : "1px solid #6c5f51",
                background: o.tamamlandi ? "#dc5000" : "transparent",
              }}
            >
              {o.tamamlandi && (
                <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#ffedd7" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-body text-warm-cream leading-none truncate"
                style={{ textDecoration: o.tamamlandi ? "line-through" : "none" }}>
                {o.baslik}
              </p>
              <p className="text-caption text-grey-brown mt-0.5">{o.ders}</p>
            </div>
            <span className="text-caption text-grey-brown shrink-0">{o.teslim}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabIstatistikler() {
  return (
    <div className="p-6 min-h-[280px]">
      <p className="text-caption text-grey-brown uppercase tracking-[0.14em] mb-4">
        Performans özeti
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ISTATISTIKLER.map((s, i) => (
          <div
            key={s.etiket}
            className={`rounded-[8px] px-4 py-3 ${i === 0 ? "col-span-2" : ""}`}
            style={{
              background: i === 0 ? "rgba(56,36,22,0.55)" : "rgba(255,237,215,0.02)",
              border: i === 0
                ? "1px solid rgba(220,80,0,0.18)"
                : "1px solid rgba(255,237,215,0.06)",
            }}
          >
            <p className="text-caption text-grey-brown">{s.etiket}</p>
            <p
              className="text-warm-cream font-medium mt-0.5 tabular-nums"
              style={{ fontSize: i === 0 ? "29px" : "18px", lineHeight: i === 0 ? 1.09 : 1.2 }}
            >
              {s.deger}
            </p>
            <p className="text-caption text-burnt-sienna mt-1">{s.delta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline Demo ─────────────────────────────────────────────────────────

function TLEtiket({ renk = "#dc5000", metin }: { renk?: string; metin: string }) {
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-pill text-caption uppercase"
      style={{
        fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
        fontSize: "10px",
        letterSpacing: "0.10em",
        color: renk,
        border: `1px solid ${renk}40`,
        background: `${renk}0d`,
      }}
    >
      {metin}
    </span>
  );
}

function TLSatir({ metin, ikinci }: { metin: string; ikinci?: string }) {
  return (
    <div
      className="flex items-start gap-2.5 py-2.5"
      style={{ borderBottom: "1px dashed rgba(64,55,46,0.7)" }}
    >
      <span
        className="shrink-0 mt-[5px] h-1 w-3"
        style={{ background: "#dc5000" }}
        aria-hidden
      />
      <div>
        <p style={{
          fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
          fontSize: "14px",
          fontWeight: 400,
          color: "#ffedd7",
          lineHeight: 1.33,
        }}>
          {metin}
        </p>
        {ikinci && (
          <p style={{
            fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
            fontSize: "12px",
            color: "#6c5f51",
            marginTop: "2px",
          }}>
            {ikinci}
          </p>
        )}
      </div>
    </div>
  );
}

function TLKart({ label, deger, accent = false }: { label: string; deger: string; accent?: boolean }) {
  return (
    <div
      className="rounded-[8px] px-4 py-3"
      style={{
        background: accent ? "rgba(56,36,22,0.55)" : "rgba(255,237,215,0.02)",
        border: accent ? "1px solid rgba(220,80,0,0.18)" : "1px solid rgba(255,237,215,0.06)",
      }}
    >
      <p style={{
        fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
        fontSize: "10px",
        color: "#6c5f51",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
        fontSize: "18px",
        fontWeight: 500,
        color: accent ? "#dc5000" : "#ffedd7",
        lineHeight: 1.2,
        marginTop: "2px",
      }}>
        {deger}
      </p>
    </div>
  );
}

function OzelDersTimeline() {
  const data = [
    {
      title: "May '26",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <TLEtiket metin="Platforma Katılım" />
          </div>
          <TLSatir metin="Hesap oluşturuldu ve profil tamamlandı" ikinci="21 Mayıs 2026, 10:42" />
          <TLSatir metin="İlk öğretmen bağlantısı kuruldu — Ayşe Kaya (Matematik)" ikinci="21 Mayıs 2026, 11:15" />
          <TLSatir metin="PWA olarak cihaza eklendi" ikinci="21 Mayıs 2026, 11:28" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <TLKart label="Başlangıç XP" deger="0 XP" />
            <TLKart label="Kayıtlı Ders" deger="0 seans" />
          </div>
        </div>
      ),
    },
    {
      title: "İlk Ders",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <TLEtiket metin="Tamamlandı" renk="#ffedd7" />
            <TLEtiket metin="+500 XP" />
          </div>
          <TLSatir metin="Matematik — İleri Kalkülüs, 60 dakika" ikinci="22 Mayıs 2026, 14:00" />
          <TLSatir metin="Ödev teslim edildi: Limit Alıştırmaları" ikinci="22 Mayıs 2026, 16:30" />
          <TLSatir metin="Öğretmen değerlendirmesi alındı — 5.0 ★" ikinci="22 Mayıs 2026, 17:00" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <TLKart label="Kazanılan XP" deger="+500" accent />
            <TLKart label="Süre" deger="60 dk" />
            <TLKart label="Puan" deger="5.0 ★" />
          </div>
        </div>
      ),
    },
    {
      title: "Cüzdan",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <TLEtiket metin="Finansal İşlem" renk="#6c5f51" />
          </div>
          <TLSatir metin="Cüzdana 1.000 ₺ yüklendi — Kredi kartı" ikinci="23 Mayıs 2026, 09:15" />
          <TLSatir metin="İlk ders ödemesi gerçekleşti — 250 ₺" ikinci="23 Mayıs 2026, 14:00" />
          <TLSatir metin="Bakiye güncellendi: 750 ₺ kullanılabilir" ikinci="23 Mayıs 2026, 14:01" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <TLKart label="Yüklenen" deger="1.000 ₺" accent />
            <TLKart label="Kalan Bakiye" deger="750 ₺" />
          </div>
        </div>
      ),
    },
    {
      title: "Seviye 7",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <TLEtiket metin="Seviye Atlandı" />
            <TLEtiket metin="7.200 XP" renk="#ffedd7" />
          </div>
          <TLSatir metin="7.000 XP eşiği aşıldı — Seviye 7 aktif" ikinci="Bugün, 21 Mayıs 2026" />
          <TLSatir metin="3 yeni rozet açıldı: 🏆 Azimli, ⚡ Hızlı Öğrenen, 📚 Okuyucu" />
          <TLSatir metin="Liderlik tablosunda Top 12'ye girdi" ikinci="Matematik kategorisinde" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <TLKart label="Toplam XP" deger="7.200" accent />
            <TLKart label="Sıralama" deger="#12" />
            <TLKart label="Rozet" deger="5 aktif" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative w-full overflow-clip">
      <Timeline data={data} />
    </div>
  );
}

// ── Card Spotlight Demo ────────────────────────────────────────────────────

interface EgitmenKartiProps {
  ad: string;
  alan: string;
  puan: number;
  ogrenci: number;
  dersler: string[];
  rozet: string;
  biyografi: string;
}

function EgitmenSpotlightKarti({
  ad,
  alan,
  puan,
  ogrenci,
  dersler,
  rozet,
  biyografi,
}: EgitmenKartiProps) {
  return (
    <CardSpotlight className="p-6 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between">
        {/* Avatar initials */}
        <div
          className="h-11 w-11 rounded-[8px] flex items-center justify-center shrink-0"
          style={{
            background: "rgba(56,36,22,0.9)",
            border: "1px solid rgba(220,80,0,0.18)",
          }}
        >
          <span
            style={{
              fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
              fontSize: "15px",
              fontWeight: 500,
              color: "#ffedd7",
              letterSpacing: "0.02em",
            }}
          >
            {ad.split(" ").map((n) => n[0]).join("")}
          </span>
        </div>

        {/* Rozet pill */}
        <span
          className="text-caption px-2.5 py-1 rounded-pill"
          style={{
            fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
            fontSize: "10px",
            fontWeight: 400,
            color: "#dc5000",
            border: "1px solid rgba(220,80,0,0.30)",
            background: "rgba(220,80,0,0.06)",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          {rozet}
        </span>
      </div>

      {/* Name + subject */}
      <div>
        <h3
          style={{
            fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
            fontSize: "18px",
            fontWeight: 500,
            color: "#ffedd7",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {ad}
        </h3>
        <p
          style={{
            fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
            fontSize: "12px",
            fontWeight: 400,
            color: "#dc5000",
            marginTop: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          {alan}
        </p>
      </div>

      {/* Biyografi */}
      <p
        style={{
          fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
          fontSize: "13px",
          fontWeight: 400,
          color: "#6c5f51",
          lineHeight: 1.4,
        }}
      >
        {biyografi}
      </p>

      {/* Dersler listesi */}
      <ul className="space-y-1.5">
        {dersler.map((ders) => (
          <li key={ders} className="flex items-center gap-2">
            {/* Burnt-sienna hairline bullet */}
            <span
              className="shrink-0 h-px w-3"
              style={{ background: "#dc5000" }}
              aria-hidden
            />
            <span
              style={{
                fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                color: "#ffedd7",
                opacity: 0.80,
              }}
            >
              {ders}
            </span>
          </li>
        ))}
      </ul>

      {/* Dashed divider */}
      <div style={{ borderTop: "1px dashed #40372e" }} />

      {/* Footer stats */}
      <div className="flex items-center justify-between">
        {/* Puan */}
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 12 12" fill="#dc5000" className="h-3 w-3" aria-hidden>
            <path d="M6 1l1.3 2.6L10 4.1 8 6.1l.5 2.9L6 7.7l-2.5 1.3L4 6.1 2 4.1l2.7-.5z" />
          </svg>
          <span
            style={{
              fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#ffedd7",
            }}
          >
            {puan.toFixed(1)}
          </span>
        </div>

        {/* Öğrenci sayısı */}
        <span
          style={{
            fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
            fontSize: "12px",
            fontWeight: 400,
            color: "#6c5f51",
          }}
        >
          {ogrenci} öğrenci
        </span>

        {/* Ders Gör CTA */}
        <button
          type="button"
          style={{
            fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
            fontSize: "12px",
            fontWeight: 400,
            color: "#ffedd7",
            background: "transparent",
            border: "1px solid rgba(255,237,215,0.22)",
            borderRadius: "22.5px",
            padding: "5px 14px",
            cursor: "pointer",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#dc5000";
            (e.currentTarget as HTMLButtonElement).style.color = "#dc5000";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,237,215,0.22)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffedd7";
          }}
        >
          Profil
        </button>
      </div>
    </CardSpotlight>
  );
}

function OzelDersTabs() {
  const tabs = [
    { title: "Dersler", value: "dersler", content: <TabDersler /> },
    { title: "Ödevler", value: "odevler", content: <TabOdevler /> },
    { title: "İstatistikler", value: "istatistikler", content: <TabIstatistikler /> },
  ];

  return <Tabs tabs={tabs} />;
}

function SidebarDemoInline() {
  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen} animate>
      <SidebarBody className="justify-between gap-8">
        {/* Logo + links */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Logo mark */}
          <motion.div
            className="flex items-center gap-2 mb-8 px-2"
            animate={{ opacity: 1 }}
          >
            {/* Cork dot */}
            <span
              className="shrink-0 inline-flex h-5 w-6 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm"
              style={{ background: "#dc5000" }}
            />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.18 }}
              className="whitespace-nowrap overflow-hidden"
              style={{
                fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
                fontSize: "15px",
                fontWeight: 500,
                color: "#ffedd7",
              }}
            >
              ORYZO
            </motion.span>
          </motion.div>

          {/* Nav links */}
          <div className="flex flex-col gap-1">
            {SIDEBAR_LINKS.slice(0, 4).map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </div>
        </div>

        {/* Bottom: user + logout */}
        <div
          className="pt-4"
          style={{ borderTop: "1px dashed #40372e" }}
        >
          <SidebarLink link={SIDEBAR_LINKS[4]} />
        </div>
      </SidebarBody>

      {/* Content panel */}
      <div
        className="flex flex-1 flex-col rounded-tl-[12px] p-6 overflow-hidden"
        style={{
          background: "rgba(64,55,46,0.18)",
          borderLeft: "1px solid rgba(64,55,46,0.7)",
        }}
      >
        <p
          className="text-caption uppercase tracking-[0.18em] mb-1"
          style={{ color: "#6c5f51" }}
        >
          Panel
        </p>
        <h3
          className="font-medium mb-5 leading-none"
          style={{
            fontFamily: "'halyard-display-variable', ui-sans-serif, system-ui, sans-serif",
            fontSize: "24px",
            color: "#ffedd7",
          }}
        >
          İçerik Alanı
        </h3>

        {/* Skeleton blocks */}
        <div className="flex gap-3 mb-3">
          {[2, 3, 1].map((span, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[8px]"
              style={{
                flex: span,
                height: "72px",
                background: "rgba(255,237,215,0.04)",
                border: "1px solid rgba(255,237,215,0.06)",
              }}
            />
          ))}
        </div>
        <div className="flex gap-3 flex-1">
          {[1, 2].map((span, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[8px]"
              style={{
                flex: span,
                background: "rgba(255,237,215,0.03)",
                border: "1px solid rgba(255,237,215,0.05)",
              }}
            />
          ))}
        </div>

        <p
          className="text-caption mt-4 opacity-40"
          style={{ color: "#ffedd7" }}
        >
          Kenar çubuğunu açmak için üzerine gelin
        </p>
      </div>
    </Sidebar>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  const W = 240;
  const H = 64;
  const pad = 6;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y] as [number, number];
  });

  // Smooth bezier path
  const pathD = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = pts[i - 1];
    const cpx = (px + x) / 2;
    return `${acc} C ${cpx},${py} ${cpx},${y} ${x},${y}`;
  }, "");

  const areaD = `${pathD} L ${pts[pts.length - 1][0]},${H} L ${pts[0][0]},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dc5000" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#dc5000" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sg)" />
      <path d={pathD} fill="none" stroke="#dc5000" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill="#dc5000" />
    </svg>
  );
}

// ── XP Ring ────────────────────────────────────────────────────────────────
function XPRing({
  percent,
  level,
  current,
  total,
}: {
  percent: number;
  level: number;
  current: number;
  total: number;
}) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
          {/* Track */}
          <circle
            cx="65" cy="65" r={r}
            fill="none"
            stroke="rgba(255,237,215,0.05)"
            strokeWidth={10}
          />
          {/* Progress */}
          <motion.circle
            cx="65" cy="65" r={r}
            fill="none"
            stroke="#dc5000"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.5 }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-caption text-grey-brown uppercase tracking-widest leading-none mb-1">Lv.</span>
          <span
            className="text-warm-cream font-medium leading-none"
            style={{ fontSize: "36px", lineHeight: 1 }}
          >
            {level}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between mb-1.5">
          <span className="text-caption text-grey-brown">
            {current.toLocaleString("tr-TR")} XP
          </span>
          <span className="text-caption text-grey-brown">
            {total.toLocaleString("tr-TR")} XP
          </span>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,237,215,0.06)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #dc5000, #ff7a38)" }}
            initial={{ width: 0 }}
            animate={{ width: `${percent * 100}%` }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.6 }}
          />
        </div>
        <p className="text-caption text-burnt-sienna mt-1.5 text-center">
          {(total - current).toLocaleString("tr-TR")} XP — sonraki seviye
        </p>
      </div>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const SPARK = [28, 42, 35, 58, 48, 72, 61, 80, 68, 88, 74, 95];

const LESSONS = [
  {
    subject: "Matematik",
    teacher: "Ayşe Kaya",
    time: "14:00",
    day: "Bugün",
    tag: "Kalkülüs",
  },
  {
    subject: "Fizik",
    teacher: "Mert Demir",
    time: "16:30",
    day: "Bugün",
    tag: "Mekanik",
  },
  {
    subject: "İngilizce",
    teacher: "Selin Arslan",
    time: "10:00",
    day: "Yarın",
    tag: "Gramer",
  },
];

const STATS = [
  { label: "Bu hafta", val: "+450 XP" },
  { label: "Toplam ders", val: "38 seans" },
  { label: "Rozet", val: "5 aktif" },
];

// ── Page ───────────────────────────────────────────────────────────────────
export default function SandboxPage() {
  return (
    <div
      className="min-h-screen bg-studio-black text-warm-cream font-halyard antialiased"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")",
      }}
    >
      <div className="mx-auto max-w-[1100px] px-6 py-8 flex flex-col min-h-screen">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-6 flex items-end justify-between"
        >
          <div>
            <p className="text-caption text-grey-brown uppercase tracking-[0.18em] mb-1.5">
              Özel Ders Pro · Sandbox
            </p>
            <h1 className="text-heading text-warm-cream font-medium leading-none">
              Genel Bakış
            </h1>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-btn"
            style={{ border: "1px dashed #40372e" }}
          >
            <span
              className="inline-flex h-1.5 w-1.5 rounded-full bg-burnt-sienna"
              style={{ boxShadow: "0 0 6px #dc5000" }}
            />
            <span className="text-caption text-grey-brown">20 Mayıs 2026, Çarşamba</span>
          </div>
        </motion.header>

        {/* ── Bento Grid ─────────────────────────────────────────────────── */}
        <motion.div
          variants={grid}
          initial="hidden"
          animate="show"
          className="grid flex-1 gap-3"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr",
          }}
        >

          {/* ┌── Card 1: Cüzdan (col-span-2) ─────────────────────────────┐ */}
          <motion.div
            variants={tile}
            className="col-span-2 rounded-card p-6 flex flex-col justify-between overflow-hidden relative"
            style={{
              background: "rgba(64,55,46,0.40)",
              border: "1px solid rgba(255,237,215,0.06)",
            }}
          >
            {/* Subtle corner glow */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(220,80,0,0.08) 0%, transparent 70%)" }}
            />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-caption text-grey-brown uppercase tracking-[0.14em]">
                  Cüzdan Bakiyesi
                </p>
                <p
                  className="text-heading-lg text-warm-cream font-medium mt-1 tabular-nums"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  ₺ 2.450,00
                </p>
              </div>

              <div
                className="flex items-center gap-1.5 rounded-pill px-3 py-1.5"
                style={{
                  background: "rgba(220,80,0,0.10)",
                  border: "1px solid rgba(220,80,0,0.20)",
                }}
              >
                <span className="text-burnt-sienna">
                  <IArrowTrendUp />
                </span>
                <span className="text-caption text-burnt-sienna">+₺320 bu ay</span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="relative z-10 mt-4">
              <Sparkline data={SPARK} />
              <div className="flex justify-between mt-1.5 px-1">
                {["Oca", "Şub", "Mar", "Nis", "May"].map((m) => (
                  <span key={m} className="text-caption text-grey-brown">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom stats row */}
            <div
              className="relative z-10 flex gap-6 mt-5 pt-4"
              style={{ borderTop: "1px dashed rgba(64,55,46,1)" }}
            >
              {[
                { label: "Bu ay harcanan", val: "₺ 1.200,00" },
                { label: "Bekleyen ödeme", val: "₺ 350,00" },
                { label: "Toplam kazanılan", val: "₺ 5.800,00" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-caption text-grey-brown">{s.label}</p>
                  <p className="text-body text-warm-cream font-medium mt-0.5 tabular-nums">
                    {s.val}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ┌── Card 2: XP & Seviye (row-span-2) ───────────────────────┐ */}
          <motion.div
            variants={tile}
            className="row-span-2 rounded-card p-6 flex flex-col"
            style={{
              background: "rgba(56,36,22,0.65)",
              border: "1px solid rgba(220,80,0,0.09)",
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="text-burnt-sienna">
                <IZap />
              </span>
              <p className="text-caption text-grey-brown uppercase tracking-[0.14em]">
                XP &amp; Seviye
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <XPRing percent={0.72} level={7} current={7200} total={10000} />
            </div>

            {/* Stat rows */}
            <div className="mt-6 space-y-0">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-2.5"
                  style={{
                    borderBottom:
                      i < STATS.length - 1
                        ? "1px dashed rgba(64,55,46,0.9)"
                        : undefined,
                  }}
                >
                  <span className="text-caption text-grey-brown">{s.label}</span>
                  <span className="text-caption text-warm-cream">{s.val}</span>
                </div>
              ))}
            </div>

            {/* Rozet strip */}
            <div
              className="mt-4 rounded-[8px] px-3 py-2.5 flex items-center justify-between"
              style={{ background: "rgba(220,80,0,0.07)", border: "1px solid rgba(220,80,0,0.14)" }}
            >
              <span className="text-caption text-grey-brown">Aktif rozet</span>
              <div className="flex -space-x-1.5">
                {["🏆", "⚡", "📚", "🎯", "🔥"].map((e, i) => (
                  <span
                    key={i}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
                    style={{
                      background: "rgba(56,36,22,0.8)",
                      border: "1.5px solid rgba(220,80,0,0.25)",
                      zIndex: 5 - i,
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ┌── Card 3: Yaklaşan Dersler ────────────────────────────────┐ */}
          <motion.div
            variants={tile}
            className="rounded-card p-6 flex flex-col overflow-hidden"
            style={{
              background: "rgba(64,55,46,0.30)",
              border: "1px solid rgba(255,237,215,0.05)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-warm-cream" style={{ opacity: 0.5 }}>
                <ICalendar />
              </span>
              <p className="text-caption text-grey-brown uppercase tracking-[0.14em]">
                Yaklaşan Dersler
              </p>
            </div>

            <ul className="space-y-2 flex-1">
              {LESSONS.map((l) => (
                <motion.li
                  key={`${l.subject}-${l.time}`}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="flex items-center gap-3 rounded-[8px] py-2 px-3 cursor-default"
                  style={{
                    borderLeft: "2px solid #dc5000",
                    background: "rgba(220,80,0,0.04)",
                  }}
                >
                  {/* Subject icon */}
                  <span className="text-grey-brown shrink-0">
                    <IBookOpen />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-body text-warm-cream font-medium leading-none truncate">
                      {l.subject}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-grey-brown">
                        <IUser />
                      </span>
                      <span className="text-caption text-grey-brown truncate">
                        {l.teacher}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-burnt-sienna">
                        <IClock />
                      </span>
                      <span className="text-caption text-burnt-sienna tabular-nums">
                        {l.time}
                      </span>
                    </div>
                    <p className="text-caption text-grey-brown mt-0.5">{l.day}</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* View all */}
            <button
              type="button"
              className="mt-4 text-caption text-grey-brown hover:text-warm-cream transition-colors"
              style={{
                textDecoration: "underline",
                textDecorationColor: "rgba(108,95,81,0.4)",
                textUnderlineOffset: "3px",
              }}
            >
              Tüm dersleri gör →
            </button>
          </motion.div>

          {/* ┌── Card 4: Hızlı İşlemler ──────────────────────────────────┐ */}
          <motion.div
            variants={tile}
            className="rounded-card p-6 flex flex-col justify-between"
            style={{
              background: "rgba(64,55,46,0.30)",
              border: "1px solid rgba(255,237,215,0.05)",
            }}
          >
            <p className="text-caption text-grey-brown uppercase tracking-[0.14em]">
              Hızlı İşlemler
            </p>

            <div className="flex flex-col gap-2.5 mt-5">
              {/* Primary: Ders Bul — filled dark-cork pill */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="flex items-center justify-center gap-2 rounded-pill py-3 text-body text-warm-cream"
                style={{
                  background: "#382416",
                  border: "1px solid rgba(255,237,215,0.09)",
                }}
              >
                <ISearch />
                <span>Ders Bul</span>
              </motion.button>

              {/* Secondary: Bakiye Yükle — ghost rounded pill */}
              <motion.button
                type="button"
                whileHover={{ borderColor: "#dc5000", color: "#dc5000" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center gap-2 rounded-btn py-3 text-body text-warm-cream"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,237,215,0.22)",
                }}
              >
                <IPlus />
                <span>Bakiye Yükle</span>
              </motion.button>

              {/* Tertiary: flat ghost text */}
              <button
                type="button"
                className="text-caption text-grey-brown hover:text-warm-cream transition-colors mt-1"
                style={{
                  textDecoration: "underline",
                  textDecorationColor: "rgba(108,95,81,0.35)",
                  textUnderlineOffset: "3px",
                }}
              >
                İşlem geçmişini gör →
              </button>
            </div>

            {/* Bottom separator + tip */}
            <div
              className="pt-4 mt-auto"
              style={{ borderTop: "1px dashed #40372e" }}
            >
              <p className="text-caption text-grey-brown leading-relaxed">
                Bir sonraki derse{" "}
                <span className="text-warm-cream">3s 20dk</span> kaldı.
              </p>
            </div>
          </motion.div>

        </motion.div>

        {/* ── Architecture Graph ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
          className="mt-3 rounded-card overflow-hidden flex flex-col"
          style={{
            height: "80vh",
            border: "1px solid rgba(255,237,215,0.06)",
            background: "rgba(16,9,4,0.8)",
          }}
        >
          {/* Header strip */}
          <div
            className="flex items-center justify-between px-6 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(64,55,46,0.7)" }}
          >
            <div>
              <p className="text-caption text-grey-brown uppercase tracking-[0.18em] mb-0.5">
                Mimari
              </p>
              <h2 className="text-subheading text-warm-cream font-medium leading-none">
                Ağ Grafiği
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                {[
                  { color: "#dc5000", label: "Merkez" },
                  { color: "#ffedd7", label: "Katman" },
                  { color: "#40372e", label: "Bileşen" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-caption text-grey-brown">{label}</span>
                  </div>
                ))}
              </div>
              <span className="text-caption text-grey-brown opacity-50">
                Sürükle · Yakınlaştır
              </span>
            </div>
          </div>

          {/* Graph canvas */}
          <div className="flex-1 min-h-0">
            <ArchitectureGraph />
          </div>
        </motion.section>

        {/* ── Sidebar Showcase ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
          className="mt-3"
        >
          {/* Section header */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-caption text-grey-brown uppercase tracking-[0.18em] mb-1">
                Bileşen Galerisi
              </p>
              <h2 className="text-subheading text-warm-cream font-medium leading-none">
                Kenar Çubuğu
              </h2>
            </div>
            <span className="text-caption text-grey-brown opacity-50">Üzerine gel → aç</span>
          </div>

          {/* Demo container */}
          <div
            className="rounded-card overflow-hidden flex"
            style={{
              height: "380px",
              border: "1px solid rgba(255,237,215,0.06)",
            }}
          >
            <SidebarDemoInline />
          </div>
        </motion.section>

        {/* ── Tabs Showcase ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.65 }}
          className="mt-3"
        >
          <div className="mb-3">
            <p className="text-caption text-grey-brown uppercase tracking-[0.18em] mb-1">
              Bileşen Galerisi
            </p>
            <h2 className="text-subheading text-warm-cream font-medium leading-none">
              Sekmeli Geçiş
            </h2>
          </div>

          <div
            className="rounded-card overflow-hidden"
            style={{ border: "1px solid rgba(255,237,215,0.06)" }}
          >
            <OzelDersTabs />
          </div>
        </motion.section>

        {/* ── Card Spotlight Showcase ────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
          className="mt-3"
        >
          <div className="mb-3">
            <p className="text-caption text-grey-brown uppercase tracking-[0.18em] mb-1">
              Bileşen Galerisi
            </p>
            <h2 className="text-subheading text-warm-cream font-medium leading-none">
              Öne Çıkan Eğitmenler
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <EgitmenSpotlightKarti
              ad="Ayşe Kaya"
              alan="Matematik"
              puan={5.0}
              ogrenci={48}
              dersler={["İleri Kalkülüs", "Lineer Cebir", "Diferansiyel Denklemler"]}
              rozet="Uzman"
              biyografi="8 yıllık deneyim · YKS odaklı · Online & yüz yüze"
            />
            <EgitmenSpotlightKarti
              ad="Mert Demir"
              alan="Fizik"
              puan={4.9}
              ogrenci={35}
              dersler={["Mekanik", "Elektromanyetizma", "Modern Fizik"]}
              rozet="Seçilen"
              biyografi="Boğaziçi mezunu · Simülasyon odaklı ders"
            />
            <EgitmenSpotlightKarti
              ad="Selin Arslan"
              alan="İngilizce"
              puan={4.8}
              ogrenci={62}
              dersler={["Akademik Yazım", "IELTS Hazırlık", "Konuşma Pratiği"]}
              rozet="Popüler"
              biyografi="Cambridge sertifikalı · IELTS 8.5"
            />
          </div>
        </motion.section>

        {/* ── Timeline Showcase ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.75 }}
          className="mt-3"
          style={{ borderTop: "1px dashed #40372e", paddingTop: "24px" }}
        >
          <div className="mb-8">
            <p className="text-caption text-grey-brown uppercase tracking-[0.18em] mb-1">
              Aktivite
            </p>
            <h2 className="text-subheading text-warm-cream font-medium leading-none">
              Öğrenme Yolculuğu
            </h2>
          </div>

          <OzelDersTimeline />
        </motion.section>

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-4 flex items-center justify-between"
        >
          <p className="text-caption text-grey-brown">
            ORYZO AI Tasarım Sistemi — Sandbox
          </p>
          <p className="text-caption text-grey-brown">
            bg-studio-black · text-warm-cream · text-burnt-sienna · rounded-card
          </p>
        </motion.footer>

      </div>
    </div>
  );
}
