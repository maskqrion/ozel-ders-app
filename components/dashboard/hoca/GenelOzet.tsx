"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase";
import type { Assignment, UserProfile } from "@/lib/types";
import LevelProgressBar from "@/components/dashboard/shared/LevelProgressBar";
import OgrenciDegerlendirmeleri from "@/components/dashboard/hoca/OgrenciDegerlendirmeleri";

type Props = {
  hocaId: string;
  ogrenciler: UserProfile[];
  odevler: Assignment[];
  level: number;
  xp: number;
};

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function GenelOzet({ hocaId, ogrenciler, odevler, level, xp }: Props) {
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const ozet = useMemo(() => {
    const bekleyen = odevler.filter((o) => o.status === "verildi").length;
    const tamamlanan = odevler.filter((o) => o.status === "yapildi").length;
    return {
      toplamOgrenci: ogrenciler.length,
      bekleyen,
      tamamlanan,
    };
  }, [ogrenciler, odevler]);

  const odevDurumGrafigi = useMemo(() => {
    const sayim = { verildi: 0, yapildi: 0, reddedildi: 0 };
    for (const o of odevler) {
      if (o.status === "verildi") sayim.verildi += 1;
      else if (o.status === "yapildi") sayim.yapildi += 1;
      else if (o.status === "reddedildi") sayim.reddedildi += 1;
    }
    return [
      { durum: "Bekliyor", adet: sayim.verildi, fill: "#f59e0b" },
      { durum: "Yapıldı", adet: sayim.yapildi, fill: "#10b981" },
      { durum: "Reddedildi", adet: sayim.reddedildi, fill: "#ef4444" },
    ];
  }, [odevler]);

  const davetLinkiUret = async () => {
    setInviteLoading(true);
    try {
      const token =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { error } = await supabase
        .from("invitations")
        .insert([{ hoca_id: hocaId, token }]);
      if (error) throw error;

      const link = `${window.location.origin}/davet?token=${token}`;
      setInviteLink(link);
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Davet linki panoya kopyalandı.");
      } catch {
        toast.success("Davet linki üretildi.");
      }
    } catch (err: any) {
      toast.error("Hata: " + (err?.message ?? "Davet linki üretilemedi."));
    } finally {
      setInviteLoading(false);
    }
  };

  const linkiKopyala = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link kopyalandı.");
    } catch {
      toast.error("Link kopyalanamadı.");
    }
  };

  const stats = [
    { label: "Toplam Öğrenci", value: ozet.toplamOgrenci, accent: "border-l-blue-500" },
    { label: "Bekleyen Ödevler", value: ozet.bekleyen, accent: "border-l-amber-500" },
    { label: "Tamamlanan Ödevler", value: ozet.tamamlanan, accent: "border-l-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <LevelProgressBar level={level} xp={xp} accent="amber" title="Eğitmen Seviyesi" />

      <motion.div
        {...cardMotion}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Öğrenci Daveti</h2>
            <p className="mt-1 text-sm text-slate-500">
              Davet linki üretin ve öğrencinize gönderin. Yalnızca daveti kabul eden öğrenciler panelinizde görünür.
            </p>
          </div>
          <button
            onClick={davetLinkiUret}
            disabled={inviteLoading}
            className="whitespace-nowrap rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {inviteLoading ? "Üretiliyor..." : "Davet Linki Üret"}
          </button>
        </div>
        {inviteLink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
            className="mt-4 flex flex-col gap-2 overflow-hidden sm:flex-row"
          >
            <input
              type="text"
              readOnly
              value={inviteLink}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={linkiKopyala}
              className="whitespace-nowrap rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
            >
              Kopyala
            </button>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 * i }}
            className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${s.accent}`}
          >
            <p className="text-xs font-medium uppercase text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Ödev Durum Dağılımı</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={odevDurumGrafigi} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="durum" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "none", fontSize: 12 }}
              />
              <Bar dataKey="adet" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <OgrenciDegerlendirmeleri hocaId={hocaId} />
    </div>
  );
}
