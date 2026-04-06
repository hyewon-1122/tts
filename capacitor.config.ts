import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tts.briefing',
  appName: '머니터링 Pick',
  webDir: 'public',
  server: {
    url: 'https://tts-gamma-beryl.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#000000',
      style: 'LIGHT',
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: true,
      spinnerColor: '#BEFF00',
    },
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
    captureInput: true,
  },
};

export default config;
