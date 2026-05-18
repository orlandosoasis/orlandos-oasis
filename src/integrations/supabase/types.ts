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
      admin_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["admin_note_target"]
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["admin_note_target"]
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["admin_note_target"]
          updated_at?: string
        }
        Relationships: []
      }
      applicant_certifications: {
        Row: {
          application_id: string
          created_at: string
          file_url: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_certifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "technician_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          admin_notes: string | null
          assigned_technician_id: string | null
          created_at: string
          homeowner_id: string
          id: string
          message: string
          related_service: string | null
          resolved_at: string | null
          service_date: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["issue_status"]
          type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_technician_id?: string | null
          created_at?: string
          homeowner_id: string
          id?: string
          message: string
          related_service?: string | null
          resolved_at?: string | null
          service_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_technician_id?: string | null
          created_at?: string
          homeowner_id?: string
          id?: string
          message?: string
          related_service?: string | null
          resolved_at?: string | null
          service_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          pool_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          pool_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          pool_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          access_detail: string | null
          access_method: string | null
          address: string
          assigned_technician_id: string | null
          city: string | null
          created_at: string
          equipment: string | null
          homeowner_id: string
          id: string
          pool_size: string | null
          pool_type: string | null
          state: string | null
          updated_at: string
          water_type: string | null
          zip: string | null
        }
        Insert: {
          access_detail?: string | null
          access_method?: string | null
          address: string
          assigned_technician_id?: string | null
          city?: string | null
          created_at?: string
          equipment?: string | null
          homeowner_id: string
          id?: string
          pool_size?: string | null
          pool_type?: string | null
          state?: string | null
          updated_at?: string
          water_type?: string | null
          zip?: string | null
        }
        Update: {
          access_detail?: string | null
          access_method?: string | null
          address?: string
          assigned_technician_id?: string | null
          city?: string | null
          created_at?: string
          equipment?: string | null
          homeowner_id?: string
          id?: string
          pool_size?: string | null
          pool_type?: string | null
          state?: string | null
          updated_at?: string
          water_type?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pools_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          contract_locked: boolean
          contract_start_date: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          grandfathered_note: string | null
          id: string
          is_active: boolean
          is_freds: boolean
          is_grandfathered: boolean
          is_placeholder: boolean
          last_name: string | null
          monthly_amount: number | null
          notifications_enabled: boolean
          payout_per_pool: number
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          state: string | null
          street_address: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          contract_locked?: boolean
          contract_start_date?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          grandfathered_note?: string | null
          id: string
          is_active?: boolean
          is_freds?: boolean
          is_grandfathered?: boolean
          is_placeholder?: boolean
          last_name?: string | null
          monthly_amount?: number | null
          notifications_enabled?: boolean
          payout_per_pool?: number
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state?: string | null
          street_address?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          contract_locked?: boolean
          contract_start_date?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          grandfathered_note?: string | null
          id?: string
          is_active?: boolean
          is_freds?: boolean
          is_grandfathered?: boolean
          is_placeholder?: boolean
          last_name?: string | null
          monthly_amount?: number | null
          notifications_enabled?: boolean
          payout_per_pool?: number
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state?: string | null
          street_address?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          message: string | null
          rating: number
          rejection_reason: string | null
          reviewer_id: string
          service_id: string | null
          status: Database["public"]["Enums"]["review_status"]
          technician_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          rating: number
          rejection_reason?: string | null
          reviewer_id: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          technician_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          rating?: number
          rejection_reason?: string | null
          reviewer_id?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_photos: {
        Row: {
          created_at: string
          id: string
          photo_type: string
          service_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_type: string
          service_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_type?: string
          service_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          homeowner_id: string
          id: string
          pool_id: string | null
          request_type: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          homeowner_id: string
          id?: string
          pool_id?: string | null
          request_type: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          homeowner_id?: string
          id?: string
          pool_id?: string | null
          request_type?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          completed_at: string | null
          completed_tasks: string[] | null
          created_at: string
          homeowner_id: string
          hours: number
          id: string
          pool_id: string
          service_date: string
          service_type: string
          started_at: string | null
          status: Database["public"]["Enums"]["service_status"]
          tech_notes: string | null
          technician_id: string | null
          time_window: Database["public"]["Enums"]["time_window"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_tasks?: string[] | null
          created_at?: string
          homeowner_id: string
          hours?: number
          id?: string
          pool_id: string
          service_date: string
          service_type: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          tech_notes?: string | null
          technician_id?: string | null
          time_window: Database["public"]["Enums"]["time_window"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_tasks?: string[] | null
          created_at?: string
          homeowner_id?: string
          hours?: number
          id?: string
          pool_id?: string
          service_date?: string
          service_type?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          tech_notes?: string | null
          technician_id?: string | null
          time_window?: Database["public"]["Enums"]["time_window"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_applications: {
        Row: {
          applied_date: string
          city: string | null
          created_at: string
          email: string
          experience: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          resume_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          zip: string | null
        }
        Insert: {
          applied_date?: string
          city?: string | null
          created_at?: string
          email: string
          experience?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          resume_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          zip?: string | null
        }
        Update: {
          applied_date?: string
          city?: string | null
          created_at?: string
          email?: string
          experience?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          resume_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_note_target: "technician" | "homeowner" | "pool"
      app_role: "homeowner" | "technician" | "admin"
      application_status: "pending" | "approved" | "rejected"
      issue_status: "open" | "in_progress" | "resolved"
      review_status: "pending" | "approved" | "rejected"
      service_request_status: "open" | "in_progress" | "resolved" | "cancelled"
      service_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      time_window: "morning" | "afternoon" | "evening"
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
      admin_note_target: ["technician", "homeowner", "pool"],
      app_role: ["homeowner", "technician", "admin"],
      application_status: ["pending", "approved", "rejected"],
      issue_status: ["open", "in_progress", "resolved"],
      review_status: ["pending", "approved", "rejected"],
      service_request_status: ["open", "in_progress", "resolved", "cancelled"],
      service_status: ["scheduled", "in_progress", "completed", "cancelled"],
      time_window: ["morning", "afternoon", "evening"],
    },
  },
} as const
