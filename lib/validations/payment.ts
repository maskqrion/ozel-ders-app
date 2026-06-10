import { z } from "zod";

export const processPaymentSchema = z.object({
  amount: z
    .number()
    .min(10, "Minimum ₺10 yükleyebilirsiniz.")
    .max(50_000, "Tek seferde en fazla ₺50.000 yükleyebilirsiniz."),
  paymentCard: z.object({
    cardHolderName: z
      .string()
      .min(3, "Kart sahibi adı en az 3 karakter olmalıdır.")
      .max(100, "Kart sahibi adı çok uzun."),
    cardNumber: z
      .string()
      .regex(/^\d{16}$/, "Kart numarası 16 haneli olmalıdır."),
    expireMonth: z
      .string()
      .regex(/^(0[1-9]|1[0-2])$/, "Geçersiz ay (01-12 arasında olmalıdır)."),
    expireYear: z
      .string()
      .regex(/^\d{4}$/, "Geçersiz yıl formatı."),
    cvc: z
      .string()
      .regex(/^\d{3,4}$/, "CVC 3 veya 4 haneli olmalıdır."),
  }),
  lessonId: z.string().uuid("Geçersiz ders kimliği.").optional(),
});

export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
