import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.proalta',
  appName: 'ProAlta',
  webDir: 'dist',
  server: {
    url: 'https://70fedbee-cdfe-4f94-93bf-5237a640cc08.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
