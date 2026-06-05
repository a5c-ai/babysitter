import { describe, it, expect } from 'vitest';
import { renderLongTermMemory } from '../longTermMemory';
import type { PromptContext } from '../../types';

function makeCtx(memories?: PromptContext['longTermMemories']): PromptContext {
  return {
    harness: 'pi',
    harnessLabel: 'PI',
    interactive: false,
    capabilities: [],
    platform: 'linux',
    pluginRootVar: '',
    loopControlTerm: 'loop-driver',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: '',
    sessionEnvVars: '',
    resumeFlags: '',
    sdkVersionExpr: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    cliSetupSnippet: '',
    iterateFlags: '',
    longTermMemories: memories,
  };
}

describe('renderLongTermMemory', () => {
  it('returns empty string when no memories', () => {
    expect(renderLongTermMemory(makeCtx())).toBe('');
    expect(renderLongTermMemory(makeCtx([]))).toBe('');
  });

  it('renders memories grouped by category', () => {
    const result = renderLongTermMemory(makeCtx([
      { content: 'Uses TypeScript strict mode', category: 'preference', confidence: 'high', tags: [] },
      { content: 'Auth service refactored in v5', category: 'architecture', confidence: 'medium', tags: [] },
      { content: 'Prefers Vitest over Jest', category: 'preference', confidence: 'high', tags: [] },
    ]));
    expect(result).toContain('## Long-Term Memory');
    expect(result).toContain('### preference');
    expect(result).toContain('### architecture');
    expect(result).toContain('- Uses TypeScript strict mode');
    expect(result).toContain('- Auth service refactored in v5');
    expect(result).toContain('- Prefers Vitest over Jest');
  });

  it('groups all entries of the same category together', () => {
    const result = renderLongTermMemory(makeCtx([
      { content: 'First', category: 'fact', confidence: 'high', tags: [] },
      { content: 'Second', category: 'fact', confidence: 'medium', tags: [] },
    ]));
    const lines = result.split('\n');
    const factIndex = lines.findIndex(l => l.includes('### fact'));
    expect(lines[factIndex + 1]).toContain('- First');
    expect(lines[factIndex + 2]).toContain('- Second');
  });
});
