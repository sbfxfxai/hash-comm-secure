// Performance monitoring utility for BitComm
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  mark(name: string): void {
    if ('performance' in window && performance.mark) {
      performance.mark(`${name}-start`);
    }
    this.metrics.set(`${name}-start`, Date.now());
  }

  // Mark the end and calculate duration
  measure(name: string): number {
    const endTime = Date.now();
    const startTime = this.metrics.get(`${name}-start`);
    
    if (startTime) {
      const duration = endTime - startTime;
      this.metrics.set(name, duration);
      
      if ('performance' in window && performance.mark && performance.measure) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
      
      return duration;
    }
    
    return 0;
  }

  // Get all performance metrics
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.metrics) {
      if (!key.endsWith('-start')) {
        result[key] = value;
      }
    }
    return result;
  }

  // Log performance metrics to console (development only)
  logMetrics(): void {
    if (import.meta.env.DEV) {
      console.group('🚀 BitComm Performance Metrics');
      const metrics = this.getMetrics();
      Object.entries(metrics).forEach(([name, duration]) => {
        console.log(`${name}: ${duration}ms`);
      });
      console.groupEnd();
    }
  }

  // Measure Core Web Vitals
  measureWebVitals(): void {
    if ('performance' in window) {
      // First Contentful Paint
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const fcp = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
        this.metrics.set('First-Contentful-Paint', fcp);
      }

      // Time to Interactive (approximation)
      window.addEventListener('load', () => {
        setTimeout(() => {
          const tti = performance.now();
          this.metrics.set('Time-to-Interactive', tti);
        }, 0);
      });
    }
  }

  // Measure JavaScript bundle loading time
  measureBundleLoad(bundleName: string): Promise<void> {
    return new Promise((resolve) => {
      this.mark(`bundle-${bundleName}`);
      
      // Simulate bundle load completion
      requestAnimationFrame(() => {
        this.measure(`bundle-${bundleName}`);
        resolve();
      });
    });
  }
}

// Initialize performance monitoring
export const perfMonitor = PerformanceMonitor.getInstance();

// Auto-start measuring initial page load
perfMonitor.mark('initial-load');
perfMonitor.measureWebVitals();

// Measure when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  perfMonitor.measure('initial-load');
  perfMonitor.mark('dom-ready');
});

// Measure when all resources are loaded
window.addEventListener('load', () => {
  perfMonitor.measure('dom-ready');
  perfMonitor.mark('resources-loaded');
  
  // Log metrics after everything is loaded
  setTimeout(() => {
    perfMonitor.measure('resources-loaded');
    perfMonitor.logMetrics();
  }, 100);
});

// Export utility functions for component-level measurements
export const measureComponentLoad = (componentName: string) => {
  perfMonitor.mark(`component-${componentName}`);
  return () => perfMonitor.measure(`component-${componentName}`);
};

export const measureAsyncOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  perfMonitor.mark(operationName);
  try {
    const result = await operation();
    perfMonitor.measure(operationName);
    return result;
  } catch (error) {
    perfMonitor.measure(operationName);
    throw error;
  }
};
