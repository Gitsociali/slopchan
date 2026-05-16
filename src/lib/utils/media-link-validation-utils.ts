import { getExpiringMediaLinkHostname } from './url-utils';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export const getExpiringMediaLinkAlert = (url: string, t: TranslateFn): string | null => {
  const expiringMediaLinkHostname = getExpiringMediaLinkHostname(url);
  return expiringMediaLinkHostname ? `${t('error')}: ${t('expiring_media_link_alert', { domain: expiringMediaLinkHostname })}` : null;
};
