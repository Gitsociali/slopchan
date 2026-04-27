import * as React from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const act = (React as { act?: (cb: () => void | Promise<void>) => void | Promise<void> }).act as (cb: () => void | Promise<void>) => void | Promise<void>;

type ReplyModalShape = {
  activeCid: string | null;
  closeModal: ReturnType<typeof vi.fn>;
  parentNumber: number | null;
  scrollY: number;
  showReplyModal: boolean;
  communityAddress: string | null;
  threadCid: string | null;
  threadNumber: number | null;
};

const testState = vi.hoisted(() => ({
  account: { author: { address: '0x123' } } as unknown,
  accountComments: {} as Record<number, { communityAddress?: string }>,
  accountCommunityAddresses: [] as string[],
  closeCreateBoardModalMock: vi.fn(),
  directories: [
    { address: 'music-posting.eth', title: '/mu/ - Music', nsfw: false },
    { address: 'tech-posting.eth', title: '/g/ - Technology', nsfw: false },
  ] as Array<{ address: string; title?: string; nsfw?: boolean }>,
  initSnowMock: vi.fn(),
  isMobile: false,
  isSpecialEnabled: false,
  removeSnowMock: vi.fn(),
  replyModalState: {
    activeCid: null,
    closeModal: vi.fn(),
    parentNumber: null,
    scrollY: 0,
    showReplyModal: false,
    communityAddress: null,
    threadCid: null,
    threadNumber: null,
  } as ReplyModalShape,
  resolvedCommunityAddress: undefined as string | undefined,
  communities: {} as Record<string, unknown>,
  useThemeMock: vi.fn(),
}));

vi.mock('@bitsocial/bitsocial-react-hooks', () => ({
  useAccount: () => testState.account,
  useAccountComment: ({ commentIndex }: { commentIndex?: number }) => (typeof commentIndex === 'number' ? testState.accountComments[commentIndex] : undefined),
  useCommunity: (options?: { communityAddress?: string; community?: { name?: string; publicKey?: string } }) => {
    const communityAddress = options?.communityAddress ?? options?.community?.name ?? options?.community?.publicKey;
    return communityAddress ? testState.communities[communityAddress] : undefined;
  },
  useAccountCommunities: () => ({
    accountCommunities: Object.fromEntries(testState.accountCommunityAddresses.map((address) => [address, { address }])),
  }),
}));

vi.mock('../hooks/use-account-community-addresses', () => ({
  useAccountCommunityAddresses: () => testState.accountCommunityAddresses,
}));

vi.mock('../hooks/use-directories', () => ({
  useDirectories: () => testState.directories,
  findDirectoryByAddress: (directories: Array<{ address: string; title?: string; directoryCode?: string }>, address: string) =>
    directories.find((entry) => entry.address === address || entry.directoryCode === address || entry.title === address),
}));

vi.mock('../hooks/use-is-mobile', () => ({
  default: () => testState.isMobile,
}));

vi.mock('../hooks/use-resolved-community-address', () => ({
  useResolvedCommunityAddress: () => testState.resolvedCommunityAddress,
}));

vi.mock('../hooks/use-theme', () => ({
  default: () => testState.useThemeMock(),
}));

vi.mock('../stores/use-create-board-modal-store', () => ({
  default: () => ({
    closeCreateBoardModal: testState.closeCreateBoardModalMock,
  }),
}));

vi.mock('../stores/use-reply-modal-store', () => ({
  default: () => testState.replyModalState,
}));

vi.mock('../stores/use-special-theme-store', () => ({
  default: () => ({
    isEnabled: testState.isSpecialEnabled,
  }),
}));

vi.mock('../lib/snow', () => ({
  initSnow: (options: unknown) => testState.initSnowMock(options),
  removeSnow: () => testState.removeSnowMock(),
}));

vi.mock('../lib/utils/preload-utils', () => ({
  preloadReplyModal: vi.fn(),
  preloadThemeAssets: vi.fn(),
}));

function makeNamedComponent(name: string) {
  return () => createElement('div', { 'data-testid': name }, name);
}

vi.mock('../components/board-buttons', () => ({
  DesktopBoardButtons: makeNamedComponent('desktop-board-buttons'),
  MobileAllFeedFilter: makeNamedComponent('mobile-all-feed-filter'),
  MobileBoardButtons: makeNamedComponent('mobile-board-buttons'),
}));

vi.mock('../components/board-header', () => ({
  default: makeNamedComponent('board-header'),
}));

vi.mock('../components/feed-cache-container', () => ({
  default: makeNamedComponent('feed-cache-container'),
}));

