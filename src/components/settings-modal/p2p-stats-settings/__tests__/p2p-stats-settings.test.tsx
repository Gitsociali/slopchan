import * as React from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const act = (React as { act?: (cb: () => void | Promise<void>) => void | Promise<void> }).act as (cb: () => void | Promise<void>) => void | Promise<void>;

const testState = vi.hoisted(() => ({
  account: {} as Record<string, any>,
  rpcSettings: { state: 'disconnected' } as Record<string, any>,
  setAccountMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@bitsocial/bitsocial-react-hooks', () => ({
  setAccount: (account: unknown) => testState.setAccountMock(account),
  useAccount: () => testState.account,
  usePkcRpcSettings: () => testState.rpcSettings,
}));

let container: HTMLDivElement;
let root: Root;

const loadComponent = async (isElectron = false) => {
  vi.resetModules();
  window.electronApi = isElectron ? ({ isElectron: true } as Window['electronApi']) : undefined;
  window.isElectron = isElectron;
  return (await import('../p2p-stats-settings')).default;
};

const renderSettings = async (isElectron = false) => {
  const P2PStatsSettings = await loadComponent(isElectron);
  await act(async () => {
    root.render(createElement(P2PStatsSettings));
    await Promise.resolve();
  });
};

describe('P2PStatsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.electronApi = undefined;
    window.isElectron = false;
    testState.account = {
      id: 'account-1',
      author: { address: 'author', wallets: {} },
      pkcOptions: {
        ipfsGatewayUrls: ['https://gateway.example'],
      },
    };
    testState.rpcSettings = { state: 'disconnected' };
    testState.setAccountMock.mockReset().mockResolvedValue(undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders browser libp2p stats from the active PKC client', async () => {
    testState.account = {
      ...testState.account,
      pkcOptions: {
        httpRoutersOptions: ['https://router.example'],
        libp2pJsClientsOptions: [{ key: 'libp2pjs' }],
      },
      pkc: {
        clients: {
          libp2pJsClients: {
            libp2pjs: {
              key: 'libp2pjs',
              heliaWithKuboRpcClientFunctions: {
                add: async () => {
                  throw new Error("Helia 'add' is not supported at the moment in pkc-js API");
                },
              },
              _helia: {
                libp2p: {
                  getConnections: () => ['connection-1'],
                  getMultiaddrs: () => ['/ip4/127.0.0.1/tcp/4001'],
                  getPeers: () => ['peer-1', 'peer-2'],
                  metrics: {
                    toJSON: () => ({
                      helia_bitswap_data_received_bytes: { global: 2048, peer1: 2048 },
                      helia_bitswap_sent_data_bytes_total: 1024,
                    }),
                  },
                  peerId: { toString: () => 'self-peer' },
                  services: {
                    pubsub: {
                      getPeers: () => ['peer-1'],
                    },
                  },
                },
                routing: {
                  routers: [
                    {
                      async provide() {
                        // noop
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    await renderSettings(false);
    await act(async () => Promise.resolve());

    expect(container.textContent).toContain('leeching');
    expect(container.textContent).not.toContain('browser Helia');
    expect(container.textContent).not.toContain('seed mode');
    expect(container.textContent).not.toContain('status');
    expect(container.textContent).toContain('self-peer');
    expect(container.textContent).toContain('2 peers');
    expect(container.textContent).toContain('downloaded data');
    expect(container.textContent).toContain('2.00 KB');
    expect(container.textContent).toContain('uploaded data');
    expect(container.textContent).toContain('1.00 KB');
    expect(container.textContent).not.toContain('pubsub topics');
    expect(container.textContent).not.toContain('topic subscribers');
  });

  it('reads browser transfer counters from Helia bitswap ledgers', async () => {
    testState.account = {
      ...testState.account,
      pkcOptions: {
        libp2pJsClientsOptions: [{ key: 'libp2pjs' }],
      },
      pkc: {
        clients: {
          libp2pJsClients: {
            libp2pjs: {
              key: 'libp2pjs',
              _helia: {
                blockstore: {
                  child: {
                    blockBrokers: [
                      {
                        bitswap: {
                          peerWantLists: {
                            ledgerMap: new Map([['peer-1', { bytesReceived: 4096, bytesSent: 2048 }]]),
                          },
                        },
                      },
                    ],
                  },
                },
                libp2p: {
                  getConnections: () => [],
                  getMultiaddrs: () => [],
                  getPeers: () => [],
                  peerId: { toString: () => 'self-peer' },
                },
              },
            },
          },
        },
      },
    };

    await renderSettings(false);
    await act(async () => Promise.resolve());

    expect(container.textContent).toContain('downloaded data');
    expect(container.textContent).toContain('4.00 KB');
    expect(container.textContent).toContain('uploaded data');
    expect(container.textContent).toContain('2.00 KB');
  });

  it('reports seeding only when browser Helia can add and publish provider records', async () => {
    testState.account = {
      ...testState.account,
      pkcOptions: {
        libp2pJsClientsOptions: [{ key: 'libp2pjs' }],
      },
      pkc: {
        clients: {
          libp2pJsClients: {
            libp2pjs: {
              key: 'libp2pjs',
              heliaWithKuboRpcClientFunctions: {
                add: async () => ({ cid: 'cid' }),
              },
              _helia: {
                libp2p: {
                  getConnections: () => [],
                  getMultiaddrs: () => [],
                  getPeers: () => [],
                  peerId: { toString: () => 'self-peer' },
                },
                routing: {
                  routers: [
                    {
                      provide: async (cid: unknown) => cid,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    await renderSettings(false);
    await act(async () => Promise.resolve());

    expect(container.textContent).toContain('seeding');
    expect(container.textContent).not.toContain('seed mode');
  });
});
