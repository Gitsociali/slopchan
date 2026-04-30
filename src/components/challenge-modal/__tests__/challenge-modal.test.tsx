import * as React from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChallengeModal from '../challenge-modal';
import getShortAddress from '../../../lib/get-short-address';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const act = (React as { act?: (cb: () => void | Promise<void>) => void | Promise<void> }).act as (cb: () => void | Promise<void>) => void | Promise<void>;

const testState = vi.hoisted(() => ({
  abandonCurrentChallengeMock: vi.fn().mockResolvedValue(undefined),
  account: {
    author: {
      address: '0xabc123',
    },
  } as Record<string, any>,
  challenges: [] as Array<{ challenge: any; id: number }>,
  commentsByCid: {} as Record<string, { author?: { shortAddress?: string } }>,
  publicationPreview: 'preview body',
  publicationType: 'post',
  removeChallengeMock: vi.fn(),
  springStartMock: vi.fn(),
  theme: 'dark',
  votePreview: 'upvote',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'challenge_counter') {
        return `${options?.index}/${options?.total}`;
      }
      if (key === 'iframe_challenge_confirm') {
        return `${options?.board} wants to open ${options?.site}.\n\nFor ${options?.publicationType}: ${options?.excerpt}`;
      }
      return key;
    },
  }),
}));

vi.mock('@bitsocial/bitsocial-react-hooks', () => ({
  useAccount: () => testState.account,
  useComment: ({ commentCid }: { commentCid?: string }) => (commentCid ? testState.commentsByCid[commentCid] : undefined),
}));

vi.mock('../../../lib/utils/challenge-utils', () => ({
  getPublicationPreview: () => testState.publicationPreview,
  getPublicationType: () => testState.publicationType,
  getVotePreview: () => testState.votePreview,
}));

vi.mock('../../../hooks/use-is-mobile', () => ({
  default: () => false,
}));

vi.mock('../../../hooks/use-theme', () => ({
  default: () => [testState.theme],
}));

vi.mock('../../../stores/use-challenges-store', () => ({
  default: () => ({
    abandonCurrentChallenge: testState.abandonCurrentChallengeMock,
    challenges: testState.challenges,
    removeChallenge: testState.removeChallengeMock,
  }),
}));

vi.mock('@react-spring/web', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const createSpringValue = (value: number) => ({
    get: () => value,
    to: (mapper: (input: number) => unknown) => mapper(value),
  });
  return {
    animated: {
      div: React.forwardRef(({ children, style, ...props }: any, ref) => createElement('div', { ...props, ref, style: { touchAction: style?.touchAction } }, children)),
    },
    useSpring: () => [
      {
        x: createSpringValue(120),
        y: createSpringValue(60),
      },
      { start: testState.springStartMock },
    ],
  };
});

vi.mock('@use-gesture/react', () => ({
  useDrag: () => () => ({}),
}));

let alertSpy: ReturnType<typeof vi.spyOn>;
let confirmSpy: ReturnType<typeof vi.spyOn>;
let container: HTMLDivElement;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
let nextStoredChallengeId = 1;
let postMessageMock: ReturnType<typeof vi.fn>;
let root: Root;

const createPublication = (): Record<string, any> => ({
  author: { displayName: 'Alice' },
  content: 'Publication content',
  link: 'https://example.com/link',
  parentCid: 'parent-1',
  publishChallengeAnswers: vi.fn(),
  shortCommunityAddress: 'mu',
  communityAddress: 'music-posting.eth',
  title: 'Subject',
});

const createStoredChallenge = (challenge: any, publication = createPublication(), publicationTarget?: Record<string, unknown>) => ({
  challenge: [{ challenges: Array.isArray(challenge) ? challenge : [challenge] }, publication, publicationTarget],
  id: nextStoredChallengeId++,
});

const renderModal = async () => {
  await act(async () => {
    root.render(createElement(ChallengeModal));
  });
  await act(async () => {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  });
};

