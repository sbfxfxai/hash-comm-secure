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

// Define proper types for metrics
interface MetricValue {
    name: string;
    value: string | number;
    status?: 'healthy' | 'warning' | 'critical';
    unit?: string;
    description?: string;
}

type HealthStatus = 'healthy' | 'warning' | 'critical';

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

    const getHealthStatus = (metric: MetricValue): HealthStatus => {
        // Return explicit status if provided
        if (metric.status) {
            return metric.status
        }

        // Auto-determine status based on value
        if (typeof metric.value === 'number') {
            if (metric.value > 100) return 'healthy'
            if (metric.value > 50) return 'warning'
            return 'critical'
        }

        // For string values, assume healthy unless specified otherwise
        return 'healthy'
    }

    const getHealthColor = (status: HealthStatus): string => {
        switch (status) {
            case 'healthy': return 'text-green-600'
            case 'warning': return 'text-yellow-600'
            case 'critical': return 'text-red-600'
            default: return 'text-gray-600'
        }
    }

    const getHealthIcon = (status: HealthStatus): JSX.Element => {
        switch (status) {
            case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
            case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
            default: return <Activity className="h-5 w-5 text-gray-600" />
        }
    }

    const formatMetricValue = (value: string | number, unit?: string): string => {
        if (typeof value === 'number') {
            // Format numbers with appropriate precision
            if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M${unit ? ` ${unit}` : ''}`
            } else if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}K${unit ? ` ${unit}` : ''}`
            } else {
                return `${value}${unit ? ` ${unit}` : ''}`
            }
        }
        return String(value)
    }

    const handleGenerateReport = async () => {
        try {
            await AdminService.generateComplianceReport(
                'audit',
                { start: '2023-01-01', end: '2023-12-31' },
                'admin'
            )
            // Refresh reports after generating
            const updatedReports = await AdminService.getComplianceReports()
            setReports(updatedReports)
        } catch (error) {
            console.error('Error generating report:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading admin dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Monitor and manage your BitComm network
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {identities.length} Identities
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {reports.length} Reports
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="identities" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="identities">Premium Identities</TabsTrigger>
                    <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
                    <TabsTrigger value="auditLogs">Audit Logs</TabsTrigger>
                    <TabsTrigger value="metrics">Dashboard Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="identities" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Premium Identities
                            </CardTitle>
                            <CardDescription>
                                Manage all premium identities in the network.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <div className="flex items-center space-x-2">
                                    <Input
                                        placeholder="Search identities..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-sm"
                                    />
                                    <Button onClick={handleSearchIdentities}>Search</Button>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Verification</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {identities.map((identity) => (
                                        <TableRow key={identity.id}>
                                            <TableCell className="font-medium">{identity.name}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {identity.metadata?.address ?
                                                    `${String(identity.metadata.address).substring(0, 12)}...` :
                                                    'N/A'
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={identity.is_verified ? "default" : "secondary"}>
                                                    {identity.verification_method || 'unverified'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {identity.created_at ?
                                                    new Date(identity.created_at).toLocaleDateString() :
                                                    'N/A'
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Compliance Reports
                            </CardTitle>
                            <CardDescription>
                                Generate and view compliance reports for audit purposes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Button onClick={handleGenerateReport}>
                                    Generate Audit Report
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Report Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Generated At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="capitalize">{report.report_type}</TableCell>
                                            <TableCell>
                                                <Badge variant={report.status === 'completed' ? "default" : "secondary"}>
                                                    {report.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(report.generated_at).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm">
                                                    Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="auditLogs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Audit Logs
                            </CardTitle>
                            <CardDescription>
                                View and filter audit logs to track user activity and changes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 mb-4">
                                <Input
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Button onClick={handleFilterAuditLogs}>Filter</Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            Date Range
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <div className="flex flex-col space-y-2 p-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">From:</label>
                                                <Calendar
                                                    mode="single"
                                                    selected={dateFrom}
                                                    onSelect={setDateFrom}
                                                    className="rounded-md border"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">To:</label>
                                                <Calendar
                                                    mode="single"
                                                    selected={dateTo}
                                                    onSelect={setDateTo}
                                                    className="rounded-md border"
                                                />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {auditLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">{log.action}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {String(log.user_id).substring(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {log.details || 'N/A'}
                                            </TableCell>
                                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Dashboard Metrics
                            </CardTitle>
                            <CardDescription>
                                Real-time metrics and health indicators of the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {metrics ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(metrics).map(([key, metric]) => {
                                        const typedMetric = metric as MetricValue
                                        const status = getHealthStatus(typedMetric)
                                        return (
                                            <Card key={key} className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {getHealthIcon(status)}
                                                        <div>
                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                {typedMetric.name || key}
                                                            </p>
                                                            <p className={`text-2xl font-bold ${getHealthColor(status)}`}>
                                                                {formatMetricValue(typedMetric.value, typedMetric.unit)}
                                                            </p>
                                                            {typedMetric.description && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {typedMetric.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-8">
                                    <Activity className="h-6 w-6 animate-spin mr-2" />
                                    <span>Loading metrics...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default AdminDashboard