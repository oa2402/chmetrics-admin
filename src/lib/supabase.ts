import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          company_name: string
          website_url: string | null
          industry: string | null
          employee_count: number | null
          contact_name: string | null
          contact_email: string | null
          contact_role: string | null
          bgm_score: number
          status: string
          source: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      lead_activities: {
        Row: {
          id: string
          lead_id: string
          activity_type: string | null
          subject: string | null
          content: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['lead_activities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lead_activities']['Insert']>
      }
      website_analyses: {
        Row: {
          id: string
          lead_id: string
          url: string | null
          industry_detected: string | null
          employee_estimate: string | null
          bgm_signals: string[] | null
          raw_analysis: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['website_analyses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['website_analyses']['Insert']>
      }
      linkedin_posts: {
        Row: {
          id: string
          content: string | null
          image_url: string | null
          category: string | null
          status: string
          scheduled_for: string | null
          posted_at: string | null
          likes: number
          comments: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['linkedin_posts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['linkedin_posts']['Insert']>
      }
      daily_reports: {
        Row: {
          id: string
          report_date: string
          new_leads: number
          emails_sent: number
          emails_opened: number
          replies_received: number
          mrr_current: number
          linkedin_posts_today: number
          summary: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['daily_reports']['Insert']>
      }
    }
  }
}
