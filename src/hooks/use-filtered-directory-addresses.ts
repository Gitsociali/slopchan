import { useMemo } from 'react';
import { getDirectoryFetchAddress, useDirectories } from './use-directories';
import useAllFeedFilterStore from '../stores/use-all-feed-filter-store';

export const useFilteredDirectoryAddresses = () => {
  const directories = useDirectories();
  const { filter } = useAllFeedFilterStore();

  const filteredAddresses = useMemo(() => {
    if (filter === 'all') {
      return directories.map((community) => getDirectoryFetchAddress(community));
    }
    if (filter === 'nsfw') {
      return directories.filter((community) => community.nsfw === true).map((community) => getDirectoryFetchAddress(community));
    }
    // filter === 'sfw'
    return directories.filter((community) => community.nsfw !== true).map((community) => getDirectoryFetchAddress(community));
  }, [directories, filter]);

  return filteredAddresses;
};
