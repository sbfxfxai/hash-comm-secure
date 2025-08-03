import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { perfMonitor } from './utils/performance'
import { cssLoader } from './utils/cssLoader'

// TypeScript declarations for global window extensions
interface PoWResult {
    nonce: number;
    hash: string;
}

// If you have @types/crypto-js installed, you can use this instead:
// import type * as CryptoJS from 'crypto-js';
// Then replace CryptoJSStatic with typeof CryptoJS

// Custom CryptoJS interface to avoid 'any' type
interface CryptoJSStatic {
    AES: {
        encrypt: (message: string, key: string) => { toString: () => string };
        decrypt: (ciphertext: string, key: string) => { toString: (encoding: { toString: () => string }) => string };
    };
    enc: {
        Utf8: { toString: () => string };
    };
    SHA256: (message: string) => { toString: () => string };
    lib: {
        WordArray: {
            random: (bytes: number) => { toString: () => string };
        };
    };
}

declare global {
    interface Window {
        React: typeof React;
        BitComm: {
            CryptoJS?: CryptoJSStatic;
            computeProofOfWork?: (data: string, difficulty: number) => Promise<PoWResult>;
            verifyProofOfWork?: (message: string, pow: PoWResult) => boolean;
            encryptMessage?: (message: string, publicKey: string) => string;
            decryptMessage?: (encryptedMessage: string, privateKey: string) => string;
            loaded: boolean;
            error?: Error;
        };
    }
}

// Make React globally available for UI components
window.React = React

// Create a namespace for BitComm functions to avoid global pollution
window.BitComm = { loaded: false }

// Lazy load and expose crypto functions only when needed
const loadCryptoFunctions = async () => {
    try {
        const [CryptoJS, { computeProofOfWork, verifyProofOfWork, encryptMessage, decryptMessage }] = await Promise.all([
            import('crypto-js'),
            import('./lib/bitcomm')
        ]);

        // Use a namespace instead of polluting global scope
        window.BitComm = {
            CryptoJS: CryptoJS.default,
            computeProofOfWork,
            verifyProofOfWork,
            encryptMessage,
            decryptMessage,
            loaded: true
        }

        console.log('✅ BitComm crypto functions loaded');
    } catch (error) {
        console.error('❌ Failed to load crypto functions:', error);
        window.BitComm = { loaded: false, error };
    }
};

// Enhanced idle task scheduler with better browser support
const scheduleIdleTask = (callback: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout });
    } else {
        // Better fallback that doesn't block the main thread
        setTimeout(callback, Math.min(100, timeout / 20));
    }
};

// Performance monitoring setup - safely handle undefined methods
if (import.meta.env.DEV) {
    try {
        // Check if perfMonitor exists and has the method you need
        if (perfMonitor) {
            // Replace 'start' with the actual method name from your perfMonitor
            // Common alternatives: init, begin, monitor, track
            if ('init' in perfMonitor && typeof perfMonitor.init === 'function') {
                perfMonitor.init();
            } else if ('begin' in perfMonitor && typeof perfMonitor.begin === 'function') {
                perfMonitor.begin();
            } else if ('monitor' in perfMonitor && typeof perfMonitor.monitor === 'function') {
                perfMonitor.monitor();
            } else {
                console.log('Performance monitor available but no known start method found');
            }
        }
    } catch (error) {
        console.warn('Performance monitor failed to start:', error);
    }
}

// Schedule post-render optimizations
scheduleIdleTask(() => {
    loadCryptoFunctions();
}, 1000);

// Preload critical component styles
scheduleIdleTask(() => {
    cssLoader.loadCriticalComponentStyles().catch(console.error);
}, 1500);

// Development-only CSS analysis
if (import.meta.env.DEV) {
    scheduleIdleTask(() => {
        try {
            const usedClasses = cssLoader.analyzeUsedClasses();
            console.log('📊 CSS Analysis:', {
                totalUsedClasses: usedClasses.size,
                sampleClasses: Array.from(usedClasses).slice(0, 10)
            });
        } catch (error) {
            console.warn('CSS analysis failed:', error);
        }
    }, 3000);
}

// Render the app (AuthProvider is now only in App.tsx)
createRoot(document.getElementById("root")!).render(<App />);

// Service worker and cache management (less aggressive, more targeted)
if ('serviceWorker' in navigator) {
    const cleanupOldCaches = async () => {
        try {
            console.log('🧹 Starting cache cleanup...');

            // Only clean up in development or if explicitly requested
            const forceCleanup = import.meta.env.DEV ||
                new URLSearchParams(window.location.search).has('clean');

            if (!forceCleanup) {
                return;
            }

            // Get current cache version from build info if available
            const currentVersion = import.meta.env.VITE_APP_VERSION || 'unknown';

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                const oldCaches = cacheNames.filter(name =>
                    !name.includes(currentVersion) || name.includes('workbox-precache')
                );

                console.log(`🗑️ Removing ${oldCaches.length} old caches`);

                for (const cacheName of oldCaches) {
                    await caches.delete(cacheName);
                    console.log(`Deleted cache: ${cacheName}`);
                }
            }

            // Only unregister service workers in development
            if (import.meta.env.DEV) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    console.log('🗑️ Unregistering SW:', registration.scope);
                    await registration.unregister();
                }
            }

            console.log('✅ Cache cleanup completed');

        } catch (error) {
            console.error('❌ Cache cleanup error:', error);
        }
    };

    // Run cleanup after app is fully loaded
    scheduleIdleTask(cleanupOldCaches, 5000);
}

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // In development, log more details
    if (import.meta.env.DEV) {
        console.error('Promise:', event.promise);
        console.error('Stack:', event.reason?.stack);
    }

    // Prevent the default console error
    event.preventDefault();
});

// Performance observation (if supported)
if ('PerformanceObserver' in window && import.meta.env.DEV) {
    try {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const slowEntries = entries.filter(entry => entry.duration > 100);

            if (slowEntries.length > 0) {
                console.warn('⚠️ Slow operations detected:', slowEntries);
            }
        });

        observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
        console.warn('Performance observer setup failed:', error);
    }
}