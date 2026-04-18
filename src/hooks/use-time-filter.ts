import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getEffectiveTimeFilterName,
  getEffectiveTimeFilterSeconds,
  getStableLastVisitTimeFilterName,
  getSelectedTimeFilterValue,
  getTimeFilterOptionValues,
  touchLastVisitTimestamp,
} from '../lib/utils/time-filter-utils';

declare global {
  interface Window {
    _5chanLastVisitTimestampIntervalId?: number;
    _5chanLastVisitTimestampSubscribers?: number;
  }
}

const ensureLastVisitTimestampTracking = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  touchLastVisitTimestamp();
  window._5chanLastVisitTimestampSubscribers = (window._5chanLastVisitTimestampSubscribers || 0) + 1;

  if (!window._5chanLastVisitTimestampIntervalId) {
    window._5chanLastVisitTimestampIntervalId = window.setInterval(() => {
      touchLastVisitTimestamp();
    }, 60 * 1000);
  }

  return () => {
    window._5chanLastVisitTimestampSubscribers = Math.max((window._5chanLastVisitTimestampSubscribers || 1) - 1, 0);
    if (window._5chanLastVisitTimestampSubscribers === 0 && window._5chanLastVisitTimestampIntervalId) {
      window.clearInterval(window._5chanLastVisitTimestampIntervalId);
      delete window._5chanLastVisitTimestampIntervalId;
    }
  };
};

const useTimeFilter = (timeFilterNameOverride?: string) => {
  const location = useLocation();

  useEffect(() => ensureLastVisitTimestampTracking(), []);

  const lastVisitTimeFilterName = getStableLastVisitTimeFilterName();
  const timeFilterValue = timeFilterNameOverride || getSelectedTimeFilterValue(location.search);
  const timeFilterName = timeFilterNameOverride || getEffectiveTimeFilterName(location.search, lastVisitTimeFilterName);
  const timeFilterSeconds = getEffectiveTimeFilterSeconds('', timeFilterName);
  const timeFilterValues = getTimeFilterOptionValues(lastVisitTimeFilterName);

  return { timeFilterSeconds, timeFilterName, timeFilterValue, timeFilterValues, lastVisitTimeFilterName };
};

export default useTimeFilter;
