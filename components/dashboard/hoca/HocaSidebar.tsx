"use client";

import { m } from "framer-motion";

/* ── Inline SVG icon factory ───────────────────────────────────────── */
type SP = { size?: number; className?: string };
const Svg = ({ size = 18, className = "", children }: SP & { children: React.ReactNode }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
    strokeLinejoin="round" className={className} aria-hidden
  >
    {children}
  </svg>
);

const IconHome     = (p: SP) => <Svg {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
const IconCalendar = (p: SP) => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>;
const IconClipboard= (p: SP) => <Svg {...p}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="12" y1="11" x2="16" y2="11"/><line x1="12" y1="16" x2="16" y2="16"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="8" y1="16" x2="8.01" y2="16"/></Svg>;
const IconMsg      = (p: SP) => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
const IconStar     = (p: SP) => <Svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
const IconBook     = (p: SP) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Svg>;
const IconWallet   = (p: SP) => <Svg {...p}><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></Svg>;
const IconClock    = (p: SP) => <Svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>;

export type NavItem = { id: string; label: string; Icon: (p: SP) => React.JSX.Element };

export const NAV_PRIMARY: NavItem[] = [
  { id: "ozet",     label: "Genel Özet",   Icon: IconHome },
  { id: "takvim",   label: "Ders Takvimi", Icon: IconCalendar },
  { id: "odevler",  label: "Ödevler",      Icon: IconClipboard },
  { id: "mesajlar", label: "Mesajlar",     Icon: IconMsg },
];

export const NAV_SECONDARY: NavItem[] = [
  { id: "degerlendirmeler", label: "Değerlendirmeler", Icon: IconStar },
  { id: "kaynaklar",        label: "Kaynaklar",        Icon: IconBook },
  { id: "cuzdan",           label: "Cüzdan",           Icon: IconWallet },
  { id: "musaitlik",        label: "Müsaitlik",        Icon: IconClock },
];

const ALL_NAV = [...NAV_PRIMARY, ...NAV_SECONDARY];

type Props = { activeId: string; onSelect: (id: string) => void };

function SidebarBtn({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-blue-700"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
      }`}
    >
      {active && (
        <m.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-blue-50"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className={`relative z-10 shrink-0 ${active ? "text-blue-600" : ""}`}>
        <item.Icon size={17} />
      </span>
      <span className="relative z-10 truncate">{item.label}</span>
    </button>
  );
}

export default function HocaSidebar({ activeId, onSelect }: Props) {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-slate-100 bg-slate-50/60 py-4 px-2.5 overflow-y-auto">
        <nav className="flex-1 space-y-0.5" aria-label="Ana menü">
          {NAV_PRIMARY.map((item) => (
            <SidebarBtn
              key={item.id}
              item={item}
              active={activeId === item.id}
              onSelect={onSelect}
            />
          ))}
        </nav>

        <div className="my-2.5 mx-1 h-px bg-slate-200/70" />

        <nav className="space-y-0.5" aria-label="İkincil menü">
          {NAV_SECONDARY.map((item) => (
            <SidebarBtn
              key={item.id}
              item={item}
              active={activeId === item.id}
              onSelect={onSelect}
            />
          ))}
        </nav>
      </aside>

      {/* ── Mobile bottom tab bar (scrollable) ──────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex overflow-x-auto bg-white/95 backdrop-blur-sm border-t border-slate-100"
        aria-label="Navigasyon"
      >
        {ALL_NAV.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`relative shrink-0 flex flex-col items-center justify-center gap-1 px-3.5 py-2.5 min-w-[58px] transition-colors ${
                active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {active && (
                <m.span
                  layoutId="mobile-active"
                  className="absolute top-0 inset-x-2 h-[2px] rounded-b-full bg-blue-600"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.Icon size={19} />
              <span className="text-[9px] font-semibold leading-none">
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
