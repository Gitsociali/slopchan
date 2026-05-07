import { describe, expect, it } from 'vitest';
import {
  getBrowserGatewayAccountOptions,
  getBrowserPureP2PAccountOptions,
  getP2PRuntimeMode,
  isBrowserPureP2PEnabled,
  shouldShowP2PSettingsSection,
} from '../p2p-runtime';

const browserWindow = {
  electronApi: undefined,
  isElectron: false,
  localStorage: {
    getItem: () => null,
    setItem: () => undefined,
  },
} as unknown as Window;

const electronWindow = {
  electronApi: { isElectron: true },
  isElectron: true,
} as unknown as Window;

describe('p2p-runtime', () => {
  it('detects browser libp2p accounts from options and live clients', () => {
    expect(getP2PRuntimeMode({ pkcOptions: { libp2pJsClientsOptions: [{ key: 'libp2pjs' }] } }, browserWindow)).toBe('browser-libp2p');
    expect(getP2PRuntimeMode({ pkc: { clients: { libp2pJsClients: { libp2pjs: {} } } } }, browserWindow)).toBe('browser-libp2p');
  });

  it('detects electron Kubo RPC accounts only in electron runtime', () => {
    const account = { pkcOptions: { pkcRpcClientsOptions: ['ws://localhost:9138'] } };

    expect(getP2PRuntimeMode(account, electronWindow)).toBe('electron-kubo-rpc');
    expect(getP2PRuntimeMode(account, browserWindow)).toBeNull();
  });

  it('shows p2p settings in browsers only when pure p2p is enabled or active', () => {
    expect(shouldShowP2PSettingsSection(undefined, browserWindow)).toBe(false);
    expect(shouldShowP2PSettingsSection({ pkcOptions: { ipfsGatewayUrls: ['https://gateway.example'] } }, browserWindow)).toBe(false);
    expect(isBrowserPureP2PEnabled({ pkcOptions: { ipfsGatewayUrls: ['https://gateway.example'] } }, browserWindow)).toBe(false);
  });

  it('builds browser p2p and gateway account options without a direct pkc-js import', () => {
    const account = {
      pkcOptions: {
        httpRoutersOptions: ['https://custom-router.example'],
        ipfsGatewayUrls: ['https://gateway.example'],
        pkcRpcClientsOptions: ['ws://remote.example'],
      },
    };

    expect(getBrowserPureP2PAccountOptions(account)).toMatchObject({
      libp2pJsClientsOptions: [{ key: 'libp2pjs' }],
      ipfsGatewayUrls: undefined,
      pkcRpcClientsOptions: undefined,
    });
    expect(getBrowserGatewayAccountOptions(account)).toMatchObject({
      ipfsGatewayUrls: ['https://ipfsgateway.xyz', 'https://gateway.plebpubsub.xyz', 'https://gateway.forumindex.com'],
      libp2pJsClientsOptions: undefined,
      pkcRpcClientsOptions: undefined,
    });
  });
});
