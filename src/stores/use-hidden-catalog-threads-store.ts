import { create } from 'zustand';
import type { Comment } from '@bitsocial/bitsocial-react-hooks';

interface HiddenCatalogThreadsStore {
  hiddenCommentsByCid: Record<string, Comment>;
  scopeHiddenThreadsCounts: Record<string, number>;
  shownScopeKey: string | null;
  forgetHiddenComment: (cid: string) => void;
  rememberHiddenComment: (comment: Comment | undefined) => void;
  setScopeHiddenThreadsCount: (scopeKey: string, count: number) => void;
  setShownScopeKey: (shownScopeKey: string | null) => void;
  toggleShownScopeKey: (scopeKey: string) => void;
}

const useHiddenCatalogThreadsStore = create<HiddenCatalogThreadsStore>((set) => ({
  hiddenCommentsByCid: {},
  forgetHiddenComment: (cid) =>
    set((state) => {
      if (!cid || !state.hiddenCommentsByCid[cid]) {
        return state;
      }
      const nextHiddenComments = { ...state.hiddenCommentsByCid };
      delete nextHiddenComments[cid];
      return { hiddenCommentsByCid: nextHiddenComments };
    }),
  rememberHiddenComment: (comment) =>
    set((state) => {
      const cid = comment?.cid;
      if (!cid) {
        return state;
      }
      return {
        hiddenCommentsByCid: {
          ...state.hiddenCommentsByCid,
          [cid]: comment,
        },
      };
    }),
  scopeHiddenThreadsCounts: {},
  setScopeHiddenThreadsCount: (scopeKey, count) =>
    set((state) => {
      const nextCounts = { ...state.scopeHiddenThreadsCounts };
      if (!scopeKey || count <= 0) {
        delete nextCounts[scopeKey];
      } else {
        nextCounts[scopeKey] = count;
      }
      return { scopeHiddenThreadsCounts: nextCounts };
    }),
  shownScopeKey: null,
  setShownScopeKey: (shownScopeKey) => set({ shownScopeKey }),
  toggleShownScopeKey: (scopeKey) => set((state) => ({ shownScopeKey: state.shownScopeKey === scopeKey ? null : scopeKey })),
}));

export default useHiddenCatalogThreadsStore;
