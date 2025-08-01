import { supabase, Database } from './supabase'

export type PremiumIdentity = Database['public']['Tables']['premium_identities']['Row']
export type ComplianceReport = Database['public']['Tables']['compliance_reports']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type UserPermission = Database['public']['Tables']['user_permissions']['Row']
export type UsageMetric = Database['public']['Tables']['usage_metrics']['Row']

export interface AuditLogFilter {
  userId?: string
  action?: string
  resourceType?: string
  dateFrom?: string
  dateTo?: string
  severity?: string
}

export interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  totalIdentities: number
  verifiedIdentities: number
  totalMessages: number
  securityEvents: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

export class AdminService {
  
  // Fetch all premium identities for admin dashboard
  static async getAllIdentities(page = 1, pageSize = 20): Promise<PremiumIdentity[]> {
    const { data, error } = await supabase
      .from('premium_identities')
      .select('*')
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get total number of identities
  static async getIdentitiesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('premium_identities')
      .select('*', { count: 'exact' })

    if (error) throw error
    return count || 0
  }

  // Search for identities by name, address, or domain
  static async searchIdentities(query: string): Promise<PremiumIdentity[]> {
    const { data, error } = await supabase
      .from('premium_identities')
      .select('*')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,domain.ilike.%${query}%`)
      .limit(50)

    if (error) throw error
    return data || []
}

  // Fetch audit logs with optional filters
  static async getAuditLogs(filter: AuditLogFilter = {}, page = 1, pageSize = 20): Promise<AuditLog[]> {
    let query = supabase.from('audit_logs').select('*')
    if (filter.userId) query = query.eq('user_id', filter.userId)
    if (filter.action) query = query.ilike('action', `%${filter.action}%`)
    if (filter.resourceType) query = query.eq('resource_type', filter.resourceType)
    if (filter.dateFrom) query = query.gte('timestamp', filter.dateFrom)
    if (filter.dateTo) query = query.lte('timestamp', filter.dateTo)
    if (filter.severity) query = query.eq('severity', filter.severity)
    const { data, error } = await query.range((page - 1) * pageSize, page * pageSize - 1).order('timestamp', { ascending: false })
    if (error) throw error
    return data || []
  }

  static async getRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase.from('user_roles').select('*').eq('user_id', userId)
    if (error) throw error
    return data || []
  }

  static async getPermissions(userId: string): Promise<UserPermission[]> {
    const { data, error } = await supabase.from('user_permissions').select('*').eq('user_id', userId)
    if (error) throw error
    return data || []
  }

  static async assignRole(userId: string, role: string, assignedBy: string): Promise<UserRole> {
    const { data, error } = await supabase.from('user_roles').insert({ user_id: userId, role, assigned_by: assignedBy, assigned_at: new Date().toISOString() }).select().single()
    if (error) throw error
    return data
  }

  static async assignPermission(userId: string, permission: string, grantedBy: string): Promise<UserPermission> {
    const { data, error } = await supabase.from('user_permissions').insert({ user_id: userId, permission, granted_by: grantedBy, granted_at: new Date().toISOString() }).select().single()
    if (error) throw error
    return data
  }

  // Get dashboard metrics
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [identitiesCount, verifiedCount, auditLogsCount, usageMetricsCount] = await Promise.all([
        supabase.from('premium_identities').select('*', { count: 'exact' }).then(r => r.count || 0),
        supabase.from('premium_identities').select('*', { count: 'exact' }).eq('is_verified', true).then(r => r.count || 0),
        supabase.from('audit_logs').select('*', { count: 'exact' }).eq('severity', 'high').then(r => r.count || 0),
        supabase.from('usage_metrics').select('*', { count: 'exact' }).eq('metric_type', 'message_sent').then(r => r.count || 0)
      ])

      const systemHealth = auditLogsCount > 50 ? 'critical' : auditLogsCount > 10 ? 'warning' : 'healthy'

      return {
        totalUsers: identitiesCount,
        activeUsers: Math.floor(identitiesCount * 0.7), // Simulate active users
        totalIdentities: identitiesCount,
        verifiedIdentities: verifiedCount,
        totalMessages: usageMetricsCount,
        securityEvents: auditLogsCount,
        systemHealth
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalIdentities: 0,
        verifiedIdentities: 0,
        totalMessages: 0,
        securityEvents: 0,
        systemHealth: 'healthy'
      }
    }
  }

  // Log audit event
  static async logAuditEvent(event: {
    userId?: string
    action: string
    resourceType: string
    resourceId?: string
    changes?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: event.userId,
        action: event.action,
        resource_type: event.resourceType,
        resource_id: event.resourceId,
        changes: event.changes,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        severity: event.severity || 'low',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }

  // Get usage metrics
  static async getUsageMetrics(metricType?: string, dateFrom?: string, dateTo?: string): Promise<UsageMetric[]> {
    let query = supabase.from('usage_metrics').select('*')
    if (metricType) query = query.eq('metric_type', metricType)
    if (dateFrom) query = query.gte('timestamp', dateFrom)
    if (dateTo) query = query.lte('timestamp', dateTo)
    
    const { data, error } = await query.order('timestamp', { ascending: false }).limit(100)
    if (error) throw error
    return data || []
  }
  static async generateComplianceReport(params: {
    report_type: 'audit' | 'activity' | 'security'
    generated_by: string
    date_range_start: string
    date_range_end: string
  }): Promise<ComplianceReport> {
    // In a real implementation, this would trigger a backend process
    // to aggregate data and generate the report.
    // For now, we'll create a report entry and simulate completion.
    const { data, error } = await supabase
      .from('compliance_reports')
      .insert({
        report_type: params.report_type,
        generated_by: params.generated_by,
        date_range_start: params.date_range_start,
        date_range_end: params.date_range_end,
        status: 'generating',
        data: {}
      })
      .select()
      .single()

    if (error) throw error

    // Simulate report generation
    setTimeout(async () => {
      await supabase
        .from('compliance_reports')
        .update({ 
          status: 'complete', 
          data: { message: `Completed ${params.report_type} report` }
        })
        .eq('id', data.id)
    }, 5000)

    return data
  }

  // Get all compliance reports
  static async getComplianceReports(page = 1, pageSize = 20): Promise<ComplianceReport[]> {
    const { data, error } = await supabase
      .from('compliance_reports')
      .select('*')
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('generated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Fetch a specific compliance report
  static async getReportById(reportId: string): Promise<ComplianceReport | null> {
    const { data, error } = await supabase
      .from('compliance_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error) return null
    return data
  }
}
