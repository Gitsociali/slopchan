import { describe, expect, it } from 'vitest';
import { formatErrorForDisplay, formatErrorMessageForDisplay, serializeErrorForClipboard } from '../error-utils';

describe('error utils', () => {
  it('returns plain string errors unchanged', () => {
    expect(formatErrorForDisplay('plain failure')).toBe('plain failure');
  });

  it('uses the message without appending structured details', () => {
    expect(
      formatErrorForDisplay({
        details: {
          plebpubsub: 'timeout',
          pubsubprovider: 'connection refused',
        },
        message: 'All pubsub providers throw an error and unable to publish or subscribe',
      }),
    ).toBe('All pubsub providers throw an error and unable to publish or subscribe');
  });

  it('uses the message without appending the cause', () => {
    expect(
      formatErrorForDisplay({
        cause: {
          provider: 'plebpubsub',
          reason: 'timeout',
        },
        message: 'publish failed',
      }),
    ).toBe('publish failed');
  });

  it('keeps the visible message compact when details contain nested errors', () => {
    expect(
      formatErrorForDisplay({
        details: {
          reason: new Error('provider timeout'),
        },
        message: 'publish failed',
      }),
    ).toBe('publish failed');
  });

  it('formats cyclic errors without recursing forever', () => {
    const error = Object.assign(new Error('publish failed'), {
      details: {
        elapsedMs: BigInt(5000),
      },
    });
    Object.assign(error.details, { self: error.details });

    expect(formatErrorForDisplay(error)).toBe('publish failed');
  });

  it('falls back to details when an object has no message', () => {
    expect(
      formatErrorForDisplay({
        details: {
          provider: 'gateway',
          reason: 'timeout',
        },
      }),
    ).toBe('provider: gateway; reason: timeout');
  });

  it('extracts only the direct message for compact display labels', () => {
    expect(
      formatErrorMessageForDisplay({
        details: {
          provider: 'gateway',
        },
        message: 'gateway failed',
      }),
    ).toBe('gateway failed');
    expect(formatErrorMessageForDisplay({ details: { provider: 'gateway' } })).toBeUndefined();
  });

  it('serializes cyclic errors as valid JSON for copying', () => {
    const cause = new Error('provider timeout');
    const error = Object.assign(new Error('publish failed'), {
      attempts: [{ elapsedMs: BigInt(5000), provider: 'pubsub', reason: cause }],
    });
    Object.assign(error, { self: error });

    expect(JSON.parse(serializeErrorForClipboard(error))).toMatchObject({
      attempts: [
        {
          elapsedMs: '5000',
          provider: 'pubsub',
          reason: {
            message: 'provider timeout',
            name: 'Error',
          },
        },
      ],
      message: 'publish failed',
      name: 'Error',
      self: '[Circular]',
    });
  });

  it('keeps string errors unchanged and empty objects as JSON', () => {
    expect(serializeErrorForClipboard('plain failure')).toBe('plain failure');
    expect(serializeErrorForClipboard({})).toBe('{}');
  });
});
