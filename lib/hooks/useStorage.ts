import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const uniqueName = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
      const filePath = folder ? `${folder}/${uniqueName}` : uniqueName;

      const { data, error } = await supabase.storage
        .from("kaynaklar")
        .upload(filePath, file);

      if (error) throw error;
      return data.path;
    },
    onError: () => {
      toast.error("Dosya yüklenirken bir hata oluştu.");
    },
  });
}
