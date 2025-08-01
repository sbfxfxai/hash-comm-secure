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

  const getHealthStatus = (metric: any): 'healthy' | 'warning' | 'critical' => {
    if (metric.status) return metric.status
    if (metric.value && typeof metric.value === 'number' && metric.value > 100) return 'healthy'
    return 'healthy'
  }

  const getHealthColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="identities">
        <TabsList>
          <TabsTrigger value="identities">Premium Identities</TabsTrigger>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
          <TabsTrigger value="auditLogs">Audit Logs</TabsTrigger>
          <TabsTrigger value="metrics">Dashboard Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="identities">
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
                      <TableCell>{identity.metadata?.address || 'N/A'}</TableCell>
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
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate and view compliance reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => AdminService.generateComplianceReport(
                  'audit',
                  { start: '2023-01-01', end: '2023-12-31' },
                  'admin'
                )}
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
                        <Badge variant={report.status === 'completed' ? "default" : "secondary"}>
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
        </TabsContent>

        <TabsContent value="auditLogs">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>View and filter audit logs to track user activity and changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Button onClick={handleFilterAuditLogs}>Filter</Button>
                <Button onClick={handleSearchIdentities}>Search</Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4" /> Select Date Range</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex items-center space-x-3">
                      <Calendar 
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        className="rounded-md border"
                      />
                      <Calendar 
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        className="rounded-md border"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.user_id}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Metrics</CardTitle>
              <CardDescription>Real-time metrics and health indicators of the application.</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(metrics).map(([key, metric]) => {
                    const status = getHealthStatus(metric)
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        {getHealthIcon(status)}
                        <div className="flex-1">
                          <strong>{metric.name}:</strong>
                          <span className={`ml-2 ${getHealthColor(status)}`}>{metric.value}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div>Loading metrics...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}