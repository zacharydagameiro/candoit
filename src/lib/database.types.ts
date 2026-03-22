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
      discovery_messages: {
        Row: {
          id: string
          thread_id: string
          role: Database["public"]["Enums"]["discovery_message_role"]
          content: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          role: Database["public"]["Enums"]["discovery_message_role"]
          content: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          role?: Database["public"]["Enums"]["discovery_message_role"]
          content?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      discovery_threads: {
        Row: {
          id: string
          product_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      requirement_candidates: {
        Row: {
          id: string
          thread_id: string
          product_id: string
          source_message_id: string | null
          title: string
          description: string | null
          category: string | null
          status: Database["public"]["Enums"]["requirement_candidate_status"]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          product_id: string
          source_message_id?: string | null
          title: string
          description?: string | null
          category?: string | null
          status?: Database["public"]["Enums"]["requirement_candidate_status"]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          product_id?: string
          source_message_id?: string | null
          title?: string
          description?: string | null
          category?: string | null
          status?: Database["public"]["Enums"]["requirement_candidate_status"]
          metadata?: Json
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
          contact_url: string | null
          email: string | null
          phone: string | null
          country: string | null
          region: string | null
          products: string[]
          embedding: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by_user_id?: string | null
          name: string
          website?: string | null
          contact_url?: string | null
          email?: string | null
          phone?: string | null
          country?: string | null
          region?: string | null
          products?: string[]
          embedding?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by_user_id?: string | null
          name?: string
          website?: string | null
          contact_url?: string | null
          email?: string | null
          phone?: string | null
          country?: string | null
          region?: string | null
          products?: string[]
          embedding?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_suppliers_by_embedding: {
        Args: {
          query_embedding: string
          match_count?: number
        }
        Returns: {
          supplier_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      discovery_message_role: "user" | "assistant" | "system" | "tool"
      requirement_candidate_status: "proposed" | "accepted" | "discarded"
      requirement_match_status: "candidate" | "shortlisted" | "rejected"
      requirement_status:
        | "ready"
        | "queued"
        | "finding"
        | "found"
        | "archived"
    }
    CompositeTypes: Record<string, never>
  }
}
