// Metadata and data types for database operations
export interface IdentityMetadata {
  algorithm?: string
  keySize?: number
  derivedAt?: string
  verificationData?: {
    method: string
    verifiedAt: string
    documentHash?: string
  }
  [key: string]: unknown
}

export interface ComplianceReportData {
  totalUsers: number
  totalIdentities: number
  verifiedIdentities: number
  messagesCount: number
  activeConnections: number
  securityEvents: SecurityEvent[]
  auditTrail: AuditEvent[]
  [key: string]: unknown
}

export interface SecurityEvent {
  id: string
  type: 'login_attempt' | 'failed_verification' | 'suspicious_activity' | 'data_breach'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  userId?: string
  details: Record<string, unknown>
}

export interface AuditEvent {
  id: string
  action: string
  userId: string
  timestamp: string
  resourceType: string
  resourceId: string
  changes: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface UsageEventData {
  messageCount?: number
  connectionDuration?: number
  dataSize?: number
  deviceInfo?: {
    platform: string
    version: string
    userAgent?: string
  }
  [key: string]: unknown
}

// Device sync data structure
export interface DeviceSyncData {
  identities: Array<{
    id: string
    name: string
    publicKey: string
    metadata: IdentityMetadata
  }>
  preferences: Record<string, unknown>
  lastModified: string
}
