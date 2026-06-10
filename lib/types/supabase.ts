export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lesson_id: string
          rejection_reason: string | null
          score: number | null
          status: string | null
          submission_file_path: string | null
          submission_file_url: string | null
          submission_text: string | null
          submitted_at: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id: string
          rejection_reason?: string | null
          score?: number | null
          status?: string | null
          submission_file_path?: string | null
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string
          rejection_reason?: string | null
          score?: number | null
          status?: string | null
          submission_file_path?: string | null
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          expires_at: string | null
          hoca_id: string
          id: string
          is_used: boolean | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          hoca_id: string
          id?: string
          is_used?: boolean | null
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          hoca_id?: string
          id?: string
          is_used?: boolean | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          hoca_id: string
          id: string
          lesson_date: string
          meeting_room_id: string | null
          ogrenci_id: string
          payment_status: string
          price: number
          status: string | null
        }
        Insert: {
          created_at?: string
          hoca_id: string
          id?: string
          lesson_date: string
          meeting_room_id?: string | null
          ogrenci_id: string
          payment_status?: string
          price?: number
          status?: string | null
        }
        Update: {
          created_at?: string
          hoca_id?: string
          id?: string
          lesson_date?: string
          meeting_room_id?: string | null
          ogrenci_id?: string
          payment_status?: string
          price?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_ogrenci_id_fkey"
            columns: ["ogrenci_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers_json: Json
          created_at: string
          id: string
          quiz_id: string
          score: number
          student_id: string
          total: number
          xp_earned: number
        }
        Insert: {
          answers_json?: Json
          created_at?: string
          id?: string
          quiz_id: string
          score?: number
          student_id: string
          total?: number
          xp_earned?: number
        }
        Update: {
          answers_json?: Json
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          student_id?: string
          total?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          id: string
          options: Json
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          id?: string
          options: Json
          order_index?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          id?: string
          options?: Json
          order_index?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          hoca_id: string
          id: string
          is_ai_generated: boolean
          lesson_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hoca_id: string
          id?: string
          is_ai_generated?: boolean
          lesson_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hoca_id?: string
          id?: string
          is_ai_generated?: boolean
          lesson_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          file_path: string
          id: string
          title: string
          yukleyen_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          title: string
          yukleyen_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          title?: string
          yukleyen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_yukleyen_id_fkey"
            columns: ["yukleyen_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          hoca_id: string
          id: string
          ogrenci_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          hoca_id: string
          id?: string
          ogrenci_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          hoca_id?: string
          id?: string
          ogrenci_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ogrenci_id_fkey"
            columns: ["ogrenci_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_hour: number
          hoca_id: string
          id: string
          start_hour: number
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_hour: number
          hoca_id: string
          id?: string
          start_hour: number
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_hour?: number
          hoca_id?: string
          id?: string
          start_hour?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount: number
          conversation_id: string
          created_at: string
          error_message: string | null
          expires_at: string
          id: string
          status: string
          tx_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          conversation_id: string
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          status?: string
          tx_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          conversation_id?: string
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          status?: string
          tx_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      web_push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_students: {
        Row: {
          created_at: string | null
          hoca_id: string
          id: string
          ogrenci_id: string
        }
        Insert: {
          created_at?: string | null
          hoca_id: string
          id?: string
          ogrenci_id: string
        }
        Update: {
          created_at?: string | null
          hoca_id?: string
          id?: string
          ogrenci_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_students_hoca_id_fkey"
            columns: ["hoca_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_students_ogrenci_id_fkey"
            columns: ["ogrenci_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          ders_fiyati: number | null
          email: string
          full_name: string | null
          hakkinda: string | null
          id: string
          identity_number: string | null
          ilce: string | null
          level: number
          portfolio_url: string | null
          role: string
          sehir: string | null
          video_url: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          ders_fiyati?: number | null
          email: string
          full_name?: string | null
          hakkinda?: string | null
          id: string
          identity_number?: string | null
          ilce?: string | null
          level?: number
          portfolio_url?: string | null
          role: string
          sehir?: string | null
          video_url?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          ders_fiyati?: number | null
          email?: string
          full_name?: string | null
          hakkinda?: string | null
          id?: string
          identity_number?: string | null
          ilce?: string | null
          level?: number
          portfolio_url?: string | null
          role?: string
          sehir?: string | null
          video_url?: string | null
          xp?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          currency: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          currency?: string
          id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          currency?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_xp: { Args: { amount: number }; Returns: Json }
      create_reservation: {
        Args: {
          p_hoca_id: string
          p_lesson_date: string
          p_ogrenci_id: string
          p_price: number
        }
        Returns: string
      }
      deposit_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_user_id: string
        }
        Returns: Json
      }
      award_xp: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      create_quiz_with_questions: {
        Args: { p_description: string; p_questions: Json; p_title: string }
        Returns: string
      }
      hoca_complete_lesson: {
        Args: { p_lesson_id: string }
        Returns: undefined
      }
      is_hoca: { Args: never; Returns: boolean }
      is_ogrenci: { Args: never; Returns: boolean }
      notify_upcoming_lessons: { Args: never; Returns: undefined }
      transfer_lesson_payment: {
        Args: { p_hoca_id: string; p_ogrenci_id: string; p_tutar: number }
        Returns: undefined
      }
      refund_lesson_payment: {
        Args: { p_lesson_id: string; p_caller_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: { p_identifier: string; p_limit: number; p_window_ms: number }
        Returns: { allowed: boolean; remaining: number; retry_after_ms: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
