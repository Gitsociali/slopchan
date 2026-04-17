import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Community } from '@bitsocialnet/bitsocial-react-hooks';
import { getFormattedTimeAgo } from '../lib/utils/time-utils';
import useCommunityOfflineStore from '../stores/use-community-offline-store';
import useCommunitiesLoadingStartTimestamps from '../stores/use-communities-loading-start-timestamps-store';

const getCommunityOfflineKey = (community?: Community, communityAddressHint?: string) =>
  communityAddressHint || community?.address || community?.name || community?.publicKey;

const useIsCommunityOffline = (community?: Community | undefined, communityAddressHint?: string) => {
  const { t } = useTranslation();
  const { state, updatedAt, updatingState } = community || {};
  const communityKey = getCommunityOfflineKey(community, communityAddressHint);
  const { communityOfflineState, setCommunityOfflineState, initializeCommunityOfflineState } = useCommunityOfflineStore();
  const communitiesLoadingStartTimestamps = useCommunitiesLoadingStartTimestamps(communityKey ? [communityKey] : undefined);

  useEffect(() => {
    if (communityKey && !communityOfflineState[communityKey]) {
      initializeCommunityOfflineState(communityKey);
    }
  }, [communityKey, communityOfflineState, initializeCommunityOfflineState]);

  useEffect(() => {
    if (communityKey) {
      setCommunityOfflineState(communityKey, { state, updatedAt, updatingState });
    }
  }, [communityKey, state, updatedAt, updatingState, setCommunityOfflineState]);

  if (!communityKey) {
    return { isOffline: false, isOnlineStatusLoading: false, offlineIconClass: '', offlineTitle: false };
  }

  const offlineState = communityOfflineState[communityKey] || { initialLoad: true };
  const loadingStartTimestamp = communitiesLoadingStartTimestamps[0] || 0;
  const isLoading = offlineState.initialLoad && (!updatedAt || Date.now() / 1000 - updatedAt >= 120 * 120) && Date.now() / 1000 - loadingStartTimestamp < 30;
  const isOffline = !isLoading && ((updatedAt && updatedAt < Date.now() / 1000 - 120 * 120) || (!updatedAt && Date.now() / 1000 - loadingStartTimestamp >= 30));

  const isOnline = updatedAt && Date.now() / 1000 - updatedAt < 120 * 120;
  const offlineIconClass = isLoading ? 'yellowOfflineIcon' : isOffline ? 'redOfflineIcon' : '';

  const offlineTitle = isLoading
    ? 'downloading board...'
    : updatedAt
      ? isOffline && t('posts_last_synced_info', { time: getFormattedTimeAgo(updatedAt), interpolation: { escapeValue: false } })
      : t('community_offline_info');

  return { isOffline: !isOnline && isOffline, isOnlineStatusLoading: !isOnline && isLoading, offlineIconClass, offlineTitle };
};

export default useIsCommunityOffline;
