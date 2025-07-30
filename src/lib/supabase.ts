import { createClient } from '@supabase/supabase-js'
import { IdentityMetadata, ComplianceReportData } from '@/types/database'

const supabaseUrl = 'https://pwgpqhmypjtwmvlijbzb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Z3BxaG15cGp0d212bGlqYnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNTUzNDgsImV4cCI6MjA1MzgzMTM0OH0.XWNNxPSQ7RvVFvzGFQbBh0Q2wZLmPZvBvHYzWp9x8Qk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for premium identity features
export interface Database {
  public: {
    Tables: {
      premium_identities: {
        Row: {
          id: string
          user_id: string
          name: string
          public_key: string
          encrypted_private_key: string
          is_verified: boolean
          verification_method: string | null
          created_at: string
          updated_at: string
          metadata: IdentityMetadata
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          public_key: string
          encrypted_private_key: string
          is_verified?: boolean
          verification_method?: string | null
          created_at?: string
          updated_at?: string
          metadata?: IdentityMetadata
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          public_key?: string
          encrypted_private_key?: string
          is_verified?: boolean
          verification_method?: string | null
          created_at?: string
          updated_at?: string
          metadata?: IdentityMetadata
        }
      }
      device_sync: {
        Row: {
          id: string
          identity_id: string
          device_id: string
          device_name: string
          encrypted_data: string
          last_sync: string
          created_at: string
        }
        Insert: {
          id?: string
          identity_id: string
          device_id: string
          device_name: string
          encrypted_data: string
          last_sync?: string
          created_at?: string
        }
        Update: {
          id?: string
          identity_id?: string
          device_id?: string
          device_name?: string
          encrypted_data?: string
          last_sync?: string
          created_at?: string
        }
      }
      compliance_reports: {
        Row: {
          id: string
          report_type: 'audit' | 'activity' | 'security' | 'compliance'
          generated_by: string
          generated_at: string
          date_range_start: string
          date_range_end: string
          data: ComplianceReportData
          status: 'generating' | 'complete' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          report_type: 'audit' | 'activity' | 'security' | 'compliance'
          generated_by: string
          generated_at?: string
          date_range_start: string
          date_range_end: string
          data: ComplianceReportData
          status?: 'generating' | 'complete' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          report_type?: 'audit' | 'activity' | 'security' | 'compliance'
          generated_by?: string
          generated_at?: string
          date_range_start?: string
          date_range_end?: string
          data?: ComplianceReportData
          status?: 'generating' | 'complete' | 'failed'
          created_at?: string
        }
      }
    }
  }
}
