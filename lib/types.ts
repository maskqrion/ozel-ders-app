export type Role = 'hoca' | 'ogrenci';
export type LessonStatus = 'bekliyor' | 'tamamlandi' | 'iptal';
export type AssignmentStatus = 'verildi' | 'yapildi' | 'reddedildi';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at?: string;
  avatar_url?: string | null;

  // Hoca-only profil alanları (öğrencilerde null kalır)
  sehir: string | null;
  ilce: string | null;
  ders_fiyati: number | null;
  hakkinda: string | null;

  // Hoca portfolyo alanları (Faz 2 / Adım 1)
  video_url: string | null;
  portfolio_url: string | null;

  // KYC: Iyzico ödeme akışı için TC kimlik numarası
  identity_number?: string | null;

  // Gamification (herkes için, default: level=1, xp=0)
  level: number;
  xp: number;
}

export interface Lesson {
  id: string;
  hoca_id: string;
  ogrenci_id: string;
  lesson_date: string;
  status: LessonStatus;
  payment_status?: string | null;
  price?: number | null;
  meeting_room_id?: string | null;
  users?: { email: string; full_name?: string | null } | null;
  hoca?: { email: string; full_name?: string | null } | null;
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
  score: number | null;
  submission_signed_url?: string | null;
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

export interface TeacherStudent {
  id: string;
  hoca_id: string;
  ogrenci_id: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  hoca_id: string;
  token: string;
  is_used: boolean;
  created_at: string;
  expires_at?: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export type NotificationType = 'message' | 'assignment' | 'quiz' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

// Hoca değerlendirme — rating 1-5 arası (DB check constraint)
export interface Review {
  id: string;
  hoca_id: string;
  ogrenci_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  hoca_id: string;
  title: string;
  description: string | null;
  created_at: string;
  is_ai_generated?: boolean;
  lesson_id?: string | null;
  quiz_questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  order_index: number;
  created_at: string;
}
