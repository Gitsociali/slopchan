import { describe, expect, it, vi } from 'vitest';
import { startPkcRpcServer } from './start-pkc-rpc-core.js';

describe('startPkcRpcServer', () => {
  it('passes the Electron data path through pkcOptions', async () => {
    const pkcOptions = {
      dataPath: '/tmp/5chan-pkc',
      kuboRpcClientsOptions: [{ url: 'http://localhost:50019/api/v0' }],
    };
    const server = {
      on: vi.fn(),
      ws: { on: vi.fn() },
    };
    const PKCRpcModule = {
      PKCWsServer: vi.fn(async () => server),
    };

    await startPkcRpcServer({
      PKCRpcModule,
      port: 9138,
      pkcOptions,
      authKey: 'test-auth-key',
      logger: { log: vi.fn() },
    });

    expect(PKCRpcModule.PKCWsServer).toHaveBeenCalledWith({
      port: 9138,
      pkcOptions,
      authKey: 'test-auth-key',
    });
    expect(PKCRpcModule.PKCWsServer.mock.calls[0][0]).not.toHaveProperty('pkc');
  });
});
