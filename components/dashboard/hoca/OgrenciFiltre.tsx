"use client";

import { motion } from "framer-motion";
import type { UserProfile } from "@/lib/types";

type Props = {
  ogrenciler: UserProfile[];
  value: string;
  onChange: (v: string) => void;
};

export default function OgrenciFiltre({ ogrenciler, value, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
    >
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <span className="text-sm font-medium text-slate-600">Öğrenci Filtresi:</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none sm:w-64"
        >
          <option value="">Tüm Öğrencileri Göster</option>
          {ogrenciler.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name || o.email}
            </option>
          ))}
        </select>
      </div>
      {value && (
        <button
          onClick={() => onChange("")}
          className="whitespace-nowrap text-sm text-slate-500 transition-colors hover:text-red-500"
        >
          Temizle ✖
        </button>
      )}
    </motion.div>
  );
}
