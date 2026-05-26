"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { useUploadFile } from "@/lib/hooks/useStorage";
import type { Resource } from "@/lib/types";
import { FileUpload } from "@/components/ui/file-upload";
import { StatefulButton } from "@/components/ui/stateful-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";

type Props = {
  kaynaklar: Resource[];
};

export default function Kaynaklar({ kaynaklar }: Props) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { mutateAsync: uploadFile } = useUploadFile();

  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");

  const handleUpload = async () => {
    if (!file || !fileTitle) {
      toast.error("Dosya ve başlık gerekli.");
      throw new Error("validation");
    }
    const filePath = await uploadFile({ file, folder: `kaynaklar/${profile?.id}` });
    if (!filePath) throw new Error("Dosya yolu alınamadı.");
    const { error: dbError } = await supabase
      .from("resources")
      .insert([{ yukleyen_id: profile!.id, title: fileTitle, file_path: filePath }]);
    if (dbError) throw dbError;
    toast.success("Dosya yüklendi.");
    setFileTitle("");
    setFile(null);
    queryClient.invalidateQueries({ queryKey: ["kaynaklar"] });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-800">Kaynak Paylaş</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            placeholder="Dosya Başlığı"
          />
          <FileUpload
            onChange={(files) => setFile(files[0] ?? null)}
            accept="*/*"
            maxSizeMB={50}
          />
          <StatefulButton
            onClick={handleUpload}
            successLabel="Yüklendi ✓"
            errorLabel="Hata oluştu"
          >
            Dosyayı Yükle
          </StatefulButton>
        </div>
      </m.div>

      <m.div
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
              <m.div
                key={k.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <CardSpotlight
                  bg="white"
                  color="rgba(99,102,241,0.09)"
                  borderColor="#f1f5f9"
                  hoverBorderColor="rgba(99,102,241,0.3)"
                  radius={240}
                  className="block"
                >
                  <a
                    href={k.signed_url || "#"}
                    onClick={(e) => {
                      if (!k.signed_url) e.preventDefault();
                    }}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3"
                  >
                    <span className="text-slate-400">📄</span>
                    <span className="truncate text-sm text-slate-700">{k.title}</span>
                  </a>
                </CardSpotlight>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </m.div>
    </div>
  );
}
