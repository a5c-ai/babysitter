// Tests for validation stage

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { validate as validateSchema } from '../schema';
import { validate } from '../validate';

describe('validateSchema', () => {
  it('should validate a minimal manifest', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: 'Test Author',
      license: 'MIT',
    };

    const result = validateSchema(manifest);
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should reject manifest missing required fields', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
    };

    const result = validateSchema(manifest);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('description'))).toBe(true);
    expect(result.diagnostics.some((d) => d.message.includes('author'))).toBe(true);
    expect(result.diagnostics.some((d) => d.message.includes('license'))).toBe(true);
  });

  it('should reject invalid name pattern', () => {
    const manifest = {
      name: 'Test_Plugin!',
      version: '1.0.0',
      description: 'Test',
      author: 'Test',
      license: 'MIT',
    };

    const result = validateSchema(manifest);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('pattern'))).toBe(true);
  });

  it('should accept author as object', () => {
    const manifest = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'Test',
      author: { name: 'Test Author', email: 'test@example.com' },
      license: 'MIT',
    };

    const result = validateSchema(manifest);
    expect(result.valid).toBe(true);
  });
});

describe('validate directory references', () => {
  function createPluginDir(files: Record<string, string>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extension-mux-validate-'));
    for (const [relativePath, content] of Object.entries(files)) {
      const fullPath = path.join(dir, relativePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
    return dir;
  }

  it('rejects missing declared agent and context files', () => {
    const dir = createPluginDir({
      'plugin.json': JSON.stringify({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        license: 'MIT',
        agents: 'agents/AGENTS.md',
        contextFiles: {
          gemini: 'context/GEMINI.md',
        },
      }, null, 2),
      'versions.json': JSON.stringify({ sdkVersion: '5.0.0' }, null, 2),
    });

    const result = validate(dir);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('Agent file not found'))).toBe(true);
    expect(result.diagnostics.some((d) => d.message.includes('Context file not found for target gemini'))).toBe(true);
  });
});
