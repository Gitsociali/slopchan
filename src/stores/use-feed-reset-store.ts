import { create } from 'zustand';

interface FeedResetState {
  reset: (() => void) | null;
  currentResetFunction: (() => void) | null;
  setResetFunction: (resetFunction: () => void) => void;
}

const invokeCurrentResetFunction = () => {
  useFeedResetStore.getState().currentResetFunction?.();
};

const useFeedResetStore = create<FeedResetState>((set) => ({
  reset: null,
  currentResetFunction: null,
  setResetFunction: (resetFunction) =>
    set((state) =>
      state.currentResetFunction === resetFunction && state.reset
        ? state
        : {
            currentResetFunction: resetFunction,
            reset: state.reset ?? invokeCurrentResetFunction,
          },
    ),
}));

export default useFeedResetStore;
