import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Writable } from 'stream';
import {
  DiagnosticLogger,
  createDiagnosticLogger,
  TraceWriter,
  createTraceWriter,
  generateTraceId,
  buildTraceRecord,
} from '../index';
import type { DiagnosticEntry, TraceRecord } from '../types';

// ---------------------------------------------------------------------------
// DiagnosticLogger tests
// ---------------------------------------------------------------------------

describe('DiagnosticLogger', () => {
  let output: string[];
  let stream: Writable;

  beforeEach(() => {
    output = [];
    stream = new Writable({
      write(chunk, _encoding, callback) {
        output.push(chunk.toString());
        callback();
      },
    });
  });

  it('should emit JSON entries to the output stream', () => {
    const logger = new DiagnosticLogger({ output: stream, json: true, level: 'debug' });
    logger.setAdapter('claude');
    logger.setPhase('session.start', 'SessionStart');
    logger.setSession('sess-123', 'native');
    logger.setHandlerIds(['handler-a', 'handler-b']);

    logger.info('Hook execution started');

    expect(output).toHaveLength(1);
    const entry: DiagnosticEntry = JSON.parse(output[0]);
    expect(entry.adapter).toBe('claude');
    expect(entry.canonicalPhase).toBe('session.start');
    expect(entry.nativeEventName).toBe('SessionStart');
    expect(entry.sessionIdQuality).toBe('native');
    expect(entry.sessionId).toBe('sess-123');
    expect(entry.handlerIds).toEqual(['handler-a', 'handler-b']);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('Hook execution started');
  });

  it('should respect minimum log level', () => {
    const logger = new DiagnosticLogger({ output: stream, json: true, level: 'warn' });
    logger.debug('ignored');
    logger.info('also ignored');
    logger.warn('this one shows');
    logger.error('this too');

    expect(output).toHaveLength(2);
    expect(JSON.parse(output[0]).level).toBe('warn');
    expect(JSON.parse(output[1]).level).toBe('error');
  });

  it('should emit human-readable format when json is false', () => {
    const logger = new DiagnosticLogger({ output: stream, json: false, level: 'info' });
    logger.setAdapter('codex');
    logger.setPhase('tool.before', 'preToolUse');
    logger.setHandlerIds(['my-handler']);
    logger.setOutputDegradationFlags(['additionalContext']);

    logger.info('Processing hook');

    expect(output).toHaveLength(1);
    expect(output[0]).toContain('[INFO]');
    expect(output[0]).toContain('[codex]');
    expect(output[0]).toContain('[tool.before]');
    expect(output[0]).toContain('Processing hook');
    expect(output[0]).toContain('handlers=[my-handler]');
    expect(output[0]).toContain('degraded=[additionalContext]');
  });

  it('should include merge decisions in entries', () => {
    const logger = new DiagnosticLogger({ output: stream, json: true, level: 'info' });
    logger.setMergeDecisions([
      { field: 'persistEnv.FOO', resolution: 'last-writer-wins', lossy: false },
      { field: 'additionalContext', resolution: 'concatenated', lossy: true },
    ]);

    logger.info('Merge complete');

    const entry: DiagnosticEntry = JSON.parse(output[0]);
    expect(entry.mergeDecisions).toHaveLength(2);
    expect(entry.mergeDecisions[0].field).toBe('persistEnv.FOO');
    expect(entry.mergeDecisions[1].lossy).toBe(true);
  });

  it('should include extra data in entries', () => {
    const logger = new DiagnosticLogger({ output: stream, json: true, level: 'info' });
    logger.info('test', { foo: 'bar', count: 42 });

    const entry: DiagnosticEntry = JSON.parse(output[0]);
    expect(entry.extra).toEqual({ foo: 'bar', count: 42 });
  });

  it('should build entries without emitting via buildEntry', () => {
    const logger = new DiagnosticLogger({ output: stream, json: true, level: 'info' });
    logger.setAdapter('gemini');
    logger.setPhase('session.end', 'onSessionEnd');

    const entry = logger.buildEntry('warn', 'dry run');
    expect(entry.adapter).toBe('gemini');
    expect(entry.level).toBe('warn');
    // Nothing emitted to stream
    expect(output).toHaveLength(0);
  });
});

describe('createDiagnosticLogger', () => {
  it('should create a logger with default options', () => {
    const logger = createDiagnosticLogger();
    expect(logger).toBeInstanceOf(DiagnosticLogger);
  });
});

// ---------------------------------------------------------------------------
// TraceWriter tests
// ---------------------------------------------------------------------------

