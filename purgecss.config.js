// PurgeCSS configuration for removing unused CSS
// This provides more aggressive unused CSS removal than Tailwind's built-in purging

const purgecss = require('@fullhuman/purgecss')

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
    './public/**/*.html',
  ],
  
  // CSS files to analyze and purge
  css: [
    './dist/assets/*.css'
  ],
  
  // Selectors to always keep (even if not found in content)
  safelist: [
    // Keep critical CSS classes
    'html', 'body', '*',
    // Keep dynamic classes that might be added via JavaScript
    /^animate-/, 
    /^transition-/,
    /^transform/,
    /^duration-/,
    /^ease-/,
    // Keep classes that might be used in components not scanned
    /^bg-/,
    /^text-/,
    /^border-/,
    /^hover:/,
    /^focus:/,
    /^active:/,
    /^dark:/,
    // Keep Bitcoin and theme-specific classes
    /^bitcoin-/,
    /^gradient-/,
    // Keep CSS custom properties
    /^--/,
    // Keep classes that might be in third-party components
    'sr-only',
    'not-sr-only',
    // Keep critical animation classes
    'pulse',
    'fade-in',
    'fade-out',
    'loading'
  ],
  
  // Patterns to extract selectors from content
  extractors: [
    {
      extractor: (content) => {
        // Extract className and class attributes
        const classes = []
        
        // Extract from className="..." and class="..."
        const classMatches = content.match(/class(?:Name)?=["']([^"']*)["']/g) || []
        classMatches.forEach(match => {
          const classNames = match.replace(/class(?:Name)?=["']([^"']*)["']/, '$1').split(/\s+/)
          classes.push(...classNames)
        })
        
        // Extract from Tailwind @apply directives
        const applyMatches = content.match(/@apply\s+([^;]+);/g) || []
        applyMatches.forEach(match => {
          const classNames = match.replace(/@apply\s+([^;]+);/, '$1').split(/\s+/)
          classes.push(...classNames)
        })
        
        // Extract from CSS variable usage
        const cssVarMatches = content.match(/hsl\(var\(--[^)]+\)\)/g) || []
        cssVarMatches.forEach(match => {
          classes.push(match)
        })
        
        return classes.filter(Boolean)
      },
      extensions: ['js', 'jsx', 'ts', 'tsx', 'html', 'css']
    }
  ],
  
  // Options
  fontFace: true,
  keyframes: true,
  variables: true,
  
  // Skip purging for certain selectors
  blocklist: [],
  
  // Only purge in production
  environment: process.env.NODE_ENV === 'production'
}
