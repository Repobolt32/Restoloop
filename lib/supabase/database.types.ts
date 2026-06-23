/**
 * Supabase Database Types for Restoloop
 *
 * Generated from the migration files in supabase/migrations/.
 * This file defines the Database type that Supabase client uses for type-safe queries.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          id?: string
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
          }
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
          created_at: string
          food_pref: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone: string
          birthday?: string | null
          last_visit?: string
          created_at?: string
          food_pref?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string
          birthday?: string | null
          last_visit?: string
          created_at?: string
          food_pref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      coupons: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          type: 'welcome' | 'bday' | 'winback'
          code: string
          discount: number
          status: 'pending' | 'sent' | 'redeemed' | 'expired'
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
          type: 'welcome' | 'bday' | 'winback'
          code: string
          discount: number
          status?: 'pending' | 'sent' | 'redeemed' | 'expired'
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
          type?: 'welcome' | 'bday' | 'winback'
          code?: string
          discount?: number
          status?: 'pending' | 'sent' | 'redeemed' | 'expired'
          bill_amount?: number | null
          bill_items?: Json | null
          created_at?: string
          expires_at?: string
          redeemed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      message_log: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          coupon_id: string | null
          wa_message_id: string | null
          status: 'sent' | 'failed' | 'delivered' | 'blocked'
          sent_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          customer_id: string
          coupon_id?: string | null
          wa_message_id?: string | null
          status?: 'sent' | 'failed' | 'delivered' | 'blocked'
          sent_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          coupon_id?: string | null
          wa_message_id?: string | null
          status?: 'sent' | 'failed' | 'delivered' | 'blocked'
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
            foreignKeyName: "message_log_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          }
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_platform_credits: {
        Args: Record<PropertyKey, never>
        Returns: {
          new_balance: number
        }[]
      }
      decrement_platform_credits_batch: {
        Args: { count: number }
        Returns: {
          new_balance: number
        }[]
      }
      decrement_tenant_credits: {
        Args: { p_tenant_id: string; p_count: number }
        Returns: {
          new_balance: number
        }[]
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
