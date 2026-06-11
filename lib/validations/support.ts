import { z } from "zod";

// Değerler DB check constraint'leriyle birebir aynı olmalı
// (supabase/migrations/20260611120000_support_tickets.sql)
export const SUPPORT_CATEGORIES = [
  "account",
  "reservation",
  "payment",
  "assignment",
  "quiz",
  "messaging",
  "technical",
  "other",
] as const;

export const SUPPORT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const createSupportTicketSchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES, { message: "Lütfen bir kategori seçin." }),
  priority: z.enum(SUPPORT_PRIORITIES, { message: "Lütfen bir öncelik seçin." }),
  subject: z
    .string()
    .trim()
    .min(5, "Konu en az 5 karakter olmalıdır.")
    .max(120, "Konu en fazla 120 karakter olabilir."),
  message: z
    .string()
    .trim()
    .min(20, "Mesajınız en az 20 karakter olmalıdır.")
    .max(2000, "Mesajınız en fazla 2000 karakter olabilir."),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
