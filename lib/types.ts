export type Role = 'hoca' | 'ogrenci';
export type LessonStatus = 'bekliyor' | 'tamamlandi';
export type AssignmentStatus = 'verildi' | 'yapildi' | 'reddedildi';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
}

export interface Lesson {
  id: string;
  hoca_id: string;
  ogrenci_id: string;
  lesson_date: string;
  status: LessonStatus;
  users?: { email: string }; // Join ile gelen veri için
}

export interface Assignment {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  status: AssignmentStatus;
  submission_text: string | null;
  submission_file_path: string | null;
  submitted_at: string | null;
  rejection_reason: string | null;
  submission_signed_url?: string | null; // signed URL için
  lessons?: {
    hoca_id: string;
    ogrenci_id: string;
    lesson_date: string;
    users?: { email: string };
  };
}

export interface Resource {
  id: string;
  yukleyen_id: string;
  title: string;
  file_path: string;
  created_at: string;
  signed_url?: string | null;
}