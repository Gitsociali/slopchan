import { Capacitor } from '@capacitor/core';
import AppUpdater from '../plugins/app-updater';
import { currentAppVersion } from './app-version';
import { getDefaultReleaseUrl, getReleaseApiUrl, isAllowedDownloadUrl } from './app-update-config';

const isElectron = window.electronApi?.isElectron === true;

type AppRuntime = 'web' | 'electron' | 'android';

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubLatestReleaseResponse {
  tag_name?: string;
  html_url?: string;
  assets?: GitHubReleaseAsset[];
}

interface WebAppUpdateInfo {
  runtime: 'web';
  targetVersion: string;
  releaseUrl: string;
}

interface NativeAppUpdateInfo {
  runtime: 'electron' | 'android';
  targetVersion: string;
  assetName: string;
  downloadUrl: string;
  releaseUrl: string;
}

type AvailableAppUpdate = WebAppUpdateInfo | NativeAppUpdateInfo;

const getAppRuntime = (): AppRuntime => {
  if (isElectron) {
    return 'electron';
  }

  return Capacitor.getPlatform() === 'android' ? 'android' : 'web';
};

const normalizeVersion = (version: string): string => version.trim().replace(/^v/i, '').split('-')[0];

const compareVersions = (left: string, right: string): number => {
  const leftParts = normalizeVersion(left)
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeVersion(right)
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }

  return 0;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const fetchLatestStableVersion = async (): Promise<string> => {
  const versionUrl = new URL(`/version.json?t=${Date.now()}`, window.location.origin).toString();
  const packageData = await fetchJson<{ version?: string }>(versionUrl);

  if (typeof packageData?.version !== 'string') {
    throw new Error('invalid version payload');
  }

  return packageData.version;
};

const refreshServiceWorkerRegistration = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  await registration?.update();
};

const hasArmArchitecture = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return normalized.includes('arm64') || normalized.includes('aarch64');
};

const hasX64Architecture = (value: string): boolean => !hasArmArchitecture(value);

const getReleaseUrl = (version: string): string => getDefaultReleaseUrl(normalizeVersion(version));

const findMatchingElectronAsset = async (assets: GitHubReleaseAsset[]): Promise<GitHubReleaseAsset | null> => {
  const platformInfo = await window.electronApi?.getPlatform();
  if (!platformInfo) {
    return null;
  }

  const { platform, arch } = platformInfo;
  const prefersArm = hasArmArchitecture(arch);
  const prefersX64 = hasX64Architecture(arch);

  if (platform === 'darwin') {
    return (
      assets.find((asset) => asset.name.endsWith('.zip') && ((prefersArm && hasArmArchitecture(asset.name)) || (prefersX64 && hasX64Architecture(asset.name)))) ||
      assets.find((asset) => asset.name.endsWith('.zip')) ||
      assets.find((asset) => asset.name.endsWith('.dmg') && ((prefersArm && hasArmArchitecture(asset.name)) || (prefersX64 && hasX64Architecture(asset.name)))) ||
      null
    );
  }

  if (platform === 'linux') {
    return (
      assets.find((asset) => asset.name.endsWith('.AppImage') && ((prefersArm && hasArmArchitecture(asset.name)) || (prefersX64 && hasX64Architecture(asset.name)))) ||
      null
    );
  }

  if (platform === 'win32') {
    return (
      assets.find(
        (asset) =>
          asset.name.toLowerCase().endsWith('.exe') &&
          asset.name.toLowerCase().includes('setup') &&
          ((prefersArm && hasArmArchitecture(asset.name)) || (prefersX64 && hasX64Architecture(asset.name))),
      ) || null
    );
  }

  return null;
};

const fetchLatestReleaseUpdate = async (runtime: Extract<AppRuntime, 'electron' | 'android'>): Promise<NativeAppUpdateInfo | null> => {
  const releaseData = await fetchJson<GitHubLatestReleaseResponse>(getReleaseApiUrl());
  const targetVersion = typeof releaseData.tag_name === 'string' ? normalizeVersion(releaseData.tag_name) : '';

  if (!targetVersion || compareVersions(targetVersion, currentAppVersion) <= 0) {
    return null;
  }

  const assets = Array.isArray(releaseData.assets)
    ? releaseData.assets.filter((asset) => typeof asset?.name === 'string' && typeof asset?.browser_download_url === 'string')
    : [];
  const matchedAsset = runtime === 'android' ? assets.find((asset) => asset.name.toLowerCase().endsWith('.apk')) || null : await findMatchingElectronAsset(assets);

  if (!matchedAsset || !isAllowedDownloadUrl(matchedAsset.browser_download_url)) {
    return null;
  }

  return {
    runtime,
    targetVersion,
    assetName: matchedAsset.name,
    downloadUrl: matchedAsset.browser_download_url,
    releaseUrl:
      typeof releaseData.html_url === 'string' && releaseData.html_url.trim().length > 0 ? releaseData.html_url : getReleaseUrl(releaseData.tag_name || targetVersion),
  };
};

const resolveAvailableAppUpdate = async (): Promise<AvailableAppUpdate | null> => {
  const runtime = getAppRuntime();

  if (runtime === 'web') {
    await refreshServiceWorkerRegistration();

    const latestStableVersion = await fetchLatestStableVersion();
    if (compareVersions(latestStableVersion, currentAppVersion) > 0) {
      return {
        runtime: 'web',
        targetVersion: latestStableVersion,
        releaseUrl: getReleaseUrl(latestStableVersion),
      };
    }

    return null;
  }

  return fetchLatestReleaseUpdate(runtime);
};

const applyAvailableAppUpdate = async (update: AvailableAppUpdate): Promise<void> => {
  if (update.runtime === 'web') {
    await refreshServiceWorkerRegistration().catch((error) => {
      console.error('Failed to refresh service worker registration', error);
    });
    window.location.reload();
    return;
  }

  if (update.runtime === 'electron') {
    if (!window.electronApi?.downloadAndInstallUpdate) {
      throw new Error('Electron updater is unavailable');
    }

    await window.electronApi.downloadAndInstallUpdate({
      url: update.downloadUrl,
      fileName: update.assetName,
    });
    return;
  }

  await AppUpdater.downloadAndInstallUpdate({
    url: update.downloadUrl,
    fileName: update.assetName,
  });
};

export type { AppRuntime, AvailableAppUpdate, NativeAppUpdateInfo, WebAppUpdateInfo };
export { applyAvailableAppUpdate, fetchLatestStableVersion, getAppRuntime, isElectron, refreshServiceWorkerRegistration, resolveAvailableAppUpdate };
