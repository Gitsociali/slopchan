import { useCommunity } from '@bitsocialnet/bitsocial-react-hooks';
import { useCommunityIdentifier } from '../../hooks/use-community-identifiers';
import { useDirectoryByAddress } from '../../hooks/use-directories';
import useIsCommunityOffline from '../../hooks/use-is-community-offline';
import { useResolvedCommunityAddress } from '../../hooks/use-resolved-community-address';

interface BoardOfflineAlertProps {
  className: string;
  hidden?: boolean;
  communityAddress?: string;
}

const BoardOfflineAlert = ({ className, hidden = false, communityAddress }: BoardOfflineAlertProps) => {
  const resolvedCommunityAddress = useResolvedCommunityAddress();
  const directoryEntry = useDirectoryByAddress(resolvedCommunityAddress || communityAddress);
  const canonicalCommunityAddress = resolvedCommunityAddress || directoryEntry?.address || communityAddress;
  const communityIdentifier = useCommunityIdentifier(canonicalCommunityAddress);
  const community = useCommunity(communityIdentifier ? { community: communityIdentifier } : undefined);
  const { isOffline, isOnlineStatusLoading, offlineTitle } = useIsCommunityOffline(community, canonicalCommunityAddress);

  if (hidden || (!isOffline && !isOnlineStatusLoading)) {
    return null;
  }

  return <div className={className}>{offlineTitle}</div>;
};

export default BoardOfflineAlert;
