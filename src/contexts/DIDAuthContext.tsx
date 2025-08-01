import React, { createContext, useContext, useEffect, useState } from 'react'
import { DecentralizedIdentityManager, DecentralizedIdentity } from '@/lib/p2p/decentralized-identity'
import { toast } from 'sonner'

interface DIDAuthContextType {
  identity: DecentralizedIdentity | null
  identities: DecentralizedIdentity[]
  loading: boolean
  createIdentity: (name: string) => Promise<boolean>
  switchIdentity: (did: string) => void
  signOut: () => Promise<void>
  verifyIdentity: (did: string, signature: string, message: string) => Promise<boolean>
}

const DIDAuthContext = createContext<DIDAuthContextType>({} as DIDAuthContextType)

export const useDIDAuth = () => {
  const context = useContext(DIDAuthContext)
  if (!context) {
    throw new Error('useDIDAuth must be used within a DIDAuthProvider')
  }
  return context
}

export const DIDAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [identity, setIdentity] = useState<DecentralizedIdentity | null>(null)
  const [identities, setIdentities] = useState<DecentralizedIdentity[]>([])
  const [loading, setLoading] = useState(true)
  const identityManager = new DecentralizedIdentityManager()

  useEffect(() => {
    // Load identities from local storage
    identityManager.loadIdentities().then((loadedIdentities) => {
      setIdentities(loadedIdentities)
      if (loadedIdentities.length > 0) {
        // Use the most recently used identity
        const lastUsed = loadedIdentities.reduce((prev, current) => 
          prev.metadata.lastUsed > current.metadata.lastUsed ? prev : current
        )
        setIdentity(lastUsed)
        toast.success(`Welcome back, ${lastUsed.metadata.name}!`)
      }
      setLoading(false)
    })
  }, [])

  const createIdentity = async (name: string): Promise<boolean> => {
    try {
      const newIdentity = await identityManager.createIdentity(name)
      if (newIdentity) {
        const updatedIdentities = [...identities, newIdentity]
        setIdentities(updatedIdentities)
        setIdentity(newIdentity)
        toast.success(`Identity "${name}" created successfully!`)
        return true
      }
      return false
    } catch (error) {
      toast.error('Failed to create identity')
      return false
    }
  }

  const switchIdentity = (did: string) => {
    const selectedIdentity = identities.find(id => id.did === did)
    if (selectedIdentity) {
      setIdentity(selectedIdentity)
      // Update last used timestamp
      selectedIdentity.metadata.lastUsed = new Date()
      toast.success(`Switched to ${selectedIdentity.metadata.name}`)
    }
  }

  const signOut = async () => {
    setIdentity(null)
    toast.info('Signed out successfully')
  }

  const verifyIdentity = async (did: string, signature: string, message: string): Promise<boolean> => {
    return await identityManager.verifyIdentity(did, signature, message)
  }

  const value = {
    identity,
    identities,
    loading,
    createIdentity,
    switchIdentity,
    signOut,
    verifyIdentity,
  }

  return <DIDAuthContext.Provider value={value}>{children}</DIDAuthContext.Provider>
}
