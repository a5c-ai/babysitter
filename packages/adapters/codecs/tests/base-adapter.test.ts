import { describe, expect, it } from 'vitest';

import { BaseAgentAdapter } from '../src/base-adapter.js';

class DetectStubAdapter extends BaseAgentAdapter {
  readonly agent = 'codex';
  readonly displayName = 'Codex';
  readonly cliCommand = 'codex';
  readonly minVersion = '0.1.0';
  readonly capabilities = {
    supportsStreaming: false,
    supportsImages: false,
    supportsFunctions: false,
    supportsStdinInjection: false,
    supportsCwd: true,
    supportsEnv: true,
    supportsAbort: true,
    supportsTimeout: true,
    supportsPty: false,
    supportsNetworkIsolation: false,
    supportsSessionFork: false,
    supportsResume: true,
    supportsStatefulSessions: true,
    structuredSessionTransport: 'restart-per-turn',
    sessionControlPlane: 'self-managed',
    supportsInteractiveMode: false,
    canResume: true,
    supportsImageInput: false,
    supportsFileAttachments: false,
    installMethods: [],
    authMethods: [],
    platforms: ['win32', 'linux', 'darwin'],
  } as const;
  readonly models = [];
  readonly defaultModelId = undefined;
  readonly configSchema = {
    agent: 'codex',
    version: 1,
    fields: [],
  } as const;

  buildSpawnArgs() {
    throw new Error('not implemented');
  }

  parseEvent() {
    return null;
  }

  async detectAuth() {
    return { status: 'authenticated' as const, method: 'api_key' as const, identity: 'test' };
  }

  getAuthGuidance() {
    return {
      agent: 'codex',
      providerName: 'OpenAI',
      steps: [],
      envVars: [],
      documentationUrls: [],
    };
  }

  sessionDir(): string {
    return '';
  }

  async parseSessionFile() {
    throw new Error('not implemented');
  }

  async listSessionFiles() {
    return [];
  }

  async readConfig() {
    return { agent: 'codex', source: 'global' as const };
  }

  async writeConfig() {}

  protected override resolveVersionProbeCommand() {
    return { command: 'cmd.exe', args: ['/d', '/s', '/c', '"codex.cmd --version"'] };
  }
}

describe('BaseAgentAdapter.detectInstallation', () => {
  it('falls back to probing the bare cli command when the resolved wrapper probe fails', async () => {
    const adapter = new DetectStubAdapter();
    const locator = process.platform === 'win32' ? 'where' : 'which';
    adapter.setSpawner(async (command, args) => {
      if (command === locator) {
        return { code: 0, stdout: 'C:\\Users\\tmusk\\AppData\\Roaming\\npm\\codex\n', stderr: '' };
      }
      if (command === 'cmd.exe') {
        return { code: 1, stdout: '', stderr: 'wrapper failed' };
      }
      if (command === 'codex' && args.join(' ') === '--version') {
        return { code: 0, stdout: 'codex-cli 0.120.0\n', stderr: '' };
      }
      throw new Error(`unexpected spawn: ${command} ${args.join(' ')}`);
    });

    const result = await adapter.detectInstallation();

    expect(result).toMatchObject({
      installed: true,
      version: '0.120.0',
    });
  });
});
