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
      day_off_request_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          request_id: string
          summary: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          request_id: string
          summary: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          request_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_off_request_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_off_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "day_off_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      day_off_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by_id: string | null
          decision_note: string | null
          end_date: string
          id: string
          reason: string | null
          resolution_action:
            | Database["public"]["Enums"]["day_off_resolution"]
            | null
          start_date: string
          status: Database["public"]["Enums"]["day_off_status"]
          technician_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by_id?: string | null
          decision_note?: string | null
          end_date: string
          id?: string
          reason?: string | null
          resolution_action?:
            | Database["public"]["Enums"]["day_off_resolution"]
            | null
          start_date: string
          status?: Database["public"]["Enums"]["day_off_status"]
          technician_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by_id?: string | null
          decision_note?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          resolution_action?:
            | Database["public"]["Enums"]["day_off_resolution"]
            | null
          start_date?: string
          status?: Database["public"]["Enums"]["day_off_status"]
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_off_requests_decided_by_id_fkey"
            columns: ["decided_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_off_requests_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_items: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          per_pool_cost: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          per_pool_cost?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          per_pool_cost?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      homeowner_custom_charges: {
        Row: {
          active: boolean
          amount: number
          billing_type: string
          created_at: string
          created_by: string | null
          homeowner_id: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          billing_type?: string
          created_at?: string
          created_by?: string | null
          homeowner_id: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          billing_type?: string
          created_at?: string
          created_by?: string | null
          homeowner_id?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homeowner_notifications: {
        Row: {
          body: string
          created_at: string
          cta_route: string | null
          dismissed_at: string | null
          homeowner_id: string
          id: string
          kind: string
          route_issue_id: string | null
          service_id: string | null
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          cta_route?: string | null
          dismissed_at?: string | null
          homeowner_id: string
          id?: string
          kind: string
          route_issue_id?: string | null
          service_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          cta_route?: string | null
          dismissed_at?: string | null
          homeowner_id?: string
          id?: string
          kind?: string
          route_issue_id?: string | null
          service_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_notifications_route_issue_id_fkey"
            columns: ["route_issue_id"]
            isOneToOne: false
            referencedRelation: "route_issues"
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
          frequency: string
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
          frequency?: string
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
          frequency?: string
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
      pricing_addons: {
        Row: {
          active: boolean
          billing_type: string
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_type?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_type?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_frequencies: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          frequency: string
          id: string
          multiplier: number
          price_delta: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          frequency: string
          id?: string
          multiplier?: number
          price_delta?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          frequency?: string
          id?: string
          multiplier?: number
          price_delta?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_grandfathered_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          monthly_price: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          monthly_price?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          monthly_price?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_pool_sizes: {
        Row: {
          active: boolean
          base_monthly_price: number
          created_at: string
          display_name: string
          id: string
          size: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_monthly_price?: number
          created_at?: string
          display_name: string
          id?: string
          size: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_monthly_price?: number
          created_at?: string
          display_name?: string
          id?: string
          size?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance_due_after_cancellation: boolean
          city: string | null
          contract_locked: boolean
          contract_start_date: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          grandfathered_monthly_override: number | null
          grandfathered_note: string | null
          grandfathered_plan_id: string | null
          id: string
          is_active: boolean
          is_freds: boolean
          is_grandfathered: boolean
          is_placeholder: boolean
          last_name: string | null
          monthly_amount: number | null
          notifications_enabled: boolean
          outstanding_balance: number
          payout_per_pool: number
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          state: string | null
          street_address: string | null
          subscription_cancellation_reason: string | null
          subscription_cancelled_at: string | null
          subscription_effective_end_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance_due_after_cancellation?: boolean
          city?: string | null
          contract_locked?: boolean
          contract_start_date?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          grandfathered_monthly_override?: number | null
          grandfathered_note?: string | null
          grandfathered_plan_id?: string | null
          id: string
          is_active?: boolean
          is_freds?: boolean
          is_grandfathered?: boolean
          is_placeholder?: boolean
          last_name?: string | null
          monthly_amount?: number | null
          notifications_enabled?: boolean
          outstanding_balance?: number
          payout_per_pool?: number
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state?: string | null
          street_address?: string | null
          subscription_cancellation_reason?: string | null
          subscription_cancelled_at?: string | null
          subscription_effective_end_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance_due_after_cancellation?: boolean
          city?: string | null
          contract_locked?: boolean
          contract_start_date?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          grandfathered_monthly_override?: number | null
          grandfathered_note?: string | null
          grandfathered_plan_id?: string | null
          id?: string
          is_active?: boolean
          is_freds?: boolean
          is_grandfathered?: boolean
          is_placeholder?: boolean
          last_name?: string | null
          monthly_amount?: number | null
          notifications_enabled?: boolean
          outstanding_balance?: number
          payout_per_pool?: number
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          state?: string | null
          street_address?: string | null
          subscription_cancellation_reason?: string | null
          subscription_cancelled_at?: string | null
          subscription_effective_end_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
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
      route_issue_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          created_at: string
          details: Json
          event_type: string
          homeowner_id: string | null
          id: string
          notification_id: string | null
          route_issue_id: string
          service_id: string | null
          summary: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          event_type: string
          homeowner_id?: string | null
          id?: string
          notification_id?: string | null
          route_issue_id: string
          service_id?: string | null
          summary?: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          homeowner_id?: string | null
          id?: string
          notification_id?: string | null
          route_issue_id?: string
          service_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_issue_events_route_issue_id_fkey"
            columns: ["route_issue_id"]
            isOneToOne: false
            referencedRelation: "route_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      route_issue_services: {
        Row: {
          created_at: string
          homeowner_id: string
          id: string
          previous_service_date: string | null
          previous_status: string | null
          previous_technician_id: string | null
          previous_time_window: string | null
          route_issue_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          homeowner_id: string
          id?: string
          previous_service_date?: string | null
          previous_status?: string | null
          previous_technician_id?: string | null
          previous_time_window?: string | null
          route_issue_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          homeowner_id?: string
          id?: string
          previous_service_date?: string | null
          previous_status?: string | null
          previous_technician_id?: string | null
          previous_time_window?: string | null
          route_issue_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_issue_services_route_issue_id_fkey"
            columns: ["route_issue_id"]
            isOneToOne: false
            referencedRelation: "route_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      route_issues: {
        Row: {
          action_taken: string
          created_at: string
          delay_minutes: number | null
          id: string
          issue_type: string
          message_to_homeowners: string
          new_service_date: string | null
          new_time_window: string | null
          other_text: string | null
          reassigned_to_id: string | null
          reported_by_id: string
          reported_by_role: string
          resolved_at: string | null
          resolved_by_id: string | null
          route_date: string
          scope: string
          status: string
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          action_taken: string
          created_at?: string
          delay_minutes?: number | null
          id?: string
          issue_type: string
          message_to_homeowners?: string
          new_service_date?: string | null
          new_time_window?: string | null
          other_text?: string | null
          reassigned_to_id?: string | null
          reported_by_id: string
          reported_by_role: string
          resolved_at?: string | null
          resolved_by_id?: string | null
          route_date?: string
          scope: string
          status?: string
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          action_taken?: string
          created_at?: string
          delay_minutes?: number | null
          id?: string
          issue_type?: string
          message_to_homeowners?: string
          new_service_date?: string | null
          new_time_window?: string | null
          other_text?: string | null
          reassigned_to_id?: string | null
          reported_by_id?: string
          reported_by_role?: string
          resolved_at?: string | null
          resolved_by_id?: string | null
          route_date?: string
          scope?: string
          status?: string
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
          addon_ids: string[]
          base_price: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by_homeowner: boolean
          completed_at: string | null
          completed_tasks: string[] | null
          computed_price: number | null
          created_at: string
          custom_charges: Json
          delay_minutes: number
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
          addon_ids?: string[]
          base_price?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_homeowner?: boolean
          completed_at?: string | null
          completed_tasks?: string[] | null
          computed_price?: number | null
          created_at?: string
          custom_charges?: Json
          delay_minutes?: number
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
          addon_ids?: string[]
          base_price?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_homeowner?: boolean
          completed_at?: string | null
          completed_tasks?: string[] | null
          computed_price?: number | null
          created_at?: string
          custom_charges?: Json
          delay_minutes?: number
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
      subscription_events: {
        Row: {
          actor_id: string | null
          created_at: string
          effective_end_date: string | null
          event_type: string
          homeowner_id: string
          id: string
          reason: string | null
          status_after: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          effective_end_date?: string | null
          event_type: string
          homeowner_id: string
          id?: string
          reason?: string | null
          status_after: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          effective_end_date?: string | null
          event_type?: string
          homeowner_id?: string
          id?: string
          reason?: string | null
          status_after?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: []
      }
      tech_notifications: {
        Row: {
          body: string | null
          created_at: string
          cta_route: string | null
          dismissed_at: string | null
          id: string
          kind: string
          read_at: string | null
          request_id: string | null
          technician_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          cta_route?: string | null
          dismissed_at?: string | null
          id?: string
          kind: string
          read_at?: string | null
          request_id?: string | null
          technician_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          cta_route?: string | null
          dismissed_at?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          request_id?: string | null
          technician_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "day_off_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_notifications_technician_id_fkey"
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
      technician_unavailability: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          request_id: string | null
          source: string
          technician_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          request_id?: string | null
          source?: string
          technician_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          request_id?: string | null
          source?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_unavailability_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "day_off_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_unavailability_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_cancel_subscription: {
        Args: {
          p_effective_end: string
          p_homeowner_id: string
          p_preserve_balance: boolean
          p_reason: string
        }
        Returns: {
          avatar_url: string | null
          balance_due_after_cancellation: boolean
          city: string | null
          contract_locked: boolean
          contract_start_date: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          grandfathered_monthly_override: number | null
          grandfathered_note: string | null
          grandfathered_plan_id: string | null
          id: string
          is_active: boolean
          is_freds: boolean
          is_grandfathered: boolean
          is_placeholder: boolean
          last_name: string | null
          monthly_amount: number | null
          notifications_enabled: boolean
          outstanding_balance: number
          payout_per_pool: number
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          state: string | null
          street_address: string | null
          subscription_cancellation_reason: string | null
          subscription_cancelled_at: string | null
          subscription_effective_end_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          zip_code: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_day_off_request: {
        Args: {
          p_action: Database["public"]["Enums"]["day_off_resolution"]
          p_id: string
          p_message: string
          p_reassign_to: string
          p_reschedule_to: string
        }
        Returns: string
      }
      cancel_day_off_request: {
        Args: { p_id: string }
        Returns: {
          created_at: string
          decided_at: string | null
          decided_by_id: string | null
          decision_note: string | null
          end_date: string
          id: string
          reason: string | null
          resolution_action:
            | Database["public"]["Enums"]["day_off_resolution"]
            | null
          start_date: string
          status: Database["public"]["Enums"]["day_off_status"]
          technician_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "day_off_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_subscription: {
        Args: { p_effective_end: string; p_reason: string }
        Returns: {
          avatar_url: string | null
          balance_due_after_cancellation: boolean
          city: string | null
          contract_locked: boolean
          contract_start_date: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          grandfathered_monthly_override: number | null
          grandfathered_note: string | null
          grandfathered_plan_id: string | null
          id: string
          is_active: boolean
          is_freds: boolean
          is_grandfathered: boolean
          is_placeholder: boolean
          last_name: string | null
          monthly_amount: number | null
          notifications_enabled: boolean
          outstanding_balance: number
          payout_per_pool: number
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          state: string | null
          street_address: string | null
          subscription_cancellation_reason: string | null
          subscription_cancelled_at: string | null
          subscription_effective_end_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          zip_code: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      compute_homeowner_monthly: {
        Args: { p_homeowner_id: string }
        Returns: number
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      deny_day_off_request: {
        Args: { p_id: string; p_reason: string }
        Returns: string
      }
      dismiss_homeowner_notification: {
        Args: { p_id: string }
        Returns: {
          body: string
          created_at: string
          cta_route: string | null
          dismissed_at: string | null
          homeowner_id: string
          id: string
          kind: string
          route_issue_id: string | null
          service_id: string | null
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "homeowner_notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      preview_day_off_impact: { Args: { p_id: string }; Returns: Json }
      reactivate_subscription: {
        Args: never
        Returns: {
          avatar_url: string | null
          balance_due_after_cancellation: boolean
          city: string | null
          contract_locked: boolean
          contract_start_date: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          grandfathered_monthly_override: number | null
          grandfathered_note: string | null
          grandfathered_plan_id: string | null
          id: string
          is_active: boolean
          is_freds: boolean
          is_grandfathered: boolean
          is_placeholder: boolean
          last_name: string | null
          monthly_amount: number | null
          notifications_enabled: boolean
          outstanding_balance: number
          payout_per_pool: number
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          state: string | null
          street_address: string | null
          subscription_cancellation_reason: string | null
          subscription_cancelled_at: string | null
          subscription_effective_end_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          zip_code: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_route_issue: {
        Args: { p_id: string; p_status: string }
        Returns: {
          action_taken: string
          created_at: string
          delay_minutes: number | null
          id: string
          issue_type: string
          message_to_homeowners: string
          new_service_date: string | null
          new_time_window: string | null
          other_text: string | null
          reassigned_to_id: string | null
          reported_by_id: string
          reported_by_role: string
          resolved_at: string | null
          resolved_by_id: string | null
          route_date: string
          scope: string
          status: string
          technician_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "route_issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_day_off_request: {
        Args: { p_end: string; p_reason: string; p_start: string }
        Returns: string
      }
      submit_route_issue: {
        Args: {
          p_action: string
          p_delay_minutes: number
          p_issue_type: string
          p_message: string
          p_new_service_date: string
          p_new_time_window: string
          p_other_text: string
          p_reassign_to: string
          p_route_date: string
          p_scope: string
          p_service_ids: string[]
          p_technician_id: string
        }
        Returns: string
      }
    }
    Enums: {
      admin_note_target: "technician" | "homeowner" | "pool"
      app_role: "homeowner" | "technician" | "admin"
      application_status: "pending" | "approved" | "rejected"
      day_off_resolution:
        | "reassign"
        | "unassigned"
        | "reschedule"
        | "notify_only"
      day_off_status: "pending" | "approved" | "denied" | "cancelled"
      issue_status: "open" | "in_progress" | "resolved"
      review_status: "pending" | "approved" | "rejected"
      service_request_status: "open" | "in_progress" | "resolved" | "cancelled"
      service_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      subscription_status: "active" | "pending_cancellation" | "cancelled"
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
      day_off_resolution: [
        "reassign",
        "unassigned",
        "reschedule",
        "notify_only",
      ],
      day_off_status: ["pending", "approved", "denied", "cancelled"],
      issue_status: ["open", "in_progress", "resolved"],
      review_status: ["pending", "approved", "rejected"],
      service_request_status: ["open", "in_progress", "resolved", "cancelled"],
      service_status: ["scheduled", "in_progress", "completed", "cancelled"],
      subscription_status: ["active", "pending_cancellation", "cancelled"],
      time_window: ["morning", "afternoon", "evening"],
    },
  },
} as const
