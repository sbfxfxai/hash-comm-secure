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
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Code splitting optimizations
    rollupOptions: {
      output: {
        // Advanced chunking strategy
        manualChunks(id) {
          // Vendor chunk for core React ecosystem
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            // Crypto libraries
            if (id.includes('crypto-js') || id.includes('bitcoin') || id.includes('lightning')) {
              return 'crypto';
            }
            // P2P networking
            if (id.includes('libp2p') || id.includes('webrtc') || id.includes('kad-dht')) {
              return 'p2p';
            }
            // UI component libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('recharts')) {
              return 'ui';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('date-fns')) {
              return 'charts';
            }
            // QR and scanning libraries
            if (id.includes('qr') || id.includes('scanner')) {
              return 'qr';
            }
            // All other node_modules
            return 'vendor-misc';
          }
        },
        // Optimize chunk names and sizes
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `${facadeModuleId}-[hash].js`;
        }
      }
    },
    // Aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    // Fix preload warnings
    modulePreload: {
      polyfill: false
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging
    sourcemap: mode === 'development',
    // Reduce bundle size
    reportCompressedSize: false
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
