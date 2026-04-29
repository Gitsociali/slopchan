import { describe, expect, it } from 'vitest';

import { configureP2PBrowserPkcOptions, isP2PBrowserHostname, P2P_BROWSER_PKC_OPTIONS } from '../p2p-browser-config';

describe('p2p-browser-config', () => {
  it('detects p2p subdomains', () => {
    expect(isP2PBrowserHostname('p2p.5chan.app')).toBe(true);
    expect(isP2PBrowserHostname('P2P.5chan.app')).toBe(true);
    expect(isP2PBrowserHostname('5chan.app')).toBe(false);
    expect(isP2PBrowserHostname('www.p2p.5chan.app')).toBe(false);
  });

  it('configures browser PKC options for p2p hostnames', () => {
    const targetWindow = {
      location: { hostname: 'p2p.5chan.app' },
      defaultPkcOptions: {
        ipfsGatewayUrls: ['https://gateway.example'],
      },
    };

    expect(configureP2PBrowserPkcOptions(targetWindow)).toBe(true);
    expect(targetWindow.defaultPkcOptions).toEqual({
      ipfsGatewayUrls: ['https://gateway.example'],
      ...P2P_BROWSER_PKC_OPTIONS,
    });
  });

  it('leaves normal hostnames untouched', () => {
    const defaultPkcOptions = {
      ipfsGatewayUrls: ['https://gateway.example'],
    };
    const targetWindow = {
      location: { hostname: '5chan.app' },
      defaultPkcOptions,
    };

    expect(configureP2PBrowserPkcOptions(targetWindow)).toBe(false);
    expect(targetWindow.defaultPkcOptions).toBe(defaultPkcOptions);
  });
});
