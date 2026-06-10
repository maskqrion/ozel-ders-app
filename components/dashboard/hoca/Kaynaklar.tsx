"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { createResource } from "@/app/actions/resources";
import { useProfile } from "@/lib/hooks/useProfile";
import { useUploadFile } from "@/lib/hooks/useStorage";
import type { Resource } from "@/lib/types";
import { FileUpload } from "@/components/ui/file-upload";
import { StatefulButton } from "@/components/ui/stateful-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";

type Props = {
  kaynaklar: Resource[];
};

export default function Kaynaklar({ kaynaklar: initialKaynaklar }: Props) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { mutateAsync: uploadFile } = useUploadFile();

  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [localKaynaklar, setLocalKaynaklar] = useState<Resource[]>(initialKaynaklar);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLocalKaynaklar(initialKaynaklar);
  }, [initialKaynaklar]);

  const handleUpload = async () => {
    if (!file || !fileTitle) {
      toast.error("Dosya ve başlık gerekli.");
      throw new Error("validation");
    }
    const filePath = await uploadFile({ file, folder: `kaynaklar/${profile?.id ?? "shared"}` });
    if (!filePath) throw new Error("Dosya yolu alınamadı.");
    const result = await createResource(filePath, fileTitle);
    if (!result.ok) throw new Error(result.error);
    toast.success("Dosya yüklendi.");
    setFileTitle("");
    setFile(null);
    queryClient.invalidateQueries({ queryKey: ["kaynaklar"] });
  };

  const handleDelete = async (k: Resource) => {
    if (!window.confirm(`"${k.title}" kaynağını silmek istediğinize emin misiniz?`)) return;
    setDeletingId(k.id);
    try {
      // DB kaydını önce sil; başarısız olursa dosya hâlâ erişilebilir kalır.
      const { error } = await supabase.from("resources").delete().eq("id", k.id);
      if (error) throw error;
      setLocalKaynaklar((prev) => prev.filter((r) => r.id !== k.id));
      toast.success("Kaynak silindi.");
      // Dosyayı DB'den sonra kaldır; hata ana akışı etkilemez.
      supabase.storage.from("kaynaklar").remove([k.file_path]).then(({ error: storErr }) => {
        if (storErr) console.error("Storage dosyası silinemedi:", storErr);
      });
    } catch {
      toast.error("Silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setDeletingId(null);
    }
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
          {localKaynaklar.length === 0 && <p className="text-sm text-slate-400">Henüz kaynak yüklenmedi.</p>}
          <AnimatePresence initial={false}>
            {localKaynaklar.map((k) => (
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
                  <div className="flex items-center gap-2 p-3">
                    <a
                      href={k.signed_url || "#"}
                      onClick={(e) => { if (!k.signed_url) e.preventDefault(); }}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <span className="text-slate-400">📄</span>
                      <span className="truncate text-sm text-slate-700">{k.title}</span>
                    </a>
                    <button
                      onClick={() => handleDelete(k)}
                      disabled={deletingId === k.id}
                      className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      aria-label="Sil"
                    >
                      {deletingId === k.id ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-400" />
                      ) : (
                        <span className="text-base leading-none">🗑</span>
                      )}
                    </button>
                  </div>
                </CardSpotlight>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </m.div>
    </div>
  );
}
