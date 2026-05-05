import { memo, RefObject, useRef, useState } from 'react';
import { setAccount, useAccount, usePkcRpcSettings } from '@bitsocial/bitsocial-react-hooks';
import { useTranslation } from 'react-i18next';
import styles from './advanced-settings.module.css';

interface SettingsProps {
  ipfsGatewayUrlsRef?: RefObject<HTMLTextAreaElement>;
  mediaIpfsGatewayUrlRef?: RefObject<HTMLInputElement>;
  pubsubProvidersRef?: RefObject<HTMLTextAreaElement>;
  httpRoutersRef?: RefObject<HTMLTextAreaElement>;
  ethRpcRef?: RefObject<HTMLTextAreaElement>;
  p2pRpcRef?: RefObject<HTMLInputElement>;
  p2pDataPathRef?: RefObject<HTMLInputElement>;
}

type AccountProtocolOptions = {
  chainProviders?: Record<string, { urls?: string[]; chainId: number }>;
  dataPath?: string;
  httpRoutersOptions?: string[];
  ipfsGatewayUrls?: string[];
  pkcRpcClientsOptions?: string[];
  pubsubHttpClientsOptions?: string[];
  pubsubKuboRpcClientsOptions?: string[];
};

type AccountShape = {
  chainProviders?: AccountProtocolOptions['chainProviders'];
  mediaIpfsGatewayUrl?: string;
  pkcOptions?: AccountProtocolOptions;
};

type RpcSettingsShape = {
  pkcOptions?: { dataPath?: string };
};

const getProtocolOptions = (account?: AccountShape) => account?.pkcOptions;

const getChainProviders = (account?: AccountShape) => account?.chainProviders ?? getProtocolOptions(account)?.chainProviders;

const getNodeRpcClientsOptions = (protocolOptions?: AccountProtocolOptions) => protocolOptions?.pkcRpcClientsOptions;

const getPubsubRpcClientsOptions = (protocolOptions?: AccountProtocolOptions) =>
  protocolOptions?.pubsubKuboRpcClientsOptions ?? protocolOptions?.pubsubHttpClientsOptions;

const getRpcSettingsDataPath = (rpcSettings?: RpcSettingsShape) => rpcSettings?.pkcOptions?.dataPath ?? '';

const IPFSGatewaysSettings = ({ ipfsGatewayUrlsRef, mediaIpfsGatewayUrlRef }: SettingsProps) => {
  const account = useAccount() as AccountShape | undefined;
  const protocolOptions = getProtocolOptions(account);
  const { ipfsGatewayUrls } = protocolOptions || {};
  const { mediaIpfsGatewayUrl } = account || {};
  const pkcRpc = usePkcRpcSettings();
  const isConnectedToRpc = pkcRpc?.state === 'connected';
  const ipfsGatewayUrlsDefaultValue = ipfsGatewayUrls?.join('\n');

  return (
    <div className={styles.ipfsGatewaysSettings}>
      <div className={styles.ipfsGatewaysSetting}>
        <textarea
          defaultValue={ipfsGatewayUrlsDefaultValue}
          ref={ipfsGatewayUrlsRef}
          disabled={isConnectedToRpc}
          autoCorrect='off'
          autoComplete='off'
          spellCheck='false'
          rows={ipfsGatewayUrls?.length || 1}
        />
      </div>
      <span className={styles.settingTip}>media IPFS gateway</span>
      <div>
        <input
          type='text'
          defaultValue={mediaIpfsGatewayUrl}
          ref={mediaIpfsGatewayUrlRef}
          disabled={isConnectedToRpc}
          autoCorrect='off'
          autoCapitalize='off'
          spellCheck='false'
        />
      </div>
    </div>
  );
};

