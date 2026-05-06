import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useTrustedBoardUrlPermissionsStore from '../../../stores/use-trusted-board-url-permissions-store';
import styles from './trusted-board-links-setting.module.css';

const TrustedBoardLinksSetting = () => {
  const { t } = useTranslation();
  const trustedOriginsByOrigin = useTrustedBoardUrlPermissionsStore((state) => state.trustedOrigins);
  const revokeOrigin = useTrustedBoardUrlPermissionsStore((state) => state.revokeOrigin);
  const trustedOrigins = useMemo(
    () => Object.values(trustedOriginsByOrigin).sort((a, b) => a.site.localeCompare(b.site) || a.origin.localeCompare(b.origin)),
    [trustedOriginsByOrigin],
  );

  return (
    <div className={styles.trustedBoardLinks}>
      <div className={styles.description}>{t('trusted_board_links_intro')}</div>
      {trustedOrigins.length ? (
        <ul className={styles.list}>
          {trustedOrigins.map((permission) => (
            <li key={permission.origin} className={styles.item}>
              <span className={styles.site}>
                {permission.site} <span className={styles.expiry}>({t('trusted_board_link_until_revoked')})</span>
              </span>
              <button type='button' onClick={() => revokeOrigin(permission.origin)}>
                {t('revoke')}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>{t('trusted_board_links_empty')}</div>
      )}
    </div>
  );
};

export default memo(TrustedBoardLinksSetting);
