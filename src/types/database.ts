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
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      grocery_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      grocery_items: {
        Row: {
          id: string
          name: string
          checked: boolean
          store: 'publix' | 'costco' | 'aldi'
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          checked?: boolean
          store: 'publix' | 'costco' | 'aldi'
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          checked?: boolean
          store?: 'publix' | 'costco' | 'aldi'
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      archived_items: {
        Row: {
          id: string
          list_id: string
          name: string
          store: 'publix' | 'costco' | 'aldi'
          created_at: string
          archived_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          store: 'publix' | 'costco' | 'aldi'
          created_at?: string
          archived_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          name?: string
          store?: 'publix' | 'costco' | 'aldi'
          created_at?: string
          archived_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      links: {
        Row: {
          id: string
          title: string
          url: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      link_categories: {
        Row: {
          link_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          link_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          link_id?: string
          category_id?: string
          created_at?: string
        }
      }
      url_items: {
        Row: {
          id: string
          url: string | null
          place_id: string | null
          place_name: string | null
          place_address: string | null
          place_lat: number | null
          place_lng: number | null
          place_types: string[] | null
          place_rating: number | null
          place_user_ratings_total: number | null
          place_price_level: number | null
          place_website: string | null
          place_phone_number: string | null
          place_opening_hours: Json | null
          image_url: string | null
          title: string
          description: string | null
          notes: string | null
          date_range: Json | null
          list_type: 'local' | 'shared'
          list_id: string
          created_at: string
          updated_at: string
          archived: boolean
        }
        Insert: {
          id?: string
          url?: string | null
          place_id?: string | null
          place_name?: string | null
          place_address?: string | null
          place_lat?: number | null
          place_lng?: number | null
          place_types?: string[] | null
          place_rating?: number | null
          place_user_ratings_total?: number | null
          place_price_level?: number | null
          place_website?: string | null
          place_phone_number?: string | null
          place_opening_hours?: Json | null
          image_url?: string | null
          title: string
          description?: string | null
          notes?: string | null
          date_range?: Json | null
          list_type: 'local' | 'shared'
          list_id: string
          created_at?: string
          updated_at?: string
          archived?: boolean
        }
        Update: {
          id?: string
          url?: string | null
          place_id?: string | null
          place_name?: string | null
          place_address?: string | null
          place_lat?: number | null
          place_lng?: number | null
          place_types?: string[] | null
          place_rating?: number | null
          place_user_ratings_total?: number | null
          place_price_level?: number | null
          place_website?: string | null
          place_phone_number?: string | null
          place_opening_hours?: Json | null
          image_url?: string | null
          title?: string
          description?: string | null
          notes?: string | null
          date_range?: Json | null
          list_type?: 'local' | 'shared'
          list_id?: string
          created_at?: string
          updated_at?: string
          archived?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 