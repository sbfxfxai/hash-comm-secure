import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminDashboard } from '../AdminDashboard'
import { AdminService } from '@/lib/adminService'

// Mock the AdminService
vi.mock('@/lib/adminService', () => ({
  AdminService: {
    getAllIdentities: vi.fn(),
    getComplianceReports: vi.fn(),
    getAuditLogs: vi.fn(),
    getDashboardMetrics: vi.fn(),
    searchIdentities: vi.fn(),
    generateComplianceReport: vi.fn(),
  }
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2023-12-01')
}))

const mockIdentities = [
  {
    id: '1',
    name: 'Test Identity',
    is_verified: true,
    verification_method: 'bitcoin',
    metadata: { address: 'test-address' },
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  }
]

const mockReports = [
  {
    id: '1',
    report_type: 'audit',
    status: 'complete',
    generated_at: '2023-12-01T00:00:00Z',
    generated_by: 'admin',
    date_range_start: '2023-01-01',
    date_range_end: '2023-12-31',
    data: {}
  }
]

const mockAuditLogs = [
  {
    id: '1',
    action: 'user_login',
    user: 'test-user',
    timestamp: '2023-12-01T00:00:00Z',
    user_id: 'user-1',
    resource_type: 'auth',
    resource_id: 'session-1',
    changes: {},
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
    severity: 'low'
  }
]

const mockMetrics = {
  totalUsers: {
    name: 'Total Users',
    value: 100,
    health: 'healthy' as const
  },
  activeUsers: {
    name: 'Active Users',
    value: 75,
    health: 'healthy' as const
  },
  systemHealth: {
    name: 'System Health',
    value: 'HEALTHY',
    health: 'healthy' as const
  }
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AdminService.getAllIdentities).mockResolvedValue(mockIdentities)
    vi.mocked(AdminService.getComplianceReports).mockResolvedValue(mockReports)
    vi.mocked(AdminService.getAuditLogs).mockResolvedValue(mockAuditLogs)
    vi.mocked(AdminService.getDashboardMetrics).mockResolvedValue(mockMetrics)
  })

  it('should render all tabs', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Premium Identities')).toBeInTheDocument()
      expect(screen.getByText('Compliance Reports')).toBeInTheDocument()
      expect(screen.getByText('Audit Logs')).toBeInTheDocument()
      expect(screen.getByText('Dashboard Metrics')).toBeInTheDocument()
    })
  })

  it('should fetch and display premium identities', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Identity')).toBeInTheDocument()
      expect(screen.getByText('test-address')).toBeInTheDocument()
      expect(screen.getByText('bitcoin')).toBeInTheDocument()
    })
    
    expect(AdminService.getAllIdentities).toHaveBeenCalled()
  })

  it('should fetch and display compliance reports', async () => {
    render(<AdminDashboard />)
    
    // Click on compliance reports tab
    fireEvent.click(screen.getByText('Compliance Reports'))
    
    await waitFor(() => {
      expect(screen.getByText('audit')).toBeInTheDocument()
      expect(screen.getByText('complete')).toBeInTheDocument()
    })
    
    expect(AdminService.getComplianceReports).toHaveBeenCalled()
  })

  it('should fetch and display audit logs', async () => {
    render(<AdminDashboard />)
    
    // Click on audit logs tab
    fireEvent.click(screen.getByText('Audit Logs'))
    
    await waitFor(() => {
      expect(screen.getByText('user_login')).toBeInTheDocument()
      expect(screen.getByText('test-user')).toBeInTheDocument()
    })
    
    expect(AdminService.getAuditLogs).toHaveBeenCalled()
  })

  it('should fetch and display dashboard metrics', async () => {
    render(<AdminDashboard />)
    
    // Click on metrics tab
    fireEvent.click(screen.getByText('Dashboard Metrics'))
    
    await waitFor(() => {
      expect(screen.getByText('Total Users:')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('Active Users:')).toBeInTheDocument()
      expect(screen.getByText('75')).toBeInTheDocument()
    })
    
    expect(AdminService.getDashboardMetrics).toHaveBeenCalled()
  })

  it('should handle generate compliance report button click', async () => {
    vi.mocked(AdminService.generateComplianceReport).mockResolvedValue(mockReports[0])
    
    render(<AdminDashboard />)
    
    // Click on compliance reports tab
    fireEvent.click(screen.getByText('Compliance Reports'))
    
    // Click generate report button
    const generateButton = screen.getByText('Generate Audit Report')
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(AdminService.generateComplianceReport).toHaveBeenCalledWith({
        report_type: 'audit',
        generated_by: 'admin',
        date_range_start: '2023-01-01',
        date_range_end: '2023-12-31'
      })
    })
  })

  it('should handle search functionality', async () => {
    vi.mocked(AdminService.searchIdentities).mockResolvedValue(mockIdentities)
    
    render(<AdminDashboard />)
    
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    const searchButton = screen.getByText('Search')
    fireEvent.click(searchButton)
    
    await waitFor(() => {
      expect(AdminService.searchIdentities).toHaveBeenCalledWith('test search')
    })
  })

  it('should handle filter functionality for audit logs', async () => {
    render(<AdminDashboard />)
    
    // Click on audit logs tab
    fireEvent.click(screen.getByText('Audit Logs'))
    
    const filterButton = screen.getByText('Filter')
    fireEvent.click(filterButton)
    
    await waitFor(() => {
      expect(AdminService.getAuditLogs).toHaveBeenCalledWith({})
    })
  })

  it('should handle loading state', () => {
    // Mock pending promises
    vi.mocked(AdminService.getAllIdentities).mockReturnValue(new Promise(() => {}))
    vi.mocked(AdminService.getComplianceReports).mockReturnValue(new Promise(() => {}))
    vi.mocked(AdminService.getAuditLogs).mockReturnValue(new Promise(() => {}))
    vi.mocked(AdminService.getDashboardMetrics).mockReturnValue(new Promise(() => {}))
    
    render(<AdminDashboard />)
    
    // The component should handle loading state gracefully
    expect(screen.getByText('Premium Identities')).toBeInTheDocument()
  })

  it('should handle error states gracefully', async () => {
    vi.mocked(AdminService.getAllIdentities).mockRejectedValue(new Error('API Error'))
    vi.mocked(AdminService.getComplianceReports).mockRejectedValue(new Error('API Error'))
    vi.mocked(AdminService.getAuditLogs).mockRejectedValue(new Error('API Error'))
    vi.mocked(AdminService.getDashboardMetrics).mockRejectedValue(new Error('API Error'))
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching admin data:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })
})
