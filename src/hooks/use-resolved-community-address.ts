import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDirectories } from './use-directories';
import { getCommunityAddress, getBoardPath } from '../lib/utils/route-utils';

/**
 * Resolve a board identifier from URL params to canonical community address.
 */
export const useResolvedCommunityAddress = (): string | undefined => {
  const params = useParams<{ boardIdentifier?: string }>();
  const directories = useDirectories();

  const boardIdentifier = params.boardIdentifier;

  return useMemo(() => {
    if (!boardIdentifier) {
      return undefined;
    }

    return getCommunityAddress(boardIdentifier, directories);
  }, [boardIdentifier, directories]);
};

/**
 * Resolve a community address to board path (directory code or address) for links.
 */
export const useBoardPath = (communityAddress: string | undefined): string | undefined => {
  const directories = useDirectories();

  return useMemo(() => {
    if (!communityAddress) {
      return undefined;
    }

    return getBoardPath(communityAddress, directories);
  }, [communityAddress, directories]);
};