const PubsubProvidersSettings = ({ pubsubProvidersRef }: SettingsProps) => {
  const account = useAccount() as AccountShape | undefined;
  const protocolOptions = getProtocolOptions(account);
  const pubsubKuboRpcClientsOptions = getPubsubRpcClientsOptions(protocolOptions);
  const pkcRpc = usePkcRpcSettings();
  const isConnectedToRpc = pkcRpc?.state === 'connected';
  const pubsubProvidersDefaultValue = pubsubKuboRpcClientsOptions?.join('\n');

  return (
    <div className={styles.pubsubProvidersSettings}>
      <textarea
        defaultValue={pubsubProvidersDefaultValue}
        ref={pubsubProvidersRef}
        disabled={isConnectedToRpc}
        autoCorrect='off'
        autoCapitalize='off'
        autoComplete='off'
        spellCheck='false'
        rows={pubsubKuboRpcClientsOptions?.length || 1}
      />
    </div>
  );
};

const HttpRoutersSettings = ({ httpRoutersRef }: SettingsProps) => {
  const account = useAccount() as AccountShape | undefined;
  const protocolOptions = getProtocolOptions(account);
  const { httpRoutersOptions } = protocolOptions || {};
  const pkcRpc = usePkcRpcSettings();
  const isConnectedToRpc = pkcRpc?.state === 'connected';
  const httpRoutersDefaultValue = httpRoutersOptions?.join('\n');

  return (
    <div className={styles.httpRoutersSettings}>
      <textarea
        defaultValue={httpRoutersDefaultValue}
        ref={httpRoutersRef}
        disabled={isConnectedToRpc}
        autoCorrect='off'
        autoCapitalize='off'
        autoComplete='off'
        spellCheck='false'
        rows={httpRoutersOptions?.length || 1}
      />
    </div>
  );
};

const BlockchainProvidersSettings = ({ ethRpcRef }: SettingsProps) => {
  const account = useAccount() as AccountShape | undefined;
  const chainProviders = getChainProviders(account);
  const ethRpcDefaultValue = chainProviders?.['eth']?.urls?.join('\n');

  return (
    <div className={styles.blockchainProvidersSettings}>
      <span className={styles.settingTip}>Ethereum RPC, for .eth domains</span>
      <div>
        <textarea
          defaultValue={ethRpcDefaultValue}
          ref={ethRpcRef}
          autoCorrect='off'
          autoComplete='off'
          spellCheck='false'
          rows={chainProviders?.['eth']?.urls?.length || 1}
        />
      </div>
    </div>
  );
};

const P2pRPCSettings = ({ p2pRpcRef }: SettingsProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const account = useAccount() as AccountShape | undefined;
  const protocolOptions = getProtocolOptions(account);
  const pkcRpcClientsOptions = getNodeRpcClientsOptions(protocolOptions);

  return (
    <div className={styles.p2pRPCSettings}>
      <div>
        <input type='text' defaultValue={pkcRpcClientsOptions} ref={p2pRpcRef} autoCorrect='off' autoCapitalize='off' spellCheck='false' />
        <button onClick={() => setShowInfo(!showInfo)}>{showInfo ? 'X' : '?'}</button>
      </div>
      {showInfo && (
        <div className={styles.p2pRpcSettingsInfo}>
          use a P2P full node locally, or remotely with SSL
          <br />
          <ol>
            <li>get secret auth key from the node</li>
            <li>get IP address and port used by the node</li>
            <li>
              enter: <code>{`ws://<IP>:<port>/<secretAuthKey>`}</code>
            </li>
            <li>click save to connect</li>
          </ol>
        </div>
      )}
    </div>
  );
};

const P2pDataPathSettings = ({ p2pDataPathRef }: SettingsProps) => {
  const pkcRpc = usePkcRpcSettings();
  const { pkcRpcSettings } = pkcRpc || {};
  const isConnectedToRpc = pkcRpc?.state === 'connected';
  const path = getRpcSettingsDataPath(pkcRpcSettings as RpcSettingsShape | undefined);

  return (
    <div className={styles.p2pDataPathSettings}>
      <div>
        <input autoCorrect='off' autoCapitalize='off' spellCheck='false' type='text' defaultValue={path} disabled={!isConnectedToRpc} ref={p2pDataPathRef} />
      </div>
    </div>
  );
};

