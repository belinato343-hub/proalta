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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          created_at: string
          event_type: string
          hospital_id: string | null
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          hospital_id?: string | null
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          hospital_id: string
          id: string
          patient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          hospital_id: string
          id?: string
          patient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          hospital_id?: string
          id?: string
          patient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      homecare_companies: {
        Row: {
          admin_user_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hospital_modules: {
        Row: {
          enabled_at: string
          enabled_by: string | null
          hospital_id: string
          id: string
          module_id: string
        }
        Insert: {
          enabled_at?: string
          enabled_by?: string | null
          hospital_id: string
          id?: string
          module_id: string
        }
        Update: {
          enabled_at?: string
          enabled_by?: string | null
          hospital_id?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_modules_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "therapy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          admin_user_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_homecare: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          company_id: string
          id: string
          patient_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          id?: string
          patient_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_homecare_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "homecare_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invites: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string
          hospital_id: string | null
          id: string
          module_id: string | null
          notes: string | null
          patient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          token: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by: string
          hospital_id?: string | null
          id?: string
          module_id?: string | null
          notes?: string | null
          patient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string
          hospital_id?: string | null
          id?: string
          module_id?: string | null
          notes?: string | null
          patient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "homecare_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invites_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invites_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "therapy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_therapies: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          hospital_id: string | null
          id: string
          module_id: string
          patient_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          hospital_id?: string | null
          id?: string
          module_id: string
          patient_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          hospital_id?: string | null
          id?: string
          module_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_therapies_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_therapies_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "therapy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          hospital_id: string | null
          hospital_origem: string | null
          id: string
          nome: string | null
          tipo_sonda: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hospital_id?: string | null
          hospital_origem?: string | null
          id?: string
          nome?: string | null
          tipo_sonda?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hospital_id?: string | null
          hospital_origem?: string | null
          id?: string
          nome?: string | null
          tipo_sonda?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          content: string
          created_at: string
          hospital_id: string | null
          id: string
          is_ai_answer: boolean | null
          patient_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          content: string
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_ai_answer?: boolean | null
          patient_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          content?: string
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_ai_answer?: boolean | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      readmissions: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          readmission_date: string
          reason: string | null
          registered_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          readmission_date: string
          reason?: string | null
          registered_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          readmission_date?: string
          reason?: string | null
          registered_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "readmissions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      therapy_modules: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_views: {
        Row: {
          completion_percent: number
          created_at: string
          hospital_id: string | null
          id: string
          patient_id: string
          video_id: string
          video_title: string
          watched_seconds: number
        }
        Insert: {
          completion_percent?: number
          created_at?: string
          hospital_id?: string | null
          id?: string
          patient_id: string
          video_id: string
          video_title: string
          watched_seconds?: number
        }
        Update: {
          completion_percent?: number
          created_at?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string
          video_id?: string
          video_title?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_views_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invite_preview: {
        Args: { _token: string }
        Returns: {
          company_name: string
          hospital_name: string
          module_name: string
          patient_name: string
          reason: string
          valid: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_homecare_admin_of: { Args: { _company_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "patient" | "hospital_admin" | "homecare_admin"
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
    Enums: {
      app_role: ["patient", "hospital_admin", "homecare_admin"],
    },
  },
} as const
