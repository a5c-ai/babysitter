import { describe, expect, it, vi } from 'vitest';
import type { PromptContext } from '../types';

// Mock the discovery module before importing the module under test
vi.mock('../babysitterMdDiscovery', () => ({
  discoverBabysitterMdFiles: vi.fn(() => []),
}));

import { renderProjectInstructions } from '../parts/projectInstructions';
import { discoverBabysitterMdFiles } from '../babysitterMdDiscovery';

const mockDiscover = vi.mocked(discoverBabysitterMdFiles);

// Minimal PromptContext — renderProjectInstructions ignores ctx
const ctx: PromptContext = {
  harness: 'claude-code',
  harnessLabel: 'Claude Code',
  interactive: true,
  capabilities: [],
  platform: 'win32',
  pluginRootVar: '',
  loopControlTerm: 'stop-hook',
  sessionBindingFlags: '',
  hookDriven: true,
  interactiveToolName: '',
  sessionEnvVars: '',
  resumeFlags: '',
  sdkVersionExpr: '',
  hasIntentFidelityChecks: false,
  hasNonNegotiables: false,
  cliSetupSnippet: '',
  iterateFlags: '',
};

// ---------------------------------------------------------------------------
// renderProjectInstructions
// ---------------------------------------------------------------------------
describe('renderProjectInstructions', () => {
  it('returns empty string when no files are found', () => {
    mockDiscover.mockReturnValue([]);
    expect(renderProjectInstructions(ctx)).toBe('');
  });

  it('renders a single file without path header or merge note', () => {
    mockDiscover.mockReturnValue([
      {
        filePath: '/repo/BABYSITTER.md',
        content: '  Hello world  ',
        relativePath: 'BABYSITTER.md',
      },
    ]);

    const result = renderProjectInstructions(ctx);

    // Should contain heading
    expect(result).toContain('## Project Instructions (BABYSITTER.md)');
    // Content should be trimmed
    expect(result).toContain('Hello world');
    expect(result).not.toContain('  Hello world  ');
    // No path header for single file
    expect(result).not.toContain('### BABYSITTER.md');
    // No merge note for single file
    expect(result).not.toContain('Merged from');
  });

  it('renders multiple files with path headers and merge note', () => {
    mockDiscover.mockReturnValue([
      {
        filePath: '/repo/BABYSITTER.md',
        content: 'Root instructions',
        relativePath: 'BABYSITTER.md',
      },
      {
        filePath: '/repo/sub/BABYSITTER.md',
        content: 'Sub instructions',
        relativePath: 'sub/BABYSITTER.md',
      },
    ]);

    const result = renderProjectInstructions(ctx);

    // Path headers present
    expect(result).toContain('### BABYSITTER.md');
    expect(result).toContain('### sub/BABYSITTER.md');
    // Merge note with count
    expect(result).toContain('Merged from 2 BABYSITTER.md files');
    // Both contents present
    expect(result).toContain('Root instructions');
    expect(result).toContain('Sub instructions');
  });

  it('trims whitespace from file content', () => {
    mockDiscover.mockReturnValue([
      {
        filePath: '/repo/BABYSITTER.md',
        content: '\n\n  Padded content\n\n',
        relativePath: 'BABYSITTER.md',
      },
    ]);

    const result = renderProjectInstructions(ctx);
    expect(result).toContain('Padded content');
    // The trimmed content should not have leading/trailing newlines
    expect(result).not.toContain('\n\n  Padded content\n\n');
  });
});
