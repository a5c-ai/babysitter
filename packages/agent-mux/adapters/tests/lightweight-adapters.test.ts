import { describe, it, expect } from 'vitest';
import { CopilotAdapter } from '../src/copilot-adapter.js';
import { CursorAdapter } from '../src/cursor-adapter.js';
import { OpenCodeAdapter } from '../src/opencode-adapter.js';
import { PiAdapter } from '../src/pi-adapter.js';
import { OmpAdapter } from '../src/omp-adapter.js';
import { OpenClawAdapter } from '../src/openclaw-adapter.js';
import { HermesAdapter } from '../src/hermes-adapter.js';

const CASES = [
  { name: 'copilot', ctor: CopilotAdapter },
  { name: 'cursor', ctor: CursorAdapter },
  { name: 'opencode', ctor: OpenCodeAdapter },
  { name: 'pi', ctor: PiAdapter },
  { name: 'omp', ctor: OmpAdapter },
  { name: 'openclaw', ctor: OpenClawAdapter },
  { name: 'hermes', ctor: HermesAdapter },
];

describe('lightweight adapter parity', () => {
  for (const { name, ctor } of CASES) {
    describe(name, () => {
      const adapter = new ctor();

      it('identity matches', () => {
        expect(adapter.agent).toBe(name);
        expect(adapter.cliCommand).toBeTruthy();
        expect(adapter.displayName).toBeTruthy();
      });

      it('has capabilities + models', () => {
        expect(adapter.capabilities).toBeDefined();
        expect(Array.isArray(adapter.models)).toBe(true);
      });

      it('buildSpawnArgs returns usable SpawnArgs', () => {
        const args = adapter.buildSpawnArgs({ agent: name as never, prompt: 'hi', cwd: process.cwd() });
        expect(args.command).toBeTruthy();
        expect(Array.isArray(args.args)).toBe(true);
        expect(typeof args.env).toBe('object');
      });

      it('uses the correct initial prompt transport', () => {
        const args = adapter.buildSpawnArgs({ agent: name as never, prompt: 'hi', cwd: process.cwd() });

        if (name === 'copilot') {
          expect(args.stdin).toBeUndefined();
          expect(args.args).toEqual(['copilot', 'suggest', 'hi']);
          return;
        }

        if (name === 'cursor') {
          expect(args.stdin).toBeUndefined();
          expect(args.args).toContain('--prompt');
          expect(args.args).toContain('hi');
          return;
        }

        if (name === 'pi' || name === 'omp' || name === 'openclaw' || name === 'hermes') {
          expect(args.args).not.toContain('--prompt');
          expect(args.stdin).toBe('hi\n');
        }
      });

      it('preserves explicit non-interactive prompt args where supported', () => {
        const args = adapter.buildSpawnArgs({
          agent: name as never,
          prompt: 'hi',
          cwd: process.cwd(),
          nonInteractive: true,
        });

        if (name === 'pi' || name === 'omp' || name === 'openclaw' || name === 'hermes') {
          expect(args.args).toContain('--prompt');
          expect(args.args).toContain('hi');
          expect(args.stdin).toBeUndefined();
        }
      });

      it('keeps Hermes in JSONL mode for parseEvent', () => {
        if (name !== 'hermes') return;
        const args = adapter.buildSpawnArgs({ agent: name as never, prompt: 'hi', cwd: process.cwd() });
        expect(args.args).toContain('--output-format');
        expect(args.args).toContain('jsonl');
      });

      it('sessionDir returns a non-empty path', () => {
        const d = adapter.sessionDir();
        expect(typeof d).toBe('string');
        expect(d.length).toBeGreaterThan(0);
      });

      it('detectAuth resolves without throwing', async () => {
        const state = await adapter.detectAuth();
        expect(state).toBeDefined();
      });

      it('exposes installHook / uninstallHook from BaseAdapter', () => {
        expect(typeof adapter.installHook).toBe('function');
        expect(typeof adapter.uninstallHook).toBe('function');
      });
    });
  }
});
