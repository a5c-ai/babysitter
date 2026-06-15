/**
 * Standalone node:test suite for forbidden-markers-scanner.
 *
 * Uses `node:test` + `node:assert/strict` so it can be invoked without any
 * test framework setup. Run with:
 *   node --test library/processes/shared/__tests__/forbidden-markers-scanner.test.mjs
 * or via the top-level npm script:
 *   npm run test:shared
 *
 * Test scope: parser + scanner only. The `defineTask` wrapper is a thin pass-
 * through to the scanner — its shape is covered by JSON-schema declarations
 * in the source and the library smoke test (`library/__tests__/smoke.test.mjs`).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  parseForbiddenMarkers,
  scanForbiddenMarkers,
} from '../forbidden-markers-scanner.js';

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeTempRoot() {
  return mkdtempSync(join(tmpdir(), 'fm-scanner-'));
}

function writeMarkersFile(root, body) {
  const p = join(root, 'forbidden-markers.txt');
  writeFileSync(p, body, 'utf8');
  return p;
}

function makeChunksDir(root, files = {}) {
  const dir = join(root, 'chunks');
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body, 'utf8');
  }
  return dir;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseForbiddenMarkers
// ─────────────────────────────────────────────────────────────────────────────

describe('parseForbiddenMarkers', () => {
  it('strips blank lines, comments, and whitespace', () => {
    const content = [
      '# Saga-era markers',
      'single-breath',
      '   hands-free-stuck   ',
      '',
      '# group two',
      'MAX_RECOVERY_FAILURES',
      '   # indented comment is still a comment? — no, only leading-# counts after trim',
      '',
    ].join('\n');

    const out = parseForbiddenMarkers(content);
    assert.deepEqual(out, [
      'single-breath',
      'hands-free-stuck',
      'MAX_RECOVERY_FAILURES',
    ]);
  });

  it('returns an empty array for an empty body', () => {
    assert.deepEqual(parseForbiddenMarkers(''), []);
  });

  it('returns an empty array for a comments-only body', () => {
    const content = '# only\n# comments\n# here\n';
    assert.deepEqual(parseForbiddenMarkers(content), []);
  });

  it('returns an empty array when content is null/undefined', () => {
    assert.deepEqual(parseForbiddenMarkers(null), []);
    assert.deepEqual(parseForbiddenMarkers(undefined), []);
  });

  it('handles CRLF line endings', () => {
    const content = 'foo\r\nbar\r\n# comment\r\nbaz\r\n';
    assert.deepEqual(parseForbiddenMarkers(content), ['foo', 'bar', 'baz']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scanForbiddenMarkers — required-args contract
// ─────────────────────────────────────────────────────────────────────────────

describe('scanForbiddenMarkers — argument validation', () => {
  it('throws when markersFile is missing', async () => {
    await assert.rejects(
      () => scanForbiddenMarkers({ chunksDir: '/tmp/whatever' }),
      /markersFile is required/,
    );
  });

  it('throws when chunksDir is missing', async () => {
    await assert.rejects(
      () => scanForbiddenMarkers({ markersFile: '/tmp/whatever.txt' }),
      /chunksDir is required/,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scanForbiddenMarkers — no-op states
// ─────────────────────────────────────────────────────────────────────────────

describe('scanForbiddenMarkers — no-op states', () => {
  it('missing markers file → ok:true reason:missing-markers-file', async () => {
    const root = makeTempRoot();
    try {
      const chunksDir = makeChunksDir(root, { 'a.js': 'console.log(1);' });
      const result = await scanForbiddenMarkers({
        markersFile: join(root, 'does-not-exist.txt'),
        chunksDir,
      });
      assert.equal(result.ok, true);
      assert.deepEqual(result.hits, []);
      assert.equal(result.markerCount, 0);
      assert.equal(result.chunkCount, 0);
      assert.equal(result.reason, 'missing-markers-file');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('missing chunks dir → ok:true reason:missing-chunks-dir', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'foo\nbar\n');
      const result = await scanForbiddenMarkers({
        markersFile,
        chunksDir: join(root, 'does-not-exist-chunks'),
      });
      assert.equal(result.ok, true);
      assert.deepEqual(result.hits, []);
      assert.equal(result.markerCount, 2);
      assert.equal(result.chunkCount, 0);
      assert.equal(result.reason, 'missing-chunks-dir');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('empty markers list → ok:true reason:empty-markers', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, '# only comments\n\n');
      const chunksDir = makeChunksDir(root, { 'a.js': 'console.log(1);' });
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, true);
      assert.deepEqual(result.hits, []);
      assert.equal(result.markerCount, 0);
      assert.equal(result.chunkCount, 0);
      assert.equal(result.reason, 'empty-markers');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('chunks dir with no .js files → ok:true reason:no-chunks', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'foo\n');
      const chunksDir = makeChunksDir(root, {
        'README.md': '# not a chunk',
        'styles.css': 'body{}',
      });
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, true);
      assert.deepEqual(result.hits, []);
      assert.equal(result.markerCount, 1);
      assert.equal(result.chunkCount, 0);
      assert.equal(result.reason, 'no-chunks');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scanForbiddenMarkers — clean
// ─────────────────────────────────────────────────────────────────────────────

describe('scanForbiddenMarkers — clean chunks', () => {
  it('no marker present in any chunk → ok:true reason:clean hits:[]', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'forbidden\nbanned\n');
      const chunksDir = makeChunksDir(root, {
        'a.js': 'export const x = 1;',
        'b.js': 'export const y = 2;',
        'c.js': 'export const z = 3;',
      });
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, true);
      assert.deepEqual(result.hits, []);
      assert.equal(result.markerCount, 2);
      assert.equal(result.chunkCount, 3);
      assert.equal(result.reason, 'clean');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scanForbiddenMarkers — hits
// ─────────────────────────────────────────────────────────────────────────────

describe('scanForbiddenMarkers — hits', () => {
  it('1 marker × 1 chunk → ok:false with structured hit', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'single-breath\n');
      const chunksDir = makeChunksDir(root, {
        'page.js': 'function x(){return "single-breath";}',
        'other.js': 'console.log("ok");',
      });
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, false);
      assert.equal(result.reason, 'hits');
      assert.equal(result.markerCount, 1);
      assert.equal(result.chunkCount, 2);
      assert.equal(result.hits.length, 1);
      assert.equal(result.hits[0].marker, 'single-breath');
      assert.match(result.hits[0].chunk, /page\.js$/);
      assert.equal(result.hits[0].count, 1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('same marker in N chunks → N hit entries', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'BAD_THING\n');
      const chunksDir = makeChunksDir(root, {
        'a.js': 'BAD_THING',
        'b.js': 'BAD_THING',
        'c.js': 'BAD_THING',
        'd.js': 'totally-fine',
      });
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, false);
      assert.equal(result.reason, 'hits');
      assert.equal(result.hits.length, 3);
      const chunkNames = result.hits.map(h => h.chunk.split('/').pop()).sort();
      assert.deepEqual(chunkNames, ['a.js', 'b.js', 'c.js']);
      for (const h of result.hits) {
        assert.equal(h.marker, 'BAD_THING');
        assert.equal(h.count, 1);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('1 marker M times in single chunk → count == M', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'OOPS\n');
      // 4 occurrences of OOPS, plus overlapping non-occurrences to verify the
      // counter does not over-count via overlap or under-count via greedy step.
      const body = 'OOPS-OOPS_OOPS+OOPS.NOT_OOPSY but OOPS prefix';
      // Count manually: 'OOPS' at indices 0, 5, 10, 15, 24, 35 — let's compute.
      const chunksDir = makeChunksDir(root, { 'noisy.js': body });
      const expected = (body.match(/OOPS/g) || []).length;
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, false);
      assert.equal(result.hits.length, 1);
      assert.equal(result.hits[0].marker, 'OOPS');
      assert.equal(result.hits[0].count, expected);
      assert(expected >= 4, `sanity: expected at least 4 occurrences, got ${expected}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('multiple markers, multiple chunks → one hit per (marker, chunk) pair', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'alpha\nbeta\n');
      const chunksDir = makeChunksDir(root, {
        'x.js': 'alpha beta alpha',          // alpha × 2, beta × 1
        'y.js': 'beta beta beta',            // beta × 3
        'z.js': 'no markers here',           // none
      });
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, false);
      assert.equal(result.markerCount, 2);
      assert.equal(result.chunkCount, 3);

      // Build an easy lookup: (chunkBasename, marker) → count
      const map = new Map();
      for (const h of result.hits) {
        map.set(`${h.chunk.split('/').pop()}::${h.marker}`, h.count);
      }
      assert.equal(map.get('x.js::alpha'), 2);
      assert.equal(map.get('x.js::beta'), 1);
      assert.equal(map.get('y.js::beta'), 3);
      assert.equal(map.get('y.js::alpha'), undefined);
      assert.equal(map.get('z.js::alpha'), undefined);
      assert.equal(map.get('z.js::beta'), undefined);
      assert.equal(result.hits.length, 3);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('non-.js files in chunks dir are ignored', async () => {
    const root = makeTempRoot();
    try {
      const markersFile = writeMarkersFile(root, 'forbidden\n');
      const chunksDir = makeChunksDir(root, {
        'a.js': 'totally clean',
        'README.md': 'forbidden — but this is not a chunk',
        'styles.css': 'forbidden',
      });
      const result = await scanForbiddenMarkers({ markersFile, chunksDir });
      assert.equal(result.ok, true);
      assert.equal(result.reason, 'clean');
      assert.equal(result.chunkCount, 1);
      assert.deepEqual(result.hits, []);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
