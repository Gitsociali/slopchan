import { useMemo } from 'react';
import { useAccountCommunities } from '@bitsocial/bitsocial-react-hooks';

export const useAccountCommunityAddresses = (): string[] => {
  const { accountCommunities } = useAccountCommunities({ onlyIfCached: true });

  return useMemo(() => Object.keys(accountCommunities), [accountCommunities]);
};
