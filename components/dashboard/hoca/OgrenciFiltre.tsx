"use client";

import { m } from "framer-motion";
import type { UserProfile } from "@/lib/types";
import { GooeyInput } from "@/components/ui/gooey-input";

type Props = {
  ogrenciler: UserProfile[];
  value: string;
  onChange: (v: string) => void;
  searchText?: string;
  onSearchChange?: (v: string) => void;
};

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default function OgrenciFiltre({
  ogrenciler,
  value,
  onChange,
  searchText = "",
  onSearchChange,
}: Props) {
  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
    >
      {/* GooeyInput — isim/metin araması */}
      {onSearchChange !== undefined && (
        <div className="w-full sm:max-w-xs">
          <GooeyInput
            placeholder="Öğrenci ara..."
            value={searchText}
            onChange={onSearchChange}
            icon={<SearchIcon />}
          />
        </div>
      )}

      {/* Dropdown filtresi */}
      <div className="flex flex-1 items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-slate-600">Filtrele:</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none sm:max-w-xs"
        >
          <option value="">Tüm Öğrencileri Göster</option>
          {ogrenciler.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name || o.email}
            </option>
          ))}
        </select>
      </div>

      {(value || searchText) && (
        <button
          onClick={() => {
            onChange("");
            onSearchChange?.("");
          }}
          className="shrink-0 whitespace-nowrap text-sm text-slate-500 transition-colors hover:text-red-500"
        >
          Temizle ✖
        </button>
      )}
    </m.div>
  );
}
