export * from './types.js';
export * from './config.js';
export * from './server.js';

export const TRANSPORT_MUX_RUNTIME = {
  packageName: '@a5c-ai/transport-mux',
  status: 'contract-runtime',
  publishable: false,
  cutoverComplete: false,
} as const;

export const TRANSPORT_MUX_PACKAGE = TRANSPORT_MUX_RUNTIME.packageName;
