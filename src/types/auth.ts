import { AuthError } from '@supabase/supabase-js'

// Auth form validation schemas and types
export interface AuthResponse {
  error: AuthError | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  fullName?: string
}

// User metadata types
export interface UserMetadata {
  full_name?: string
  avatar_url?: string
  [key: string]: unknown
}

// OAuth provider types
export type OAuthProvider = 'google' | 'github' | 'discord'

export interface OAuthOptions {
  redirectTo?: string
  scopes?: string
}
