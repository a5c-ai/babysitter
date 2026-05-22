import { beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { compileAll } from '../compiler.js';
import {
  BABYSITTER_DEFAULT_SDK_CONFIG,
  resolveSdkConfig,
  resolveTargetCliName,
  resolveTargetNpmPackageName,
} from '../sdkConfig.js';
import { getTargetProfile } from '../targets/index.js';
import type { A5cPluginManifest } from '../types.js';

const NO_SDK_PLUGIN_DIR = path.resolve(__dirname, 'fixtures/no-sdk-plugin');

describe('omitted sdk config defaults', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upf-no-sdk-'));
  });

  it('uses Babysitter SDK defaults consistently in generated metadata and install docs', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(NO_SDK_PLUGIN_DIR, 'plugin.json'), 'utf-8'),
    ) as A5cPluginManifest;

    expect(manifest.sdk).toBeUndefined();
    expect(resolveSdkConfig(manifest)).toEqual(BABYSITTER_DEFAULT_SDK_CONFIG);

    const results = compileAll(NO_SDK_PLUGIN_DIR, tmpDir, {});
    expect(results).toHaveLength(10);

    for (const result of results) {
      expect(
        result.status,
        `${result.target} failed: ${result.diagnostics.filter((d) => d.level === 'error').map((d) => d.message).join(', ')}`,
      ).not.toBe('error');

      const targetProfile = getTargetProfile(result.target);
      expect(targetProfile, `missing target profile for ${result.target}`).not.toBeNull();

      const expectedPackageName = resolveTargetNpmPackageName(manifest, targetProfile!);
      const expectedCliName = resolveTargetCliName(manifest, targetProfile!);
      const readme = fs.readFileSync(path.join(result.outputDir, 'README.md'), 'utf-8');

      expect(readme).toContain(`npm install -g ${BABYSITTER_DEFAULT_SDK_CONFIG.package}`);
      expect(readme).toContain(
        `${BABYSITTER_DEFAULT_SDK_CONFIG.cli} harness:discover --json | grep ${targetProfile!.adapterName}`,
      );

      if (targetProfile!.distribution === 'marketplace' || targetProfile!.distribution === 'both') {
        expect(readme).toContain(
          `${BABYSITTER_DEFAULT_SDK_CONFIG.cli} harness:install-plugin ${targetProfile!.name}`,
        );
      }

      if (targetProfile!.distribution === 'npm-cli' || targetProfile!.distribution === 'both') {
        expect(readme).toContain(`npm install -g ${expectedPackageName}`);
        expect(readme).toContain(`${expectedCliName} install --global`);
      }

      const packageJsonPath = path.join(result.outputDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        continue;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as {
        name: string;
        bin?: Record<string, string>;
      };

      expect(packageJson.name).toBe(expectedPackageName);
      expect(packageJson.bin).toBeDefined();
      expect(Object.keys(packageJson.bin ?? {})).toEqual([expectedCliName]);
    }
  });
});
