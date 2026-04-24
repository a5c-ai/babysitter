export * from './types.js';
export * from './config.js';
export * from './server.js';
export * from './runtime.js';

export const TRANSPORT_MUX_RUNTIME = {
  packageName: '@a5c-ai/transport-mux',
  status: 'launcher-owned-runtime',
  executable: true,
  launcherIntegrated: true,
  cutoverComplete: false,
} as const;

export const TRANSPORT_MUX_PACKAGE = TRANSPORT_MUX_RUNTIME.packageName;
