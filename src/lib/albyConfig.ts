// Alby Configuration Service for BitComm
// Comprehensive configuration for Lightning Network integration with Alby

export interface AlbyConfig {
  // App Configuration
  appName: string
  appDescription: string
  appUrl: string
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
  
  // Connection settings
  bitcoinConnectEnabled: boolean
  
  // Rate limiting
  rateLimitEnabled: boolean
  rateLimitRequestsPerMinute: number
  
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

export interface AlbyFeatures {
  // Core Lightning features
  payments: boolean
  invoices: boolean
  addresses: boolean
  
  // Advanced features
  nwc: boolean
  webhooks: boolean
  keysend: boolean
  
  // Integration features
  btcpayServer: boolean
  lnurl: boolean
  webln: boolean
}

class AlbyConfigService {
  private config: AlbyConfig
<<<<<<< HEAD
  private features: AlbyFeatures

  constructor() {
    this.config = this.loadConfig()
    this.features = this.detectFeatures()
  }

  // Load configuration from environment variables
  private loadConfig(): AlbyConfig {
    return {
      // Developer settings
      developerAddress: import.meta.env.VITE_DEVELOPER_BITCOIN_ADDRESS || 'excitementresourceful193152@getalby.com',
      developerShare: parseFloat(import.meta.env.VITE_DEVELOPER_SHARE_PERCENTAGE || '0.1'),
      
      // App metadata
      appName: import.meta.env.VITE_APP_NAME || 'BitComm - Decentralized Communication',
      appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'Secure P2P messaging with Lightning Network payments',
      appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
      
      // Network settings
      network: (import.meta.env.VITE_BITCOIN_NETWORK as 'mainnet' | 'testnet') || 'mainnet',
      
      // Feature pricing (in satoshis)
      pricing: {
        messageSend: parseInt(import.meta.env.VITE_PRICING_MESSAGE_SEND || '10'),
        identityCreate: parseInt(import.meta.env.VITE_PRICING_IDENTITY_CREATE || '100'),
        identityVerify: parseInt(import.meta.env.VITE_PRICING_IDENTITY_VERIFY || '1000'),
        premiumMonth: parseInt(import.meta.env.VITE_PRICING_PREMIUM_MONTH || '10000'),
        businessMonth: parseInt(import.meta.env.VITE_PRICING_BUSINESS_MONTH || '30000'),
        enterpriseMonth: parseInt(import.meta.env.VITE_PRICING_ENTERPRISE_MONTH || '100000'),
      },
      
      // Connection settings
      bitcoinConnectEnabled: import.meta.env.VITE_BITCOIN_CONNECT_ENABLED !== 'false',
      nwcEnabled: import.meta.env.VITE_NWC_ENABLED !== 'false',
      
      // Rate limiting
      rateLimitEnabled: import.meta.env.VITE_RATE_LIMIT_ENABLED !== 'false',
      rateLimitRequestsPerMinute: parseInt(import.meta.env.VITE_RATE_LIMIT_REQUESTS_PER_MINUTE || '30'),
    }
  }

  // Detect available Alby features
  private detectFeatures(): AlbyFeatures {
    return {
      // Core Lightning features
      payments: true, // Always supported with Lightning Tools
      invoices: true, // Always supported with Lightning Tools
      addresses: true, // Lightning Address support
      
      // Advanced features
      nwc: this.config.nwcEnabled && typeof window !== 'undefined',
      webhooks: false, // Not implemented yet
      keysend: false, // Not implemented yet
      
      // Integration features
      btcpayServer: !!import.meta.env.VITE_BTCPAY_SERVER_URL,
      lnurl: true, // Supported via Lightning Tools
      webln: typeof window !== 'undefined' && 'webln' in window,
    }
  }

  // Get current configuration
  getConfig(): AlbyConfig {
    return { ...this.config }
  }

  // Get available features
  getFeatures(): AlbyFeatures {
    return { ...this.features }
  }

  // Get developer address
  getDeveloperAddress(): string {
    return this.config.developerAddress
  }

  // Get developer share percentage
  getDeveloperShare(): number {
    return this.config.developerShare
  }

  // Get pricing for specific feature
  getFeaturePricing(feature: keyof AlbyConfig['pricing']): number {
    return this.config.pricing[feature]
  }

  // Calculate developer fee
  calculateDeveloperFee(amount: number): number {
    return Math.floor(amount * this.config.developerShare)
  }

  // Get app metadata for wallet connections
  getAppMetadata() {
    return {
      name: this.config.appName,
      description: this.config.appDescription,
      url: this.config.appUrl,
      icon: `${this.config.appUrl}/favicon.ico`
    }
  }

  // Check if feature is available
  isFeatureAvailable(feature: keyof AlbyFeatures): boolean {
    return this.features[feature]
  }

  // Check if Lightning payments are properly configured
  isLightningConfigured(): boolean {
    return !!(
      this.config.developerAddress &&
      this.config.developerAddress.includes('@') &&
      (this.config.bitcoinConnectEnabled || this.config.nwcEnabled)
    )
  }

  // Validate Lightning address format
  isValidLightningAddress(address: string): boolean {
    const lightningAddressRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return lightningAddressRegex.test(address)
  }

  // Get Bitcoin Connect initialization options
  getBitcoinConnectOptions() {
    return {
      appName: this.config.appName,
      showBalance: true,
      filters: this.config.nwcEnabled ? ['nwc'] : undefined,
      theme: 'dark' as const,
    }
  }

  // Get rate limiting configuration
  getRateLimitConfig() {
    return {
      enabled: this.config.rateLimitEnabled,
      requestsPerMinute: this.config.rateLimitRequestsPerMinute,
    }
  }

  // Debug configuration
  debugConfig(): void {
    if (import.meta.env.DEV) {
      console.group('🔧 Alby Configuration')
      console.log('Developer Address:', this.config.developerAddress)
      console.log('Network:', this.config.network)
      console.log('Developer Share:', `${this.config.developerShare * 100}%`)
      console.log('Pricing:', this.config.pricing)
      console.log('Features:', this.features)
      console.log('Bitcoin Connect Enabled:', this.config.bitcoinConnectEnabled)
      console.log('NWC Enabled:', this.config.nwcEnabled)
      console.log('Lightning Configured:', this.isLightningConfigured())
      console.groupEnd()
    }
  }

  // Validate configuration
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check developer address
    if (!this.config.developerAddress) {
      errors.push('Developer address is required')
    } else if (!this.isValidLightningAddress(this.config.developerAddress)) {
      errors.push('Developer address must be a valid Lightning address')
    }

    // Check developer share
    if (this.config.developerShare < 0 || this.config.developerShare > 1) {
      errors.push('Developer share must be between 0 and 1')
    }

    // Check pricing
    Object.entries(this.config.pricing).forEach(([key, value]) => {
      if (value < 0) {
        errors.push(`${key} pricing must be positive`)
      }
    })

    // Check connection settings
    if (!this.config.bitcoinConnectEnabled && !this.config.nwcEnabled) {
      errors.push('At least one connection method must be enabled')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Update configuration (for testing)
  updateConfig(updates: Partial<AlbyConfig>): void {
    this.config = { ...this.config, ...updates }
    this.features = this.detectFeatures()
  }
=======

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
>>>>>>> 33acb15922b0c772fbc1c91ff7b81f4b4acac735
}

// Export singleton instance
export const albyConfig = new AlbyConfigService()
<<<<<<< HEAD

// Export types and service
export default albyConfig
export type { AlbyConfig, AlbyFeatures }
=======
export default albyConfig
>>>>>>> 33acb15922b0c772fbc1c91ff7b81f4b4acac735
