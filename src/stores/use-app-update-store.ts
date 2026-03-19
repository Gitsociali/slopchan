import { create } from 'zustand';
import { applyAvailableAppUpdate, resolveAvailableAppUpdate, type AvailableAppUpdate } from '../lib/app-update';

interface AppUpdateState {
  availableUpdate: AvailableAppUpdate | null;
  isApplyingUpdate: boolean;
  isCheckingForUpdate: boolean;
  refreshAvailableUpdate: () => Promise<AvailableAppUpdate | null>;
  applyAppUpdate: () => Promise<void>;
}

const useAppUpdateStore = create<AppUpdateState>((set, get) => ({
  availableUpdate: null,
  isApplyingUpdate: false,
  isCheckingForUpdate: false,
  refreshAvailableUpdate: async () => {
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
