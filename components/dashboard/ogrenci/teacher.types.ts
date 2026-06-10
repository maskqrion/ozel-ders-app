/**
 * teacher.types.ts
 * OgretmenBul ve alt bileşenlerinin paylaştığı tipler ve sabitler.
 */

export type Hoca = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  sehir: string | null;
  ilce: string | null;
  ders_fiyati: number | null;
  hakkinda: string | null;
  video_url: string | null;
  portfolio_url: string | null;
  level: number;
  xp: number;
};

export type RatingStat = { avg: number; count: number };
export type SortId = "top" | "price-a" | "price-d" | "level-d";
export type Budget = { id: string; label: string; max?: number; min?: number };
export type SubjectId =
  | "all"
  | "matematik"
  | "fizik"
  | "kimya"
  | "ingilizce"
  | "tarih"
  | "sort-top"
  | "sort-level";

export const HOCA_SELECT =
  "id, full_name, avatar_url, sehir, ilce, ders_fiyati, hakkinda, video_url, portfolio_url, level, xp";

export const BUDGETS: Budget[] = [
  { id: "all", label: "Tüm Bütçeler" },
  { id: "b1", label: "₺0 – 300", max: 300 },
  { id: "b2", label: "₺300 – 500", max: 500, min: 300 },
  { id: "b3", label: "₺500 – 750", max: 750, min: 500 },
  { id: "b4", label: "₺750+", min: 750 },
];

export const SORTS: { id: SortId; label: string }[] = [
  { id: "top", label: "En yüksek puan" },
  { id: "price-a", label: "Fiyat: artan" },
  { id: "price-d", label: "Fiyat: azalan" },
  { id: "level-d", label: "En yüksek seviye" },
];

export const SUBJECTS: { id: SubjectId; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "matematik", label: "Matematik" },
  { id: "fizik", label: "Fizik" },
  { id: "kimya", label: "Kimya" },
  { id: "ingilizce", label: "İngilizce" },
  { id: "tarih", label: "Tarih" },
  { id: "sort-top", label: "En Yüksek Puanlılar" },
  { id: "sort-level", label: "En Yüksek Seviye" },
];