const isElectron = window.electronApi?.isElectron === true;

const AdvancedSettings = () => {
  const { t } = useTranslation();
  const account = useAccount() as AccountShape | undefined;
  const protocolOptions = getProtocolOptions(account);

  const ipfsGatewayUrlsRef = useRef<HTMLTextAreaElement>(null);
  const mediaIpfsGatewayUrlRef = useRef<HTMLInputElement>(null);
  const pubsubProvidersRef = useRef<HTMLTextAreaElement>(null);
  const ethRpcRef = useRef<HTMLTextAreaElement>(null);
  const httpRoutersRef = useRef<HTMLTextAreaElement>(null);
  const p2pRpcRef = useRef<HTMLInputElement>(null);
  const p2pDataPathRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const ipfsGatewayUrls = ipfsGatewayUrlsRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const mediaIpfsGatewayUrl = mediaIpfsGatewayUrlRef.current?.value.trim();

    const pubsubKuboRpcClientsOptions = pubsubProvidersRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const ethRpcUrls = ethRpcRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const httpRoutersOptions = httpRoutersRef.current?.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');

    const pkcRpcClientsOptions = p2pRpcRef.current?.value.trim() ? [p2pRpcRef.current.value.trim()] : undefined;
    const dataPath = p2pDataPathRef.current?.value.trim() || undefined;

    const chainProviders: Record<string, { urls: string[] | undefined; chainId: number }> = {};
    if (ethRpcUrls && ethRpcUrls.length > 0) {
      chainProviders.eth = { urls: ethRpcUrls, chainId: 1 };
    }

    try {
      await setAccount({
        ...account,
        mediaIpfsGatewayUrl,
        chainProviders,
        pkcOptions: {
          ...protocolOptions,
          ipfsGatewayUrls,
          pubsubKuboRpcClientsOptions,
          httpRoutersOptions,
          pkcRpcClientsOptions,
          dataPath,
        },
      });
      alert('Options saved, reloading...');
      window.location.reload();
    } catch (e) {
      if (e instanceof Error) {
        alert('Error saving options: ' + e.message);
        console.log(e);
      } else {
        alert('Error');
      }
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.category}>
        <span className={styles.categoryTitle}>IPFS gateways:</span>
        <span className={styles.categorySettings}>
          <IPFSGatewaysSettings ipfsGatewayUrlsRef={ipfsGatewayUrlsRef} mediaIpfsGatewayUrlRef={mediaIpfsGatewayUrlRef} />
        </span>
      </div>
      <div className={styles.category}>
        <span className={styles.categoryTitle}>pubsub providers:</span>
        <span className={styles.categorySettings}>
          <PubsubProvidersSettings pubsubProvidersRef={pubsubProvidersRef} />
        </span>
      </div>
      <div className={styles.category}>
        <span className={styles.categoryTitle}>http routers:</span>
        <span className={styles.categorySettings}>
          <HttpRoutersSettings httpRoutersRef={httpRoutersRef} />
        </span>
      </div>
      <div className={styles.category}>
        <span className={styles.categoryTitle} style={{ marginBottom: '-5px' }}>
          blockchain providers:
        </span>
        <span className={styles.categorySettings}>
          <BlockchainProvidersSettings ethRpcRef={ethRpcRef} />
        </span>
      </div>
      <div className={styles.category}>
        <span className={styles.categoryTitle}>Node RPC:</span>
        <span className={styles.categorySettings}>
          <P2pRPCSettings p2pRpcRef={p2pRpcRef} />
        </span>
      </div>
      {isElectron && (
        <div className={styles.category}>
          <span className={styles.categoryTitle}>p2p data path:</span>
          <span className={styles.categorySettings}>
            <P2pDataPathSettings p2pDataPathRef={p2pDataPathRef} />
          </span>
        </div>
      )}
      <button className={styles.saveOptions} onClick={handleSave}>
        {t('save_advanced_settings')}
      </button>
    </div>
  );
};

export default memo(AdvancedSettings);
