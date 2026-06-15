import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { classifyTrust, isBlocked, addToBlocklist, removeFromBlocklist, evaluatePluginTrust } from '../trust';

describe('plugin trust', () => {
  let tempDir: string;
  beforeEach(() => { tempDir = mkdtempSync(join(tmpdir(), 'trust-')); });
  afterEach(() => { rmSync(tempDir, { recursive: true, force: true }); });

  describe('classifyTrust', () => {
    it('returns verified for signed marketplace plugins', () => {
      expect(classifyTrust({ source: 'marketplace', signature: 'sig123' })).toBe('verified');
    });
    it('returns community for npm plugins with author', () => {
      expect(classifyTrust({ source: 'npm', author: 'dev' })).toBe('community');
    });
    it('returns local for local plugins', () => {
      expect(classifyTrust({ source: 'local' })).toBe('local');
    });
    it('returns unknown for unsigned plugins', () => {
      expect(classifyTrust({ source: 'git' })).toBe('unknown');
    });
  });

  describe('blocklist', () => {
    it('blocks and unblocks plugins', () => {
      expect(isBlocked(tempDir, 'bad-plugin')).toBe(false);
      addToBlocklist(tempDir, 'bad-plugin', 'malicious');
      expect(isBlocked(tempDir, 'bad-plugin')).toBe(true);
      expect(removeFromBlocklist(tempDir, 'bad-plugin')).toBe(true);
      expect(isBlocked(tempDir, 'bad-plugin')).toBe(false);
    });
    it('does not double-add', () => {
      addToBlocklist(tempDir, 'x');
      addToBlocklist(tempDir, 'x');
      expect(removeFromBlocklist(tempDir, 'x')).toBe(true);
      expect(removeFromBlocklist(tempDir, 'x')).toBe(false);
    });
  });

  describe('evaluatePluginTrust', () => {
    it('allows all permissions for system trust', () => {
      const result = evaluatePluginTrust(['filesystem:write', 'subprocess:spawn'], 'system');
      expect(result.allowed).toBe(true);
      expect(result.deniedPermissions).toEqual([]);
    });
    it('denies dangerous permissions for sandboxed trust', () => {
      const result = evaluatePluginTrust(['filesystem:write', 'tools:register'], 'sandboxed');
      expect(result.allowed).toBe(false);
      expect(result.deniedPermissions).toContain('filesystem:write');
    });
    it('allows safe permissions for community trust', () => {
      const result = evaluatePluginTrust(['tools:register', 'events:listen'], 'community');
      expect(result.allowed).toBe(true);
    });
  });
});
