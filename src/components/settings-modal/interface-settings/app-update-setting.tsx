import { useTranslation } from 'react-i18next';
import capitalize from 'lodash/capitalize';
import styles from './interface-settings.module.css';
import useAppUpdateStore from '../../../stores/use-app-update-store';

const UpdateButton = () => {
  const { t } = useTranslation();
  const availableUpdate = useAppUpdateStore((state) => state.availableUpdate);
  const isApplyingUpdate = useAppUpdateStore((state) => state.isApplyingUpdate);
  const isCheckingForUpdate = useAppUpdateStore((state) => state.isCheckingForUpdate);
  const appUpdateCheckStatus = useAppUpdateStore((state) => state.appUpdateCheckStatus);
  const applyAppUpdate = useAppUpdateStore((state) => state.applyAppUpdate);
  const refreshAvailableUpdate = useAppUpdateStore((state) => state.refreshAvailableUpdate);
  const showAppUpdateUpToDateStatus = useAppUpdateStore((state) => state.showAppUpdateUpToDateStatus);

  const handleUpdateAction = async () => {
    try {
      if (availableUpdate) {
        await applyAppUpdate();
        return;
      }

      const update = await refreshAvailableUpdate();
      if (!update) {
        showAppUpdateUpToDateStatus();
      }
    } catch (error) {
      alert(String(error));
    }
  };
  const buttonLabel = availableUpdate ? t('download') : t('check');
  const isBusy = isApplyingUpdate || isCheckingForUpdate;
  const shouldShowUpToDateStatus = !isCheckingForUpdate && !availableUpdate && appUpdateCheckStatus === 'upToDate';

  return (
    <>
      <button type='button' onClick={handleUpdateAction} disabled={isBusy}>
        {capitalize(buttonLabel)}
      </button>
      {isCheckingForUpdate && (
        <span className={styles.updateStatus} aria-live='polite'>
          {t('checking_for_updates')}
        </span>
      )}
      {shouldShowUpToDateStatus && (
        <span className={styles.updateStatus} aria-live='polite'>
          {t('app_is_up_to_date')}
        </span>
      )}
      {!isCheckingForUpdate && availableUpdate && (
        <span className={styles.updateStatus} aria-live='polite'>
          {t('new_version_found')}:&nbsp;
          <a href={availableUpdate.releaseUrl} target='_blank' rel='noopener noreferrer'>
            v{availableUpdate.targetVersion}
          </a>
        </span>
      )}
    </>
  );
};

const AppUpdateSetting = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.setting}>
      {capitalize(t('update'))}: <UpdateButton />
    </div>
  );
};

export default AppUpdateSetting;
