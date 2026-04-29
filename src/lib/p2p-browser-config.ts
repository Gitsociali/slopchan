export const P2P_BROWSER_PKC_OPTIONS = {
  libp2pJsClientsOptions: [{ key: 'libp2pjs' }],
  httpRoutersOptions: ['https://peers.pleb.bot', 'https://peers.forumindex.com'],
};

type P2PBrowserConfigWindow = {
  location: Pick<Location, 'hostname'>;
  defaultPkcOptions?: Record<string, unknown>;
};

export const isP2PBrowserHostname = (hostname: string) => hostname.toLowerCase().startsWith('p2p.');

export const configureP2PBrowserPkcOptions = (targetWindow: P2PBrowserConfigWindow = window) => {
  if (!isP2PBrowserHostname(targetWindow.location.hostname)) {
    return false;
  }

  targetWindow.defaultPkcOptions = {
    ...targetWindow.defaultPkcOptions,
    libp2pJsClientsOptions: P2P_BROWSER_PKC_OPTIONS.libp2pJsClientsOptions.map((options) => ({ ...options })),
    httpRoutersOptions: [...P2P_BROWSER_PKC_OPTIONS.httpRoutersOptions],
  };

  return true;
};
