import { useCallback, useState } from 'react';
import { getTimeFilterSeconds, type TimeFilterSuggestion } from '../lib/utils/time-filter-utils';

interface UseExpandedTimeFilterOptions {
  timeFilterName: string;
  timeFilterSeconds: number | undefined;
  expandTimeWindow: (newerThan?: number) => Promise<void>;
}

const useExpandedTimeFilter = ({ timeFilterName, timeFilterSeconds, expandTimeWindow }: UseExpandedTimeFilterOptions) => {
  const [currentTimeFilterName, setCurrentTimeFilterName] = useState(timeFilterName);
  const [currentTimeFilterSeconds, setCurrentTimeFilterSeconds] = useState(timeFilterSeconds);

  const expandSuggestionTimeWindow = useCallback(
    async (suggestion: TimeFilterSuggestion | null) => {
      if (!suggestion) {
        return;
      }

      const nextTimeFilterSeconds = getTimeFilterSeconds(suggestion.timeFilterName);
      if (typeof nextTimeFilterSeconds !== 'number') {
        return;
      }

      await expandTimeWindow(nextTimeFilterSeconds);
      setCurrentTimeFilterName(suggestion.timeFilterName);
      setCurrentTimeFilterSeconds(nextTimeFilterSeconds);
    },
    [expandTimeWindow],
  );

  return {
    currentTimeFilterName,
    currentTimeFilterSeconds,
    expandSuggestionTimeWindow,
  };
};

export default useExpandedTimeFilter;
