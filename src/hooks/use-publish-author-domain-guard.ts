import { useMemo } from 'react';
import { useAccount, useResolvedAuthorAddress } from '@bitsocial/bitsocial-react-hooks';

type PublishAuthorDomainBlockReason = 'resolving' | 'unresolved' | 'mismatch';

const isDomainAddress = (address: unknown): address is string => typeof address === 'string' && address.includes('.');

export const getPublishAuthorDomainErrorMessage = (reason: PublishAuthorDomainBlockReason) => {
  if (reason === 'mismatch') {
    return 'Your Bitsocial Account address belongs to another account.';
  }
  if (reason === 'resolving') {
    return 'Your Bitsocial Account address is still being verified. Try again in a moment.';
  }
  return 'Your Bitsocial Account address is not resolved yet.';
};

const usePublishAuthorDomainGuard = () => {
  const account = useAccount();
  const authorAddress = account?.author?.address;
  const hasDomainAuthor = isDomainAddress(authorAddress);
  const { resolvedAddress, state } = useResolvedAuthorAddress({
    author: hasDomainAuthor ? account?.author : undefined,
    cache: false,
  });

  const blockedReason = useMemo<PublishAuthorDomainBlockReason | undefined>(() => {
    if (!hasDomainAuthor) {
      return undefined;
    }

    if (state === 'succeeded') {
      if (!resolvedAddress) {
        return 'unresolved';
      }
      return resolvedAddress === account?.signer?.address ? undefined : 'mismatch';
    }

    if (state === 'failed') {
      return 'unresolved';
    }

    return 'resolving';
  }, [account?.signer?.address, hasDomainAuthor, resolvedAddress, state]);

  return {
    account,
    blockedReason,
    hasDomainAuthor,
  };
};

export default usePublishAuthorDomainGuard;
