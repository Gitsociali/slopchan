const DEFAULT_FAVICON = '/favicon.ico?variant=nsfw';
const SFW_FAVICON = '/favicon2.ico?variant=sfw';
const FAVICON_RELS = ['icon', 'shortcut icon'] as const;
const FAVICON_SELECTOR = ['link[data-fivechan-tab-favicon="true"]', ...FAVICON_RELS.map((rel) => `link[rel="${rel}"][sizes="16x16"]`)].join(', ');

let currentHref: string | null = null;

const hasExpectedFaviconLinks = (href: string): boolean =>
  FAVICON_RELS.every((rel) => document.querySelector(`link[rel="${rel}"][href="${href}"][data-fivechan-tab-favicon="true"]`));

const createFaviconLink = (rel: (typeof FAVICON_RELS)[number], href: string): HTMLLinkElement => {
  const link = document.createElement('link');
  link.rel = rel;
  link.type = 'image/png';
  link.setAttribute('sizes', '16x16');
  link.href = href;
  link.dataset.fivechanTabFavicon = 'true';
  return link;
};

/**
 * Swap the tab favicon between the default (NSFW/home) and SFW variants.
 * Uses remove-and-recreate plus cache-busted URLs to bypass sticky favicon caching.
 */
export const updateFavicon = (isSfw: boolean): void => {
  const href = isSfw ? SFW_FAVICON : DEFAULT_FAVICON;
  if (href === currentHref && hasExpectedFaviconLinks(href)) return;
  currentHref = href;

  document.querySelectorAll<HTMLLinkElement>(FAVICON_SELECTOR).forEach((link) => link.remove());
  FAVICON_RELS.forEach((rel) => {
    document.head.appendChild(createFaviconLink(rel, href));
  });
};

/**
 * Determine whether the current navigation context is a SFW board.
 *
 * Pure function — no hooks, no side-effects, fully testable.
 */
export const isSfwBoard = ({
  pathname,
  isSpecialTheme,
  isInAllView,
  isInSubscriptionsView,
  isInModView,
  communityAddress,
  directories,
}: {
  pathname: string;
  isSpecialTheme: boolean;
  isInAllView: boolean;
  isInSubscriptionsView: boolean;
  isInModView: boolean;
  communityAddress: string | undefined;
  directories: { address: string; nsfw?: boolean }[];
}): boolean => {
  if (pathname === '/' || pathname.startsWith('/rules')) return false;
  if (isSpecialTheme) return false;
  if (isInAllView || isInSubscriptionsView || isInModView) return false;

  if (!communityAddress) return false;

  const entry = directories.find((d) => d.address === communityAddress);
  return !entry?.nsfw;
};
