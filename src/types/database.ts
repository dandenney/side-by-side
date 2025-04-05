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