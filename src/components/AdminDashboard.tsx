import { useState, useEffect } from 'react'
import { AdminService, PremiumIdentity, ComplianceReport } from '@/lib/adminService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function AdminDashboard() {
  const [identities, setIdentities] = useState<PremiumIdentity[]>([])
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [identitiesData, reportsData] = await Promise.all([
        AdminService.getAllIdentities(),
        AdminService.getComplianceReports()
      ])
      setIdentities(identitiesData)
      setReports(reportsData)
      setLoading(false)
    }
    fetchData()
  }, [])

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
