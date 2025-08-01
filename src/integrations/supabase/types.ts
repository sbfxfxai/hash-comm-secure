export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
          severity: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          severity?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
          severity?: string | null
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          data: Json | null
          date_range_end: string | null
          date_range_start: string | null
          generated_at: string | null
          generated_by: string
          id: string
          report_type: string
          status: string | null
        }
        Insert: {
          data?: Json | null
          date_range_end?: string | null
          date_range_start?: string | null
          generated_at?: string | null
          generated_by: string
          id?: string
          report_type: string
          status?: string | null
        }
        Update: {
          data?: Json | null
          date_range_end?: string | null
          date_range_start?: string | null
          generated_at?: string | null
          generated_by?: string
          id?: string
          report_type?: string
          status?: string | null
        }
        Relationships: []
      }
      premium_identities: {
        Row: {
          created_at: string | null
          encrypted_private_key: string
          id: string
          is_verified: boolean | null
          metadata: Json | null
          name: string
          public_key: string
          updated_at: string | null
          user_id: string | null
          verification_method: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_private_key: string
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          name: string
          public_key: string
          updated_at?: string | null
          user_id?: string | null
          verification_method?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_private_key?: string
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string
          public_key?: string
          updated_at?: string | null
          user_id?: string | null
          verification_method?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          assigned_by: string | null
          assigned_at: string
          expires_at: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          assigned_by?: string | null
          assigned_at?: string
          expires_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          assigned_by?: string | null
          assigned_at?: string
          expires_at?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          permission: string
          resource_type: string | null
          resource_id: string | null
          granted_by: string | null
          granted_at: string
          expires_at: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          permission: string
          resource_type?: string | null
          resource_id?: string | null
          granted_by?: string | null
          granted_at?: string
          expires_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          permission?: string
          resource_type?: string | null
          resource_id?: string | null
          granted_by?: string | null
          granted_at?: string
          expires_at?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          id: string
          user_id: string | null
          metric_type: string
          metric_value: number
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          metric_type: string
          metric_value: number
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          metric_type?: string
          metric_value?: number
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: []
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
    CompositeTypes: {
      identity_metadata: {
        address: string | null
        domain: string | null
        verification_docs: Json | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
