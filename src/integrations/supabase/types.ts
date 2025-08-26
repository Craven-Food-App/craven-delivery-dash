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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      craver_applications: {
        Row: {
          account_number_last_four: string | null
          bank_account_type: string | null
          city: string
          created_at: string
          date_of_birth: string
          drivers_license_back: string | null
          drivers_license_front: string | null
          email: string
          first_name: string
          id: string
          insurance_document: string | null
          last_name: string
          license_expiry: string
          license_number: string
          license_plate: string | null
          license_state: string
          phone: string
          profile_photo: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          routing_number: string | null
          ssn_last_four: string
          state: string
          status: Database["public"]["Enums"]["application_status"]
          street_address: string
          submitted_at: string | null
          updated_at: string
          user_id: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_registration: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vehicle_year: number | null
          zip_code: string
        }
        Insert: {
          account_number_last_four?: string | null
          bank_account_type?: string | null
          city: string
          created_at?: string
          date_of_birth: string
          drivers_license_back?: string | null
          drivers_license_front?: string | null
          email: string
          first_name: string
          id?: string
          insurance_document?: string | null
          last_name: string
          license_expiry: string
          license_number: string
          license_plate?: string | null
          license_state: string
          phone: string
          profile_photo?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          routing_number?: string | null
          ssn_last_four: string
          state: string
          status?: Database["public"]["Enums"]["application_status"]
          street_address: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vehicle_year?: number | null
          zip_code: string
        }
        Update: {
          account_number_last_four?: string | null
          bank_account_type?: string | null
          city?: string
          created_at?: string
          date_of_birth?: string
          drivers_license_back?: string | null
          drivers_license_front?: string | null
          email?: string
          first_name?: string
          id?: string
          insurance_document?: string | null
          last_name?: string
          license_expiry?: string
          license_number?: string
          license_plate?: string | null
          license_state?: string
          phone?: string
          profile_photo?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          routing_number?: string | null
          ssn_last_four?: string
          state?: string
          status?: Database["public"]["Enums"]["application_status"]
          street_address?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vehicle_year?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      craver_locations: {
        Row: {
          lat: number
          lng: number
          updated_at: string
          user_id: string
        }
        Insert: {
          lat: number
          lng: number
          updated_at?: string
          user_id: string
        }
        Update: {
          lat?: number
          lng?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifiers: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_available: boolean | null
          is_required: boolean | null
          max_selections: number | null
          menu_item_id: string
          modifier_type: string
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          menu_item_id: string
          modifier_type?: string
          name: string
          price_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          menu_item_id?: string
          modifier_type?: string
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          is_gluten_free: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          order_count: number | null
          preparation_time: number | null
          price_cents: number
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          order_count?: number | null
          preparation_time?: number | null
          price_cents: number
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          order_count?: number | null
          preparation_time?: number | null
          price_cents?: number
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_craver_id: string | null
          created_at: string
          distance_km: number
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          dropoff_name: string
          id: string
          payout_cents: number
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          restaurant_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          assigned_craver_id?: string | null
          created_at?: string
          distance_km: number
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          dropoff_name: string
          id?: string
          payout_cents: number
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pickup_name: string
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          assigned_craver_id?: string | null
          created_at?: string
          distance_km?: number
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          dropoff_name?: string
          id?: string
          payout_cents?: number
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          pickup_name?: string
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          city: string
          created_at: string | null
          cuisine_type: string
          delivery_fee_cents: number | null
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_promoted: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_delivery_time: number | null
          min_delivery_time: number | null
          name: string
          owner_id: string
          phone: string | null
          rating: number | null
          state: string
          total_reviews: number | null
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          cuisine_type: string
          delivery_fee_cents?: number | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_promoted?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_time?: number | null
          min_delivery_time?: number | null
          name: string
          owner_id: string
          phone?: string | null
          rating?: number | null
          state: string
          total_reviews?: number | null
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          cuisine_type?: string
          delivery_fee_cents?: number | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_promoted?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_time?: number | null
          min_delivery_time?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          rating?: number | null
          state?: string
          total_reviews?: number | null
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_approved_craver: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status: "pending" | "under_review" | "approved" | "rejected"
      order_status:
        | "pending"
        | "assigned"
        | "picked_up"
        | "delivered"
        | "cancelled"
      vehicle_type: "car" | "bike" | "scooter" | "motorcycle" | "walking"
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
      application_status: ["pending", "under_review", "approved", "rejected"],
      order_status: [
        "pending",
        "assigned",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      vehicle_type: ["car", "bike", "scooter", "motorcycle", "walking"],
    },
  },
} as const
