import * as assert from 'assert';

import {
  computeKeyFilesModel,
  groupKeyFiles,
  matchesKeyFilesFilter,
  normalizePinnedIdsByRunId,
  setPinnedIdsForRun,
  togglePinnedId,
} from '../extension/keyFilesModel';

suite('keyFilesModel', () => {
  test('groupKeyFiles uses stable group and item ordering', () => {
    const base = {
      fsPath: 'C:\\tmp\\x',
      isDirectory: false,
      size: null,
      mtimeMs: null,
      displayName: 'x',
      exists: true,
    };

    const grouped = groupKeyFiles([
      { ...base, id: '3', group: 'Logs', relPath: 'b.log' },
      { ...base, id: '2', group: 'Code', relPath: 'a.js' },
      { ...base, id: '1', group: 'Code', relPath: 'a.js' },
      { ...base, id: '4', group: 'Process', relPath: 'state.json' },
    ]);

    assert.deepStrictEqual(
      grouped.map((g) => g.group),
      ['Process', 'Code', 'Logs'],
    );
    const code = grouped.find((g) => g.group === 'Code');
    assert.ok(code);
    assert.deepStrictEqual(
      code.items.map((i) => i.id),
      ['1', '2'],
    );
  });

  test('matchesKeyFilesFilter checks relPath and displayName', () => {
    assert.equal(
      matchesKeyFilesFilter({ relPath: 'foo/bar.txt', displayName: 'bar.txt' }, 'bar'),
      true,
    );
    assert.equal(
      matchesKeyFilesFilter({ relPath: 'foo/baz.txt', displayName: 'something' }, 'bar'),
      false,
    );
  });

  test('pins persist per run and prune missing ids', () => {
    const pinnedIdsByRunId = normalizePinnedIdsByRunId({
      run1: ['a', 'a', '', 'missing'],
      run2: ['x'],
    });

    const snapshot: unknown = {
      run: { id: 'run1', paths: { runRoot: 'C:\\runs\\run1' } },
      runFiles: [
        {
          id: 'a',
          relPath: 'code/main.js',
          fsPath: 'C:\\runs\\run1\\code\\main.js',
          isDirectory: false,
        },
      ],
      importantFiles: [],
      keyFilesMeta: {
        runRoot: 'C:\\runs\\run1',
        runRootExists: true,
        runRootReadable: true,
        truncated: false,
        totalFiles: 1,
      },
    };

    const model = computeKeyFilesModel({ snapshot, filterValue: '', pinnedIdsByRunId });
    assert.deepStrictEqual(
      model.groupedPinned.flatMap((g) => g.items.map((i) => i.id)),
      ['a'],
    );
    assert.deepStrictEqual(model.nextPinnedIds, ['a']);

    const updated = setPinnedIdsForRun(pinnedIdsByRunId, 'run2', togglePinnedId(['x'], 'y'));
    assert.deepStrictEqual(updated.run1, ['a', 'missing']);
    assert.deepStrictEqual(updated.run2, ['x', 'y']);
  });

  test('empty states reflect run-folder availability', () => {
    const missing: unknown = {
      run: { id: 'r', paths: { runRoot: 'C:\\runs\\missing' } },
      runFiles: [],
      importantFiles: [],
      keyFilesMeta: {
        runRoot: 'C:\\runs\\missing',
        runRootExists: false,
        runRootReadable: false,
        truncated: false,
        totalFiles: 0,
      },
    };
    const missingModel = computeKeyFilesModel({
      snapshot: missing,
      filterValue: '',
      pinnedIdsByRunId: {},
    });
    assert.equal(missingModel.emptyMessage, 'Run folder is missing.');
    assert.equal(missingModel.canRevealRunRoot, false);
    assert.equal(missingModel.canCopyRunRoot, true);

    const unreadable: unknown = {
      run: { id: 'r', paths: { runRoot: 'C:\\runs\\unreadable' } },
      runFiles: [],
      importantFiles: [],
      keyFilesMeta: {
        runRoot: 'C:\\runs\\unreadable',
        runRootExists: true,
        runRootReadable: false,
        runRootError: 'Run folder is not readable.',
        truncated: false,
        totalFiles: 0,
      },
    };
    const unreadableModel = computeKeyFilesModel({
      snapshot: unreadable,
      filterValue: '',
      pinnedIdsByRunId: {},
    });
    assert.equal(unreadableModel.emptyMessage, 'Run folder is not readable.');
    assert.equal(unreadableModel.canRevealRunRoot, true);
  });

  test('does not throw when snapshot is nullish', () => {
    assert.doesNotThrow(() =>
      computeKeyFilesModel({ snapshot: undefined, filterValue: '', pinnedIdsByRunId: {} }),
    );
  });
});
