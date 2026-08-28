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
      guides: {
        Row: {
          accent_color: string
          callout: string | null
          category: string
          collection: Database["public"]["Enums"]["guide_collection"]
          cover_url: string | null
          created_at: string
          created_by: string | null
          has_pdf: boolean
          id: string
          page_count: number
          pdf_path: string | null
          position: number
          published_at: string | null
          status: Database["public"]["Enums"]["guide_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          callout?: string | null
          category?: string
          collection?: Database["public"]["Enums"]["guide_collection"]
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          has_pdf?: boolean
          id?: string
          page_count?: number
          pdf_path?: string | null
          position?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["guide_status"]
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          callout?: string | null
          category?: string
          collection?: Database["public"]["Enums"]["guide_collection"]
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          has_pdf?: boolean
          id?: string
          page_count?: number
          pdf_path?: string | null
          position?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["guide_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdf_annotations: {
        Row: {
          created_at: string
          guide_id: string
          id: string
          note: string
          page_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guide_id: string
          id?: string
          note: string
          page_number?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guide_id?: string
          id?: string
          note?: string
          page_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_annotations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          created_at: string
          current_page: number
          guide_id: string
          id: string
          page_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_page?: number
          guide_id: string
          id?: string
          page_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_page?: number
          guide_id?: string
          id?: string
          page_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          provider: string
          provider_checkout_session_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string
          provider_checkout_session_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string
          provider_checkout_session_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ua_access_levels: {
        Row: {
          created_at: string
          created_by: number | null
          description: string | null
          id: number
          name: string
          permissions: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          description?: string | null
          id?: number
          name: string
          permissions?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: number | null
          description?: string | null
          id?: number
          name?: string
          permissions?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_access_levels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_campaigns: {
        Row: {
          created_at: string
          created_by: number | null
          id: number
          landing_url: string | null
          name: string
          notes: string | null
          product_id: number
          slug: string
          status: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          id?: number
          landing_url?: string | null
          name: string
          notes?: string | null
          product_id: number
          slug: string
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          created_by?: number | null
          id?: number
          landing_url?: string | null
          name?: string
          notes?: string | null
          product_id?: number
          slug?: string
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ua_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ua_campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ua_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_conversions: {
        Row: {
          amount_cents: number | null
          campaign_id: number | null
          created_at: string
          created_by: number | null
          currency: string
          id: number
          note: string | null
          occurred_at: string
          product_id: number
          source: string
          status: string
        }
        Insert: {
          amount_cents?: number | null
          campaign_id?: number | null
          created_at?: string
          created_by?: number | null
          currency?: string
          id?: number
          note?: string | null
          occurred_at?: string
          product_id: number
          source?: string
          status?: string
        }
        Update: {
          amount_cents?: number | null
          campaign_id?: number | null
          created_at?: string
          created_by?: number | null
          currency?: string
          id?: number
          note?: string | null
          occurred_at?: string
          product_id?: number
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_conversions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ua_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ua_conversions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ua_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ua_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_facilitators: {
        Row: {
          category: string
          created_at: string
          created_by: number | null
          id: number
          image_key: string | null
          image_url: string | null
          link_url: string | null
          position: number
          source_label: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: number | null
          id?: number
          image_key?: string | null
          image_url?: string | null
          link_url?: string | null
          position?: number
          source_label?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: number | null
          id?: number
          image_key?: string | null
          image_url?: string | null
          link_url?: string | null
          position?: number
          source_label?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_facilitators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_forum_comments: {
        Row: {
          author_id: number
          body: string
          created_at: string
          id: number
          status: string
          topic_id: number
          updated_at: string
        }
        Insert: {
          author_id: number
          body: string
          created_at?: string
          id?: number
          status?: string
          topic_id: number
          updated_at?: string
        }
        Update: {
          author_id?: number
          body?: string
          created_at?: string
          id?: number
          status?: string
          topic_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_forum_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ua_forum_comments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ua_forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_forum_topics: {
        Row: {
          author_id: number
          body: string
          category: string
          comment_count: number
          created_at: string
          id: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: number
          body: string
          category?: string
          comment_count?: number
          created_at?: string
          id?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: number
          body?: string
          category?: string
          comment_count?: number
          created_at?: string
          id?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_forum_topics_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_funnel_settings: {
        Row: {
          checkout_url: string | null
          cta_label: string
          headline: string
          id: number
          price_label: string
          subheadline: string | null
          updated_at: string
          vsl_video_path: string | null
        }
        Insert: {
          checkout_url?: string | null
          cta_label?: string
          headline?: string
          id?: number
          price_label?: string
          subheadline?: string | null
          updated_at?: string
          vsl_video_path?: string | null
        }
        Update: {
          checkout_url?: string | null
          cta_label?: string
          headline?: string
          id?: number
          price_label?: string
          subheadline?: string | null
          updated_at?: string
          vsl_video_path?: string | null
        }
        Relationships: []
      }
      ua_guides: {
        Row: {
          category: string
          content: string | null
          cover_image_key: string | null
          cover_image_url: string | null
          created_at: string
          created_by: number | null
          id: number
          pdf_key: string | null
          pdf_url: string | null
          position: number
          published_at: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          cover_image_key?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: number | null
          id?: number
          pdf_key?: string | null
          pdf_url?: string | null
          position?: number
          published_at?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          cover_image_key?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: number | null
          id?: number
          pdf_key?: string | null
          pdf_url?: string | null
          position?: number
          published_at?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_guides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_landing_settings: {
        Row: {
          id: number
          product_shelf_description: string
          product_shelf_title: string
          show_product_shelf: boolean
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          id?: number
          product_shelf_description?: string
          product_shelf_title?: string
          show_product_shelf?: boolean
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          id?: number
          product_shelf_description?: string
          product_shelf_title?: string
          show_product_shelf?: boolean
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ua_landing_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_pdf_annotations: {
        Row: {
          created_at: string
          document_id: number
          id: number
          note: string
          page_number: number
          source_type: string
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          document_id: number
          id?: number
          note: string
          page_number?: number
          source_type: string
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          document_id?: number
          id?: number
          note?: string
          page_number?: number
          source_type?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ua_pdf_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_preferences: {
        Row: {
          created_at: string
          id: number
          notify_community: boolean
          notify_guides: boolean
          notify_replies: boolean
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          notify_community?: boolean
          notify_guides?: boolean
          notify_replies?: boolean
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          notify_community?: boolean
          notify_guides?: boolean
          notify_replies?: boolean
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ua_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_product_clicks: {
        Row: {
          campaign: string | null
          campaign_id: number | null
          created_at: string
          id: number
          origin: string
          product_id: number
        }
        Insert: {
          campaign?: string | null
          campaign_id?: number | null
          created_at?: string
          id?: number
          origin?: string
          product_id: number
        }
        Update: {
          campaign?: string | null
          campaign_id?: number | null
          created_at?: string
          id?: number
          origin?: string
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ua_product_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ua_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ua_product_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ua_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_products: {
        Row: {
          category: string
          cover_image_key: string | null
          cover_image_url: string | null
          created_at: string
          created_by: number | null
          external_url: string
          featured_on_home: boolean
          id: number
          position: number
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image_key?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: number | null
          external_url: string
          featured_on_home?: boolean
          id?: number
          position?: number
          slug: string
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_key?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: number | null
          external_url?: string
          featured_on_home?: boolean
          id?: number
          position?: number
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_profiles: {
        Row: {
          avatar_key: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          avatar_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          avatar_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ua_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_reading_progress: {
        Row: {
          created_at: string
          current_page: number
          document_id: number
          id: number
          page_count: number
          source_type: string
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          current_page?: number
          document_id: number
          id?: number
          page_count?: number
          source_type: string
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          current_page?: number
          document_id?: number
          id?: number
          page_count?: number
          source_type?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ua_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_test_guides: {
        Row: {
          accent_color: string
          callout: string | null
          category: string
          content: string | null
          cover_image_key: string | null
          cover_image_url: string | null
          created_at: string
          created_by: number | null
          id: number
          pdf_key: string | null
          pdf_url: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          callout?: string | null
          category?: string
          content?: string | null
          cover_image_key?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: number | null
          id?: number
          pdf_key?: string | null
          pdf_url?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          callout?: string | null
          category?: string
          content?: string | null
          cover_image_key?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: number | null
          id?: number
          pdf_key?: string | null
          pdf_url?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ua_test_guides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_user_access_levels: {
        Row: {
          access_level_id: number
          created_at: string
          id: number
          user_id: number
        }
        Insert: {
          access_level_id: number
          created_at?: string
          id?: number
          user_id: number
        }
        Update: {
          access_level_id?: number
          created_at?: string
          id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ua_user_access_levels_access_level_id_fkey"
            columns: ["access_level_id"]
            isOneToOne: false
            referencedRelation: "ua_access_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ua_user_access_levels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ua_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ua_users: {
        Row: {
          account_status: string
          auth_id: string | null
          created_at: string
          email: string | null
          id: number
          last_signed_in: string
          membership_status: string
          name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          account_status?: string
          auth_id?: string | null
          created_at?: string
          email?: string | null
          id?: number
          last_signed_in?: string
          membership_status?: string
          name?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          account_status?: string
          auth_id?: string | null
          created_at?: string
          email?: string | null
          id?: number
          last_signed_in?: string
          membership_status?: string
          name?: string | null
          role?: string
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "master" | "admin" | "user"
      guide_collection: "biblioteca" | "academia"
      guide_status: "draft" | "published"
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
      app_role: ["master", "admin", "user"],
      guide_collection: ["biblioteca", "academia"],
      guide_status: ["draft", "published"],
    },
  },
} as const
