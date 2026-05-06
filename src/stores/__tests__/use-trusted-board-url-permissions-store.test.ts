import { beforeEach, describe, expect, it, vi } from 'vitest';
import useTrustedBoardUrlPermissionsStore from '../use-trusted-board-url-permissions-store';

const STORAGE_KEY = 'trusted-board-url-permissions-store';

describe('useTrustedBoardUrlPermissionsStore', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    useTrustedBoardUrlPermissionsStore.setState({ trustedOrigins: {} });
  });

  it('starts without trusted origins', () => {
    expect(useTrustedBoardUrlPermissionsStore.getState().getTrustedOrigins()).toEqual([]);
    expect(useTrustedBoardUrlPermissionsStore.getState().isOriginTrusted('https://spamblocker.bitsocial.net')).toBe(false);
  });

  it('trusts and persists a board challenge origin', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    useTrustedBoardUrlPermissionsStore.getState().trustOrigin('https://spamblocker.bitsocial.net', 'spamblocker.bitsocial.net', null, 1_000);

    expect(useTrustedBoardUrlPermissionsStore.getState().isOriginTrusted('https://spamblocker.bitsocial.net', 2_000)).toBe(true);
    expect(useTrustedBoardUrlPermissionsStore.getState().getTrustedOrigins(2_000)).toEqual([
      {
        createdAt: 1_000,
        expiresAt: null,
        origin: 'https://spamblocker.bitsocial.net',
        site: 'spamblocker.bitsocial.net',
      },
    ]);
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, expect.stringContaining('spamblocker.bitsocial.net'));

    setItemSpy.mockRestore();
  });

  it('revokes a trusted origin', () => {
    useTrustedBoardUrlPermissionsStore.getState().trustOrigin('https://spamblocker.bitsocial.net', 'spamblocker.bitsocial.net');

    useTrustedBoardUrlPermissionsStore.getState().revokeOrigin('https://spamblocker.bitsocial.net');

    expect(useTrustedBoardUrlPermissionsStore.getState().isOriginTrusted('https://spamblocker.bitsocial.net')).toBe(false);
    expect(useTrustedBoardUrlPermissionsStore.getState().getTrustedOrigins()).toEqual([]);
  });

  it('drops expired permissions when checked', () => {
    useTrustedBoardUrlPermissionsStore.getState().trustOrigin('https://old.example', 'old.example', 10, 1);

    expect(useTrustedBoardUrlPermissionsStore.getState().isOriginTrusted('https://old.example', 11)).toBe(false);
    expect(useTrustedBoardUrlPermissionsStore.getState().trustedOrigins).toEqual({});
  });
});
