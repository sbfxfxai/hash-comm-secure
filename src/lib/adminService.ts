// Decentralized Admin Service - No Supabase dependencies
import { type Database } from '@/integrations/supabase/types'

// Mock types for the decentralized version
export type Tables = Database['public']['Tables']
export type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
}

export type UserRole = {
  id: string;
  user_id: string;
  role: string;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

export type UserPermission = {
  id: string;
  user_id: string;
  permission: string;
  resource_type: string;
  resource_id?: string;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

export type UsageMetrics = {
  id: string;
  user_id: string;
  metric_type: string;
  metric_value: number;
  timestamp: string;
  metadata: any;
}

export type AuditLogFilter = {
  userId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: string;
}

export type DashboardMetrics = {
  totalUsers: { name: string; value: number; change: string; trend: 'up' | 'down' | 'stable' };
  verifiedIdentities: { name: string; value: number; change: string; trend: 'up' | 'down' | 'stable' };
  systemHealth: { name: string; value: string; status: 'healthy' | 'warning' | 'critical' };
  activeUsers: { name: string; value: number; change: string; trend: 'up' | 'down' | 'stable' };
}

// Decentralized Admin Service - uses local storage for demo
export class AdminService {
  // Get premium identities
  static async getPremiumIdentities(): Promise<any[]> {
    // Return demo data for decentralized mode
    return [
      {
        id: '1',
        user_id: 'user1',
        name: 'Demo User 1',
        public_key: 'demo_key_1',
        encrypted_private_key: 'encrypted_demo_key_1',
        is_verified: true,
        verification_method: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { address: 'Demo Address 1' }
      }
    ]
  }

  // Get compliance reports
  static async getComplianceReports(): Promise<any[]> {
    return [
      {
        id: '1',
        report_type: 'security' as const,
        generated_by: 'system',
        generated_at: new Date().toISOString(),
        date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_range_end: new Date().toISOString(),
        data: {},
        status: 'completed' as const,
        created_at: new Date().toISOString()
      }
    ]
  }

  // Generate compliance report
  static async generateComplianceReport(reportType: string, dateRange: { start: string; end: string }): Promise<any> {
    return {
      id: Date.now().toString(),
      report_type: reportType,
      generated_by: 'admin',
      generated_at: new Date().toISOString(),
      date_range_start: dateRange.start,
      date_range_end: dateRange.end,
      data: {},
      status: 'completed',
      created_at: new Date().toISOString()
    }
  }

  // Get audit logs with optional filters
  static async getAuditLogs(filter: AuditLogFilter = {}, page = 1, pageSize = 20): Promise<AuditLog[]> {
    // Return demo data for decentralized mode
    return [
      {
        id: '1',
        user_id: 'user1',
        action: 'login',
        resource_type: 'authentication',
        resource_id: 'auth_1',
        timestamp: new Date().toISOString(),
        ip_address: '127.0.0.1',
        user_agent: 'Demo Browser',
        severity: 'low',
        details: { demo: true }
      }
    ]
  }

  static async getRoles(userId: string): Promise<UserRole[]> {
    return [
      {
        id: '1',
        user_id: userId,
        role: 'admin',
        granted_by: 'system',
        granted_at: new Date().toISOString()
      }
    ]
  }

  static async getPermissions(userId: string): Promise<UserPermission[]> {
    return [
      {
        id: '1',
        user_id: userId,
        permission: 'read',
        resource_type: 'admin',
        granted_by: 'system',
        granted_at: new Date().toISOString()
      }
    ]
  }

  static async getUsageMetrics(userId?: string): Promise<UsageMetrics[]> {
    return [
      {
        id: '1',
        user_id: userId || 'demo',
        metric_type: 'message_sent',
        metric_value: 42,
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ]
  }

  // Get dashboard metrics
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    return {
      totalUsers: {
        name: 'Total Users',
        value: 150,
        change: '+12%',
        trend: 'up'
      },
      verifiedIdentities: {
        name: 'Verified Identities',
        value: 89,
        change: '+8%',
        trend: 'up'
      },
      systemHealth: {
        name: 'System Health',
        value: 'Healthy',
        status: 'healthy'
      },
      activeUsers: {
        name: 'Active Users',
        value: 105,
        change: '+5%',
        trend: 'up'
      }
    }
  }
}