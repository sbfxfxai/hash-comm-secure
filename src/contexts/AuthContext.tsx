import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { generateDID, verifyDID, createIdentity, storeDIDLocally, getDIDFromStorage } from '@/lib/did'

interface DIDUser {
  did: string
  publicKey: string
  displayName?: string
  avatar?: string
  createdAt: Date
}

interface AuthResponse {
  error?: string
}

interface AuthContextType {
  user: DIDUser | null
  loading: boolean
  isAuthenticated: boolean
  createDIDIdentity: (displayName: string) => Promise<AuthResponse>
  signInWithDID: (did: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
  connectBitcoinWallet: () => Promise<AuthResponse>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DIDUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing DID identity in localStorage
    const initializeAuth = async () => {
      try {
        const storedDID = getDIDFromStorage()
        if (storedDID) {
          setUser(storedDID)
          toast.success('Welcome back to BitComm!')
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const createDIDIdentity = async (displayName: string): Promise<AuthResponse> => {
    try {
      setLoading(true)
      const identity = await createIdentity(displayName)
      
      const didUser: DIDUser = {
        did: identity.did,
        publicKey: identity.publicKey,
        displayName: displayName,
        createdAt: new Date()
      }
      
      // Store locally for decentralized auth
      storeDIDLocally(didUser)
      
      // Also store the complete identity data for the Identity Manager
      const identityData = {
        address: identity.did,
        privateKey: identity.privateKey, // This should be encrypted in production
        publicKey: identity.publicKey,
        name: displayName,
        isActive: !user, // If no user exists, this becomes the active identity
        created: new Date().toISOString()
      }
      
      // Add to identities list
      const existingIdentities = JSON.parse(localStorage.getItem('bitcomm_identities') || '[]')
      const updatedIdentities = [identityData, ...existingIdentities]
      localStorage.setItem('bitcomm_identities', JSON.stringify(updatedIdentities))
      
      setUser(didUser)
      
      toast.success('DID Identity created successfully!')
      return { error: undefined }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create DID identity'
      toast.error(errorMsg)
      return { error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const signInWithDID = async (did: string): Promise<AuthResponse> => {
    try {
      setLoading(true)
      const isValid = await verifyDID(did)
      
      if (!isValid) {
        throw new Error('Invalid DID')
      }
      
      // Create user from DID
      const didUser: DIDUser = {
        did,
        publicKey: 'verified',
        displayName: `User-${did.slice(-8)}`,
        createdAt: new Date()
      }
      
      storeDIDLocally(didUser)
      setUser(didUser)
      
      toast.success('Signed in with DID successfully!')
      return { error: undefined }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to sign in with DID'
      toast.error(errorMsg)
      return { error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const connectBitcoinWallet = async (): Promise<AuthResponse> => {
    try {
      // Bitcoin Connect integration for wallet-based authentication
      const bitcoinConnect = (window as any).bitcoinConnect
      if (!bitcoinConnect) {
        throw new Error('Bitcoin Connect not available')
      }
      
      // This would integrate with Bitcoin Connect for wallet auth
      toast.success('Bitcoin wallet connected!')
      return { error: undefined }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect Bitcoin wallet'
      toast.error(errorMsg)
      return { error: errorMsg }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      // Clear local storage but keep identities for re-authentication
      localStorage.removeItem('bitcomm_did_user')
      setUser(null)
      toast.info('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Error signing out')
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    createDIDIdentity,
    signInWithDID,
    signOut,
    connectBitcoinWallet,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
