import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './interface-settings.module.css';
import capitalize from 'lodash/capitalize';
import useExpandedMediaStore from '../../../stores/use-expanded-media-store';
import useFeedViewSettingsStore from '../../../stores/use-feed-view-settings-store';
import Version from '../../version';
import StyleSelector from '../../style-selector/style-selector';
import { INTERFACE_LANGUAGE_STORAGE_KEY, SUPPORTED_INTERFACE_LANGUAGES } from '../../../lib/constants';
import useAppUpdateStore from '../../../stores/use-app-update-store';

const UpdateButton = () => {
  const { t } = useTranslation();
  const availableUpdate = useAppUpdateStore((state) => state.availableUpdate);
  const isApplyingUpdate = useAppUpdateStore((state) => state.isApplyingUpdate);
  const isCheckingForUpdate = useAppUpdateStore((state) => state.isCheckingForUpdate);
  const applyAppUpdate = useAppUpdateStore((state) => state.applyAppUpdate);
  const refreshAvailableUpdate = useAppUpdateStore((state) => state.refreshAvailableUpdate);

  const handleUpdateAction = async () => {
    try {
      if (availableUpdate) {
        await applyAppUpdate();
        return;
      }

      await refreshAvailableUpdate();
    } catch (error) {
      alert(String(error));
    }
  };
  const buttonLabel = availableUpdate ? t('download') : t('check');
  const isBusy = isApplyingUpdate || isCheckingForUpdate;

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

const InterfaceLanguage = () => {
  const { i18n } = useTranslation();
  const { changeLanguage, language } = i18n;

  const onSelectLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = e.target.value;
    localStorage.setItem(INTERFACE_LANGUAGE_STORAGE_KEY, selectedLanguage);
    changeLanguage(selectedLanguage);
  };

  return (
    <div className={styles.languageSettings}>
      <select value={language} onChange={onSelectLanguage}>
        {SUPPORTED_INTERFACE_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
};

const InterfaceSettings = () => {
  const { t } = useTranslation();
  const { fitExpandedImagesToScreen, setFitExpandedImagesToScreen, setUnmuteExpandedVideoSound, unmuteExpandedVideoSound } = useExpandedMediaStore();
  const { enableInfiniteScroll, setEnableInfiniteScroll } = useFeedViewSettingsStore();

  return (
    <div className={styles.interfaceSettings}>
      <div className={styles.version}>
        {capitalize(t('version'))}: <Version />
      </div>
      <div className={styles.setting}>
        {capitalize(t('update'))}: <UpdateButton />
      </div>
      <div className={styles.setting}>
        {capitalize(t('interface_language'))}: <InterfaceLanguage />
      </div>
      <div className={styles.setting}>
        {capitalize(t('style'))}: <StyleSelector />
      </div>
      <div className={styles.setting}>
        <label>
          <input type='checkbox' checked={fitExpandedImagesToScreen} onChange={(e) => setFitExpandedImagesToScreen(e.target.checked)} />
          {capitalize(t('fit_expanded_images_to_screen'))}
        </label>
        <div className={styles.settingTip}>{capitalize(t('fit_expanded_images_to_screen_tip'))}</div>
      </div>
      <div className={styles.setting}>
        <label>
          <input type='checkbox' checked={unmuteExpandedVideoSound} onChange={(e) => setUnmuteExpandedVideoSound(e.target.checked)} />
          {capitalize(t('unmute_video_sound'))}
        </label>
        <div className={styles.settingTip}>{capitalize(t('unmute_video_sound_tip'))}</div>
      </div>
      <div className={styles.setting}>
        <label>
          <input type='checkbox' checked={enableInfiniteScroll} onChange={(e) => setEnableInfiniteScroll(e.target.checked)} />
          {capitalize(t('enable_infinite_scroll'))}
        </label>
        <div className={styles.settingTip}>{capitalize(t('enable_infinite_scroll_tip'))}</div>
      </div>
    </div>
  );
};

export default memo(InterfaceSettings);
