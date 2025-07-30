import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a5b147355401481baa111f751d710a68',
  appName: 'hash-comm-secure',
  webDir: 'dist',
  server: {
    url: 'https://a5b14735-5401-481b-aa11-1f751d710a68.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;