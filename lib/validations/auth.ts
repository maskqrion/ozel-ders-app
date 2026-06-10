import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler birbiriyle eşleşmiyor",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const profileUpdateSchema = z.object({
  full_name: z.string().optional(),
  sehir: z.string().optional(),
  ilce: z.string().optional(),
  hakkinda: z.string().optional(),
  ders_fiyati: z.string().optional(),
  identity_number: z
    .string()
    .refine((v) => !v || /^\d{11}$/.test(v), { message: "TC kimlik numarası 11 haneli rakamdan oluşmalıdır." })
    .optional(),
  video_url: z
    .string()
    .refine((v) => !v || /^https?:\/\//.test(v), { message: "Geçerli bir http/https URL giriniz" })
    .optional(),
  portfolio_url: z
    .string()
    .refine((v) => !v || /^https?:\/\//.test(v), { message: "Geçerli bir http/https URL giriniz" })
    .optional(),
});
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
