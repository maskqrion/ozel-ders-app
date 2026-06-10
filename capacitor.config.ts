import type { CapacitorConfig } from '@capacitor/cli';

// ORTAM BAZLI URL
// - Android emülatör  → 10.0.2.2  (host makinenin localhost'u)
// - Fiziksel cihaz    → yerel ağdaki bilgisayarın IP'si, örn. 192.168.1.x
// - Üretim (Vercel)   → https://your-app.vercel.app
const serverUrl = process.env.CAPACITOR_SERVER_URL ?? 'http://10.0.2.2:3000';
const isProd    = serverUrl.startsWith('https://');

const config: CapacitorConfig = {
  appId:   'com.ozelders.app',
  appName: 'Özel Ders Pro',
  webDir:  'out',        // Sunucu erişilemezken gösterilen yükleme ekranı
  server: {
    url:           serverUrl,
    androidScheme: isProd ? 'https' : 'http',
    cleartext:     !isProd,  // HTTP'ye izin ver (sadece geliştirme)
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
