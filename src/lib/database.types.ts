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
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          category?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          id: string
          product_id: string
          title: string
          description: string | null
          category: string | null
          status: Database["public"]["Enums"]["requirement_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          description?: string | null
          category?: string | null
          status?: Database["public"]["Enums"]["requirement_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          description?: string | null
          category?: string | null
          status?: Database["public"]["Enums"]["requirement_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      requirement_suppliers: {
        Row: {
          id: string
          requirement_id: string
          supplier_id: string
          fit_score: number | null
          notes: string | null
          match_status: Database["public"]["Enums"]["requirement_match_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requirement_id: string
          supplier_id: string
          fit_score?: number | null
          notes?: string | null
          match_status?: Database["public"]["Enums"]["requirement_match_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requirement_id?: string
          supplier_id?: string
          fit_score?: number | null
          notes?: string | null
          match_status?: Database["public"]["Enums"]["requirement_match_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          created_by_user_id: string | null
          name: string
          website: string | null
          email: string | null
          phone: string | null
          country: string | null
          region: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by_user_id?: string | null
          name: string
          website?: string | null
          email?: string | null
          phone?: string | null
          country?: string | null
          region?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by_user_id?: string | null
          name?: string
          website?: string | null
          email?: string | null
          phone?: string | null
          country?: string | null
          region?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      requirement_match_status: "candidate" | "shortlisted" | "rejected"
      requirement_status:
        | "draft"
        | "researching"
        | "partially_matched"
        | "matched"
        | "blocked"
    }
    CompositeTypes: Record<string, never>
  }
}
