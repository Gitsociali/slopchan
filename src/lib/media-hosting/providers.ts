import type { MediaHostingRuntime, ProviderId } from './types';

interface ProviderDefinition {
  id: ProviderId;
  label: string;
  homepageUrl: string;
  /** Image URLs used to detect whether this provider is reachable from the user's network. */
  availabilityProbeUrls: readonly string[];
  /** Runtimes where automated upload is supported (non-web = no interactive fallback) */
  supportedRuntimes: readonly MediaHostingRuntime[];
}

/** All media hosting providers with metadata */
export const MEDIA_HOSTING_PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: 'catbox',
    label: 'Catbox',
    homepageUrl: 'https://catbox.moe',
    availabilityProbeUrls: ['https://catbox.moe/pictures/logo.png', 'https://files.catbox.moe/8ten4y.png'],
    supportedRuntimes: ['web', 'electron', 'android'],
  },
  {
    id: 'imgur',
    label: 'Imgur',
    homepageUrl: 'https://imgur.com',
    availabilityProbeUrls: ['https://s.imgur.com/images/favicon-32x32.png', 'https://i.imgur.com/YpB7qfa.jpg'],
    supportedRuntimes: ['electron'],
  },
  {
    id: 'imgbb',
    label: 'ImgBB',
    homepageUrl: 'https://imgbb.com',
    availabilityProbeUrls: ['https://simgbb.com/images/logo.png', 'https://i.ibb.co/7Jsq00V5/spoiler.png'],
    supportedRuntimes: ['electron', 'android'],
  },
] as const;
