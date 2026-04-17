import * as React from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Pass from '../pass';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const act = (React as { act?: (cb: () => void | Promise<void>) => void | Promise<void> }).act as (cb: () => void | Promise<void>) => void | Promise<void>;

vi.mock('react-router-hash-link', () => ({
  HashLink: ({ children, to }: { children: React.ReactNode; to: string }) => createElement('a', { href: to }, children),
}));

vi.mock('../../home', () => ({
  Footer: () => createElement('div', { 'data-testid': 'footer' }, 'footer'),
  HomeLogo: () => createElement('div', { 'data-testid': 'home-logo' }, 'home-logo'),
}));

let container: HTMLDivElement;
let root: Root;

const renderPass = async () => {
  await act(async () => {
    root.render(createElement(MemoryRouter, {}, createElement(Pass)));
  });
};

describe('Pass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    document.title = 'before';

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders the placeholder 5chan Pass details and marks the route as coming soon', async () => {
    await renderPass();

    expect(container.querySelector('[data-testid="home-logo"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="footer"]')).toBeTruthy();
    expect(container.textContent).toContain('Support 5chan with 5chan Pass');
    expect(container.textContent).toContain('not available yet');
    expect(container.textContent).toContain('crypto only');
    expect(container.textContent).toContain('directory voting');
    expect(container.textContent).toContain('/vip/');
    expect(container.textContent).toContain('zero-friction');
    expect(container.textContent).toContain('CAPTCHA verification');
    expect(container.textContent).toContain('$30 for 1 year');
    expect(container.textContent).toContain('$60 for 3 years');
    expect(container.textContent).toContain('MintPass');
    expect(container.textContent).toContain('burn BSO');
    expect(container.textContent).toContain('automatically in the smart contract');
    expect(container.textContent).toContain('purchase wallet activity can be publicly visible');
    expect(container.querySelector('a[href="/rules"]')?.textContent).toBe('rules');
    expect(container.querySelector('a[href="/vip"]')?.textContent).toBe('/vip/');
    expect(container.querySelector('a[href="https://github.com/bitsocialnet/mintpass"]')?.textContent).toBe('MintPass');
    expect(container.querySelector('a[href="https://bitsocial.net"]')?.textContent).toBe('Bitsocial');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.title).toBe('Pass - 5chan');
  });
});
