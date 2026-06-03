import { randomBytes } from "node:crypto";

import type { AuthBootstrapResult, CloudConfig, KubernetesManifest } from "../types.js";

function makeSecretManifest(namespace: string, secretName: string, data: Record<string, string>): KubernetesManifest {
  return {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: secretName,
      namespace,
      labels: {
        "app.kubernetes.io/name": "cloud-bootstrap-auth",
        "app.kubernetes.io/part-of": "babysitter-cloud",
      },
    },
    type: "Opaque",
    stringData: data,
  };
}

function generateOpaqueSecret(): string {
  return randomBytes(18).toString("base64url");
}

export function bootstrapAuth(config: CloudConfig): AuthBootstrapResult {
  const secretName = `${config.namespace}-bootstrap-auth`;
  const username = config.auth.adminUsername;
  const password = config.auth.defaultAdminPassword
    ?? (config.auth.mode === "local-dev" ? "admin" : generateOpaqueSecret());
  const tokenSeed = generateOpaqueSecret();
  const manifest = makeSecretManifest(config.namespace, secretName, {
    ADMIN_USERNAME: username,
    ADMIN_PASSWORD: password,
    ADMIN_TOKEN_SEED: tokenSeed,
    AUTH_MODE: config.auth.mode,
    ...(config.auth.adminPasswordSecretRef ? { EXTERNAL_PASSWORD_SECRET_REF: config.auth.adminPasswordSecretRef } : {}),
  });

  return {
    secretName,
    username,
    password,
    tokenSeed,
    manifests: [manifest],
    env: {
      CLOUD_BOOTSTRAP_AUTH_SECRET: secretName,
      CLOUD_BOOTSTRAP_ADMIN_USERNAME: username,
      CLOUD_BOOTSTRAP_AUTH_MODE: config.auth.mode,
    },
  };
}

