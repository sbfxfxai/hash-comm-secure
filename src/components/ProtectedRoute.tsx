import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from '@/components/AuthModal'
import { BitCommButton } from '@/components/ui/bitcomm-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, User } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  requireAuth = true 
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-orange"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return fallback || (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Sign in to access premium BitComm features
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This feature requires a BitComm account to ensure secure, verified communication.
          </p>
          <AuthModal>
            <BitCommButton variant="hero" className="w-full">
              <User className="mr-2 h-4 w-4" />
              Sign In to Continue
            </BitCommButton>
          </AuthModal>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