vi.mock('../components/post-form', () => ({
  default: makeNamedComponent('post-form'),
}));

vi.mock('../components/board-blotter', () => ({
  default: makeNamedComponent('board-blotter'),
}));

vi.mock('../components/boards-bar', () => ({
  default: makeNamedComponent('boards-bar'),
}));

vi.mock('../views/board', () => ({
  default: makeNamedComponent('board-view'),
}));

vi.mock('../views/blotter', () => ({
  default: makeNamedComponent('blotter-view'),
}));

vi.mock('../views/catalog', () => ({
  default: makeNamedComponent('catalog-view'),
}));

vi.mock('../views/faq', () => ({
  default: makeNamedComponent('faq-view'),
}));

vi.mock('../views/home', () => ({
  default: makeNamedComponent('home-view'),
}));

vi.mock('../views/mod-queue', () => ({
  default: makeNamedComponent('mod-queue-view'),
}));

vi.mock('../views/not-allowed', () => ({
  default: makeNamedComponent('not-allowed-view'),
}));

vi.mock('../views/not-found', () => ({
  default: makeNamedComponent('not-found-view'),
}));

vi.mock('../views/pass', () => ({
  default: makeNamedComponent('pass-view'),
}));

vi.mock('../views/pending-post', () => ({
  default: makeNamedComponent('pending-post-view'),
}));

vi.mock('../views/post', () => ({
  default: makeNamedComponent('post-view'),
}));

vi.mock('../views/rules', () => ({
  default: makeNamedComponent('rules-view'),
}));

vi.mock('../views/account-data-editor', () => ({
  default: makeNamedComponent('account-data-editor-view'),
}));

vi.mock('../views/archive/archive', () => ({
  default: makeNamedComponent('archive-view'),
}));

vi.mock('../components/boards-bar-edit-modal', () => ({
  default: makeNamedComponent('boards-bar-edit-modal'),
}));

vi.mock('../components/create-board-modal', () => ({
  default: makeNamedComponent('create-board-modal'),
}));

vi.mock('../components/challenge-modal', () => ({
  default: makeNamedComponent('challenge-modal'),
}));

vi.mock('../components/directory-modal', () => ({
  default: makeNamedComponent('directory-modal'),
}));

vi.mock('../components/disclaimer-modal', () => ({
  default: makeNamedComponent('disclaimer-modal'),
}));

vi.mock('../components/settings-modal', () => ({
  default: makeNamedComponent('settings-modal'),
}));

vi.mock('../components/reply-modal', () => ({
  default: ({ parentCid, postCid }: { parentCid: string; postCid: string }) => createElement('div', { 'data-testid': 'reply-modal' }, `${parentCid}:${postCid}`),
}));

let latestLocation = '';
let container: HTMLDivElement;
let root: Root;
let App: typeof import('../app').default | null = null;

const LocationProbe = () => {
  const location = useLocation();
  React.useLayoutEffect(() => {
    latestLocation = `${location.pathname}${location.search}`;
  }, [location.pathname, location.search]);
  return null;
};