const dispatchInput = async (element: HTMLInputElement, value: string) => {
  await act(async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

const clickButton = async (text: string) => {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent === text);
  await act(async () => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

describe('ChallengeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.abandonCurrentChallengeMock.mockReset().mockResolvedValue(undefined);
    testState.account = {
      author: {
        address: '0xabc123',
      },
    };
    testState.challenges = [];
    testState.commentsByCid = {
      'parent-1': {
        author: {
          shortAddress: '0xparent',
        },
      },
    };
    testState.publicationPreview = 'preview body';
    testState.publicationType = 'post';
    testState.removeChallengeMock.mockReset();
    testState.springStartMock.mockReset();
    testState.theme = 'dark';
    testState.votePreview = 'upvote';
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    postMessageMock = vi.fn();
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      configurable: true,
      get: () => ({
        postMessage: postMessageMock,
      }),
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('renders nothing when there are no queued challenges', async () => {
    await renderModal();
    expect(container.innerHTML).toBe('');
  });

  it('submits a text challenge answer on Enter and closes the modal', async () => {
    const publication = createPublication();
    testState.publicationType = 'reply';
    testState.challenges = [
      createStoredChallenge(
        {
          challenge: '2 + 2',
          type: 'text/plain',
        },
        publication,
      ),
    ];

    await renderModal();
    expect(container.textContent).toContain('Challenge for reply');
    expect(container.textContent).toContain('1/1');
    expect(container.querySelector('textarea')?.textContent ?? container.textContent).toContain('Publication content');

    const input = container.querySelector<HTMLInputElement>('input[placeholder*="TYPE THE ANSWER HERE"]');
    expect(input).not.toBeNull();

    await dispatchInput(input as HTMLInputElement, '4');
    await act(async () => {
      input?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    });

    expect(publication.publishChallengeAnswers).toHaveBeenCalledWith(['4']);
    expect(testState.removeChallengeMock).toHaveBeenCalledOnce();
  });

  it('supports multi-step image challenges with next and previous navigation', async () => {
    const publication = createPublication();
    testState.challenges = [
      createStoredChallenge(
        [
          {
            challenge: 'first answer',
            type: 'text/plain',
          },
          {
            challenge: 'YmFzZTY0LWltYWdl',
            type: 'image/png',
          },
        ],
        publication,
      ),
    ];

    await renderModal();
    expect(container.textContent).toContain('1/2');

    const input = container.querySelector<HTMLInputElement>('input[placeholder*="TYPE THE ANSWER HERE"]');
    await dispatchInput(input as HTMLInputElement, 'step one');
    await act(async () => {
      input?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    });

    expect(container.textContent).toContain('2/2');
    expect(container.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,YmFzZTY0LWltYWdl');

    await clickButton('previous');
    expect(container.textContent).toContain('1/2');

    await clickButton('next');
    await dispatchInput(container.querySelector<HTMLInputElement>('input[placeholder*="TYPE THE ANSWER HERE"]') as HTMLInputElement, 'step two');
    await clickButton('submit');

    expect(publication.publishChallengeAnswers).toHaveBeenCalledWith(['step one', 'step two']);
    expect(testState.removeChallengeMock).toHaveBeenCalledOnce();
  });

  it('opens iframe challenges, injects the theme, and completes them', async () => {
    const publication = createPublication();
    testState.challenges = [
      createStoredChallenge(
        {
          challenge: 'https://mintpass.org/auth?user={userAddress}',
          type: 'url/iframe',
        },
        publication,
      ),
    ];

    await renderModal();
    expect(confirmSpy).toHaveBeenCalledWith('mu wants to open mintpass.org.\n\nFor post: Subject');
    expect(container.textContent).toContain('mintpass.org');
    expect(container.textContent).toContain('Done');
    expect(container.textContent).not.toContain('Challenge for post');
    expect(container.textContent).not.toContain('Open');
    expect(container.textContent).not.toContain('Cancel');
    expect(container.textContent).not.toContain('Alice');
    expect(container.textContent).not.toContain('Subject');
    expect(container.textContent).not.toContain('Publication content');
    expect(container.textContent).not.toContain('mu wants to open');

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toContain('https://mintpass.org/auth?user=0xabc123&theme=dark');
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts allow-forms allow-popups allow-same-origin allow-top-navigation-by-user-activation');

    await act(async () => {
      iframe?.dispatchEvent(new Event('load', { bubbles: true }));
    });

    expect(postMessageMock).toHaveBeenCalledWith(
      {
        source: 'plebbit-5chan',
        theme: 'dark',
        type: 'plebbit-theme',
      },
      'https://mintpass.org',
    );

    await clickButton('Done');
    expect(publication.publishChallengeAnswers).toHaveBeenCalledWith(['']);
    expect(testState.removeChallengeMock).toHaveBeenCalledOnce();
  });

  it('allows localhost http iframe challenges for local spam blocker testing', async () => {
    const publication = createPublication();
    testState.challenges = [
      createStoredChallenge(
        {
          challenge: 'http://localhost:3000/api/v1/iframe/session-123?foo=bar',
          type: 'url/iframe',
        },
        publication,
      ),
    ];

    await renderModal();

    expect(confirmSpy).toHaveBeenCalledWith('mu wants to open localhost:3000.\n\nFor post: Subject');

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toContain('http://localhost:3000/api/v1/iframe/session-123?foo=bar&theme=dark');

    await act(async () => {
      iframe?.dispatchEvent(new Event('load', { bubbles: true }));
    });

    expect(postMessageMock).toHaveBeenCalledWith(
      {
        source: 'plebbit-5chan',
        theme: 'dark',
        type: 'plebbit-theme',
      },
      'http://localhost:3000',
    );
  });

  it('auto-submits iframe challenges when the iframe posts a completion message', async () => {
    const publication = createPublication();
    testState.challenges = [
      createStoredChallenge(
        {
          challenge: 'https://spamblocker.bitsocial.net/api/v1/iframe/session-123',
          type: 'url/iframe',
        },
        publication,
      ),
    ];

    await renderModal();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'challengeAnswer',
            challengeAnswers: [''],
            sessionId: 'session-123',
          },
          origin: 'https://spamblocker.bitsocial.net',
        }),
      );
    });

    expect(publication.publishChallengeAnswers).toHaveBeenCalledWith(['']);
    expect(testState.removeChallengeMock).toHaveBeenCalledOnce();
  });

  it('ignores iframe completion messages with the wrong session id', async () => {
    const publication = createPublication();
    testState.challenges = [
      createStoredChallenge(
        {
          challenge: 'https://spamblocker.bitsocial.net/api/v1/iframe/session-123',
          type: 'url/iframe',
        },
        publication,
      ),
    ];

    await renderModal();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'challengeAnswer',
            challengeAnswers: [''],
            sessionId: 'session-999',
          },
          origin: 'https://spamblocker.bitsocial.net',
        }),
      );
    });

    expect(publication.publishChallengeAnswers).not.toHaveBeenCalled();
    expect(testState.removeChallengeMock).not.toHaveBeenCalled();
  });

  it('uses the shortened community address when shortCommunityAddress is unavailable', async () => {
    const longCommunityAddress = '12D3KooWS6yKc5N7o6JcAYHZpaQwAwyh1VddYatarU75Se3HXEeD';
    const publication = {
      ...createPublication(),
      shortCommunityAddress: undefined,
      communityAddress: longCommunityAddress,
    };
    testState.challenges = [
      createStoredChallenge(
        {
          challenge: 'http://localhost:3000/api/v1/iframe/session-123?foo=bar',
          type: 'url/iframe',
        },
        publication,
      ),
    ];

    await renderModal();

    expect(confirmSpy).toHaveBeenCalledWith(`${getShortAddress(longCommunityAddress)} wants to open localhost:3000.\n\nFor post: Subject`);
    expect(confirmSpy.mock.calls[0]?.[0]).not.toContain(longCommunityAddress);
  });

  it('uses reply content in the iframe confirmation excerpt', async () => {
    const publication = {
      ...createPublication(),
      content: '>>17\nA reply body with enough context',
      title: '',
    };
    testState.publicationType = 'reply';
    testState.challenges = [
      createStoredChallenge(
        {
          challenge: 'https://spamblocker.bitsocial.net/api/v1/iframe/session-123',
          type: 'url/iframe',
        },
        publication,
      ),
    ];

    await renderModal();

    expect(confirmSpy).toHaveBeenCalledWith('mu wants to open spamblocker.bitsocial.net.\n\nFor reply: >>17 A reply body with enough context');
  });

  it('abandons iframe challenges when the external confirmation is canceled', async () => {
    confirmSpy.mockReturnValueOnce(false);
    testState.challenges = [
      createStoredChallenge({
        challenge: 'https://spamblocker.bitsocial.net/api/v1/iframe/session-123',
        type: 'url/iframe',
      }),
    ];

    await renderModal();

    expect(confirmSpy).toHaveBeenCalledWith('mu wants to open spamblocker.bitsocial.net.\n\nFor post: Subject');
    expect(testState.abandonCurrentChallengeMock).toHaveBeenCalledOnce();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('alerts when iframe challenges need a signer address and the account is missing one', async () => {
    testState.account = { author: { address: '' } };
    testState.challenges = [
      createStoredChallenge({
        challenge: 'https://mintpass.org/auth?user={userAddress}',
        type: 'url/iframe',
      }),
    ];

    await renderModal();

    expect(alertSpy).toHaveBeenCalledWith('Error: Unable to load challenge without your address. Please sign in and try again.');
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(testState.abandonCurrentChallengeMock).toHaveBeenCalledOnce();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('abandons invalid iframe challenges and responds to Escape', async () => {
    testState.challenges = [
      createStoredChallenge({
        challenge: 'http://example.com/unsafe',
        type: 'url/iframe',
      }),
    ];

    await renderModal();

    expect(alertSpy).toHaveBeenCalledWith('Error: Only HTTPS iframe challenges or localhost HTTP challenges are supported');
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(testState.abandonCurrentChallengeMock).toHaveBeenCalledOnce();

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(testState.abandonCurrentChallengeMock).toHaveBeenCalledTimes(2);
  });
});
