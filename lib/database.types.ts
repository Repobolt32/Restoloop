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
      accounts: {
        Row: {
          id: string
          name: string
          email: string | null
          updated_at: string | null
          created_at: string | null
          created_by: string | null
          updated_by: string | null
          picture_url: string | null
          public_data: Json
        }
        Insert: {
          id: string
          name: string
          email?: string | null
          updated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          picture_url?: string | null
          public_data?: Json
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          updated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          picture_url?: string | null
          public_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string
          birthday: string | null
          last_visit: string
          food_pref: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone: string
          birthday?: string | null
          last_visit?: string
          food_pref?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string
          birthday?: string | null
          last_visit?: string
          food_pref?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          type: string
          code: string
          discount: number
          status: string
          bill_amount: number | null
          bill_items: Json | null
          created_at: string
          expires_at: string
          redeemed_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          type: string
          code: string
          discount: number
          status?: string
          bill_amount?: number | null
          bill_items?: Json | null
          created_at?: string
          expires_at: string
          redeemed_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          type?: string
          code?: string
          discount?: number
          status?: string
          bill_amount?: number | null
          bill_items?: Json | null
          created_at?: string
          expires_at?: string
          redeemed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_log: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          coupon_id: string | null
          wa_message_id: string | null
          status: string
          sent_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          coupon_id?: string | null
          wa_message_id?: string | null
          status?: string
          sent_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          coupon_id?: string | null
          wa_message_id?: string | null
          status?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_log_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_credits: {
        Row: {
          id: string
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          credits_balance: number
          coupon_welcome: number
          coupon_bday: number
          coupon_winback: number
          tax_rate: number
          tax_cgst: number
          tax_sgst: number
          address: string | null
          email: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          credits_balance?: number
          coupon_welcome?: number
          coupon_bday?: number
          coupon_winback?: number
          tax_rate?: number
          tax_cgst?: number
          tax_sgst?: number
          address?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          credits_balance?: number
          coupon_welcome?: number
          coupon_bday?: number
          coupon_winback?: number
          tax_rate?: number
          tax_cgst?: number
          tax_sgst?: number
          address?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_owner_id_fkey"
            columns: ["owner_id"]
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
      decrement_platform_credits: {
        Args: { amount: number }
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

type PublicSchema = Database["public"]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
