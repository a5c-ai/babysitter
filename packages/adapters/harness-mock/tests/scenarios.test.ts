import { describe, it, expect } from 'vitest';
import {
  MockProcess,
  claudeCodeSuccess,
  claudeCodeCrash,
  claudeCodeTimeout,
  claudeCodeFileOps,
  runtimeHookAllowBash,
  runtimeHookDenyWrite,
  runtimeHookTimeout,
  codexSuccess,
  codexFailure,
  emptySuccess,
  largeOutput,
} from '../src/index.js';

describe('Pre-built scenarios', () => {
  describe('claude-code', () => {
    it('claudeCodeSuccess produces JSONL output and exits 0', async () => {
      const proc = new MockProcess(claudeCodeSuccess);
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"type":"system"');
      expect(result.stdout).toContain('"type":"result"');
    });

    it('claudeCodeCrash exits with signal code', async () => {
      const proc = new MockProcess(claudeCodeCrash);
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(143);
    });

    it('claudeCodeTimeout hangs until killed', async () => {
      const proc = new MockProcess(claudeCodeTimeout);
      proc.start();
      expect(proc.exited).toBe(false);
      // Kill it
      setTimeout(() => proc.kill(), 100);
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(143);
    });

    it('claudeCodeFileOps has file operations', async () => {
      const proc = new MockProcess(claudeCodeFileOps);
      proc.start();
      await proc.waitForExit();
      expect(proc.fileChanges.length).toBeGreaterThan(0);
      expect(proc.fileChanges[0]!.type).toBe('create');
    });

    it('runtimeHookAllowBash pauses for hook approval and exits 0', async () => {
      const proc = new MockProcess(runtimeHookAllowBash);
      const seen: string[] = [];
      proc.on('runtime-hook', (step: any) => seen.push(step.kind));
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(0);
      expect(seen).toEqual(['preToolUse']);
      expect(result.stdout).toContain('"tool_result"');
    });

    it('runtimeHookDenyWrite exits early on denial', async () => {
      const proc = new MockProcess(runtimeHookDenyWrite);
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Runtime hook denied Write');
      expect(result.stdout).not.toContain('"tool_result"');
    });

    it('runtimeHookTimeout hangs until killed', async () => {
      const proc = new MockProcess(runtimeHookTimeout);
      proc.start();
      setTimeout(() => proc.kill(), 50);
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(143);
    });
  });

  describe('codex', () => {
    it('codexSuccess exits 0 with output', async () => {
      const proc = new MockProcess(codexSuccess);
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"type":"message"');
    });

    it('codexFailure exits 1', async () => {
      const proc = new MockProcess(codexFailure);
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error');
    });
  });

  describe('generic', () => {
    it('emptySuccess exits immediately', async () => {
      const proc = new MockProcess(emptySuccess);
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
    });

    it('largeOutput generates configured number of lines', async () => {
      const scenario = largeOutput(100);
      expect(scenario.output.length).toBe(100);
      const proc = new MockProcess(scenario);
      proc.start();
      const result = await proc.waitForExit();
      expect(result.exitCode).toBe(0);
      const lines = result.stdout.split('\n').filter(l => l.length > 0);
      expect(lines.length).toBe(100);
    });
  });
});
