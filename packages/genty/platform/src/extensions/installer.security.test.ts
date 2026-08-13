/**
 * FIX-003 regression suite for the shipped (but unexported) extension
 * installer.
 *
 * `src/extensions/installer.ts` used to interpolate the npm package name, the
 * version, the git URL, the git ref, and the derived install directory into
 * `execSync` command strings. The module is not part of the package's public
 * export map, but it is compiled into `dist/` and shipped, so the same-class
 * defect is repaired and pinned here: every value must reach the child process
 * as one literal argv entry, and the values that reach a tool without an option
 * terminator must be rejected before they can be parsed as flags.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, it, expect, vi } from 'vitest';

// The installer resolves its install root from `homedir()` at module load, and
// these scenarios do create that directory. Redirect it into a temp dir so the
// suite never writes into the developer's real ~/.genty.
const sandboxHome = mkdtempSync(join(tmpdir(), 'genty-installer-security-'));
vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  return { ...actual, homedir: () => process.env.GENTY_TEST_HOME ?? actual.homedir() };
});
process.env.GENTY_TEST_HOME = sandboxHome;

const { installFromGit, installFromNpm } = await import('./installer.js');
type InstallerExecFn = import('./installer.js').InstallerExecFn;

afterAll(() => {
  rmSync(sandboxHome, { recursive: true, force: true });
  delete process.env.GENTY_TEST_HOME;
});

/** Values that are dangerous only when concatenated into a shell command string. */
const HOSTILE_VALUES: ReadonlyArray<readonly [string, string]> = [
  ['double quotes', 'https://example.com/"injected".git'],
  ['single quotes', "https://example.com/'injected'.git"],
  ['whitespace', 'https://example.com/my repo.git'],
  ['command substitution', 'https://example.com/$(touch /tmp/pwned).git'],
  ['backticks', 'https://example.com/`touch /tmp/pwned`.git'],
  ['semicolon chaining', 'https://example.com/r.git; touch /tmp/pwned'],
  ['double-ampersand chaining', 'https://example.com/r.git && touch /tmp/pwned'],
  ['pipe', 'https://example.com/r.git | touch /tmp/pwned'],
  ['newline', 'https://example.com/r.git\ntouch /tmp/pwned'],
  ['leading dash', '--upload-pack=touch /tmp/pwned'],
  ['env expansion', 'https://example.com/$HOME-${IFS}.git'],
];

function makeExec(): ReturnType<typeof vi.fn<InstallerExecFn>> {
  return vi.fn<InstallerExecFn>(() => undefined);
}

describe('FIX-003: the extension installer never builds shell command strings', () => {
  describe('installFromGit', () => {
    it('invokes git with an argument array and option termination', () => {
      const exec = makeExec();
      // loadManifest throws because nothing was really cloned; the executor
      // contract is what this suite asserts.
      expect(() => installFromGit('https://example.com/repo.git', 'main', exec)).toThrow(
        /No package\.json found/,
      );

      const [file, args] = exec.mock.calls[0]!;
      expect(file).toBe('git');
      expect(args.slice(0, 6)).toEqual(['clone', '--depth', '1', '--branch', 'main', '--']);
      expect(args[6]).toBe('https://example.com/repo.git');
      expect(args).toHaveLength(8);
    });

    it('omits --branch entirely when no ref is given', () => {
      const exec = makeExec();
      expect(() => installFromGit('https://example.com/repo.git', undefined, exec)).toThrow();
      const [, args] = exec.mock.calls[0]!;
      expect(args).not.toContain('--branch');
      expect(args.slice(0, 4)).toEqual(['clone', '--depth', '1', '--']);
    });

    it.each(HOSTILE_VALUES)(
      'passes a hostile git URL (%s) through as one literal argument after --',
      (_label, hostile) => {
        const exec = makeExec();
        expect(() => installFromGit(hostile, undefined, exec)).toThrow();

        const [file, args] = exec.mock.calls[0]!;
        expect(file).toBe('git');
        const terminator = args.indexOf('--');
        expect(terminator).toBeGreaterThan(0);
        // Operand position: immediately after the option terminator, verbatim.
        expect(args[terminator + 1]).toBe(hostile);
        expect(args.filter((argument) => argument === hostile)).toHaveLength(1);
        // Nothing was ever concatenated into a larger command string.
        expect(args.some((argument) => argument.includes('git clone'))).toBe(false);
      },
    );

    it.each(HOSTILE_VALUES)(
      'passes a hostile git ref (%s) through as the literal value of --branch',
      (_label, hostile) => {
        const exec = makeExec();
        expect(() => installFromGit('https://example.com/repo.git', hostile, exec)).toThrow();

        const [, args] = exec.mock.calls[0]!;
        const branchFlag = args.indexOf('--branch');
        expect(branchFlag).toBeGreaterThan(-1);
        expect(args[branchFlag + 1]).toBe(hostile);
      },
    );
  });

  describe('installFromNpm', () => {
    it('invokes npm with an argument array', () => {
      const exec = makeExec();
      expect(() => installFromNpm('left-pad', '1.3.0', exec)).toThrow(/No package\.json found/);

      const [file, args] = exec.mock.calls[0]!;
      expect(file).toMatch(/^npm(?:\.cmd)?$/);
      expect(args[0]).toBe('install');
      expect(args).toContain('--no-save');
      expect(args[args.length - 1]).toBe('left-pad@1.3.0');
      // The prefix is its own argv entry, never quoted into a command string.
      const prefixFlag = args.indexOf('--prefix');
      expect(prefixFlag).toBeGreaterThan(-1);
      expect(args[prefixFlag + 1]).not.toContain('"');
    });

    it.each(HOSTILE_VALUES)(
      'rejects a hostile package name (%s) before it can reach npm',
      (_label, hostile) => {
        const exec = makeExec();
        expect(() => installFromNpm(hostile, undefined, exec)).toThrow(/Invalid npm package name/);
        expect(exec).not.toHaveBeenCalled();
      },
    );

    it.each(HOSTILE_VALUES)(
      'rejects a hostile version specifier (%s) before it can reach npm',
      (_label, hostile) => {
        const exec = makeExec();
        expect(() => installFromNpm('left-pad', hostile, exec)).toThrow(
          /Invalid npm version specifier/,
        );
        expect(exec).not.toHaveBeenCalled();
      },
    );

    it('accepts ordinary scoped names and semver ranges', () => {
      const exec = makeExec();
      expect(() => installFromNpm('@scope/pkg', '^1.2.3', exec)).toThrow(/No package\.json found/);
      expect(exec.mock.calls[0]![1].at(-1)).toBe('@scope/pkg@^1.2.3');
    });
  });

  it('the module contains no shell command strings at all', async () => {
    const fs = await import('node:fs');
    const url = await import('node:url');
    const pathModule = await import('node:path');
    const source = fs.readFileSync(
      pathModule.join(pathModule.dirname(url.fileURLToPath(import.meta.url)), 'installer.ts'),
      'utf8',
    );
    expect(source).not.toContain('execSync(');
    expect(source).toContain('execFileSync(');
    expect(source).toContain('shell: false');
  });
});
