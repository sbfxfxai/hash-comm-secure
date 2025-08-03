import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import { perfMonitor } from './utils/performance'
import { cssLoader } from './utils/cssLoader'

// Make React globally available for UI components
;(window as any).React = React

// Lazy load and expose crypto functions only when needed
const loadCryptoFunctions = async () => {
  const [CryptoJS, { computeProofOfWork, verifyProofOfWork, encryptMessage, decryptMessage }] = await Promise.all([
    import('crypto-js'),
    import('./lib/bitcomm')
  ]);
  
  ;(window as any).CryptoJS = CryptoJS.default
  ;(window as any).computeProofOfWork = computeProofOfWork
  ;(window as any).verifyProofOfWork = verifyProofOfWork
  ;(window as any).encryptMessage = encryptMessage
  ;(window as any).decryptMessage = decryptMessage
};

// Load crypto functions after initial app render with fallback
const scheduleIdleTask = (callback: () => void, timeout = 2000) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 100);
  }
};

// Schedule tasks for after initial render
scheduleIdleTask(() => {
  loadCryptoFunctions().catch(console.error);
});

// Preload critical component styles after initial render
scheduleIdleTask(() => {
  cssLoader.loadCriticalComponentStyles().catch(console.error);
}, 1000);

// Analyze and report unused CSS in development
if (import.meta.env.DEV) {
  scheduleIdleTask(() => {
    const usedClasses = cssLoader.analyzeUsedClasses();
    console.log('CSS Analysis - Used Classes:', usedClasses.size);
    console.log('Used classes:', Array.from(usedClasses).slice(0, 20), '...');
  }, 3000);
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Force unregister any existing service workers and clear caches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('Unregistering service worker:', registration);
        await registration.unregister();
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          console.log('Deleting cache:', cacheName);
          await caches.delete(cacheName);
        }
      }
      
      console.log('All service workers unregistered and caches cleared');
      
      // Force reload if there were active service workers
      if (registrations.length > 0) {
        console.log('Reloading page to ensure clean state...');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error clearing service workers and caches:', error);
    }
  });
}
