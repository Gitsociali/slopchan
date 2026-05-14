import { useEffect, useMemo, useRef } from 'react';
import { useAccount, type Comment, type CommunitiesPages, type Community } from '@bitsocial/bitsocial-react-hooks';
import accountsStore from '@bitsocial/bitsocial-react-hooks/dist/stores/accounts';
import communitiesStore from '@bitsocial/bitsocial-react-hooks/dist/stores/communities';
import communitiesPagesStore, { getCommunityFirstPageCid, getCommunityPages } from '@bitsocial/bitsocial-react-hooks/dist/stores/communities-pages';
import { getCommentCommunityAddress } from '../lib/utils/comment-utils';
import { isCommentArchived } from '../lib/utils/comment-moderation-utils';
import { useDirectories } from './use-directories';
import { getBoardAddressKeys, isBoardAddressInScope } from './use-hidden-catalog-threads';

type UsePruneHiddenCatalogThreadsOptions = {
  enabled: boolean;
  hiddenThreadCandidates: readonly Comment[];
  communityAddress: string | undefined;
  sortType: 'active' | 'new';
};

type RawBoardCatalogState = {
  isFullyLoaded: boolean;
  rootThreadCids: Set<string>;
};

const EMPTY_RAW_BOARD_CATALOG_STATE: RawBoardCatalogState = {
  isFullyLoaded: false,
  rootThreadCids: new Set<string>(),
};

const addRootThreadCids = (cids: Set<string>, comments: readonly Comment[] | undefined) => {
  for (const comment of comments || []) {
    if (comment?.cid && !comment.parentCid) {
      cids.add(comment.cid);
    }
  }
};

const getRawBoardCatalogState = ({
  accountId,
  communitiesPages,
  community,
  sortType,
}: {
  accountId: string | undefined;
  communitiesPages: CommunitiesPages;
  community: Community | undefined;
  sortType: 'active' | 'new';
}): RawBoardCatalogState => {
  if (!community) {
    return EMPTY_RAW_BOARD_CATALOG_STATE;
  }

  const rootThreadCids = new Set<string>();
  const preloadedSortPage = community.posts?.pages?.[sortType];
  addRootThreadCids(rootThreadCids, preloadedSortPage?.comments);

  const firstPageCid = getCommunityFirstPageCid(community, sortType, 'posts');
  const pages = firstPageCid ? getCommunityPages(community, sortType, communitiesPages, 'posts', accountId) : [];
  for (const page of pages) {
    addRootThreadCids(rootThreadCids, page?.comments);
  }

  if (pages.length > 0) {
    return {
      isFullyLoaded: !pages[pages.length - 1]?.nextCid,
      rootThreadCids,
    };
  }

  const pageCids = community.posts?.pageCids || {};
  const hasPageCids = Object.keys(pageCids).length > 0;
  const preloadedPages = Object.values(community.posts?.pages || {}) as Array<{ comments?: Comment[]; nextCid?: string }>;
  const hasCompletePreloadedPage = !hasPageCids && preloadedPages.some((page) => Array.isArray(page?.comments)) && preloadedPages.every((page) => !page?.nextCid);

  if (hasCompletePreloadedPage) {
    for (const page of preloadedPages) {
      addRootThreadCids(rootThreadCids, page?.comments);
    }
  }

  return {
    isFullyLoaded: hasCompletePreloadedPage,
    rootThreadCids,
  };
};

const usePruneHiddenCatalogThreads = ({ enabled, hiddenThreadCandidates, communityAddress, sortType }: UsePruneHiddenCatalogThreadsOptions) => {
  const account = useAccount();
  const directories = useDirectories();
  const community = communitiesStore((state) => (communityAddress ? state.communities[communityAddress] : undefined));
  const communitiesPages = communitiesPagesStore((state) => state.communitiesPages);
  const pendingPruneCidsRef = useRef(new Set<string>());
  const boardAddressKeys = useMemo(() => (enabled ? getBoardAddressKeys(communityAddress, directories) : new Set<string>()), [communityAddress, directories, enabled]);
  const rawBoardCatalogState = useMemo(
    () =>
      enabled
        ? getRawBoardCatalogState({
            accountId: account?.id,
            communitiesPages,
            community,
            sortType,
          })
        : EMPTY_RAW_BOARD_CATALOG_STATE,
    [account?.id, communitiesPages, community, enabled, sortType],
  );

  const removedHiddenThreadCids = useMemo(() => {
    if (!enabled || boardAddressKeys.size === 0 || !rawBoardCatalogState.isFullyLoaded) {
      return [];
    }

    return hiddenThreadCandidates
      .filter((comment) => {
        const cid = comment?.cid;
        return (
          cid &&
          !isCommentArchived(comment) &&
          isBoardAddressInScope(getCommentCommunityAddress(comment), boardAddressKeys, directories) &&
          !rawBoardCatalogState.rootThreadCids.has(cid)
        );
      })
      .map((comment) => comment.cid)
      .filter((cid): cid is string => typeof cid === 'string')
      .sort();
  }, [boardAddressKeys, directories, enabled, hiddenThreadCandidates, rawBoardCatalogState]);

  useEffect(() => {
    if (!enabled || removedHiddenThreadCids.length === 0) {
      return;
    }

    for (const cid of removedHiddenThreadCids) {
      if (pendingPruneCidsRef.current.has(cid)) {
        continue;
      }

      pendingPruneCidsRef.current.add(cid);
      void accountsStore
        .getState()
        .accountsActions.unblockCid(cid)
        .catch((error: unknown) => {
          const { accounts, activeAccountId } = accountsStore.getState();
          if (activeAccountId && accounts?.[activeAccountId]?.blockedCids?.[cid]) {
            console.error('Failed to remove stale hidden thread from account', error);
          }
        })
        .finally(() => {
          pendingPruneCidsRef.current.delete(cid);
        });
    }
  }, [enabled, removedHiddenThreadCids]);
};

export default usePruneHiddenCatalogThreads;
