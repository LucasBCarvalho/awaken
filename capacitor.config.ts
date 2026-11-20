import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.awaken.app',
  appName: 'AWAKEN',
  webDir: 'dist/awake/browser',
  backgroundColor: '#05070D',
  android: {
    backgroundColor: '#05070D',
  },
  ios: {
    backgroundColor: '#05070D',
    contentInset: 'never',
  },
};

export default config;
