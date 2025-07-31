import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Security headers for development
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: https:; connect-src 'self' ws: wss: https: http://localhost:*;",
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  build: {
    // Code splitting optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large third-party libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Crypto chunk for security-related libraries
          crypto: ['crypto-js', '@supabase/supabase-js'],
          // P2P chunk for networking libraries
          p2p: ['libp2p', '@libp2p/webrtc', '@libp2p/kad-dht'],
          // UI chunk for UI components
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            'lucide-react'
          ]
        }
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    // Source maps for debugging
    sourcemap: mode === 'development'
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // CSS optimization
  css: {
    devSourcemap: mode === 'development'
  }
}));
