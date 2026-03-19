import { registerPlugin } from '@capacitor/core';

interface DownloadAndInstallUpdateOptions {
  url: string;
  fileName: string;
}

interface AppUpdaterPlugin {
  downloadAndInstallUpdate(options: DownloadAndInstallUpdateOptions): Promise<void>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

export default AppUpdater;
