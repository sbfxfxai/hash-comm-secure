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
    // Use default chunking with basic optimizations
    rollupOptions: {
      output: {
        // Only split the largest dependencies to reduce main bundle size
        manualChunks: {
          // Split React into its own chunk for better caching
          'react-vendor': ['react', 'react-dom'],
          // Split large UI libraries
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
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
    devSourcemap: mode === 'development',
    // CSS minification handled by build process
    // Tailwind purging handles unused CSS removal automatically
  }
}));
