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
      b2b_leads: {
        Row: {
          company: string
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          company: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          company?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: []
      }
      barber_affiliations: {
        Row: {
          barber_id: string
          barbershop_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          ended_on: string | null
          id: string
          role_title: string | null
          started_on: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          ended_on?: string | null
          id?: string
          role_title?: string | null
          started_on?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          ended_on?: string | null
          id?: string
          role_title?: string | null
          started_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_affiliations_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "private_barbers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "barber_affiliations_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_certifications: {
        Row: {
          barber_id: string
          created_at: string
          file_path: string | null
          id: string
          issued_on: string | null
          issuer: string
          title: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          barber_id: string
          created_at?: string
          file_path?: string | null
          id?: string
          issued_on?: string | null
          issuer: string
          title: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          barber_id?: string
          created_at?: string
          file_path?: string | null
          id?: string
          issued_on?: string | null
          issuer?: string
          title?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_certifications_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "private_barbers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "barber_certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          address_snapshot: Json | null
          amount_cents: number | null
          barbershop_id: string | null
          client_id: string
          created_at: string
          currency: string | null
          duration_minutes: number
          id: string
          location_id: string | null
          paid_at: string | null
          private_barber_id: string | null
          scheduled_at: string
          service_id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          style_confirmed_at: string
          updated_at: string
        }
        Insert: {
          address_snapshot?: Json | null
          amount_cents?: number | null
          barbershop_id?: string | null
          client_id: string
          created_at?: string
          currency?: string | null
          duration_minutes: number
          id?: string
          location_id?: string | null
          paid_at?: string | null
          private_barber_id?: string | null
          scheduled_at: string
          service_id: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          style_confirmed_at: string
          updated_at?: string
        }
        Update: {
          address_snapshot?: Json | null
          amount_cents?: number | null
          barbershop_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string | null
          duration_minutes?: number
          id?: string
          location_id?: string | null
          paid_at?: string | null
          private_barber_id?: string | null
          scheduled_at?: string
          service_id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
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
            foreignKeyName: "bookings_private_barber_id_fkey"
            columns: ["private_barber_id"]
            isOneToOne: false
            referencedRelation: "private_barbers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "barbershop_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean
          lat: number | null
          lng: number | null
          profile_id: string
          state: string
          street_address: string
          unit: string | null
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          lat?: number | null
          lng?: number | null
          profile_id: string
          state: string
          street_address: string
          unit?: string | null
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          lat?: number | null
          lng?: number | null
          profile_id?: string
          state?: string
          street_address?: string
          unit?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_accounts: {
        Row: {
          created_at: string
          payouts_ready_at: string | null
          profile_id: string
          stripe_account_id: string
        }
        Insert: {
          created_at?: string
          payouts_ready_at?: string | null
          profile_id: string
          stripe_account_id: string
        }
        Update: {
          created_at?: string
          payouts_ready_at?: string | null
          profile_id?: string
          stripe_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_areas: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          private_barber_id: string
          state: string
          zip_codes: string[]
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          id?: string
          private_barber_id: string
          state: string
          zip_codes?: string[]
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          private_barber_id?: string
          state?: string
          zip_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "coverage_areas_private_barber_id_fkey"
            columns: ["private_barber_id"]
            isOneToOne: false
            referencedRelation: "private_barbers"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          profile_id: string
          registered_at: string
          service_claimed_at: string | null
        }
        Insert: {
          event_id: string
          profile_id: string
          registered_at?: string
          service_claimed_at?: string | null
        }
        Update: {
          event_id?: string
          profile_id?: string
          registered_at?: string
          service_claimed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          brand_name: string
          created_at: string
          ends_at: string
          id: string
          manager_id: string
          qr_slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          venue: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          ends_at: string
          id?: string
          manager_id: string
          qr_slug?: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          venue: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          ends_at?: string
          id?: string
          manager_id?: string
          qr_slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      private_barbers: {
        Row: {
          base_price_cents: number
          bio: string | null
          created_at: string
          headline: string | null
          offers_home_service: boolean
          profile_id: string
          self_photo_path: string | null
          services_fulfilled_count: number
          setup_photo_path: string | null
          specialties: string[]
          status: Database["public"]["Enums"]["barbershop_status"]
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          base_price_cents?: number
          bio?: string | null
          created_at?: string
          headline?: string | null
          offers_home_service?: boolean
          profile_id: string
          self_photo_path?: string | null
          services_fulfilled_count?: number
          setup_photo_path?: string | null
          specialties?: string[]
          status?: Database["public"]["Enums"]["barbershop_status"]
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          base_price_cents?: number
          bio?: string | null
          created_at?: string
          headline?: string | null
          offers_home_service?: boolean
          profile_id?: string
          self_photo_path?: string | null
          services_fulfilled_count?: number
          setup_photo_path?: string | null
          specialties?: string[]
          status?: Database["public"]["Enums"]["barbershop_status"]
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "private_barbers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
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
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
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
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
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
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
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
          private_barber_id: string | null
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
          private_barber_id?: string | null
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
          private_barber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_private_barber_id_fkey"
            columns: ["private_barber_id"]
            isOneToOne: false
            referencedRelation: "private_barbers"
            referencedColumns: ["profile_id"]
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
      approve_private_barber: {
        Args: { barber_id: string }
        Returns: undefined
      }
      barber_service_history: {
        Args: { p_barber_id: string }
        Returns: {
          completed_count: number
          service_name: string
        }[]
      }
      event_attendees: {
        Args: { p_event_id: string }
        Returns: {
          first_name: string
          last_name: string
          profile_id: string
          registered_at: string
          service_claimed_at: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      link_staff_by_email: { Args: never; Returns: number }
      my_event_ids: { Args: never; Returns: string[] }
      my_shop_ids: { Args: never; Returns: string[] }
      set_client_tier: {
        Args: {
          new_tier: Database["public"]["Enums"]["client_tier"]
          user_email: string
        }
        Returns: undefined
      }
      set_event_manager: { Args: { user_email: string }; Returns: undefined }
      shop_staff_directory: {
        Args: { p_shop_id: string }
        Returns: {
          full_name: string
          guild_headline: string | null
          guild_profile_id: string | null
          id: string
          skills: string[]
        }[]
      }
      verify_certification: { Args: { cert_id: string }; Returns: undefined }
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
      event_status: "draft" | "live" | "finished"
      haircut_method: "scissors" | "machine" | "mixed"
      lead_status: "new" | "contacted" | "closed"
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
      event_status: ["draft", "live", "finished"],
      haircut_method: ["scissors", "machine", "mixed"],
      lead_status: ["new", "contacted", "closed"],
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
