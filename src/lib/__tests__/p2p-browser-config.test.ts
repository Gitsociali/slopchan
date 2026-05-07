import { describe, expect, it } from 'vitest';

import {
  configureP2PBrowserPkcOptions,
  getPureP2PBrowserPreference,
  isP2PBrowserHostname,
  P2P_BROWSER_PKC_OPTIONS,
  PURE_P2P_BROWSER_SETTING_KEY,
  setPureP2PBrowserPreference,
  shouldUsePureP2PBrowser,
} from '../p2p-browser-config';

const createStorage = (values: Record<string, string | undefined> = {}) => ({
  getItem: (key: string) => values[key] ?? null,
  setItem: (key: string, value: string) => {
    values[key] = value;
  },
});

describe('p2p-browser-config', () => {
  it('detects p2p subdomains', () => {
    expect(isP2PBrowserHostname('p2p.5chan.app')).toBe(true);
    expect(isP2PBrowserHostname('P2P.5chan.app')).toBe(true);
    expect(isP2PBrowserHostname('5chan.app')).toBe(false);
    expect(isP2PBrowserHostname('www.p2p.5chan.app')).toBe(false);
  });

  it('leaves browser PKC options untouched by default', () => {
    const targetWindow = {
      location: { hostname: '5chan.app' },
      localStorage: createStorage(),
      defaultPkcOptions: {
        ipfsGatewayUrls: ['https://gateway.example'],
      },
    };

    expect(configureP2PBrowserPkcOptions(targetWindow)).toBe(false);
    expect(targetWindow.defaultPkcOptions).toEqual({
      ipfsGatewayUrls: ['https://gateway.example'],
    });
  });

  it('configures browser PKC options when pure p2p is enabled', () => {
    const targetWindow = {
      location: { hostname: '5chan.app' },
      localStorage: createStorage({ [PURE_P2P_BROWSER_SETTING_KEY]: 'true' }),
      defaultPkcOptions: {
        ipfsGatewayUrls: ['https://gateway.example'],
      },
    };

    expect(configureP2PBrowserPkcOptions(targetWindow)).toBe(true);
    expect(targetWindow.defaultPkcOptions).toEqual(P2P_BROWSER_PKC_OPTIONS);
  });

  it('leaves browser PKC options untouched when pure p2p is disabled', () => {
    const defaultPkcOptions = {
      ipfsGatewayUrls: ['https://gateway.example'],
    };
    const targetWindow = {
      location: { hostname: '5chan.app' },
      localStorage: createStorage({ [PURE_P2P_BROWSER_SETTING_KEY]: 'false' }),
      defaultPkcOptions,
    };

    expect(configureP2PBrowserPkcOptions(targetWindow)).toBe(false);
    expect(targetWindow.defaultPkcOptions).toBe(defaultPkcOptions);
  });

  it('leaves electron defaults untouched', () => {
    const defaultPkcOptions = {
      pkcRpcClientsOptions: ['ws://localhost:9138'],
    };
    const targetWindow = {
      electronApi: { isElectron: true },
      location: { hostname: 'localhost' },
      localStorage: createStorage(),
      defaultPkcOptions,
    };

    expect(configureP2PBrowserPkcOptions(targetWindow)).toBe(false);
    expect(targetWindow.defaultPkcOptions).toBe(defaultPkcOptions);
  });

  it('persists and reads the browser pure p2p preference', () => {
    const targetWindow = {
      location: { hostname: '5chan.app' },
      localStorage: createStorage(),
    };

    expect(getPureP2PBrowserPreference(targetWindow)).toBeUndefined();
    expect(shouldUsePureP2PBrowser(targetWindow)).toBe(false);

    setPureP2PBrowserPreference(false, targetWindow);
    expect(getPureP2PBrowserPreference(targetWindow)).toBe(false);
    expect(shouldUsePureP2PBrowser(targetWindow)).toBe(false);

    setPureP2PBrowserPreference(true, targetWindow);
    expect(getPureP2PBrowserPreference(targetWindow)).toBe(true);
    expect(shouldUsePureP2PBrowser(targetWindow)).toBe(true);
  });
});
