import { supabase, Database } from './supabase'

export type PremiumIdentity = Database['public']['Tables']['premium_identities']['Row']
export type ComplianceReport = Database['public']['Tables']['compliance_reports']['Row']

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

  // Generate a compliance report
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
