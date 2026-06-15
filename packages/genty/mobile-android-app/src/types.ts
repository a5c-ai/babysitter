export type StoredGatewayAuth = {
  gatewayUrl: string;
  token: string;
};

export type PairingPayload = {
  url: string;
  token?: string;
  code?: string;
  pushTargets?: string[];
};

export type HookNotificationPayload = {
  type: 'hook.request';
  runId: string;
  hookRequestId: string;
  kind: string;
  compact?: string;
  gatewayUrl: string;
  token?: string;
};
