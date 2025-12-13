import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sales.receipt',
  appName: 'Sales Receipt',
  webDir: 'dist',
  server: {
    androidScheme: "http",
    cleartext: true
  }
};

export default config;
