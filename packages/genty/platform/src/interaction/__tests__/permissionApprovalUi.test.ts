import { describe, it, expect } from 'vitest';
import {
  formatApprovalPrompt,
  parseApprovalResponse,
  getDefaultApprovalForRisk,
  type ApprovalPrompt,
} from '../permissionApprovalUi';

// ---------------------------------------------------------------------------
// formatApprovalPrompt
// ---------------------------------------------------------------------------

describe('formatApprovalPrompt', () => {
  it('renders a low-risk prompt', () => {
    const prompt: ApprovalPrompt = {
      action: 'Read config file',
      riskLevel: 'low',
      context: 'Reading .env for variable check',
      options: ['approve', 'deny'],
    };
    const text = formatApprovalPrompt(prompt);
    expect(text).toContain('[LOW]');
    expect(text).toContain('Read config file');
    expect(text).toContain('approve');
    expect(text).toContain('deny');
  });

  it('renders a critical-risk prompt', () => {
    const prompt: ApprovalPrompt = {
      action: 'Delete production database',
      riskLevel: 'critical',
      context: 'Requested by cleanup process',
      options: ['approve', 'deny', 'modify'],
    };
    const text = formatApprovalPrompt(prompt);
    expect(text).toContain('[CRIT]');
    expect(text).toContain('Delete production database');
    expect(text).toContain('critical');
  });

  it('lists all options', () => {
    const prompt: ApprovalPrompt = {
      action: 'test',
      riskLevel: 'medium',
      context: 'ctx',
      options: ['a', 'b', 'c'],
    };
    const text = formatApprovalPrompt(prompt);
    expect(text).toContain('- a');
    expect(text).toContain('- b');
    expect(text).toContain('- c');
  });
});

// ---------------------------------------------------------------------------
// parseApprovalResponse
// ---------------------------------------------------------------------------

describe('parseApprovalResponse', () => {
  it('parses "yes" as approve', () => {
    expect(parseApprovalResponse('yes')).toBe('approve');
  });

  it('parses "y" as approve', () => {
    expect(parseApprovalResponse('y')).toBe('approve');
  });

  it('parses "approve" as approve', () => {
    expect(parseApprovalResponse('approve')).toBe('approve');
  });

  it('parses "no" as deny', () => {
    expect(parseApprovalResponse('no')).toBe('deny');
  });

  it('parses "n" as deny', () => {
    expect(parseApprovalResponse('n')).toBe('deny');
  });

  it('parses "deny" as deny', () => {
    expect(parseApprovalResponse('deny')).toBe('deny');
  });

  it('parses "reject" as deny', () => {
    expect(parseApprovalResponse('reject')).toBe('deny');
  });

  it('parses "modify" as modify', () => {
    expect(parseApprovalResponse('modify')).toBe('modify');
  });

  it('handles case-insensitive input', () => {
    expect(parseApprovalResponse('YES')).toBe('approve');
    expect(parseApprovalResponse('No')).toBe('deny');
  });

  it('handles input with whitespace', () => {
    expect(parseApprovalResponse('  approve  ')).toBe('approve');
  });

  it('handles substring match', () => {
    expect(parseApprovalResponse('yes, approve it')).toBe('approve');
  });

  it('returns undefined for unrecognised input', () => {
    expect(parseApprovalResponse('maybe')).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(parseApprovalResponse('')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getDefaultApprovalForRisk
// ---------------------------------------------------------------------------

describe('getDefaultApprovalForRisk', () => {
  it('returns approve for low risk', () => {
    expect(getDefaultApprovalForRisk('low')).toBe('approve');
  });

  it('returns approve for medium risk', () => {
    expect(getDefaultApprovalForRisk('medium')).toBe('approve');
  });

  it('returns deny for high risk', () => {
    expect(getDefaultApprovalForRisk('high')).toBe('deny');
  });

  it('returns deny for critical risk', () => {
    expect(getDefaultApprovalForRisk('critical')).toBe('deny');
  });
});
