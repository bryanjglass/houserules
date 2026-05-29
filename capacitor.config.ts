import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL ?? 'https://milkmoney.up.railway.app';

const config: CapacitorConfig = {
  appId: 'com.milkmoney.app',
  appName: 'MilkMoney',
  webDir: 'client/dist',
  server: {
    url: serverUrl,
    cleartext: false,
  },
};

export default config;
