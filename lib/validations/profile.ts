import { z } from "zod";

const optionalUrl = z
  .string()
  .refine((v) => !v || /^https:\/\/.+/.test(v), {
    message: "Geçerli bir URL giriniz (https://... ile başlamalıdır).",
  })
  .nullable()
  .optional();

const ALLOWED_VIDEO_HOSTS = /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//;
const optionalVideoUrl = z
  .string()
  .refine((v) => !v || ALLOWED_VIDEO_HOSTS.test(v), {
    message: "Yalnızca YouTube veya Vimeo bağlantıları kabul edilmektedir.",
  })
  .nullable()
  .optional();

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır.")
    .max(100, "İsim en fazla 100 karakter olabilir.")
    .nullable()
    .optional(),
  sehir: z.string().max(100, "Şehir en fazla 100 karakter olabilir.").nullable().optional(),
  ilce: z.string().max(100, "İlçe en fazla 100 karakter olabilir.").nullable().optional(),
  hakkinda: z
    .string()
    .max(500, "Hakkında bölümü en fazla 500 karakter olabilir.")
    .nullable()
    .optional(),
  ders_fiyati: z
    .number()
    .positive("Ders fiyatı sıfırdan büyük olmalıdır.")
    .max(10_000, "Ders fiyatı en fazla ₺10.000 olabilir.")
    .nullable()
    .optional(),
  identity_number: z
    .string()
    .refine((v) => !v || /^\d{11}$/.test(v), { message: "TC kimlik numarası 11 haneli rakamdan oluşmalıdır." })
    .nullable()
    .optional(),
  video_url: optionalVideoUrl,
  portfolio_url: optionalUrl,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