describe('TraceWriter', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hooks-mux-trace-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('should write trace records as JSONL', async () => {
    const tracePath = path.join(tmpDir, 'trace.jsonl');
    const writer = new TraceWriter({ filePath: tracePath });

    const record = buildTraceRecord({
      traceId: 'trace_test1',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.150Z',
      adapter: 'claude',
      phase: 'session.start',
      nativeEventName: 'SessionStart',
      sessionIdQuality: 'native',
      sessionId: 'sess-abc',
      handlers: [
        { id: 'h1', pluginId: 'p1', durationMs: 50, success: true, decision: 'noop' },
      ],
      mergedDecision: 'noop',
      degraded: false,
      errors: [],
    });

    await writer.writeRecord(record);
    await writer.writeRecord(record);

    const content = await fs.promises.readFile(tracePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);

    const parsed: TraceRecord = JSON.parse(lines[0]);
    expect(parsed.version).toBe('a5c.hooks.trace.v1');
    expect(parsed.traceId).toBe('trace_test1');
    expect(parsed.adapter).toBe('claude');
    expect(parsed.durationMs).toBe(150);
    expect(parsed.handlers).toHaveLength(1);
  });

  it('should append to existing file by default', async () => {
    const tracePath = path.join(tmpDir, 'trace.jsonl');
    await fs.promises.writeFile(tracePath, '{"existing": true}\n', 'utf-8');

    const writer = new TraceWriter({ filePath: tracePath, append: true });

    const record = buildTraceRecord({
      traceId: 'trace_append',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.100Z',
      adapter: 'codex',
      phase: 'tool.before',
      nativeEventName: 'preToolUse',
      sessionIdQuality: 'derived',
      handlers: [],
      mergedDecision: 'allow',
      degraded: false,
      errors: [],
    });

    await writer.writeRecord(record);

    const content = await fs.promises.readFile(tracePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toHaveProperty('existing', true);
  });

  it('should truncate file when append is false', async () => {
    const tracePath = path.join(tmpDir, 'trace.jsonl');
    await fs.promises.writeFile(tracePath, '{"old": true}\n', 'utf-8');

    const writer = new TraceWriter({ filePath: tracePath, append: false });

    const record = buildTraceRecord({
      traceId: 'trace_trunc',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.050Z',
      adapter: 'pi',
      phase: 'session.start',
      nativeEventName: 'init',
      sessionIdQuality: 'synthetic',
      handlers: [],
      mergedDecision: 'noop',
      degraded: false,
      errors: [],
    });

    await writer.writeRecord(record);

    const content = await fs.promises.readFile(tracePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).traceId).toBe('trace_trunc');
  });

  it('should create nested directories if needed', async () => {
    const tracePath = path.join(tmpDir, 'nested', 'deep', 'trace.jsonl');
    const writer = new TraceWriter({ filePath: tracePath });

    const record = buildTraceRecord({
      traceId: 'trace_nested',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.010Z',
      adapter: 'cursor',
      phase: 'session.start',
      nativeEventName: 'init',
      sessionIdQuality: 'none',
      handlers: [],
      mergedDecision: 'noop',
      degraded: false,
      errors: [],
    });

    await writer.writeRecord(record);

    const exists = await fs.promises.access(tracePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});

describe('createTraceWriter', () => {
  it('should return null when options are null', () => {
    expect(createTraceWriter(null)).toBeNull();
  });

  it('should return null when options are undefined', () => {
    expect(createTraceWriter()).toBeNull();
  });

  it('should return a TraceWriter when options are provided', () => {
    const writer = createTraceWriter({ filePath: '/tmp/test.jsonl' });
    expect(writer).toBeInstanceOf(TraceWriter);
  });
});

describe('generateTraceId', () => {
  it('should produce unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTraceId()));
    expect(ids.size).toBe(100);
  });

  it('should start with trace_ prefix', () => {
    expect(generateTraceId()).toMatch(/^trace_/);
  });
});

describe('buildTraceRecord', () => {
  it('should calculate duration correctly', () => {
    const record = buildTraceRecord({
      traceId: 'test',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.500Z',
      adapter: 'claude',
      phase: 'session.start',
      nativeEventName: 'SessionStart',
      sessionIdQuality: 'native',
      handlers: [],
      mergedDecision: 'noop',
      degraded: false,
      errors: [],
    });

    expect(record.durationMs).toBe(1500);
    expect(record.version).toBe('a5c.hooks.trace.v1');
  });

  it('should include handler records with errors', () => {
    const record = buildTraceRecord({
      traceId: 'test-err',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.200Z',
      adapter: 'codex',
      phase: 'tool.before',
      nativeEventName: 'preToolUse',
      sessionIdQuality: 'derived',
      handlers: [
        { id: 'h1', pluginId: 'p1', durationMs: 100, success: true, decision: 'allow' },
        { id: 'h2', pluginId: 'p2', durationMs: 100, success: false, error: 'timeout' },
      ],
      mergedDecision: 'allow',
      degraded: true,
      errors: ['Handler h2 timed out'],
    });

    expect(record.handlers).toHaveLength(2);
    expect(record.handlers[1].error).toBe('timeout');
    expect(record.degraded).toBe(true);
    expect(record.errors).toHaveLength(1);
  });
});
