/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare interface ImportMetaEnv {
  readonly VITE_COMMIT_REF: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_DISTRIBUTION?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
