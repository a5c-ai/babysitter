import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertIsRecord(
  value: unknown,
  message = 'expected an object',
): asserts value is Record<string, unknown> {
  assert.ok(isRecord(value), message);
}

function readPackageJson(): unknown {
  const root = path.resolve(__dirname, '..', '..');
  const raw = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  return JSON.parse(raw) as unknown;
}

function readVscodeIgnore(): string {
  const root = path.resolve(__dirname, '..', '..');
  return fs.readFileSync(path.join(root, '.vscodeignore'), 'utf8');
}

suite('Extension manifest', () => {
  test('contributes refresh command and keybindings', () => {
    const pkg = readPackageJson();
    assertIsRecord(pkg, 'expected package.json to be an object');

    const activationEvents = Array.isArray(pkg.activationEvents) ? pkg.activationEvents : [];
    assert.ok(
      activationEvents.includes('onCommand:babysitter.dispatchRunFromTaskFile'),
      'missing activation event for babysitter.dispatchRunFromTaskFile',
    );

    const contributes = pkg.contributes;
    assertIsRecord(contributes, 'expected contributes to be an object');

    const commands = Array.isArray(contributes.commands) ? contributes.commands : [];
    assert.ok(
      commands.some((c) => isRecord(c) && c.command === 'babysitter.runs.refresh'),
      'missing contributes.commands babysitter.runs.refresh',
    );
    assert.ok(
      commands.some((c) => isRecord(c) && c.command === 'babysitter.dispatchRunFromTaskFile'),
      'missing contributes.commands babysitter.dispatchRunFromTaskFile',
    );

    const keybindings = Array.isArray(contributes.keybindings) ? contributes.keybindings : [];
    const required = new Map<string, string>([
      ['babysitter.openPromptBuilder', 'ctrl+alt+b p'],
      ['babysitter.dispatchRun', 'ctrl+alt+b n'],
      ['babysitter.resumeRun', 'ctrl+alt+b r'],
      ['babysitter.openRunDetails', 'ctrl+alt+b d'],
      ['babysitter.openRunLogs', 'ctrl+alt+b l'],
      ['babysitter.runs.refresh', 'ctrl+alt+b shift+r'],
      ['babysitter.sendEnter', 'ctrl+alt+b enter'],
      ['babysitter.sendEsc', 'ctrl+alt+b escape'],
    ]);

    for (const [command, key] of required) {
      assert.ok(
        keybindings.some((kb) => isRecord(kb) && kb.command === command && kb.key === key),
        `missing keybinding: ${command} -> ${key}`,
      );
    }

    assertIsRecord(contributes.menus, 'expected contributes.menus to be an object');
    const explorerValue = contributes.menus['explorer/context'];
    const explorer = Array.isArray(explorerValue) ? explorerValue : [];
    assert.ok(
      explorer.some(
        (entry) =>
          isRecord(entry) &&
          entry.command === 'babysitter.dispatchRunFromTaskFile' &&
          entry.when === 'resourceScheme == file && resourceFilename =~ /\\.task\\.md$/',
      ),
      'missing explorer context menu for babysitter.dispatchRunFromTaskFile',
    );
  });

  test('has packaging metadata and a safe .vscodeignore', () => {
    const pkg = readPackageJson();
    assertIsRecord(pkg, 'expected package.json to be an object');

    assert.deepStrictEqual(pkg.extensionKind, ['workspace']);
    assert.ok(
      Array.isArray(pkg.keywords) && pkg.keywords.length > 0,
      'expected non-empty keywords',
    );

    const ignore = readVscodeIgnore();
    assert.ok(ignore.includes('node_modules/**'), 'expected node_modules/** in .vscodeignore');
    assert.ok(
      !ignore.includes('**/node_modules/**'),
      'do not use **/node_modules/** (breaks vsce dependency packaging)',
    );
    assert.ok(
      ignore.includes('!node_modules/node-pty/**'),
      'expected node-pty whitelisted for VSIX runtime',
    );
    assert.ok(ignore.includes('dist/unit/**'), 'expected dist/unit/** excluded from VSIX');
    assert.ok(ignore.includes('.kanban/**'), 'expected .kanban/** excluded from VSIX');
    assert.ok(ignore.includes('tsconfig.json'), 'expected tsconfig.json excluded from VSIX');
  });
});
