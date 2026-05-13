import { create } from 'zustand';
import { applyAvailableAppUpdate, resolveAvailableAppUpdate, type AvailableAppUpdate } from '../lib/app-update';

type AppUpdateCheckStatus = 'idle' | 'upToDate';

interface AppUpdateState {
  availableUpdate: AvailableAppUpdate | null;
  appUpdateCheckStatus: AppUpdateCheckStatus;
  isApplyingUpdate: boolean;
  isCheckingForUpdate: boolean;
  clearAppUpdateCheckStatus: () => void;
  showAppUpdateUpToDateStatus: () => void;
  refreshAvailableUpdate: () => Promise<AvailableAppUpdate | null>;
  applyAppUpdate: () => Promise<void>;
}

const UP_TO_DATE_STATUS_TIMEOUT_MS = 4000;

let appUpdateCheckStatusTimeout: ReturnType<typeof setTimeout> | null = null;

const clearAppUpdateCheckStatusTimeout = () => {
  if (appUpdateCheckStatusTimeout !== null) {
    clearTimeout(appUpdateCheckStatusTimeout);
    appUpdateCheckStatusTimeout = null;
  }
};

const scheduleAppUpdateCheckStatusClear = (clearStatus: () => void) => {
  clearAppUpdateCheckStatusTimeout();
  appUpdateCheckStatusTimeout = setTimeout(clearStatus, UP_TO_DATE_STATUS_TIMEOUT_MS);
};

const useAppUpdateStore = create<AppUpdateState>((set, get) => ({
  availableUpdate: null,
  appUpdateCheckStatus: 'idle',
  isApplyingUpdate: false,
  isCheckingForUpdate: false,
  clearAppUpdateCheckStatus: () => {
    clearAppUpdateCheckStatusTimeout();
    set({ appUpdateCheckStatus: 'idle' });
  },
  showAppUpdateUpToDateStatus: () => {
    set({ appUpdateCheckStatus: 'upToDate' });
    scheduleAppUpdateCheckStatusClear(get().clearAppUpdateCheckStatus);
  },
  refreshAvailableUpdate: async () => {
    get().clearAppUpdateCheckStatus();
    set({ isCheckingForUpdate: true });
    try {
      const availableUpdate = await resolveAvailableAppUpdate();
      set({ availableUpdate });
      return availableUpdate;
    } finally {
      set({ isCheckingForUpdate: false });
    }
  },
  applyAppUpdate: async () => {
    const availableUpdate = get().availableUpdate;
    if (!availableUpdate) {
      return;
    }

    set({ isApplyingUpdate: true });
    try {
      await applyAvailableAppUpdate(availableUpdate);
    } finally {
      set({ isApplyingUpdate: false });
    }
  },
}));

export default useAppUpdateStore;
