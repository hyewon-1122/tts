import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tts.briefing',
  appName: '시황브리핑',
  webDir: 'public',
  server: {
    // 같은 WiFi에서 PC의 Next.js 서버로 연결
    url: 'http://192.168.0.192:3000',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#030712',
      style: 'LIGHT',
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#030712',
      showSpinner: true,
      spinnerColor: '#10b981',
    },
  },
  android: {
    backgroundColor: '#030712',
    allowMixedContent: true,
    captureInput: true,
  },
};

export default config;
