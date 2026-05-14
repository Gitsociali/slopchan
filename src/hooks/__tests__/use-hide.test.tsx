import * as React from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useHide from '../use-hide';
import useHiddenCatalogThreadsStore from '../../stores/use-hidden-catalog-threads-store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const act = (React as { act?: (cb: () => void | Promise<void>) => void | Promise<void> }).act as (cb: () => void | Promise<void>) => void | Promise<void>;

const testState = vi.hoisted(() => ({
  account: { id: 'account-1', blockedCids: {} as Record<string, boolean> },
  blockCidMock: vi.fn(),
  unblockCidMock: vi.fn(),
}));

vi.mock('@bitsocial/bitsocial-react-hooks', () => ({
  useAccount: () => testState.account,
  useBlock: ({ cid }: { cid?: string }) => ({
    blocked: Boolean(cid && testState.account.blockedCids[cid]),
    error: undefined,
    errors: [],
    state: 'ready',
  }),
}));

vi.mock('@bitsocial/bitsocial-react-hooks/dist/stores/accounts', () => ({
  default: {
    getState: () => ({
      accounts: { [testState.account.id]: testState.account },
      accountsActions: {
        blockCid: testState.blockCidMock,
        unblockCid: testState.unblockCidMock,
      },
      activeAccountId: testState.account.id,
    }),
  },
}));

const HideButton = ({ cid, comment }: { cid: string; comment?: { cid: string; communityAddress?: string; postCid?: string } }) => {
  const { hide, hidden, unhide } = useHide({ cid, comment });
  return (
    <div>
      <button data-hidden={hidden ? 'true' : 'false'} data-testid='hide' type='button' onClick={hide}>
        hide {cid}
      </button>
      <button data-hidden={hidden ? 'true' : 'false'} data-testid='unhide' type='button' onClick={unhide}>
        unhide {cid}
      </button>
    </div>
  );
};

let container: HTMLDivElement;
let root: Root;

describe('useHide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.account = { id: 'account-1', blockedCids: {} };
    testState.blockCidMock.mockImplementation(async (cid: string) => {
      testState.account = {
        ...testState.account,
        blockedCids: { ...testState.account.blockedCids, [cid]: true },
      };
    });
    testState.unblockCidMock.mockImplementation(async (cid: string) => {
      const blockedCids = { ...testState.account.blockedCids };
      delete blockedCids[cid];
      testState.account = { ...testState.account, blockedCids };
    });
    useHiddenCatalogThreadsStore.setState({ hiddenCommentsByCid: {}, scopeHiddenThreadsCounts: {}, shownScopeKey: null });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useHiddenCatalogThreadsStore.setState({ hiddenCommentsByCid: {}, scopeHiddenThreadsCounts: {}, shownScopeKey: null });
  });

  it('hides the current cid after a reused component rerenders for another post', async () => {
    await act(async () => {
      root.render(createElement(HideButton, { cid: 'first-thread' }));
    });
    await act(async () => {
      root.render(createElement(HideButton, { cid: 'second-thread' }));
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="hide"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(testState.blockCidMock).toHaveBeenCalledTimes(1);
    expect(testState.blockCidMock).toHaveBeenCalledWith('second-thread');
    expect(testState.account.blockedCids).toEqual({ 'second-thread': true });
  });

  it('unhides the current cid and skips duplicate account writes', async () => {
    testState.account = { id: 'account-1', blockedCids: { 'hidden-thread': true } };

    await act(async () => {
      root.render(createElement(HideButton, { cid: 'hidden-thread' }));
    });

    expect(container.querySelector<HTMLButtonElement>('[data-testid="unhide"]')?.dataset.hidden).toBe('true');

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="hide"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      container.querySelector<HTMLButtonElement>('[data-testid="unhide"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(testState.blockCidMock).not.toHaveBeenCalled();
    expect(testState.unblockCidMock).toHaveBeenCalledWith('hidden-thread');
    expect(testState.account.blockedCids).toEqual({});
    expect(useHiddenCatalogThreadsStore.getState().hiddenCommentsByCid['hidden-thread']).toBeUndefined();
  });

  it('remembers the hidden comment so catalog counters can resolve it immediately', async () => {
    const comment = { cid: 'remembered-thread', communityAddress: 'music-posting.eth', postCid: 'remembered-thread' };

    await act(async () => {
      root.render(createElement(HideButton, { cid: 'remembered-thread', comment }));
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="hide"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useHiddenCatalogThreadsStore.getState().hiddenCommentsByCid['remembered-thread']).toEqual(comment);
  });
});
