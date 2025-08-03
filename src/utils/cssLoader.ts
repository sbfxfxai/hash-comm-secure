// CSS Loading utility for deferred non-critical styles
// Loads CSS only when needed to reduce initial bundle size

export class CSSLoader {
  private loadedStyles = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  // Load CSS dynamically when needed
  async loadCSS(href: string, id?: string): Promise<void> {
    if (this.loadedStyles.has(href)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      if (id) link.id = id;
      
      link.onload = () => {
        this.loadedStyles.add(href);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load CSS: ${href}`));
      };

      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  // Load CSS for specific components only when they're rendered
  async loadComponentCSS(componentName: string): Promise<void> {
    const componentStyles: Record<string, string[]> = {
      'ContactManager': ['/styles/components/contact-manager.css'],
      'MessageComposer': ['/styles/components/message-composer.css'],
      'AdminDashboard': ['/styles/components/admin-dashboard.css'],
      'P2PNetworkStatus': ['/styles/components/p2p-network.css'],
      'PricingPage': ['/styles/components/pricing.css'],
    };

    const styles = componentStyles[componentName];
    if (styles) {
      await Promise.all(styles.map(style => this.loadCSS(style)));
    }
  }

  // Preload CSS with low priority during idle time
  preloadCSS(href: string): void {
    if (this.loadedStyles.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    
    // Convert to stylesheet when idle
    const loadStylesheet = () => {
      link.rel = 'stylesheet';
      this.loadedStyles.add(href);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadStylesheet);
    } else {
      setTimeout(loadStylesheet, 100);
    }

    document.head.appendChild(link);
  }

  // Load critical component styles
  async loadCriticalComponentStyles(): Promise<void> {
    // Load only the most important component styles
    const criticalComponents = ['Inbox', 'Sidebar', 'Auth'];
    await Promise.all(
      criticalComponents.map(comp => this.loadComponentCSS(comp))
    );
  }

  // Remove unused CSS classes at runtime (for development analysis)
  analyzeUsedClasses(): Set<string> {
    const usedClasses = new Set<string>();
    const elements = document.querySelectorAll('[class]');
    
    elements.forEach(element => {
      const classes = element.className.split(' ');
      classes.forEach(cls => {
        if (cls.trim()) usedClasses.add(cls.trim());
      });
    });

    return usedClasses;
  }
}

// Global CSS loader instance
export const cssLoader = new CSSLoader();

// Utility to defer loading of component styles
export function withDeferredStyles<T extends import('react').ComponentType<any>>(
  Component: T,
  componentName: string
): T {
  const React = require('react');
  return React.memo((props: any) => {
    React.useEffect(() => {
      cssLoader.loadComponentCSS(componentName);
    }, []);

    return React.createElement(Component, props);
  }) as T;
}
