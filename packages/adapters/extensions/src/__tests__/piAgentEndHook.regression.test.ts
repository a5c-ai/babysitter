// Regression guard for issue #948.
//
// Two things must hold for the generated `@a5c-ai/babysitter-pi` package:
//   1. The compiled `extensions/index.ts` registers `pi.on("agent_end", ...)`,
//      which drives the babysitter stop loop.
//   2. The generated package ships the proxied stop hook script
//      (`hooks/babysitter-proxied-stop.js`): the file exists on disk, the
//      `package.json` `files` array includes `"hooks/"`, AND `npm pack`
//      actually packs the hook into the tarball.
//
// Assertions are black-box on the generated artifact so the test truly guards
// the regression rather than re-checking the source templates.

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { compile } from '../compiler.js';

const UNIFIED_PLUGIN_DIR = path.resolve(
  __dirname,
  '../../../../../plugins/babysitter-unified',
);

interface NpmPackEntry {
  files: Array<{ path: string }>;
}

describe('pi target ships agent_end wiring + proxied hook scripts (#948)', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it(
    'compiles babysitter-unified -> pi and packs the agent_end stop hook',
    () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-948-'));
      tempDirs.push(tempDir);

      const result = compile({
        source: UNIFIED_PLUGIN_DIR,
        target: 'pi',
        output: path.join(tempDir, 'pi'),
      });

      expect(
        result.status,
        result.diagnostics
          .filter((d) => d.level === 'error')
          .map((d) => d.message)
          .join('\n'),
      ).not.toBe('error');

      // 1. agent_end lifecycle wiring is present in the generated extension.
      const extension = fs.readFileSync(
        path.join(result.outputDir, 'extensions', 'index.ts'),
        'utf-8',
      );
      expect(extension).toMatch(/pi\.on\(\s*["']agent_end["']/);
      expect(extension).toContain('babysitter-proxied-stop.js');

      // 2. The proxied stop hook file exists on disk in the generated package.
      const hookPath = path.join(
        result.outputDir,
        'hooks',
        'babysitter-proxied-stop.js',
      );
      expect(
        fs.existsSync(hookPath),
        `expected generated hook at ${hookPath}`,
      ).toBe(true);

      // 3. The generated package.json `files` array includes "hooks/" so the
      //    hook directory is shipped on publish.
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'package.json'), 'utf-8'),
      ) as { name: string; files?: string[] };
      expect(packageJson.name).toBe('@a5c-ai/babysitter-pi');
      expect(packageJson.files).toContain('hooks/');

      // 4. `npm pack --dry-run --json` actually packs the hook into the tarball.
      const packOutput = execSync('npm pack --dry-run --json', {
        cwd: result.outputDir,
        encoding: 'utf-8',
      });
      const packed = JSON.parse(packOutput) as NpmPackEntry[];
      const packedPaths = packed.flatMap((entry) =>
        entry.files.map((f) => f.path),
      );
      expect(packedPaths).toContain('hooks/babysitter-proxied-stop.js');
    },
    120_000,
  );
});
