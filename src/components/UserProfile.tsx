import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { User, Mail, Calendar, Shield, Edit2, Save, X } from 'lucide-react'

export const UserProfile: React.FC = () => {
  const { user, session } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return null
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    // Here you would typically call an API to update the user profile
    // For now, we'll just simulate the save
    setTimeout(() => {
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setLoading(false)
    }, 1000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
              <AvatarFallback className="text-lg">
                {user.user_metadata?.full_name?.[0] || user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                ) : (
                  <h3 className="text-xl font-semibold">
                    {user.user_metadata?.full_name || 'Anonymous User'}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your BitComm account details and security information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">User ID</Label>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {user.id}
              </code>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Created</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Authentication Provider</Label>
            <div className="flex items-center gap-2">
              <Badge variant={user.app_metadata?.provider === 'google' ? 'default' : 'secondary'}>
                {user.app_metadata?.provider || 'email'}
              </Badge>
              {user.email_confirmed_at && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {user.last_sign_in_at && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Sign In</Label>
              <span className="text-sm text-muted-foreground">
                {formatDate(user.last_sign_in_at)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Information */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>
              Information about your current BitComm session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Session Started</Label>
                <span className="text-sm text-muted-foreground">
                  {formatDate(session.expires_at ? new Date(session.expires_at * 1000 - 3600000).toISOString() : '')}
                </span>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Session Expires</Label>
                <span className="text-sm text-muted-foreground">
                  {session.expires_at && formatDate(new Date(session.expires_at * 1000).toISOString())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
