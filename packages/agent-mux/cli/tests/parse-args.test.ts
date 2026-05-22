import { describe, it, expect } from 'vitest';
import { parseArgs, flagStr, flagNum, flagBool, flagArr } from '../src/parse-args.js';

describe('parseArgs', () => {
  describe('command extraction', () => {
    it('extracts command from first positional', () => {
      const result = parseArgs(['run', 'claude', 'hello']);
      expect(result.command).toBe('run');
      expect(result.positionals).toEqual(['claude', 'hello']);
    });

    it('extracts subcommand for commands with subcommands', () => {
      const result = parseArgs(['adapters', 'list']);
      expect(result.command).toBe('adapters');
      expect(result.subcommand).toBe('list');
      expect(result.positionals).toEqual([]);
    });

    it('extracts subcommand with additional positionals', () => {
      const result = parseArgs(['sessions', 'show', 'claude', 'abc123']);
      expect(result.command).toBe('sessions');
      expect(result.subcommand).toBe('show');
      expect(result.positionals).toEqual(['claude', 'abc123']);
    });

    it('extracts gateway subcommands', () => {
      const result = parseArgs(['gateway', 'tokens', 'create']);
      expect(result.command).toBe('gateway');
      expect(result.subcommand).toBe('tokens');
      expect(result.positionals).toEqual(['create']);
    });

    it('returns undefined command for non-command first arg', () => {
      const result = parseArgs(['hello', 'world']);
      expect(result.command).toBeUndefined();
      expect(result.positionals).toEqual(['hello', 'world']);
    });

    it('returns undefined command for empty argv', () => {
      const result = parseArgs([]);
      expect(result.command).toBeUndefined();
      expect(result.positionals).toEqual([]);
    });

    it('handles version command', () => {
      const result = parseArgs(['version']);
      expect(result.command).toBe('version');
    });

    it('handles help command with argument', () => {
      const result = parseArgs(['help', 'run']);
      expect(result.command).toBe('help');
      expect(result.positionals).toEqual(['run']);
    });
  });

  describe('long flags', () => {
    it('parses boolean flags', () => {
      const result = parseArgs(['run', '--json', '--debug']);
      expect(result.flags['json']).toBe(true);
      expect(result.flags['debug']).toBe(true);
    });

    it('parses string flags with space separator', () => {
      const result = parseArgs(['run', '--agent', 'claude']);
      expect(result.flags['agent']).toBe('claude');
    });

    it('parses string flags with = separator', () => {
      const result = parseArgs(['run', '--agent=claude']);
      expect(result.flags['agent']).toBe('claude');
    });

    it('parses --no-X for boolean negation', () => {
      const result = parseArgs(['run', '--no-stream'], {
        'stream': { type: 'boolean' },
      });
      expect(result.flags['stream']).toBe(false);
    });

    it('handles --no-color as a known flag (not negation)', () => {
      const result = parseArgs(['run', '--no-color']);
      expect(result.flags['no-color']).toBe(true);
    });
  });

  describe('short flags', () => {
    it('parses short boolean flags', () => {
      const result = parseArgs(['-h']);
      expect(result.flags['help']).toBe(true);
    });

    it('parses short string flags', () => {
      const result = parseArgs(['-a', 'claude']);
      expect(result.flags['agent']).toBe('claude');
    });

    it('parses short version flag', () => {
      const result = parseArgs(['-V']);
      expect(result.flags['version']).toBe(true);
    });
  });

  describe('-- terminator', () => {
    it('treats everything after -- as positionals', () => {
      const result = parseArgs(['run', '--', '--json', '-a', 'test']);
      expect(result.command).toBe('run');
      expect(result.positionals).toEqual(['--json', '-a', 'test']);
      expect(result.flags['json']).toBeUndefined();
    });
  });

  describe('repeatable flags', () => {
    it('collects repeatable flags into arrays', () => {
      const result = parseArgs(
        ['run', '--tag', 'build', '--tag', 'test'],
        { 'tag': { type: 'string', repeatable: true } },
      );
      expect(result.flags['tag']).toEqual(['build', 'test']);
    });

    it('single repeatable flag returns array', () => {
      const result = parseArgs(
        ['run', '--tag', 'build'],
        { 'tag': { type: 'string', repeatable: true } },
      );
      expect(result.flags['tag']).toEqual(['build']);
    });
  });

  describe('mixed positionals and flags', () => {
    it('handles flags interspersed with positionals', () => {
      const result = parseArgs(['run', 'claude', '--json', 'hello world']);
      expect(result.command).toBe('run');
      expect(result.positionals).toEqual(['claude', 'hello world']);
      expect(result.flags['json']).toBe(true);
    });

    it('handles model flag with run command', () => {
      const result = parseArgs(['run', '--model', 'claude-sonnet-4-20250514', 'claude', 'hello']);
      expect(result.command).toBe('run');
      expect(result.flags['model']).toBe('claude-sonnet-4-20250514');
      expect(result.positionals).toEqual(['claude', 'hello']);
    });
  });
});

describe('flag helpers', () => {
  describe('flagStr', () => {
    it('returns string value', () => {
      expect(flagStr({ agent: 'claude' }, 'agent')).toBe('claude');
    });

    it('returns undefined for missing flag', () => {
      expect(flagStr({}, 'agent')).toBeUndefined();
    });

    it('returns undefined for boolean flag', () => {
      expect(flagStr({ json: true }, 'json')).toBeUndefined();
    });

    it('returns last element of array', () => {
      expect(flagStr({ tag: ['a', 'b'] }, 'tag')).toBe('b');
    });
  });

  describe('flagNum', () => {
    it('returns numeric value from string', () => {
      expect(flagNum({ timeout: '5000' }, 'timeout')).toBe(5000);
    });

    it('returns undefined for non-numeric string', () => {
      expect(flagNum({ timeout: 'abc' }, 'timeout')).toBeUndefined();
    });

    it('returns undefined for missing flag', () => {
      expect(flagNum({}, 'timeout')).toBeUndefined();
    });
  });

  describe('flagBool', () => {
    it('returns boolean value', () => {
      expect(flagBool({ json: true }, 'json')).toBe(true);
      expect(flagBool({ stream: false }, 'stream')).toBe(false);
    });

    it('returns undefined for missing flag', () => {
      expect(flagBool({}, 'json')).toBeUndefined();
    });

    it('parses string true/false', () => {
      expect(flagBool({ json: 'true' }, 'json')).toBe(true);
      expect(flagBool({ json: 'false' }, 'json')).toBe(false);
    });
  });

  describe('flagArr', () => {
    it('returns array value', () => {
      expect(flagArr({ tag: ['a', 'b'] }, 'tag')).toEqual(['a', 'b']);
    });

    it('wraps string in array', () => {
      expect(flagArr({ tag: 'a' }, 'tag')).toEqual(['a']);
    });

    it('returns empty array for missing flag', () => {
      expect(flagArr({}, 'tag')).toEqual([]);
    });

    it('returns empty array for boolean flag', () => {
      expect(flagArr({ json: true }, 'json')).toEqual([]);
    });
  });
});
