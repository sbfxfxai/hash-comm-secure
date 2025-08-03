// Alby Configuration Service for BitComm
// Centralized configuration for all Alby Lightning integrations

export interface AlbyConfig {
  // App Configuration
  appName: string
  clientId?: string
  clientSecret?: string
  
  // Developer Settings
  developerAddress: string
  developerShare: number
  
  // Network Settings
  network: 'mainnet' | 'testnet'
  
  // WebLN Configuration
  weblnProvider: string
  weblnAutoEnable: boolean
  
  // NWC Configuration
  nwcEnabled: boolean
  nwcRelayUrl: string
  
  // Feature Pricing (in satoshis)
  pricing: {
    messageSend: number
    identityCreate: number
    identityVerify: number
    premiumMonth: number
    businessMonth: number
    enterpriseMonth: number
  }
}

class AlbyConfigService {
  private config: AlbyConfig

  constructor() {
    this.config = this.loadConfiguration()
  }

  private loadConfiguration(): AlbyConfig {
    return {
      // App Configuration
      appName: import.meta.env.VITE_ALBY_APP_NAME || 'BitComm',
      clientId: import.meta.env.VITE_ALBY_CLIENT_ID,
      clientSecret: import.meta.env.VITE_ALBY_CLIENT_SECRET,
      
      // Developer Settings
      developerAddress: import.meta.env.VITE_DEVELOPER_BITCOIN_ADDRESS || 'excitementresourceful193152@getalby.com',
      developerShare: parseFloat(import.meta.env.VITE_DEVELOPER_SHARE_PERCENTAGE) || 0.1,
      
      // Network Settings
      network: (import.meta.env.VITE_BITCOIN_NETWORK as 'mainnet' | 'testnet') || 'mainnet',
      
      // WebLN Configuration
      weblnProvider: import.meta.env.VITE_WEBLN_PROVIDER || 'alby',
      weblnAutoEnable: import.meta.env.VITE_WEBLN_AUTO_ENABLE === 'true',
      
      // NWC Configuration
      nwcEnabled: import.meta.env.VITE_NWC_ENABLED !== 'false',
      nwcRelayUrl: import.meta.env.VITE_NWC_RELAY_URL || 'wss://relay.getalby.com/v1',
      
      // Feature Pricing
      pricing: {
        messageSend: parseInt(import.meta.env.VITE_PRICING_MESSAGE_SEND) || 1,
        identityCreate: parseInt(import.meta.env.VITE_PRICING_IDENTITY_CREATE) || 100,
        identityVerify: parseInt(import.meta.env.VITE_PRICING_IDENTITY_VERIFY) || 1000,
        premiumMonth: parseInt(import.meta.env.VITE_PRICING_PREMIUM_MONTH) || 10000,
        businessMonth: parseInt(import.meta.env.VITE_PRICING_BUSINESS_MONTH) || 30000,
        enterpriseMonth: parseInt(import.meta.env.VITE_PRICING_ENTERPRISE_MONTH) || 100000,
      }
    }
  }

  // Get complete configuration
  getConfig(): AlbyConfig {
    return this.config
  }

  // Get specific configuration sections
  getAppConfig() {
    return {
      appName: this.config.appName,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret
    }
  }

  getDeveloperConfig() {
    return {
      address: this.config.developerAddress,
      share: this.config.developerShare
    }
  }

  getNetworkConfig() {
    return {
      network: this.config.network,
      isMainnet: this.config.network === 'mainnet'
    }
  }

  getWeblnConfig() {
    return {
      provider: this.config.weblnProvider,
      autoEnable: this.config.weblnAutoEnable
    }
  }

  getNwcConfig() {
    return {
      enabled: this.config.nwcEnabled,
      relayUrl: this.config.nwcRelayUrl
    }
  }

  getPricing() {
    return this.config.pricing
  }

  // Utility methods
  getDeveloperFee(amount: number): number {
    return Math.floor(amount * this.config.developerShare)
  }

  getUserAmount(amount: number): number {
    return amount - this.getDeveloperFee(amount)
  }

  // Validation methods
  isConfigValid(): boolean {
    return !!(
      this.config.appName &&
      this.config.developerAddress &&
      this.config.developerShare >= 0 &&
      this.config.developerShare <= 1
    )
  }

  isLightningAddressValid(address: string): boolean {
    const lightningRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return lightningRegex.test(address)
  }

  // Update configuration at runtime
  updateDeveloperAddress(address: string): void {
    if (this.isLightningAddressValid(address)) {
      this.config.developerAddress = address
      console.log(`✅ Developer address updated: ${address}`)
    } else {
      throw new Error('Invalid Lightning Address format')
    }
  }

  updateDeveloperShare(share: number): void {
    if (share >= 0 && share <= 1) {
      this.config.developerShare = share
      console.log(`✅ Developer share updated: ${share * 100}%`)
    } else {
      throw new Error('Developer share must be between 0 and 1')
    }
  }

  // Environment detection
  isDevelopment(): boolean {
    return import.meta.env.MODE === 'development'
  }

  isProduction(): boolean {
    return import.meta.env.MODE === 'production'
  }

  // Feature flags
  isNwcEnabled(): boolean {
    return this.config.nwcEnabled
  }

  isWeblnAutoEnabled(): boolean {
    return this.config.weblnAutoEnable
  }

  // Debug information
  getDebugInfo() {
    return {
      appName: this.config.appName,
      network: this.config.network,
      developerAddress: this.config.developerAddress,
      developerShare: `${this.config.developerShare * 100}%`,
      nwcEnabled: this.config.nwcEnabled,
      weblnProvider: this.config.weblnProvider,
      environment: import.meta.env.MODE,
      isValid: this.isConfigValid()
    }
  }
}

// Export singleton instance
export const albyConfig = new AlbyConfigService()
export default albyConfig