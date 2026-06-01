// Tests for utility functions

import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  buildSkillFromCommand,
  markdownToToml,
  deepMerge,
  slugify,
} from '../utils';

describe('parseFrontmatter', () => {
  it('should parse YAML frontmatter', () => {
    const markdown = `---
name: test
description: A test skill
version: 1.0.0
---

This is the body.`;

    const result = parseFrontmatter(markdown);
    expect(result.data.name).toBe('test');
    expect(result.data.description).toBe('A test skill');
    expect(result.data.version).toBe('1.0.0');
    expect(result.body).toBe('This is the body.');
  });

  it('should handle markdown without frontmatter', () => {
    const markdown = 'Just plain markdown';
    const result = parseFrontmatter(markdown);
    expect(result.data).toEqual({});
    expect(result.body).toBe('Just plain markdown');
  });
});

describe('buildSkillFromCommand', () => {
  it('should derive a skill from a command', () => {
    const command = `---
description: Test command
---

Run the test.`;

    const result = buildSkillFromCommand('test', command);
    expect(result).toContain('name: test');
    expect(result).toContain('description: Test command');
    expect(result).toContain('# test');
    expect(result).toContain('Run the test.');
  });

  it('should use default description if missing', () => {
    const command = 'Just a body';
    const result = buildSkillFromCommand('example', command);
    expect(result).toContain('description: example mode.');
  });
});

describe('markdownToToml', () => {
  it('should convert markdown to TOML', () => {
    const markdown = `---
description: Test command
---

Execute the test.`;

    const result = markdownToToml(markdown);
    expect(result).toContain('description = "Test command"');
    expect(result).toContain('prompt = "Execute the test."');
  });
});

describe('deepMerge', () => {
  it('should merge objects deeply', () => {
    const base = { a: 1, b: { c: 2, d: 3 } };
    const override = { b: { c: 10 }, e: 4 };
    const result = deepMerge(base, override);

    expect(result.a).toBe(1);
    expect(result.b.c).toBe(10);
    expect(result.b.d).toBe(3);
    expect(result.e).toBe(4);
  });

  it('should delete keys when override is null', () => {
    const base = { a: 1, b: 2, c: 3 };
    const override = { b: null };
    const result = deepMerge(base, override as any);

    expect(result.a).toBe(1);
    expect(result.b).toBeUndefined();
    expect(result.c).toBe(3);
  });

  it('should replace arrays entirely', () => {
    const base = { arr: [1, 2, 3] };
    const override = { arr: [4, 5] };
    const result = deepMerge(base, override);

    expect(result.arr).toEqual([4, 5]);
  });
});

describe('slugify', () => {
  it('should convert to kebab-case', () => {
    expect(slugify('SessionStart')).toBe('session-start');
    expect(slugify('User Prompt Submit')).toBe('user-prompt-submit');
    expect(slugify('pre_tool_use')).toBe('pre-tool-use');
  });
});
