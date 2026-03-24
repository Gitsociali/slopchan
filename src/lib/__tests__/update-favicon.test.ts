import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('update-favicon', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.resetModules();
  });

  it('replaces managed icon links and keeps both icon rel variants in sync', async () => {
    const { updateFavicon } = await import('../update-favicon');

    document.head.innerHTML = '<link rel="icon" href="/favicon.ico"><link rel="shortcut icon" href="/favicon.ico">';

    updateFavicon(false);
    expect(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')).toHaveLength(2);
    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.ico?variant=nsfw');
    expect(document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href')).toBe('/favicon.ico?variant=nsfw');

    updateFavicon(false);
    expect(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')).toHaveLength(2);

    updateFavicon(true);
    expect(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')).toHaveLength(2);
    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon2.ico?variant=sfw');
    expect(document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href')).toBe('/favicon2.ico?variant=sfw');
  });

  it('marks only non-special, non-routing aggregate sfw boards as sfw', async () => {
    const { isSfwBoard } = await import('../update-favicon');

    expect(
      isSfwBoard({
        pathname: '/',
        isSpecialTheme: false,
        isInAllView: false,
        isInSubscriptionsView: false,
        isInModView: false,
        subplebbitAddress: 'music.eth',
        directories: [{ address: 'music.eth', nsfw: false }],
      }),
    ).toBe(false);

    expect(
      isSfwBoard({
        pathname: '/music.eth',
        isSpecialTheme: false,
        isInAllView: false,
        isInSubscriptionsView: false,
        isInModView: false,
        subplebbitAddress: 'music.eth',
        directories: [
          { address: 'music.eth', nsfw: false },
          { address: 'flash.eth', nsfw: true },
        ],
      }),
    ).toBe(true);

    expect(
      isSfwBoard({
        pathname: '/flash.eth',
        isSpecialTheme: false,
        isInAllView: false,
        isInSubscriptionsView: false,
        isInModView: false,
        subplebbitAddress: 'flash.eth',
        directories: [{ address: 'flash.eth', nsfw: true }],
      }),
    ).toBe(false);
  });
});
