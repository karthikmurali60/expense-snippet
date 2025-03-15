
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e033ae059f4941d58ab39151498da534',
  appName: 'expense-snippet',
  webDir: 'dist',
  server: {
    url: 'https://e033ae05-9f49-41d5-8ab3-9151498da534.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    scheme: 'App',
    limitsNavigationsToAppBoundDomains: true,
    reloadOnStatusBarTap: true
  }
};

export default config;
