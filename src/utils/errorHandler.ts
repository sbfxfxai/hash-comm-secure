/**
 * Comprehensive Error Handling System for BitComm
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  IDENTITY = 'IDENTITY',
  CRYPTO = 'CRYPTO',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  UNKNOWN = 'UNKNOWN'
}

export interface BitCommError {
  type: ErrorType
  message: string
  originalError?: Error
  timestamp: Date
  context?: Record<string, unknown>
}

export class ErrorLogger {
  private static errors: BitCommError[] = []
  private static maxErrors = 100

  static log(error: BitCommError): void {
    // Add timestamp if not provided
    if (!error.timestamp) {
      error.timestamp = new Date()
    }

    // Store error
    this.errors.unshift(error)
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Console logging based on type
    const logMessage = `[${error.type}] ${error.message}`
    
    if (error.type === ErrorType.NETWORK || error.type === ErrorType.AUTH) {
      console.error(logMessage, error.originalError)
    } else if (error.type === ErrorType.STORAGE || error.type === ErrorType.IDENTITY) {
      console.warn(logMessage, error.originalError)
    } else {
      console.log(logMessage, error.originalError)
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error)
    }
  }

  static getRecentErrors(limit = 10): BitCommError[] {
    return this.errors.slice(0, limit)
  }

  static clearErrors(): void {
    this.errors = []
  }

  private static sendToMonitoring(error: BitCommError): void {
    // Placeholder for external monitoring service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error.originalError || new Error(error.message))
  }
}

export class BitCommErrorHandler {
  /**
   * Handle storage-related errors
   */
  static handleStorageError<T>(operation: string, error: Error, fallbackValue?: T): T | undefined {
    const bitcommError: BitCommError = {
      type: ErrorType.STORAGE,
      message: `Storage operation failed: ${operation}`,
      originalError: error,
      timestamp: new Date(),
      context: { operation }
    }

    ErrorLogger.log(bitcommError)

    // Clear corrupted localStorage data if needed
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      try {
        localStorage.removeItem(`bitcomm-${operation}`)
      } catch (clearError) {
        console.warn('Failed to clear corrupted storage:', clearError)
      }
    }

    return fallbackValue
  }

  /**
   * Handle identity-related errors
   */
  static handleIdentityError(operation: string, error: Error, context?: Record<string, unknown>): void {
    const bitcommError: BitCommError = {
      type: ErrorType.IDENTITY,
      message: `Identity operation failed: ${operation}`,
      originalError: error,
      timestamp: new Date(),
      context: { operation, ...context }
    }

    ErrorLogger.log(bitcommError)
  }

  /**
   * Handle cryptographic errors
   */
  static handleCryptoError(operation: string, error: Error): void {
    const bitcommError: BitCommError = {
      type: ErrorType.CRYPTO,
      message: `Cryptographic operation failed: ${operation}`,
      originalError: error,
      timestamp: new Date(),
      context: { operation }
    }

    ErrorLogger.log(bitcommError)
  }

  /**
   * Handle network-related errors
   */
  static handleNetworkError(operation: string, error: Error, url?: string): void {
    const bitcommError: BitCommError = {
      type: ErrorType.NETWORK,
      message: `Network operation failed: ${operation}`,
      originalError: error,
      timestamp: new Date(),
      context: { operation, url }
    }

    ErrorLogger.log(bitcommError)
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(operation: string, error: Error): void {
    const bitcommError: BitCommError = {
      type: ErrorType.AUTH,
      message: `Authentication failed: ${operation}`,
      originalError: error,
      timestamp: new Date(),
      context: { operation }
    }

    ErrorLogger.log(bitcommError)
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: BitCommError): string {
    switch (error.type) {
      case ErrorType.STORAGE:
        return 'There was an issue accessing your data. Your information has been reset to ensure the app works properly.'
      
      case ErrorType.IDENTITY:
        return 'There was an issue with your identity. Please try creating a new identity or contact support.'
      
      case ErrorType.CRYPTO:
        return 'There was an issue with encryption. Please try again or refresh the page.'
      
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.'
      
      case ErrorType.AUTH:
        return 'Authentication failed. Please sign in again.'
      
      case ErrorType.VALIDATION:
        return 'The information provided is not valid. Please check and try again.'
      
      default:
        return 'An unexpected error occurred. Please try again or refresh the page.'
    }
  }
}

/**
 * Utility function to safely execute operations with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorType: ErrorType,
  operationName: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    const bitcommError: BitCommError = {
      type: errorType,
      message: `Safe async operation failed: ${operationName}`,
      originalError: error as Error,
      timestamp: new Date(),
      context: { operationName }
    }

    ErrorLogger.log(bitcommError)
    return fallbackValue
  }
}

/**
 * Utility function to safely execute synchronous operations
 */
export function safeSync<T>(
  operation: () => T,
  errorType: ErrorType,
  operationName: string,
  fallbackValue?: T
): T | undefined {
  try {
    return operation()
  } catch (error) {
    const bitcommError: BitCommError = {
      type: errorType,
      message: `Safe sync operation failed: ${operationName}`,
      originalError: error as Error,
      timestamp: new Date(),
      context: { operationName }
    }

    ErrorLogger.log(bitcommError)
    return fallbackValue
  }
}
