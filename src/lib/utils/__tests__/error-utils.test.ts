import { describe, expect, it } from 'vitest';
import { formatErrorForDisplay } from '../error-utils';

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
});
