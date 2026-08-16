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
      admin_emails: {
        Row: {
          added_at: string
          email: string
          id: string
        }
        Insert: {
          added_at?: string
          email: string
          id?: string
        }
        Update: {
          added_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      affiliate_signups: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          referral_code: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          referral_code?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          referral_code?: string | null
          status?: string
        }
        Relationships: []
      }
      ai_knowledge: {
        Row: {
          answer: string
          audience: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          priority: number
          question: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          answer: string
          audience?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          question: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          answer?: string
          audience?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          question?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          display_type: string
          ends_at: string | null
          id: string
          is_active: boolean
          scope: string
          severity: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          display_type?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          scope?: string
          severity?: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          display_type?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          scope?: string
          severity?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          business_id: string
          created_at: string
          customer_name: string
          customer_phone: string | null
          customer_user_id: string
          duration_minutes: number
          id: string
          notes: string | null
          party_size: number
          queue_id: string | null
          scheduled_at: string
          service_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          customer_user_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          party_size?: number
          queue_id?: string | null
          scheduled_at: string
          service_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          customer_user_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          party_size?: number
          queue_id?: string | null
          scheduled_at?: string
          service_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      business_internal_notes: {
        Row: {
          business_id: string
          created_at: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_internal_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          is_hidden: boolean
          rating: number
          reviewer_name: string | null
          reviewer_user_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          rating: number
          reviewer_name?: string | null
          reviewer_user_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          rating?: number
          reviewer_name?: string | null
          reviewer_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          approval_status: string
          category: string | null
          created_at: string
          default_settings: Json
          description: string | null
          discovery_enabled: boolean
          display_rank: number
          id: string
          is_featured: boolean
          is_recommended: boolean | null
          is_sponsored: boolean
          logo_url: string | null
          name: string
          operating_hours: Json | null
          owner_id: string
          rating: number | null
          remote_joining_enabled: boolean
          settings: Json | null
          show_live_queue_info: boolean
          total_reviews: number | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          address?: string | null
          approval_status?: string
          category?: string | null
          created_at?: string
          default_settings?: Json
          description?: string | null
          discovery_enabled?: boolean
          display_rank?: number
          id?: string
          is_featured?: boolean
          is_recommended?: boolean | null
          is_sponsored?: boolean
          logo_url?: string | null
          name: string
          operating_hours?: Json | null
          owner_id: string
          rating?: number | null
          remote_joining_enabled?: boolean
          settings?: Json | null
          show_live_queue_info?: boolean
          total_reviews?: number | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          address?: string | null
          approval_status?: string
          category?: string | null
          created_at?: string
          default_settings?: Json
          description?: string | null
          discovery_enabled?: boolean
          display_rank?: number
          id?: string
          is_featured?: boolean
          is_recommended?: boolean | null
          is_sponsored?: boolean
          logo_url?: string | null
          name?: string
          operating_hours?: Json | null
          owner_id?: string
          rating?: number | null
          remote_joining_enabled?: boolean
          settings?: Json | null
          show_live_queue_info?: boolean
          total_reviews?: number | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          business: string | null
          category: string
          created_at: string
          email: string
          id: string
          industry: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          submission_type: string
        }
        Insert: {
          business?: string | null
          category?: string
          created_at?: string
          email: string
          id?: string
          industry?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          submission_type?: string
        }
        Update: {
          business?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          industry?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          submission_type?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          redemptions_count: number
          updated_at: string
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          redemptions_count?: number
          updated_at?: string
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          redemptions_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_favorites: {
        Row: {
          business_id: string
          created_at: string
          id: string
          last_used_at: string
          user_id: string
          visit_count: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          last_used_at?: string
          user_id: string
          visit_count?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          last_used_at?: string
          user_id?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json
          read_at?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_ai_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "health_ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_ai_sessions: {
        Row: {
          archived: boolean
          business_id: string
          created_at: string
          id: string
          last_message_at: string
          title: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          business_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          business_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          prep_minutes: number
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          prep_minutes?: number
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          prep_minutes?: number
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          subject: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          subject?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          subject?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      onboarding_leads: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          responses: Json
          role: string | null
          social_profile: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone: string
          responses?: Json
          role?: string | null
          social_profile?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          responses?: Json
          role?: string | null
          social_profile?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      pickup_orders: {
        Row: {
          business_id: string
          created_at: string
          customer_name: string
          customer_phone: string | null
          customer_user_id: string | null
          eta_minutes: number
          id: string
          items: Json
          no_show: boolean
          notes: string | null
          picked_up_at: string | null
          ready_at: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          customer_user_id?: string | null
          eta_minutes?: number
          id?: string
          items?: Json
          no_show?: boolean
          notes?: string | null
          picked_up_at?: string | null
          ready_at?: string | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          customer_user_id?: string | null
          eta_minutes?: number
          id?: string
          items?: Json
          no_show?: boolean
          notes?: string | null
          picked_up_at?: string | null
          ready_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_status_events: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          order_id: string
          status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: []
      }
      queue_activity_log: {
        Row: {
          action: string
          actor: string
          business_id: string
          created_at: string
          id: string
          metadata: Json
          queue_id: string | null
          token_number: number | null
          visitor_id: string | null
          visitor_name: string | null
        }
        Insert: {
          action: string
          actor?: string
          business_id: string
          created_at?: string
          id?: string
          metadata?: Json
          queue_id?: string | null
          token_number?: number | null
          visitor_id?: string | null
          visitor_name?: string | null
        }
        Update: {
          action?: string
          actor?: string
          business_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          queue_id?: string | null
          token_number?: number | null
          visitor_id?: string | null
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_activity_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_activity_log_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_activity_log_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "queue_visitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_activity_log_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "queue_visitors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_engagement_events: {
        Row: {
          business_id: string
          created_at: string
          event_type: string
          id: string
          queue_id: string
          visitor_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          event_type: string
          id?: string
          queue_id: string
          visitor_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          event_type?: string
          id?: string
          queue_id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_engagement_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_engagement_events_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_engagement_events_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "queue_visitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_engagement_events_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "queue_visitors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_health_alerts: {
        Row: {
          business_id: string
          created_at: string
          id: string
          message: string
          queue_id: string | null
          read_at: string | null
          score: number | null
          severity: string
          type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          message: string
          queue_id?: string | null
          read_at?: string | null
          score?: number | null
          severity?: string
          type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          message?: string
          queue_id?: string | null
          read_at?: string | null
          score?: number | null
          severity?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_health_alerts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_health_daily: {
        Row: {
          abandon_score: number
          accuracy_score: number
          business_id: string
          created_at: string
          day: string
          delay_score: number
          efficiency_score: number
          id: string
          queue_id: string | null
          sample_count: number
          score: number
          updated_at: string
          wait_score: number
        }
        Insert: {
          abandon_score?: number
          accuracy_score?: number
          business_id: string
          created_at?: string
          day?: string
          delay_score?: number
          efficiency_score?: number
          id?: string
          queue_id?: string | null
          sample_count?: number
          score: number
          updated_at?: string
          wait_score?: number
        }
        Update: {
          abandon_score?: number
          accuracy_score?: number
          business_id?: string
          created_at?: string
          day?: string
          delay_score?: number
          efficiency_score?: number
          id?: string
          queue_id?: string | null
          sample_count?: number
          score?: number
          updated_at?: string
          wait_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_health_daily_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_live_signals: {
        Row: {
          created_at: string
          event_type: string
          id: number
          queue_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: number
          queue_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: number
          queue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_live_signals_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_sessions: {
        Row: {
          avg_wait_minutes: number
          business_id: string
          created_at: string
          ended_at: string
          id: string
          peak_hour: number | null
          queue_id: string
          session_date: string
          started_at: string
          total_joined: number
          total_no_show: number
          total_removed: number
          total_served: number
          total_skipped: number
        }
        Insert: {
          avg_wait_minutes?: number
          business_id: string
          created_at?: string
          ended_at?: string
          id?: string
          peak_hour?: number | null
          queue_id: string
          session_date?: string
          started_at: string
          total_joined?: number
          total_no_show?: number
          total_removed?: number
          total_served?: number
          total_skipped?: number
        }
        Update: {
          avg_wait_minutes?: number
          business_id?: string
          created_at?: string
          ended_at?: string
          id?: string
          peak_hour?: number | null
          queue_id?: string
          session_date?: string
          started_at?: string
          total_joined?: number
          total_no_show?: number
          total_removed?: number
          total_served?: number
          total_skipped?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_sessions_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_service_time: number
          id: string
          is_global: boolean
          name: string
          queue_type: string
          seating_policy: string | null
          table_config: Json | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_service_time?: number
          id?: string
          is_global?: boolean
          name: string
          queue_type?: string
          seating_policy?: string | null
          table_config?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_service_time?: number
          id?: string
          is_global?: boolean
          name?: string
          queue_type?: string
          seating_policy?: string | null
          table_config?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      queue_visitors: {
        Row: {
          assigned_table_size: number | null
          called_at: string | null
          checked_in_at: string | null
          id: string
          joined_at: string
          party_size: number | null
          phone: string | null
          queue_id: string
          served_at: string | null
          serving_started_at: string | null
          session_id: string | null
          status: string
          token_number: number
          visitor_name: string | null
        }
        Insert: {
          assigned_table_size?: number | null
          called_at?: string | null
          checked_in_at?: string | null
          id?: string
          joined_at?: string
          party_size?: number | null
          phone?: string | null
          queue_id: string
          served_at?: string | null
          serving_started_at?: string | null
          session_id?: string | null
          status?: string
          token_number: number
          visitor_name?: string | null
        }
        Update: {
          assigned_table_size?: number | null
          called_at?: string | null
          checked_in_at?: string | null
          id?: string
          joined_at?: string
          party_size?: number | null
          phone?: string | null
          queue_id?: string
          served_at?: string | null
          serving_started_at?: string | null
          session_id?: string | null
          status?: string
          token_number?: number
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_visitors_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          arrival_window_minutes: number
          auto_expire_minutes: number
          business_id: string
          created_at: string
          current_token: number | null
          duplicate_protection: boolean
          estimated_service_time: number | null
          id: string
          join_cooldown_minutes: number
          name: string
          next_token: number | null
          note: string | null
          parent_queue_id: string | null
          party_size_mode: string
          party_sizes: number[]
          queue_type: string
          seating_policy: string
          status: string
          table_config: Json
          table_size: number | null
          updated_at: string
        }
        Insert: {
          arrival_window_minutes?: number
          auto_expire_minutes?: number
          business_id: string
          created_at?: string
          current_token?: number | null
          duplicate_protection?: boolean
          estimated_service_time?: number | null
          id?: string
          join_cooldown_minutes?: number
          name: string
          next_token?: number | null
          note?: string | null
          parent_queue_id?: string | null
          party_size_mode?: string
          party_sizes?: number[]
          queue_type?: string
          seating_policy?: string
          status?: string
          table_config?: Json
          table_size?: number | null
          updated_at?: string
        }
        Update: {
          arrival_window_minutes?: number
          auto_expire_minutes?: number
          business_id?: string
          created_at?: string
          current_token?: number | null
          duplicate_protection?: boolean
          estimated_service_time?: number | null
          id?: string
          join_cooldown_minutes?: number
          name?: string
          next_token?: number | null
          note?: string | null
          parent_queue_id?: string | null
          party_size_mode?: string
          party_sizes?: number[]
          queue_type?: string
          seating_policy?: string
          status?: string
          table_config?: Json
          table_size?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queues_parent_queue_id_fkey"
            columns: ["parent_queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      trust_privacy_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          seconds_since_view: number | null
          session_id: string | null
          source: string | null
          viewed_modal: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          seconds_since_view?: number | null
          session_id?: string | null
          source?: string | null
          viewed_modal?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          seconds_since_view?: number | null
          session_id?: string | null
          source?: string | null
          viewed_modal?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      queue_visitors_public: {
        Row: {
          called_at: string | null
          id: string | null
          joined_at: string | null
          queue_id: string | null
          status: string | null
          token_number: number | null
        }
        Insert: {
          called_at?: string | null
          id?: string | null
          joined_at?: string | null
          queue_id?: string | null
          status?: string | null
          token_number?: number | null
        }
        Update: {
          called_at?: string | null
          id?: string | null
          joined_at?: string | null
          queue_id?: string | null
          status?: string | null
          token_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_visitors_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      call_next: {
        Args: { p_queue_id: string }
        Returns: {
          id: string
          phone: string
          token_number: number
          visitor_name: string
        }[]
      }
      check_in_visitor: { Args: { p_visitor_id: string }; Returns: undefined }
      get_active_pickup_count: {
        Args: { p_business_id: string }
        Returns: number
      }
      get_business_benchmark: {
        Args: { p_business_id: string }
        Returns: {
          business_avg_seconds: number
          business_sample: number
          category: string
          category_avg_seconds: number
          category_sample: number
          direction: string
          faster_percent: number
          peer_business_count: number
        }[]
      }
      get_business_health: {
        Args: { p_business_id: string; p_days?: number }
        Returns: {
          abandon_score: number
          accuracy_score: number
          band: string
          business_id: string
          delay_score: number
          efficiency_score: number
          queue_count: number
          sample_count: number
          score: number
          total_joined: number
          wait_score: number
        }[]
      }
      get_owner_health_branches: {
        Args: { p_days?: number }
        Returns: {
          band: string
          business_id: string
          business_name: string
          category: string
          sample_count: number
          score: number
        }[]
      }
      get_pickup_order: {
        Args: { p_order_id: string }
        Returns: {
          business_id: string
          created_at: string
          eta_minutes: number
          id: string
          items: Json
          notes: string
          picked_up_at: string
          ready_at: string
          status: string
          token: string
        }[]
      }
      get_public_queue_activity: {
        Args: { p_limit?: number; p_queue_id: string }
        Returns: {
          action: string
          actor: string
          created_at: string
          id: string
          token_number: number
        }[]
      }
      get_public_queue_pulse: {
        Args: { p_queue_id: string }
        Returns: {
          avg_service_minutes: number
          avg_wait_minutes: number
          joined_today: number
          reliability_pct: number
          served_today: number
          waiting: number
        }[]
      }
      get_queue_forecast: {
        Args: { p_day_of_week?: number; p_queue_id: string }
        Returns: {
          avg_joins: number
          avg_wait_minutes: number
          confidence: number
          day_of_week: number
          distinct_days: number
          hour: number
          no_show_rate: number
          sample_count: number
          total_sample: number
        }[]
      }
      get_queue_health: {
        Args: { p_days?: number; p_queue_id: string }
        Returns: {
          abandon_score: number
          abandonment_rate: number
          accuracy_score: number
          avg_wait_minutes: number
          band: string
          delay_rate: number
          delay_score: number
          efficiency_score: number
          expected_per_hour: number
          queue_id: string
          sample_count: number
          score: number
          served_per_hour: number
          total_joined: number
          wait_mae_minutes: number
          wait_score: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      join_queue: {
        Args: {
          p_party_size?: number
          p_phone?: string
          p_queue_id: string
          p_visitor_name?: string
        }
        Returns: {
          assigned_table_size: number
          id: string
          token_number: number
        }[]
      }
      join_restaurant_queue: {
        Args: {
          p_parent_queue_id: string
          p_phone?: string
          p_table_size: number
          p_visitor_name?: string
        }
        Returns: {
          child_queue_id: string
          id: string
          table_size: number
          token_number: number
        }[]
      }
      log_queue_activity: {
        Args: {
          p_action: string
          p_actor?: string
          p_meta?: Json
          p_queue_id: string
          p_visitor_id: string
        }
        Returns: undefined
      }
      mark_no_show: { Args: { p_visitor_id: string }; Returns: undefined }
      recall_visitor: { Args: { p_visitor_id: string }; Returns: undefined }
      reset_queue_for_new_day: {
        Args: { p_queue_id: string }
        Returns: {
          avg_wait_minutes: number
          business_id: string
          created_at: string
          ended_at: string
          id: string
          peak_hour: number | null
          queue_id: string
          session_date: string
          started_at: string
          total_joined: number
          total_no_show: number
          total_removed: number
          total_served: number
          total_skipped: number
        }
        SetofOptions: {
          from: "*"
          to: "queue_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      run_queue_integrity_sweep: {
        Args: { p_queue_id: string }
        Returns: number
      }
      serve_restaurant_next: {
        Args: { p_queue_id: string; p_table_size: number }
        Returns: {
          assigned_table_size: number
          id: string
          party_size: number
          phone: string
          token_number: number
          visitor_name: string
        }[]
      }
      skip_visitor: { Args: { p_visitor_id: string }; Returns: undefined }
      snapshot_queue_health: {
        Args: { p_business_id: string }
        Returns: number
      }
      sync_restaurant_child_queues: {
        Args: { p_parent_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "business" | "admin"
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
      app_role: ["customer", "business", "admin"],
    },
  },
} as const
