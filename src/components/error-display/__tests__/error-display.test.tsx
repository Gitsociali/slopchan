import * as React from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorDisplay from '../error-display';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const act = (React as { act?: (cb: () => void | Promise<void>) => void | Promise<void> }).act as (cb: () => void | Promise<void>) => void | Promise<void>;

const testState = vi.hoisted(() => ({
  copyToClipboardMock: vi.fn<(value: string) => Promise<void>>(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('../../../lib/utils/clipboard-utils', () => ({
  copyToClipboard: (value: string) => testState.copyToClipboardMock(value),
}));

let container: HTMLDivElement;
let root: Root;
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

const renderDisplay = async (props: { error: unknown; displayMessage?: string; inline?: boolean; showImmediately?: boolean } | unknown) => {
  const normalizedProps =
    props && typeof props === 'object' && 'error' in (props as Record<string, unknown>)
      ? (props as { error: unknown; displayMessage?: string; inline?: boolean; showImmediately?: boolean })
      : { error: props };

  await act(async () => {
    root.render(createElement(ErrorDisplay, normalizedProps));
  });
};

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    testState.copyToClipboardMock.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('waits before rendering, then copies structured errors and shows feedback', async () => {
    testState.copyToClipboardMock.mockResolvedValue(undefined);
    const error = {
      details: { code: 500 },
      message: 'network down',
    };

    await renderDisplay(error);
    expect(container.textContent).toBe('');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const button = container.querySelector('button');
    expect(button?.textContent).toContain('error: network down');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(testState.copyToClipboardMock).toHaveBeenCalledWith(JSON.stringify(error, null, 2));
    expect(container.textContent).toContain('full error copied to the clipboard');

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(container.textContent).toContain('error: network down');
  });

  it('shows copy failure feedback and logs the clipboard error', async () => {
    testState.copyToClipboardMock.mockRejectedValue(new Error('denied'));

    await renderDisplay({ message: 'boom' });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const button = container.querySelector('button');
    expect(button).toBeTruthy();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy error: ', expect.any(Error));
    expect(container.textContent).toContain('copy failed');
  });

  it('copies native Error instances with message, stack, and extra fields', async () => {
    testState.copyToClipboardMock.mockResolvedValue(undefined);
    const error = Object.assign(new Error('native failure'), {
      details: { status: 504 },
    });
    error.stack = 'Error: native failure\n    at publish';

    await renderDisplay(error);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const button = container.querySelector('button');
    expect(button?.textContent).toContain('error: native failure');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(testState.copyToClipboardMock).toHaveBeenCalledWith(
      JSON.stringify(
        {
          name: 'Error',
          message: 'native failure',
          stack: 'Error: native failure\n    at publish',
          details: { status: 504 },
        },
        null,
        2,
      ),
    );
  });

  it('supports compact custom labels that copy plain string errors immediately', async () => {
    testState.copyToClipboardMock.mockResolvedValue(undefined);

    await renderDisplay({
      displayMessage: 'failed',
      error: 'All pubsub providers throw an error and unable to publish or subscribe',
      inline: true,
      showImmediately: true,
    });

    const button = container.querySelector('button');
    expect(button?.textContent).toBe('failed');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(testState.copyToClipboardMock).toHaveBeenCalledWith('All pubsub providers throw an error and unable to publish or subscribe');
    expect(container.textContent).toContain('full error copied to the clipboard');
  });

  it('renders plain string errors after the delay and hides again when the error clears', async () => {
    await renderDisplay('plain failure');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toContain('plain failure');

    await renderDisplay(null);
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toBe('');
  });
});
