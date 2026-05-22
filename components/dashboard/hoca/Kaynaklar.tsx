"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import type { Resource } from "@/lib/types";

type Props = {
  userId: string;
  kaynaklar: Resource[];
  refetchKaynaklar: () => void | Promise<void>;
};

export default function Kaynaklar({ userId, kaynaklar, refetchKaynaklar }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileTitle) {
      toast.error("Dosya ve başlık gerekli.");
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("kaynaklar").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase
        .from("resources")
        .insert([{ yukleyen_id: userId, title: fileTitle, file_path: filePath }]);
      if (dbError) throw dbError;
      toast.success("Dosya yüklendi.");
      setFileTitle("");
      setFile(null);
      await refetchKaynaklar();
    } catch (err: any) {
      toast.error("Hata: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Kaynak Paylaş</h2>
        <form onSubmit={handleFileUpload} className="space-y-3">
          <input
            type="text"
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            placeholder="Dosya Başlığı"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full cursor-pointer text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:opacity-60"
          >
            {uploading ? "Yükleniyor..." : "Dosyayı Yükle"}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Yüklenen Kaynaklar</h2>
        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-2">
          {kaynaklar.length === 0 && <p className="text-sm text-slate-400">Henüz kaynak yüklenmedi.</p>}
          <AnimatePresence initial={false}>
            {kaynaklar.map((k) => (
              <motion.a
                key={k.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                href={k.signed_url || "#"}
                onClick={(e) => {
                  if (!k.signed_url) e.preventDefault();
                }}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm transition-colors hover:bg-slate-100"
              >
                <span className="text-slate-400">📄</span>
                <span className="truncate text-slate-700">{k.title}</span>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
