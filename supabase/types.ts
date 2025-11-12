/**
 * Supabase Database Types
 * 
 * This file defines the TypeScript types for the Supabase database schema.
 * For a more complete type definition, generate types using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > supabase/types.ts
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
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          name: string | null
          avatar_url: string | null
          updated_at: string | null
          preferences: Json | null
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          preferences?: Json | null
        }
      }
      // Fallback for other tables - allows any table structure
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}
