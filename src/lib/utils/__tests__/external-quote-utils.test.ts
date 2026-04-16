import { describe, expect, it } from 'vitest';
import { getExternalQuoteBoardAddress, getExternalQuoteBoardLabel } from '../external-quote-utils';

const directories = [
  {
    address: 'music-posting.eth',
    name: 'music-posting.bso',
    title: '/mu/ - Music',
  },
  {
    address: 'random.eth',
    directoryCode: 'b',
    title: 'Random',
  },
];

describe('external quote board resolution', () => {
  it('canonicalizes same-board aliases through the directories list', () => {
    const reference = {
      communityAddress: 'music-posting.bso',
      kind: 'same-board' as const,
      number: 42,
      raw: '>>42',
    };

    expect(getExternalQuoteBoardAddress(reference, directories)).toBe('music-posting.eth');
    expect(getExternalQuoteBoardLabel(reference, directories)).toBe('mu');
  });

  it('canonicalizes cross-board aliases through the directories list', () => {
    const reference = {
      boardIdentifier: 'music-posting.bso',
      kind: 'cross-board' as const,
      number: 77,
      raw: '>>>/music-posting.bso/77',
    };

    expect(getExternalQuoteBoardAddress(reference, directories)).toBe('music-posting.eth');
    expect(getExternalQuoteBoardLabel(reference, directories)).toBe('mu');
  });
});
