import { describe, expect, it } from 'vitest';
import { formatErrorForDisplay, serializeErrorForClipboard } from '../error-utils';

describe('error utils', () => {
  it('returns plain string errors unchanged', () => {
    expect(formatErrorForDisplay('plain failure')).toBe('plain failure');
  });

  it('appends structured details to the message', () => {
    expect(
      formatErrorForDisplay({
        details: {
          plebpubsub: 'timeout',
          pubsubprovider: 'connection refused',
        },
        message: 'All pubsub providers throw an error and unable to publish or subscribe',
      }),
    ).toBe('All pubsub providers throw an error and unable to publish or subscribe: plebpubsub: timeout; pubsubprovider: connection refused');
  });

  it('falls back to cause when details are missing', () => {
    expect(
      formatErrorForDisplay({
        cause: {
          provider: 'plebpubsub',
          reason: 'timeout',
        },
        message: 'publish failed',
      }),
    ).toBe('publish failed: provider: plebpubsub; reason: timeout');
  });

  it('formats nested Error details without dropping the nested message', () => {
    expect(
      formatErrorForDisplay({
        details: {
          reason: new Error('provider timeout'),
        },
        message: 'publish failed',
      }),
    ).toBe('publish failed: reason: provider timeout');
  });

  it('formats cyclic errors without recursing forever', () => {
    const error = Object.assign(new Error('publish failed'), {
      details: {
        elapsedMs: BigInt(5000),
      },
    });
    Object.assign(error.details, { self: error.details });

    expect(formatErrorForDisplay(error)).toBe('publish failed: elapsedMs: 5000; self: [Circular]');
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
