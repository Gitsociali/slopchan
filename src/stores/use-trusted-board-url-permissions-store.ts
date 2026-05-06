import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TrustedBoardUrlPermission {
  createdAt: number;
  expiresAt: number | null;
  origin: string;
  site: string;
}

interface TrustedBoardUrlPermissionsState {
  trustedOrigins: Record<string, TrustedBoardUrlPermission>;
  clearAll: () => void;
  getTrustedOrigins: (now?: number) => TrustedBoardUrlPermission[];
  isOriginTrusted: (origin: string, now?: number) => boolean;
  revokeOrigin: (origin: string) => void;
  trustOrigin: (origin: string, site: string, expiresAt?: number | null, now?: number) => void;
}

const STORAGE_KEY = 'trusted-board-url-permissions-store';

const isPermissionActive = (permission: TrustedBoardUrlPermission | undefined, now: number) =>
  !!permission && (permission.expiresAt === null || permission.expiresAt > now);

const removeExpiredPermissions = (trustedOrigins: Record<string, TrustedBoardUrlPermission>, now: number) =>
  Object.fromEntries(Object.entries(trustedOrigins).filter(([, permission]) => isPermissionActive(permission, now)));

const useTrustedBoardUrlPermissionsStore = create<TrustedBoardUrlPermissionsState>()(
  persist(
    (set, get) => ({
      trustedOrigins: {},
      clearAll: () => set({ trustedOrigins: {} }),
      getTrustedOrigins: (now = Date.now()) =>
        Object.values(removeExpiredPermissions(get().trustedOrigins, now)).sort((a, b) => a.site.localeCompare(b.site) || a.origin.localeCompare(b.origin)),
      isOriginTrusted: (origin, now = Date.now()) => {
        const permission = get().trustedOrigins[origin];
        if (isPermissionActive(permission, now)) return true;
        if (permission) {
          set((state) => {
            const { [origin]: _expired, ...trustedOrigins } = state.trustedOrigins;
            return { trustedOrigins };
          });
        }
        return false;
      },
      revokeOrigin: (origin) =>
        set((state) => {
          const { [origin]: _removed, ...trustedOrigins } = state.trustedOrigins;
          return { trustedOrigins };
        }),
      trustOrigin: (origin, site, expiresAt = null, now = Date.now()) =>
        set((state) => ({
          trustedOrigins: {
            ...state.trustedOrigins,
            [origin]: {
              createdAt: now,
              expiresAt,
              origin,
              site,
            },
          },
        })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ trustedOrigins: state.trustedOrigins }),
    },
  ),
);

export default useTrustedBoardUrlPermissionsStore;
