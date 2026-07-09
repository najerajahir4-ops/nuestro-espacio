import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.najera.nuestroespacio',
  appName: 'Nuestro Espacio',
  webDir: 'public',
  server: {
    url: 'https://nuestro-espacio-tau.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
