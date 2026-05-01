import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fivechan.android',
  appName: '5chan',
  webDir: 'build',
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    FileUploader: {
      enabled: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#000000',
      overlay: false,
    },
    EdgeToEdge: {
      backgroundColor: '#000000',
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
