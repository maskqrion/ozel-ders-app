import { z } from "zod";

export const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

export const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function sanitizeFileName(name: string): string {
  // Strip any directory components (path traversal protection)
  const basename = name.split(/[\\/]/).pop() ?? "dosya";
  // Replace everything except alphanumeric, dots, hyphens, underscores
  return basename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function validateSubmissionFile(file: File): string | null {
  if (file.size === 0) return "Dosya boş olamaz.";
  if (file.size > MAX_FILE_SIZE) return "Dosya boyutu en fazla 10 MB olabilir.";
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return "Geçersiz dosya türü. İzin verilenler: PDF, resim (JPG/PNG/GIF), Word, Excel, TXT.";
  }
  return null;
}

export const submitAssignmentSchema = z
  .object({
    assignmentId: z.string().uuid("Geçersiz ödev kimliği."),
    submissionText: z
      .string()
      .max(5_000, "Metin en fazla 5000 karakter olabilir.")
      .nullable(),
    filePath: z.string().max(500, "Dosya yolu çok uzun.").nullable(),
  })
  .refine((d) => d.submissionText !== null || d.filePath !== null, {
    message: "Metin veya dosya eklemelisiniz.",
    path: ["submissionText"],
  });

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
