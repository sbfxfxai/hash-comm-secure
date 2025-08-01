import { useState, useEffect } from 'react'
import { AdminService, PremiumIdentity, ComplianceReport, AuditLog, DashboardMetrics, AuditLogFilter } from '@/lib/adminService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Users, Shield, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export function AdminDashboard() {
  const [identities, setIdentities] = useState<PremiumIdentity[]>([])
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditFilter, setAuditFilter] = useState<AuditLogFilter>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [identitiesData, reportsData, auditLogsData, metricsData] = await Promise.all([
          AdminService.getAllIdentities(),
          AdminService.getComplianceReports(),
          AdminService.getAuditLogs(),
          AdminService.getDashboardMetrics()
        ])
        setIdentities(identitiesData)
        setReports(reportsData)
        setAuditLogs(auditLogsData)
        setMetrics(metricsData)
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearchIdentities = async () => {
    if (searchTerm.trim()) {
      const results = await AdminService.searchIdentities(searchTerm)
      setIdentities(results)
    } else {
      const allIdentities = await AdminService.getAllIdentities()
      setIdentities(allIdentities)
    }
  }

  const handleFilterAuditLogs = async () => {
    const filter: AuditLogFilter = {
      ...auditFilter,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString()
    }
    const filteredLogs = await AdminService.getAuditLogs(filter)
    setAuditLogs(filteredLogs)
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Premium Identities</CardTitle>
          <CardDescription>Manage all premium identities in the network.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Verification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {identities.map(identity => (
                <TableRow key={identity.id}>
                  <TableCell>{identity.name}</TableCell>
                  <TableCell>{(identity.metadata as any)?.address || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={identity.is_verified ? "default" : "secondary"}>
                      {identity.verification_method || 'unverified'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Reports</CardTitle>
          <CardDescription>Generate and view compliance reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => AdminService.generateComplianceReport({ 
              report_type: 'audit', 
              generated_by: 'admin', 
              date_range_start: '2023-01-01', 
              date_range_end: '2023-12-31'
            })}
          >
            Generate Audit Report
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>{report.report_type}</TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'complete' ? "default" : "secondary"}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(report.generated_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
