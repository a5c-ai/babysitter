import * as Keychain from 'react-native-keychain';

import type { StoredGatewayAuth } from '../types.js';

const ACCESS_GROUP = 'group.ai.a5c.amux';
const KEY_PREFIX = 'amux.gateway.';

function serviceForHost(host: string): string {
  return `${KEY_PREFIX}${host.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
}

export async function readGatewayAuth(host: string): Promise<StoredGatewayAuth | null> {
  const credentials = await Keychain.getGenericPassword({
    service: serviceForHost(host),
    accessGroup: ACCESS_GROUP,
    authenticationPrompt: {
      title: 'Unlock AgentMux',
      subtitle: 'Use Face ID or Touch ID to restore your gateway token.',
    },
  });
  if (!credentials) {
    return null;
  }
  return {
    gatewayUrl: credentials.username,
    token: credentials.password,
  };
}

export async function writeGatewayAuth(auth: StoredGatewayAuth): Promise<void> {
  await Keychain.setGenericPassword(auth.gatewayUrl, auth.token, {
    service: serviceForHost(auth.gatewayUrl),
    accessGroup: ACCESS_GROUP,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
  });
}

export async function clearGatewayAuth(host: string): Promise<void> {
  await Keychain.resetGenericPassword({
    service: serviceForHost(host),
    accessGroup: ACCESS_GROUP,
  });
}
