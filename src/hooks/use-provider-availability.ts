import { useSyncExternalStore } from 'react';
import type { MediaHostingRuntime } from '../lib/media-hosting/types';
import { getProviderAvailabilitySnapshot, subscribeProviderAvailability } from '../lib/media-hosting/provider-availability';

export function useProviderAvailability(runtime: MediaHostingRuntime) {
  return useSyncExternalStore((listener) => subscribeProviderAvailability(listener, runtime), getProviderAvailabilitySnapshot, getProviderAvailabilitySnapshot);
}
