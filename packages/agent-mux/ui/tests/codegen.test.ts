import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

describe('generated native protocol files', () => {
  it('commits generated swift and kotlin protocol outputs', async () => {
    const swift = await fs.readFile(path.join(packageRoot, 'build/schema/swift/AmuxProtocol.swift'), 'utf8');
    const kotlin = await fs.readFile(path.join(packageRoot, 'build/schema/kotlin/AmuxProtocol.kt'), 'utf8');
    expect(swift).toContain('struct AuthFrame');
    expect(swift).toContain('enum ClientFrame');
    expect(kotlin).toContain('data class AuthFrame');
    expect(kotlin).toContain('sealed interface ClientFrame');
  });
});
