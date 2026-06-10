import { z } from "zod";

export const submitReviewSchema = z.object({
  hocaId: z.string().uuid("Geçersiz hoca kimliği."),
  rating: z
    .number()
    .int("Puan tam sayı olmalıdır.")
    .min(1, "Puan en az 1 olmalıdır.")
    .max(5, "Puan en fazla 5 olabilir."),
  comment: z
    .string()
    .min(10, "Yorum en az 10 karakter olmalıdır.")
    .max(1000, "Yorum en fazla 1000 karakter olabilir.")
    .nullable(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
