import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRegistry, type CommandDefinition } from '../commandDiscovery';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cmd(name: string, opts?: Partial<CommandDefinition>): CommandDefinition {
  return {
    name,
    description: `${name} description`,
    category: 'general',
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------

  describe('register / unregister', () => {
    it('registers and retrieves a command', () => {
      registry.register(cmd('foo'));
      expect(registry.get('foo')).toBeDefined();
      expect(registry.get('foo')!.name).toBe('foo');
    });

    it('replaces an existing command with the same name', () => {
      registry.register(cmd('foo', { description: 'v1' }));
      registry.register(cmd('foo', { description: 'v2' }));
      expect(registry.get('foo')!.description).toBe('v2');
      expect(registry.size).toBe(1);
    });

    it('unregister returns true for existing command', () => {
      registry.register(cmd('bar'));
      expect(registry.unregister('bar')).toBe(true);
      expect(registry.get('bar')).toBeUndefined();
    });

    it('unregister returns false for unknown command', () => {
      expect(registry.unregister('ghost')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Alias lookup
  // -----------------------------------------------------------------------

  describe('alias lookup', () => {
    it('finds command by alias', () => {
      registry.register(cmd('build', { aliases: ['b', 'compile'] }));
      expect(registry.get('b')?.name).toBe('build');
      expect(registry.get('compile')?.name).toBe('build');
    });

    it('returns undefined when alias does not match', () => {
      registry.register(cmd('build', { aliases: ['b'] }));
      expect(registry.get('x')).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // listByCategory
  // -----------------------------------------------------------------------

  describe('listByCategory', () => {
    beforeEach(() => {
      registry.register(cmd('a', { category: 'tools' }));
      registry.register(cmd('b', { category: 'tools' }));
      registry.register(cmd('c', { category: 'nav' }));
      registry.register(cmd('hidden-cmd', { category: 'tools', hidden: true }));
    });

    it('lists all visible commands without category filter', () => {
      const all = registry.listByCategory();
      expect(all).toHaveLength(3);
      expect(all.some((c) => c.name === 'hidden-cmd')).toBe(false);
    });

    it('filters by category', () => {
      const tools = registry.listByCategory('tools');
      expect(tools).toHaveLength(2);
      expect(tools.every((c) => c.category === 'tools')).toBe(true);
    });

    it('returns empty for unknown category', () => {
      expect(registry.listByCategory('nope')).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // getCategories
  // -----------------------------------------------------------------------

  describe('getCategories', () => {
    it('returns distinct sorted categories', () => {
      registry.register(cmd('a', { category: 'z' }));
      registry.register(cmd('b', { category: 'a' }));
      registry.register(cmd('c', { category: 'z' }));
      expect(registry.getCategories()).toEqual(['a', 'z']);
    });
  });

  // -----------------------------------------------------------------------
  // search
  // -----------------------------------------------------------------------

  describe('search', () => {
    beforeEach(() => {
      registry.register(cmd('deploy', { description: 'Push to production', aliases: ['push'] }));
      registry.register(cmd('test', { description: 'Run unit tests' }));
    });

    it('matches by name', () => {
      const results = registry.search('deploy');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('deploy');
    });

    it('matches by description', () => {
      const results = registry.search('production');
      expect(results).toHaveLength(1);
    });

    it('matches by alias', () => {
      const results = registry.search('push');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('deploy');
    });

    it('is case-insensitive', () => {
      expect(registry.search('DEPLOY')).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // getSuggestions
  // -----------------------------------------------------------------------

  describe('getSuggestions', () => {
    beforeEach(() => {
      registry.register(cmd('build', { description: 'Build the project' }));
      registry.register(cmd('bump', { description: 'Bump version' }));
      registry.register(cmd('test', { description: 'Run tests' }));
      registry.register(cmd('hidden', { description: 'Secret', hidden: true }));
    });

    it('returns suggestions ranked by score', () => {
      const suggestions = registry.getSuggestions('bu');
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      // Both 'build' and 'bump' start with 'bu'
      expect(suggestions[0].score).toBeGreaterThanOrEqual(suggestions[1].score);
    });

    it('excludes hidden commands', () => {
      const suggestions = registry.getSuggestions('hid');
      expect(suggestions.some((s) => s.command.name === 'hidden')).toBe(false);
    });

    it('respects the limit parameter', () => {
      const suggestions = registry.getSuggestions('b', 1);
      expect(suggestions).toHaveLength(1);
    });

    it('returns empty for no match', () => {
      expect(registry.getSuggestions('xyz')).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // size
  // -----------------------------------------------------------------------

  it('tracks size correctly', () => {
    expect(registry.size).toBe(0);
    registry.register(cmd('a'));
    registry.register(cmd('b'));
    expect(registry.size).toBe(2);
    registry.unregister('a');
    expect(registry.size).toBe(1);
  });
});
