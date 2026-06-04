import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = dirname(fileURLToPath(import.meta.url));

const monorepoRoot = join(webRoot, '../../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ['@nats-io/transport-node', '@nats-io/jetstream'],
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      '@a5c-ai/kradle-sdk': '../sdk/src/index.js',
      '@a5c-ai/comm-adapter/automation': join(monorepoRoot, 'packages/adapters/core/src/automation.ts'),
      '@a5c-ai/comm-adapter/kanban': join(monorepoRoot, 'packages/adapters/core/src/kanban.ts'),
      '@a5c-ai/comm-adapter/browser': join(monorepoRoot, 'packages/adapters/core/src/browser.ts'),
      '@a5c-ai/comm-adapter': join(monorepoRoot, 'packages/adapters/core/src/index.ts'),
      '@a5c-ai/tula-ui/gateway': join(monorepoRoot, 'packages/tula/ui/src/gateway.ts'),
      '@a5c-ai/tula-ui/session-flow': join(monorepoRoot, 'packages/tula/ui/src/session-flow.ts'),
      '@a5c-ai/tula-ui': join(monorepoRoot, 'packages/tula/ui/src/index.ts'),
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

nextConfig.webpack = (config, { isServer }) => {
  config.resolve.alias['@a5c-ai/kradle-sdk'] = join(webRoot, '../sdk/src/index.js');
  config.resolve.alias['@a5c-ai/comm-adapter/automation'] = join(monorepoRoot, 'packages/adapters/core/src/automation.ts');
  config.resolve.alias['@a5c-ai/comm-adapter/kanban'] = join(monorepoRoot, 'packages/adapters/core/src/kanban.ts');
  config.resolve.alias['@a5c-ai/comm-adapter/browser'] = join(monorepoRoot, 'packages/adapters/core/src/browser.ts');
  config.resolve.alias['@a5c-ai/comm-adapter'] = join(monorepoRoot, 'packages/adapters/core/src/index.ts');
  config.resolve.alias['@a5c-ai/tula-ui/gateway'] = join(monorepoRoot, 'packages/tula/ui/src/gateway.ts');
  config.resolve.alias['@a5c-ai/tula-ui/session-flow'] = join(monorepoRoot, 'packages/tula/ui/src/session-flow.ts');
  config.resolve.alias['@a5c-ai/tula-ui'] = join(monorepoRoot, 'packages/tula/ui/src/index.ts');
  if (isServer) {
    config.externals = config.externals || [];
    config.externals.push('@nats-io/transport-node', '@nats-io/jetstream');
  }
  return config;
};

export default nextConfig;
