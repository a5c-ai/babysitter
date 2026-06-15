/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND?: 'mock' | 'real';
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_GATEWAY_TOKEN?: string;
  // Kradle control plane (SPEC-KRADLE-CONTROLPLANE §4.1, AC16).
  readonly VITE_KRADLE_API_URL?: string;
  readonly VITE_KRADLE_TOKEN?: string;
  readonly VITE_KRADLE_ORG?: string;
  readonly VITE_KRADLE_REPO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
