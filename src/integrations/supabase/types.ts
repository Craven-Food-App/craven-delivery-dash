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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          admin_id: string | null
          created_at: string
          customer_id: string | null
          driver_id: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          priority: string
          status: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string | null
          driver_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          priority?: string
          status?: string
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string | null
          driver_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          priority?: string
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      craver_applications: {
        Row: {
          account_number_last_four: string | null
          background_check: boolean | null
          bank_account_type: string | null
          city: string
          created_at: string | null
          date_of_birth: string
          drivers_license: string
          drivers_license_back: string | null
          drivers_license_front: string | null
          email: string
          first_name: string
          id: string
          insurance_document: string | null
          insurance_policy: string
          insurance_provider: string
          last_name: string
          license_expiry: string | null
          license_number: string | null
          license_plate: string
          license_state: string | null
          phone: string
          profile_photo: string | null
          routing_number: string | null
          ssn_last_four: string | null
          state: string
          status: string | null
          street_address: string
          updated_at: string | null
          user_id: string | null
          vehicle_color: string
          vehicle_inspection: boolean | null
          vehicle_make: string
          vehicle_model: string
          vehicle_registration: string | null
          vehicle_type: string
          vehicle_year: number
          zip_code: string
        }
        Insert: {
          account_number_last_four?: string | null
          background_check?: boolean | null
          bank_account_type?: string | null
          city: string
          created_at?: string | null
          date_of_birth: string
          drivers_license: string
          drivers_license_back?: string | null
          drivers_license_front?: string | null
          email: string
          first_name: string
          id?: string
          insurance_document?: string | null
          insurance_policy: string
          insurance_provider: string
          last_name: string
          license_expiry?: string | null
          license_number?: string | null
          license_plate: string
          license_state?: string | null
          phone: string
          profile_photo?: string | null
          routing_number?: string | null
          ssn_last_four?: string | null
          state: string
          status?: string | null
          street_address: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_color: string
          vehicle_inspection?: boolean | null
          vehicle_make: string
          vehicle_model: string
          vehicle_registration?: string | null
          vehicle_type: string
          vehicle_year: number
          zip_code: string
        }
        Update: {
          account_number_last_four?: string | null
          background_check?: boolean | null
          bank_account_type?: string | null
          city?: string
          created_at?: string | null
          date_of_birth?: string
          drivers_license?: string
          drivers_license_back?: string | null
          drivers_license_front?: string | null
          email?: string
          first_name?: string
          id?: string
          insurance_document?: string | null
          insurance_policy?: string
          insurance_provider?: string
          last_name?: string
          license_expiry?: string | null
          license_number?: string | null
          license_plate?: string
          license_state?: string | null
          phone?: string
          profile_photo?: string | null
          routing_number?: string | null
          ssn_last_four?: string | null
          state?: string
          status?: string | null
          street_address?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_color?: string
          vehicle_inspection?: boolean | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_registration?: string | null
          vehicle_type?: string
          vehicle_year?: number
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "craver_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_addresses: {
        Row: {
          city: string
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string | null
          state: string
          street_address: string
          user_id: string | null
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          state: string
          street_address: string
          user_id?: string | null
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          state?: string
          street_address?: string
          user_id?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      driver_earnings: {
        Row: {
          amount_cents: number
          driver_id: string | null
          earned_at: string | null
          id: string
          order_id: string | null
          payout_cents: number
          tip_cents: number | null
          total_cents: number
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          driver_id?: string | null
          earned_at?: string | null
          id?: string
          order_id?: string | null
          payout_cents: number
          tip_cents?: number | null
          total_cents: number
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          driver_id?: string | null
          earned_at?: string | null
          id?: string
          order_id?: string | null
          payout_cents?: number
          tip_cents?: number | null
          total_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          license_plate: string | null
          rating: number | null
          status: string | null
          total_deliveries: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          license_plate?: string | null
          rating?: number | null
          status?: string | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          license_plate?: string | null
          rating?: number | null
          status?: string | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          updated_at?: string
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
      menu_item_favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          menu_item_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          menu_item_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          menu_item_id?: string
        }
        Relationships: []
      }
      menu_item_modifiers: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_available: boolean
          is_required: boolean
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
          display_order?: number
          id?: string
          is_available?: boolean
          is_required?: boolean
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
          display_order?: number
          id?: string
          is_available?: boolean
          is_required?: boolean
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
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          is_gluten_free: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          name: string
          order_count: number
          preparation_time: number | null
          price_cents: number
          restaurant_id: string
          spice_level: string | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          is_gluten_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name: string
          order_count?: number
          preparation_time?: number | null
          price_cents: number
          restaurant_id: string
          spice_level?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          is_gluten_free?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name?: string
          order_count?: number
          preparation_time?: number | null
          price_cents?: number
          restaurant_id?: string
          spice_level?: string | null
          updated_at?: string
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
      order_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          driver_id: string | null
          feedback_type: string | null
          id: string
          order_id: string | null
          rating: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          driver_id?: string | null
          feedback_type?: string | null
          id?: string
          order_id?: string | null
          rating?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          driver_id?: string | null
          feedback_type?: string | null
          id?: string
          order_id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_feedback_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_feedback_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_feedback_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          created_at: string
          id: string
          modifier_id: string
          modifier_name: string
          modifier_price_cents: number
          order_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modifier_id: string
          modifier_name: string
          modifier_price_cents?: number
          order_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modifier_id?: string
          modifier_name?: string
          modifier_price_cents?: number
          order_item_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          order_id: string
          price_cents: number
          quantity: number
          special_instructions: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          order_id: string
          price_cents: number
          quantity?: number
          special_instructions?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          order_id?: string
          price_cents?: number
          quantity?: number
          special_instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          delivery_address: Json | null
          delivery_fee_cents: number | null
          driver_id: string | null
          estimated_delivery_time: string | null
          id: string
          order_status: string | null
          restaurant_id: string | null
          subtotal_cents: number
          tax_cents: number | null
          tip_cents: number | null
          total_cents: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_fee_cents?: number | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_status?: string | null
          restaurant_id?: string | null
          subtotal_cents: number
          tax_cents?: number | null
          tip_cents?: number | null
          total_cents: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_fee_cents?: number | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_status?: string | null
          restaurant_id?: string | null
          subtotal_cents?: number
          tax_cents?: number | null
          tip_cents?: number | null
          total_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          last4: string | null
          provider: string
          token: string
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          provider: string
          token: string
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          provider?: string
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_employees: {
        Row: {
          created_at: string
          employee_id: string
          full_name: string
          id: string
          is_active: boolean
          pin_code: string
          restaurant_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          full_name: string
          id?: string
          is_active?: boolean
          pin_code: string
          restaurant_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          full_name?: string
          id?: string
          is_active?: boolean
          pin_code?: string
          restaurant_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_hours: {
        Row: {
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_hours_restaurant_id_fkey"
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
          city: string | null
          created_at: string | null
          cuisine_type: string | null
          delivery_fee_cents: number | null
          delivery_radius_miles: number | null
          description: string | null
          email: string | null
          estimated_delivery_time: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_promoted: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_delivery_time: number | null
          min_delivery_time: number | null
          minimum_order_cents: number | null
          name: string
          owner_id: string | null
          phone: string | null
          rating: number | null
          state: string | null
          total_reviews: number
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          delivery_fee_cents?: number | null
          delivery_radius_miles?: number | null
          description?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_promoted?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_time?: number | null
          min_delivery_time?: number | null
          minimum_order_cents?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          total_reviews?: number
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          delivery_fee_cents?: number | null
          delivery_radius_miles?: number | null
          description?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_promoted?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_time?: number | null
          min_delivery_time?: number | null
          minimum_order_cents?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          total_reviews?: number
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          role: string | null
          settings: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          phone: string | null
          role: string
          Role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          phone?: string | null
          role: string
          Role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          phone?: string | null
          role?: string
          Role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      make_user_active_driver: {
        Args: { target_user_id: string; vehicle_info?: Json }
        Returns: undefined
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