const flushEffects = async (count = 8) => {
  for (let i = 0; i < count; i += 1) {
    await act(async () => {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
};

const renderApp = async (initialEntry: string) => {
  if (!App) {
    App = (await import('../app')).default;
  }

  latestLocation = initialEntry;
  await act(async () => {
    root.render(createElement(MemoryRouter, { initialEntries: [initialEntry] }, createElement(App!), createElement(LocationProbe)));
  });
  await flushEffects();
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestLocation = '';
    testState.account = { author: { address: '0x123' } };
    testState.accountComments = {};
    testState.accountCommunityAddresses = [];
    testState.isMobile = false;
    testState.isSpecialEnabled = false;
    testState.replyModalState = {
      activeCid: null,
      closeModal: vi.fn(),
      parentNumber: null,
      scrollY: 0,
      showReplyModal: false,
      communityAddress: null,
      threadCid: null,
      threadNumber: null,
    } as ReplyModalShape;
    testState.resolvedCommunityAddress = undefined;
    testState.communities = {};
    testState.useThemeMock.mockReset();
    testState.closeCreateBoardModalMock.mockReset();
    testState.initSnowMock.mockReset();
    testState.removeSnowMock.mockReset();

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders board layout chrome, settings modal, and reply modal wiring on settings routes', async () => {
    testState.replyModalState = {
      activeCid: 'parent-cid',
      closeModal: vi.fn(),
      parentNumber: 12,
      scrollY: 32,
      showReplyModal: true,
      communityAddress: 'music-posting.eth',
      threadCid: 'thread-cid',
      threadNumber: 99,
    } as ReplyModalShape;

    await renderApp('/all/settings');

    expect(container.querySelector('[data-testid="boards-bar"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="board-header"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="post-form"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="feed-cache-container"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="desktop-board-buttons"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="board-blotter"]')).toBeNull();
    expect(latestLocation).toBe('/all/settings');
  });

  it('redirects board page 1 feeds to not-found', async () => {
    await renderApp('/mu/1');

    expect(latestLocation).toBe('/not-found');
    expect(container.querySelector('[data-testid="not-found-view"]')).toBeTruthy();
  });

  it('renders the pass route as a global static page', async () => {
    await renderApp('/pass');

    expect(latestLocation).toBe('/pass');
    expect(container.querySelector('[data-testid="pass-view"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="boards-bar"]')).toBeNull();
  });

  it('canonicalizes board address routes to directory codes while preserving query strings', async () => {
    await renderApp('/music-posting.eth/thread/comment-1?focus=1');

    expect(latestLocation).toBe('/mu/thread/comment-1?focus=1');
    expect(container.querySelector('[data-testid="post-view"]')).toBeTruthy();
  });

  it('routes invalid mod aliases and unknown mod paths to not-found', async () => {
    await renderApp('/mu/modqueue');
    expect(latestLocation).toBe('/not-found');
    expect(container.querySelector('[data-testid="not-found-view"]')).toBeTruthy();

    await renderApp('/mod/asdf');
    expect(latestLocation).toBe('/mod/asdf');
    expect(container.querySelector('[data-testid="not-found-view"]')).toBeTruthy();
  });

  it('allows the global mod queue only when the account moderates at least one board', async () => {
    testState.accountCommunityAddresses = ['music-posting.eth'];
    await renderApp('/mod/queue');

    expect(container.querySelector('[data-testid="mod-queue-view"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="feed-cache-container"]')).toBeNull();

    act(() => root.unmount());
    root = createRoot(container);

    testState.accountCommunityAddresses = [];
    await renderApp('/mod/queue');

    expect(latestLocation).toBe('/not-allowed');
    expect(container.querySelector('[data-testid="not-allowed-view"]')).toBeTruthy();
  });

  it('renders board archive routes and hides board form/buttons on that dedicated page', async () => {
    await renderApp('/mu/archive');

    expect(latestLocation).toBe('/mu/archive');
    expect(container.querySelector('[data-testid="post-form"]')).toBeNull();
    expect(container.querySelector('[data-testid="board-blotter"]')).toBeNull();
    expect(container.querySelector('[data-testid="desktop-board-buttons"]')).toBeNull();
    expect(container.querySelector('[data-testid="boards-bar"]')).toBeTruthy();
  });

  it('renders archive settings route as archive view', async () => {
    await renderApp('/mu/archive/settings');

    expect(latestLocation).toBe('/mu/archive/settings');
    expect(container.querySelector('[data-testid="archive-view"]')).toBeTruthy();
  });

  it('does not route /all/archive to a board archive page', async () => {
    await renderApp('/all/archive');

    expect(container.querySelector('[data-testid="archive-view"]')).toBeNull();
    expect(container.querySelector('[data-testid="not-found-view"]')).toBeTruthy();
  });

  it('enforces board-scoped mod queue access by account role', async () => {
    testState.resolvedCommunityAddress = 'music-posting.eth';
    testState.communities = {
      'music-posting.eth': {
        state: 'succeeded',
        roles: {
          '0x123': { role: 'moderator' },
        },
      },
    };

    await renderApp('/mu/mod/queue');
    expect(container.querySelector('[data-testid="mod-queue-view"]')).toBeTruthy();

    act(() => root.unmount());
    root = createRoot(container);

    testState.communities = {
      'music-posting.eth': {
        state: 'succeeded',
        roles: {
          '0x123': { role: 'user' },
        },
      },
    };

    await renderApp('/mu/mod/queue');
    expect(latestLocation).toBe('/not-allowed');
    expect(container.querySelector('[data-testid="not-allowed-view"]')).toBeTruthy();
  });

  it('starts and cleans up snow on desktop special-theme board layouts and closes create-board modal on mount', async () => {
    testState.isSpecialEnabled = true;

    await renderApp('/mu');

    expect(testState.initSnowMock).toHaveBeenCalledWith({ flakeCount: 150 });
    expect(testState.closeCreateBoardModalMock).toHaveBeenCalledTimes(1);

    act(() => root.unmount());
    expect(testState.removeSnowMock).toHaveBeenCalled();

    root = createRoot(container);
  });
});
