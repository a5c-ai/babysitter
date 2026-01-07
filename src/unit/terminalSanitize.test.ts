import * as assert from 'assert';

import { sanitizeTerminalOutput } from '../core/terminalSanitize';

suite('terminalSanitize', () => {
  test('strips ANSI escape sequences and control characters', () => {
    const input = `hello\x1b[31m red\x1b[0m world\x07\r\nnext\u0001line`;
    const output = sanitizeTerminalOutput(input);
    assert.strictEqual(output, 'hello red world\nnextline');
  });
});

