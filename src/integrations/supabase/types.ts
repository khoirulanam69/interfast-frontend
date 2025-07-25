export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
        }
        Relationships: []
      }
      analytics: {
        Row: {
          created_at: string
          id: string
          month: number
          total_discounts: number
          total_revenue: number
          total_users: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          total_discounts?: number
          total_revenue?: number
          total_users?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          total_discounts?: number
          total_revenue?: number
          total_users?: number
          year?: number
        }
        Relationships: []
      }
      packages: {
        Row: {
          bandwidth: string
          created_at: string
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          bandwidth: string
          created_at?: string
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          bandwidth?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          expired_date: string
          id: string
          installation_date: string
          name: string
          nik: string
          package: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string
          price: number
          province: string
          referred_by: string | null
          rt_rw: string
          updated_at: string
          user_status: Database["public"]["Enums"]["user_status"]
          username_dial: string
          village: string
        }
        Insert: {
          address: string
          city: string
          country?: string
          created_at?: string
          expired_date?: string
          id?: string
          installation_date?: string
          name: string
          nik: string
          package?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone: string
          price?: number
          province: string
          referred_by?: string | null
          rt_rw: string
          updated_at?: string
          user_status?: Database["public"]["Enums"]["user_status"]
          username_dial: string
          village: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          expired_date?: string
          id?: string
          installation_date?: string
          name?: string
          nik?: string
          package?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string
          price?: number
          province?: string
          referred_by?: string | null
          rt_rw?: string
          updated_at?: string
          user_status?: Database["public"]["Enums"]["user_status"]
          username_dial?: string
          village?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
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
      calculate_referral_discount: {
        Args: { user_id: string }
        Returns: number
      }
      update_expired_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_monthly_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      package_type:
        | "Interfast Bronze"
        | "Interfast Silver"
        | "Interfast Gold"
        | "Interfast Platinum"
      payment_status: "Paid" | "Unpaid"
      user_status: "Active" | "Inactive" | "Terminate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      package_type: [
        "Interfast Bronze",
        "Interfast Silver",
        "Interfast Gold",
        "Interfast Platinum",
      ],
      payment_status: ["Paid", "Unpaid"],
      user_status: ["Active", "Inactive", "Terminate"],
    },
  },
} as const
