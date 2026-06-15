/**
 * Tests for babysitter TUI plugin metadata and structure.
 *
 * Verifies that each plugin exports the correct TuiPlugin interface:
 * - Has a name string
 * - Has a version string
 * - Has a register function
 */

import { describe, it, expect } from 'vitest';
import {
  babysitterStatusPlugin,
  babysitterCostPlugin,
  babysitterGovernancePlugin,
  babysitterPlugins,
} from '../index.js';

describe('babysitter-tui-plugins metadata', () => {
  describe('babysitterStatusPlugin', () => {
    it('has correct name', () => {
      expect(babysitterStatusPlugin.name).toBe('babysitter:status');
    });

    it('has version', () => {
      expect(babysitterStatusPlugin.version).toBe('5.0.0');
    });

    it('has register function', () => {
      expect(typeof babysitterStatusPlugin.register).toBe('function');
    });
  });

  describe('babysitterCostPlugin', () => {
    it('has correct name', () => {
      expect(babysitterCostPlugin.name).toBe('babysitter:cost');
    });

    it('has version', () => {
      expect(babysitterCostPlugin.version).toBe('5.0.0');
    });

    it('has register function', () => {
      expect(typeof babysitterCostPlugin.register).toBe('function');
    });
  });

  describe('babysitterGovernancePlugin', () => {
    it('has correct name', () => {
      expect(babysitterGovernancePlugin.name).toBe('babysitter:governance');
    });

    it('has version', () => {
      expect(babysitterGovernancePlugin.version).toBe('5.0.0');
    });

    it('has register function', () => {
      expect(typeof babysitterGovernancePlugin.register).toBe('function');
    });
  });

  describe('babysitterPlugins array', () => {
    it('contains all three plugins', () => {
      expect(babysitterPlugins).toHaveLength(3);
    });

    it('contains status plugin', () => {
      expect(babysitterPlugins).toContain(babysitterStatusPlugin);
    });

    it('contains cost plugin', () => {
      expect(babysitterPlugins).toContain(babysitterCostPlugin);
    });

    it('contains governance plugin', () => {
      expect(babysitterPlugins).toContain(babysitterGovernancePlugin);
    });

    it('all entries have name and register', () => {
      for (const plugin of babysitterPlugins) {
        expect(typeof plugin.name).toBe('string');
        expect(typeof plugin.register).toBe('function');
        expect(plugin.name).toBeTruthy();
      }
    });

    it('all entries have unique names', () => {
      const names = babysitterPlugins.map((p) => p.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });
});
