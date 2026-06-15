import { NativeModules } from 'react-native';

import type { StoredGatewayAuth } from '../types.js';

type SecureTokenStoreModule = {
  read(host: string): Promise<StoredGatewayAuth | null>;
  write(host: string, gatewayUrl: string, token: string): Promise<void>;
  clear(host: string): Promise<void>;
};

const secureTokenStore = NativeModules.SecureTokenStore as SecureTokenStoreModule | undefined;

export async function readGatewayAuth(host: string): Promise<StoredGatewayAuth | null> {
  if (!secureTokenStore) {
    return null;
  }
  return await secureTokenStore.read(host);
}

export async function writeGatewayAuth(auth: StoredGatewayAuth): Promise<void> {
  if (!secureTokenStore) {
    return;
  }
  await secureTokenStore.write(auth.gatewayUrl, auth.gatewayUrl, auth.token);
}

export async function clearGatewayAuth(host: string): Promise<void> {
  if (!secureTokenStore) {
    return;
  }
  await secureTokenStore.clear(host);
}
