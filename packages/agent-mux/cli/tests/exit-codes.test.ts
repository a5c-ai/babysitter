import { describe, it, expect } from 'vitest';
import { ExitCode, errorCodeToExitCode } from '../src/exit-codes.js';
import type { ErrorCode } from '@a5c-ai/agent-mux-core';

describe('ExitCode constants', () => {
  it('has SUCCESS = 0', () => {
    expect(ExitCode.SUCCESS).toBe(0);
  });

  it('has GENERAL_ERROR = 1', () => {
    expect(ExitCode.GENERAL_ERROR).toBe(1);
  });

  it('has USAGE_ERROR = 2', () => {
    expect(ExitCode.USAGE_ERROR).toBe(2);
  });

  it('has AGENT_NOT_FOUND = 3', () => {
    expect(ExitCode.AGENT_NOT_FOUND).toBe(3);
  });

  it('has AGENT_NOT_INSTALLED = 4', () => {
    expect(ExitCode.AGENT_NOT_INSTALLED).toBe(4);
  });

  it('has AUTH_ERROR = 5', () => {
    expect(ExitCode.AUTH_ERROR).toBe(5);
  });

  it('has CAPABILITY_ERROR = 6', () => {
    expect(ExitCode.CAPABILITY_ERROR).toBe(6);
  });

  it('has CONFIG_ERROR = 7', () => {
    expect(ExitCode.CONFIG_ERROR).toBe(7);
  });

  it('has SESSION_NOT_FOUND = 8', () => {
    expect(ExitCode.SESSION_NOT_FOUND).toBe(8);
  });

  it('has PROFILE_NOT_FOUND = 9', () => {
    expect(ExitCode.PROFILE_NOT_FOUND).toBe(9);
  });

  it('has PLUGIN_ERROR = 10', () => {
    expect(ExitCode.PLUGIN_ERROR).toBe(10);
  });

  it('has TIMEOUT = 11', () => {
    expect(ExitCode.TIMEOUT).toBe(11);
  });

  it('has AGENT_CRASHED = 12', () => {
    expect(ExitCode.AGENT_CRASHED).toBe(12);
  });

  it('has ABORTED = 13', () => {
    expect(ExitCode.ABORTED).toBe(13);
  });

  it('has RATE_LIMITED = 14', () => {
    expect(ExitCode.RATE_LIMITED).toBe(14);
  });

  it('has CONTEXT_EXCEEDED = 15', () => {
    expect(ExitCode.CONTEXT_EXCEEDED).toBe(15);
  });
});

describe('errorCodeToExitCode', () => {
  const mappings: [ErrorCode, number][] = [
    ['VALIDATION_ERROR', 2],
    ['AGENT_NOT_FOUND', 3],
    ['UNKNOWN_AGENT', 3],
    ['AGENT_NOT_INSTALLED', 4],
    ['AUTH_ERROR', 5],
    ['CAPABILITY_ERROR', 6],
    ['CONFIG_ERROR', 7],
    ['CONFIG_LOCK_ERROR', 7],
    ['SESSION_NOT_FOUND', 8],
    ['PROFILE_NOT_FOUND', 9],
    ['PLUGIN_ERROR', 10],
    ['TIMEOUT', 11],
    ['INACTIVITY_TIMEOUT', 11],
    ['AGENT_CRASH', 12],
    ['ABORTED', 13],
    ['RATE_LIMITED', 14],
    ['CONTEXT_EXCEEDED', 15],
  ];

  for (const [code, expected] of mappings) {
    it(`maps ${code} to exit code ${expected}`, () => {
      expect(errorCodeToExitCode(code)).toBe(expected);
    });
  }

  const generalErrorCodes: ErrorCode[] = [
    'SPAWN_ERROR',
    'INTERNAL',
    'PARSE_ERROR',
  ];

  for (const code of generalErrorCodes) {
    it(`maps ${code} to exit code 1 (GENERAL_ERROR)`, () => {
      expect(errorCodeToExitCode(code)).toBe(1);
    });
  }
});
