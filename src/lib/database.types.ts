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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      barbershop_locations: {
        Row: {
          barbershop_id: string
          city: string
          country: string
          created_at: string
          formatted_address: string
          google_place_id: string | null
          id: string
          lat: number | null
          lng: number | null
          state: string
          zip_code: string
        }
        Insert: {
          barbershop_id: string
          city: string
          country: string
          created_at?: string
          formatted_address: string
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          state: string
          zip_code: string
        }
        Update: {
          barbershop_id?: string
          city?: string
          country?: string
          created_at?: string
          formatted_address?: string
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          state?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_locations_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_staff: {
        Row: {
          barbershop_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          profile_id: string | null
          skills: string[]
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          skills?: string[]
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          skills?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_staff_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbershop_staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          services_fulfilled_count: number
          status: Database["public"]["Enums"]["barbershop_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          services_fulfilled_count?: number
          status?: Database["public"]["Enums"]["barbershop_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          services_fulfilled_count?: number
          status?: Database["public"]["Enums"]["barbershop_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          barbershop_id: string
          client_id: string
          created_at: string
          duration_minutes: number
          id: string
          location_id: string | null
          scheduled_at: string
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          style_confirmed_at: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          client_id: string
          created_at?: string
          duration_minutes: number
          id?: string
          location_id?: string | null
          scheduled_at: string
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          style_confirmed_at: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          client_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          location_id?: string | null
          scheduled_at?: string
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          style_confirmed_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "barbershop_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          document: Database["public"]["Enums"]["legal_document"]
          id: number
          profile_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document: Database["public"]["Enums"]["legal_document"]
          id?: never
          profile_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document?: Database["public"]["Enums"]["legal_document"]
          id?: never
          profile_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          city: string | null
          country: string | null
          created_at: string
          first_name: string | null
          haircut_method: Database["public"]["Enums"]["haircut_method"] | null
          id: string
          last_name: string | null
          onboarding_completed_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          tier: Database["public"]["Enums"]["client_tier"]
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          haircut_method?: Database["public"]["Enums"]["haircut_method"] | null
          id: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          tier?: Database["public"]["Enums"]["client_tier"]
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          haircut_method?: Database["public"]["Enums"]["haircut_method"] | null
          id?: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          tier?: Database["public"]["Enums"]["client_tier"]
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          barbershop_id: string | null
          created_at: string
          currency: string
          duration_minutes: number
          id: string
          name: string
          price_cents: number
        }
        Insert: {
          active?: boolean
          barbershop_id?: string | null
          created_at?: string
          currency?: string
          duration_minutes?: number
          id?: string
          name: string
          price_cents: number
        }
        Update: {
          active?: boolean
          barbershop_id?: string | null
          created_at?: string
          currency?: string
          duration_minutes?: number
          id?: string
          name?: string
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      style_photos: {
        Row: {
          position: Database["public"]["Enums"]["photo_position"]
          profile_id: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          position: Database["public"]["Enums"]["photo_position"]
          profile_id: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          position?: Database["public"]["Enums"]["photo_position"]
          profile_id?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_photos_profile_id_fkey"
            columns: ["profile_id"]
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
      approve_barbershop: { Args: { shop_id: string }; Returns: undefined }
      link_staff_by_email: { Args: never; Returns: number }
      my_shop_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      barbershop_status: "pending" | "approved" | "suspended"
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      client_tier: "standard" | "premium"
      haircut_method: "scissors" | "machine" | "mixed"
      legal_document: "terms" | "privacy"
      photo_position: "front" | "left" | "right" | "back"
      user_role:
        | "client"
        | "barbershop_owner"
        | "private_barber"
        | "event_manager"
        | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      barbershop_status: ["pending", "approved", "suspended"],
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      client_tier: ["standard", "premium"],
      haircut_method: ["scissors", "machine", "mixed"],
      legal_document: ["terms", "privacy"],
      photo_position: ["front", "left", "right", "back"],
      user_role: [
        "client",
        "barbershop_owner",
        "private_barber",
        "event_manager",
        "admin",
      ],
    },
  },
} as const
