import * as React from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useTrustedBoardUrlPermissionsStore from '../../../../stores/use-trusted-board-url-permissions-store';
import TrustedBoardLinksSetting from '../trusted-board-links-setting';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const act = (React as { act?: (cb: () => void | Promise<void>) => void | Promise<void> }).act as (cb: () => void | Promise<void>) => void | Promise<void>;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

let container: HTMLDivElement;
let root: Root;

const render = () => {
  act(() => {
    root.render(createElement(TrustedBoardLinksSetting));
  });
};

describe('TrustedBoardLinksSetting', () => {
  beforeEach(() => {
    localStorage.clear();
    useTrustedBoardUrlPermissionsStore.setState({ trustedOrigins: {} });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows an empty state when no board links are trusted', () => {
    render();

    expect(container.textContent).toContain('trusted_board_links_intro');
    expect(container.textContent).toContain('trusted_board_links_empty');
  });

  it('revokes a trusted board link permission', async () => {
    useTrustedBoardUrlPermissionsStore.getState().trustOrigin('https://spamblocker.bitsocial.net', 'spamblocker.bitsocial.net');

    render();

    expect(container.textContent).toContain('spamblocker.bitsocial.net');

    const revokeButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'revoke');
    await act(async () => {
      revokeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useTrustedBoardUrlPermissionsStore.getState().isOriginTrusted('https://spamblocker.bitsocial.net')).toBe(false);
    expect(container.textContent).toContain('trusted_board_links_empty');
  });
});
