"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import type { Assignment, Lesson } from "@/lib/types";
import LevelProgressBar from "@/components/dashboard/shared/LevelProgressBar";

type Props = {
  userId: string;
  siradakiDers: Lesson | null;
  odevler: Assignment[];
  level: number;
  xp: number;
  refetchDersler: () => void | Promise<void>;
  refetchOdevler: () => void | Promise<void>;
};

const parseToken = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const t = url.searchParams.get("token");
    if (t) return t.trim();
  } catch {
    // not a URL → ham token
  }
  return trimmed;
};

export default function GenelOzet({
  userId,
  siradakiDers,
  odevler,
  level,
  xp,
  refetchDersler,
  refetchOdevler,
}: Props) {
  const [inviteLink, setInviteLink] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleAcceptInvite = async () => {
    const token = parseToken(inviteLink);
    if (!token) {
      toast.error("Geçersiz veya kullanılmış davet bağlantısı.");
      return;
    }

    setConnecting(true);
    try {
      const { data: invitation, error: invErr } = await supabase
        .from("invitations")
        .select("id, hoca_id, token, is_used")
        .eq("token", token)
        .eq("is_used", false)
        .maybeSingle();

      if (invErr || !invitation) {
        toast.error("Geçersiz veya kullanılmış davet bağlantısı.");
        return;
      }

      const { error: linkErr } = await supabase
        .from("teacher_students")
        .insert([{ hoca_id: invitation.hoca_id, ogrenci_id: userId }]);
      if (linkErr && linkErr.code !== "23505") throw linkErr;

      const { error: useErr } = await supabase
        .from("invitations")
        .update({ is_used: true })
        .eq("id", invitation.id)
        .eq("is_used", false);
      if (useErr) throw useErr;

      toast.success("Hocanıza başarıyla bağlandınız!");
      setInviteLink("");
      await Promise.all([refetchDersler(), refetchOdevler()]);
    } catch (err: any) {
      toast.error("Hata: " + (err?.message ?? "Davet kabul edilemedi."));
    } finally {
      setConnecting(false);
    }
  };

  const bekleyenSayisi = odevler.filter((o) => o.status === "verildi" || o.status === "reddedildi").length;

  return (
    <div className="space-y-6">
      <LevelProgressBar level={level} xp={xp} accent="amber" title="Öğrenci Seviyesi" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-slate-200 border-l-4 border-l-sky-400 bg-white p-6 shadow-sm"
      >
        <h3 className="font-semibold text-slate-800">Hocaya Bağlan</h3>
        <p className="mt-1 text-sm text-slate-500">
          Hocanızdan aldığınız davet bağlantısını veya token'ı aşağıya yapıştırın.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="https://.../davet?token=... veya token"
            value={inviteLink}
            onChange={(e) => setInviteLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAcceptInvite();
            }}
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
          />
          <button
            type="button"
            onClick={handleAcceptInvite}
            disabled={connecting || !inviteLink.trim()}
            className="whitespace-nowrap rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connecting ? "Bağlanıyor..." : "Bağlan"}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-6 shadow-sm"
        >
          <h3 className="text-xs font-medium uppercase text-slate-500">Sıradaki Dersim</h3>
          {siradakiDers ? (
            <div className="mt-2">
              <p className="text-2xl font-bold text-slate-800">
                {new Date(siradakiDers.lesson_date).toLocaleString("tr-TR")}
              </p>
              <p className="mt-1 text-sm text-slate-600">Hoca: {siradakiDers.users?.email}</p>
            </div>
          ) : (
            <p className="mt-2 text-lg font-medium text-slate-400">Planlanmış ders yok</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="rounded-xl border border-slate-200 border-l-4 border-l-indigo-400 bg-white p-6 shadow-sm"
        >
          <h3 className="text-xs font-medium uppercase text-slate-500">Bekleyen Ödevler</h3>
          <p className="mt-2 text-3xl font-bold text-slate-800">{bekleyenSayisi}</p>
        </motion.div>
      </div>
    </div>
  );
}
