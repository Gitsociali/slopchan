import { useEffect, useRef } from 'react';

interface UseSuggestionFeedLoaderOptions {
  currentFeedLength: number;
  feedLength: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  requestKey: string;
  shouldLoad: boolean;
}

const EMPTY_REQUEST_KEY = '';

export const useSuggestionFeedLoader = ({ currentFeedLength, feedLength, hasMore, loadMore, requestKey, shouldLoad }: UseSuggestionFeedLoaderOptions) => {
  const lastRequestKeyRef = useRef(EMPTY_REQUEST_KEY);

  useEffect(() => {
    if (!shouldLoad || !requestKey || !hasMore || feedLength > currentFeedLength) {
      lastRequestKeyRef.current = EMPTY_REQUEST_KEY;
      return;
    }

    const nextRequestKey = `${requestKey}:${currentFeedLength}:${feedLength}`;
    if (lastRequestKeyRef.current === nextRequestKey) {
      return;
    }

    lastRequestKeyRef.current = nextRequestKey;
    void loadMore();
  }, [currentFeedLength, feedLength, hasMore, loadMore, requestKey, shouldLoad]);
};
