import { describe, expect, it } from 'vitest';
import {
  createClaudeCodeContext,
  createCodexContext,
  createPiContext,
} from '../context';
import {
  composeBabysitSkillPrompt,
  composeProcessCreatePrompt,
  composeOrchestrationPrompt,
  composeBreakpointPrompt,
  joinNonEmpty,
} from '../compose';
import { renderNonNegotiables } from '../parts/nonNegotiables';
import { renderIntentFidelityChecks } from '../parts/intentFidelityChecks';
import { renderLoopControl } from '../parts/loopControl';
import { renderTaskKinds } from '../parts/taskKinds';
import { renderTaskExamples } from '../parts/taskExamples';
import { renderBreakpointHandling } from '../parts/breakpointHandling';

// ---------------------------------------------------------------------------
// 1. Context factories
// ---------------------------------------------------------------------------
describe('context factories', () => {
  describe('createClaudeCodeContext', () => {
    it('returns harness="claude-code"', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.harness).toBe('claude-code');
    });

    it('sets pluginRootVar to ${CLAUDE_PLUGIN_ROOT}', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.pluginRootVar).toBe('${CLAUDE_PLUGIN_ROOT}');
    });

    it('sets loopControlTerm to "stop-hook"', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.loopControlTerm).toBe('stop-hook');
    });

    it('sets harnessLabel to "Claude Code"', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.harnessLabel).toBe('Claude Code');
    });

    it('defaults interactive to true', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.interactive).toBe(true);
    });

    it('sets hookDriven to true', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.hookDriven).toBe(true);
    });

    it('sets hasNonNegotiables to false', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.hasNonNegotiables).toBe(false);
    });

    it('sets hasIntentFidelityChecks to false', () => {
      const ctx = createClaudeCodeContext();
      expect(ctx.hasIntentFidelityChecks).toBe(false);
    });
  });

  describe('createCodexContext', () => {
    it('returns harness="codex"', () => {
      const ctx = createCodexContext();
      expect(ctx.harness).toBe('codex');
    });

    it('defaults hookDriven to true (overridden at instruction-generation time by session state detection)', () => {
      const ctx = createCodexContext();
      expect(ctx.hookDriven).toBe(true);
    });

    it('sets hasNonNegotiables to true', () => {
      const ctx = createCodexContext();
      expect(ctx.hasNonNegotiables).toBe(true);
    });

    it('sets hasIntentFidelityChecks to true', () => {
      const ctx = createCodexContext();
      expect(ctx.hasIntentFidelityChecks).toBe(true);
    });

    it('sets loopControlTerm to "stop-hook"', () => {
      const ctx = createCodexContext();
      expect(ctx.loopControlTerm).toBe('stop-hook');
    });

    it('sets pluginRootVar to ${CODEX_PLUGIN_ROOT}', () => {
      const ctx = createCodexContext();
      expect(ctx.pluginRootVar).toBe('${CODEX_PLUGIN_ROOT}');
    });
  });

  describe('createPiContext', () => {
    it('returns harness="pi"', () => {
      const ctx = createPiContext();
      expect(ctx.harness).toBe('pi');
    });

    it('sets loopControlTerm to "skill-driven"', () => {
      const ctx = createPiContext();
      expect(ctx.loopControlTerm).toBe('skill-driven');
    });

    it('sets pluginRootVar to ${PI_PLUGIN_ROOT}', () => {
      const ctx = createPiContext();
      expect(ctx.pluginRootVar).toBe('${PI_PLUGIN_ROOT}');
    });

    it('sets hasNonNegotiables to false', () => {
      const ctx = createPiContext();
      expect(ctx.hasNonNegotiables).toBe(false);
    });

    it('sets hasIntentFidelityChecks to false', () => {
      const ctx = createPiContext();
      expect(ctx.hasIntentFidelityChecks).toBe(false);
    });

    it('sets hookDriven to false', () => {
      const ctx = createPiContext();
      expect(ctx.hookDriven).toBe(false);
    });
  });

  describe('overrides', () => {
    it('createClaudeCodeContext respects interactive override', () => {
      const ctx = createClaudeCodeContext({ interactive: false });
      expect(ctx.interactive).toBe(false);
    });

    it('createCodexContext respects harness override', () => {
      const ctx = createCodexContext({ harnessLabel: 'Custom Codex' });
      expect(ctx.harnessLabel).toBe('Custom Codex');
    });

    it('createPiContext respects loopControlTerm override', () => {
      const ctx = createPiContext({ loopControlTerm: 'custom-driver' });
      expect(ctx.loopControlTerm).toBe('custom-driver');
    });
  });
});

// ---------------------------------------------------------------------------
// 2. composeBabysitSkillPrompt
// ---------------------------------------------------------------------------
describe('composeBabysitSkillPrompt', () => {
  it('contains --harness claude-code for Claude Code context', () => {
    const output = composeBabysitSkillPrompt(createClaudeCodeContext());
    expect(output).toContain('--harness claude-code');
  });

  it('contains "stop-hook" for Claude Code context', () => {
    const output = composeBabysitSkillPrompt(createClaudeCodeContext());
    expect(output).toContain('stop-hook');
  });

  it('does NOT contain non-negotiables for Claude Code context', () => {
    const output = composeBabysitSkillPrompt(createClaudeCodeContext());
    expect(output).not.toContain('## Non-Negotiables');
  });

  it('contains --harness codex for Codex context', () => {
    const output = composeBabysitSkillPrompt(createCodexContext());
    expect(output).toContain('--harness codex');
  });

  it('contains non-hook-driven caveat for Codex context when hookDriven is false', () => {
    const output = composeBabysitSkillPrompt(createCodexContext({ hookDriven: false }));
    expect(output).toContain('does not support hooks');
  });

  it('contains non-negotiables for Codex context', () => {
    const output = composeBabysitSkillPrompt(createCodexContext());
    expect(output).toContain('## Non-Negotiables');
  });

  it('contains --harness pi for PI context', () => {
    const output = composeBabysitSkillPrompt(createPiContext());
    expect(output).toContain('--harness pi');
  });

  it('contains "skill-driven" for PI context', () => {
    const output = composeBabysitSkillPrompt(createPiContext());
    expect(output).toContain('skill-driven');
  });

  it('does NOT contain non-hook-driven caveat for PI context (uses skill-driven)', () => {
    const output = composeBabysitSkillPrompt(createPiContext());
    expect(output).not.toContain('Non-hook-driven continuation');
  });
});

// ---------------------------------------------------------------------------
// 3. composeProcessCreatePrompt
// ---------------------------------------------------------------------------
describe('composeProcessCreatePrompt', () => {
  it('contains interview phase content', () => {
    const output = composeProcessCreatePrompt(createClaudeCodeContext());
    expect(output).toContain('Interview phase');
    expect(output).toContain('Interactive mode');
  });

  it('contains process creation guidelines', () => {
    const output = composeProcessCreatePrompt(createClaudeCodeContext());
    expect(output).toContain('Process creation phase');
  });

  it('contains task kinds table', () => {
    const output = composeProcessCreatePrompt(createClaudeCodeContext());
    expect(output).toContain('## Task Kinds');
    expect(output).toContain('| Kind |');
  });

  it('does NOT contain run:create section', () => {
    const output = composeProcessCreatePrompt(createClaudeCodeContext());
    expect(output).not.toContain('### 2. Create run and bind session');
  });

  it('does NOT contain orchestration iteration section', () => {
    const output = composeProcessCreatePrompt(createClaudeCodeContext());
    expect(output).not.toContain('### 3. Run Iteration');
  });

  it('includes intent fidelity checks for Codex', () => {
    const output = composeProcessCreatePrompt(createCodexContext());
    expect(output).toContain('Intent Fidelity Checks');
  });

  it('does NOT include intent fidelity checks for Claude Code', () => {
    const output = composeProcessCreatePrompt(createClaudeCodeContext());
    expect(output).not.toContain('Intent Fidelity Checks');
  });
});

// ---------------------------------------------------------------------------
// 4. composeOrchestrationPrompt
// ---------------------------------------------------------------------------
describe('composeOrchestrationPrompt', () => {
  it('contains run:create section', () => {
    const output = composeOrchestrationPrompt(createClaudeCodeContext());
    expect(output).toContain('### 2. Create run and bind session');
  });

  it('contains run:iterate section', () => {
    const output = composeOrchestrationPrompt(createClaudeCodeContext());
    expect(output).toContain('run:iterate');
  });

  it('contains breakpoint handling', () => {
    const output = composeOrchestrationPrompt(createClaudeCodeContext());
    expect(output).toContain('Breakpoint Handling');
  });

  it('contains loop control', () => {
    const output = composeOrchestrationPrompt(createClaudeCodeContext());
    expect(output).toContain('STOP after every phase');
  });

  it('does NOT contain interview phase', () => {
    const output = composeOrchestrationPrompt(createClaudeCodeContext());
    expect(output).not.toContain('#### Interview phase');
  });

  it('does NOT contain process creation guidelines', () => {
    const output = composeOrchestrationPrompt(createClaudeCodeContext());
    expect(output).not.toContain('#### Process creation phase');
  });
});

// ---------------------------------------------------------------------------
// 5. composeBreakpointPrompt
// ---------------------------------------------------------------------------
describe('composeBreakpointPrompt', () => {
  it('contains breakpoint routing fields table', () => {
    const output = composeBreakpointPrompt(createClaudeCodeContext());
    expect(output).toContain('Breakpoint routing fields');
    expect(output).toContain('`expert`');
    expect(output).toContain('`tags`');
    expect(output).toContain('`strategy`');
  });

  it('contains retry/refine pattern code block', () => {
    const output = composeBreakpointPrompt(createClaudeCodeContext());
    expect(output).toContain('retry/refine pattern');
    expect(output).toContain('lastFeedback');
    expect(output).toContain('for (let attempt');
  });

  it('contains posting examples with --status ok', () => {
    const output = composeBreakpointPrompt(createClaudeCodeContext());
    expect(output).toContain('--status ok');
    expect(output).toContain('"approved": true');
    expect(output).toContain('"approved": false');
  });

  it('contains results posting section', () => {
    const output = composeBreakpointPrompt(createClaudeCodeContext());
    expect(output).toContain('task:post');
  });
});

// ---------------------------------------------------------------------------
// 6. Interactive vs non-interactive
// ---------------------------------------------------------------------------
describe('interactive vs non-interactive', () => {
  it('interactive Claude Code context: babysit prompt references AskUserQuestion tool', () => {
    const ctx = createClaudeCodeContext({ interactive: true });
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('AskUserQuestion tool');
  });

  it('non-interactive Claude Code context: babysit prompt references non-interactive mode', () => {
    const ctx = createClaudeCodeContext({ interactive: false });
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('Non-interactive mode');
  });

  it('interview section references the interactiveToolName', () => {
    const ctx = createClaudeCodeContext();
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('no AskUserQuestion tool');
  });

  it('PI context uses its own interactiveToolName', () => {
    const ctx = createPiContext();
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('AskUserQuestion');
  });

  it('interactive=undefined shows both interactive and non-interactive sections', () => {
    const ctx = createClaudeCodeContext({ interactive: undefined });
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('Interactive mode');
    expect(output).toContain('Non-interactive mode');
  });

  it('interactive=undefined: context accepts undefined value', () => {
    const ctx = createClaudeCodeContext({ interactive: undefined });
    expect(ctx.interactive).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Individual parts
// ---------------------------------------------------------------------------
describe('individual parts', () => {
  describe('renderNonNegotiables', () => {
    it('returns empty for Claude Code context', () => {
      const result = renderNonNegotiables(createClaudeCodeContext());
      expect(result).toBe('');
    });

    it('returns non-empty for Codex context', () => {
      const result = renderNonNegotiables(createCodexContext());
      expect(result).not.toBe('');
      expect(result).toContain('Non-Negotiables');
    });

    it('returns empty for PI context', () => {
      const result = renderNonNegotiables(createPiContext());
      expect(result).toBe('');
    });
  });

  describe('renderIntentFidelityChecks', () => {
    it('returns empty for PI context', () => {
      const result = renderIntentFidelityChecks(createPiContext());
      expect(result).toBe('');
    });

    it('returns non-empty for Codex context', () => {
      const result = renderIntentFidelityChecks(createCodexContext());
      expect(result).not.toBe('');
      expect(result).toContain('Intent Fidelity Checks');
    });

    it('returns empty for Claude Code context', () => {
      const result = renderIntentFidelityChecks(createClaudeCodeContext());
      expect(result).toBe('');
    });
  });

  describe('renderLoopControl', () => {
    it('uses in-turn loop language when hookDriven=false', () => {
      const result = renderLoopControl(createCodexContext({ hookDriven: false }));
      expect(result).toContain('Drive the orchestration loop in-turn');
      expect(result).toContain('Hooks are not available');
    });

    it('does NOT mention in-turn for Claude Code context (hookDriven=true)', () => {
      const result = renderLoopControl(createClaudeCodeContext());
      expect(result).not.toContain('in-turn');
    });

    it('uses stop-hook language for Claude Code', () => {
      const result = renderLoopControl(createClaudeCodeContext());
      expect(result).toContain('STOP after every phase');
      expect(result).toContain('stop-hook');
    });

    it('renders no loop-control section for PI', () => {
      const result = renderLoopControl(createPiContext());
      expect(result).toBe('');
    });
  });
});

// ---------------------------------------------------------------------------
// 8. joinNonEmpty utility
// ---------------------------------------------------------------------------
describe('joinNonEmpty', () => {
  it('joins non-empty sections with separator', () => {
    const result = joinNonEmpty(['a', 'b', 'c']);
    expect(result).toBe('a\n\n---\n\nb\n\n---\n\nc');
  });

  it('filters out empty strings', () => {
    const result = joinNonEmpty(['a', '', 'c']);
    expect(result).toBe('a\n\n---\n\nc');
  });

  it('returns empty string for all-empty input', () => {
    const result = joinNonEmpty(['', '', '']);
    expect(result).toBe('');
  });

  it('handles single non-empty section', () => {
    const result = joinNonEmpty(['only']);
    expect(result).toBe('only');
  });
});

// ---------------------------------------------------------------------------
// 9. Capability-conditional prompt sections
// ---------------------------------------------------------------------------
describe('capability-conditional sections', () => {
  describe('PI context (harness-routing only)', () => {
    it('shows execution.harness and execution.permissions in task kinds', () => {
      const ctx = createPiContext();
      const output = renderTaskKinds(ctx);
      expect(output).toContain('execution.harness');
      expect(output).toContain('execution.permissions');
      expect(output).toContain('execution.model');
    });

    it('shows harness and permissions in task kinds code example', () => {
      const ctx = createPiContext();
      const output = renderTaskKinds(ctx);
      expect(output).toContain("harness: 'pi'");
      expect(output).toContain("permissions:");
    });

    it('does not show breakpoint routing fields', () => {
      const ctx = createPiContext();
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('Breakpoint routing fields');
      expect(output).not.toContain('`expert`');
      expect(output).not.toContain('`tags`');
      expect(output).not.toContain('`strategy`');
      expect(output).not.toContain('`previousFeedback`');
      expect(output).not.toContain('`attempt`');
    });

    it('does not show retry/refine convergence pattern', () => {
      const ctx = createPiContext();
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('retry/refine pattern');
      expect(output).not.toContain('lastFeedback');
    });
  });

  describe('Claude Code context (breakpoint-routing, NO harness-routing)', () => {
    it('hides execution.harness and execution.permissions in task kinds', () => {
      const ctx = createClaudeCodeContext();
      const output = renderTaskKinds(ctx);
      expect(output).not.toContain('execution.harness');
      expect(output).not.toContain('execution.permissions');
    });

    it('always shows execution.model in task kinds', () => {
      const ctx = createClaudeCodeContext();
      const output = renderTaskKinds(ctx);
      expect(output).toContain('execution.model');
    });

    it('shows breakpoint routing fields (has breakpoint-routing)', () => {
      const ctx = createClaudeCodeContext();
      const output = renderBreakpointHandling(ctx);
      expect(output).toContain('Breakpoint routing fields');
      expect(output).toContain('`expert`');
      expect(output).toContain('`strategy`');
    });

    it('shows retry/refine pattern (has breakpoint-routing)', () => {
      const ctx = createClaudeCodeContext();
      const output = renderBreakpointHandling(ctx);
      expect(output).toContain('retry/refine pattern');
    });
  });

  describe('context with NO capabilities', () => {
    it('hides execution.harness and execution.permissions', () => {
      const ctx = createClaudeCodeContext({ capabilities: [] });
      const output = renderTaskKinds(ctx);
      expect(output).not.toContain('execution.harness');
      expect(output).not.toContain('execution.permissions');
    });

    it('always shows execution.model', () => {
      const ctx = createClaudeCodeContext({ capabilities: [] });
      const output = renderTaskKinds(ctx);
      expect(output).toContain('execution.model');
    });

    it('hides breakpoint routing fields', () => {
      const ctx = createClaudeCodeContext({ capabilities: [] });
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('Breakpoint routing fields');
      expect(output).not.toContain('`expert`');
      expect(output).not.toContain('`strategy`');
    });

    it('hides retry/refine pattern', () => {
      const ctx = createClaudeCodeContext({ capabilities: [] });
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('retry/refine pattern');
      expect(output).not.toContain('lastFeedback');
    });

    it('still shows basic breakpoint handling (interactive/non-interactive)', () => {
      const ctx = createClaudeCodeContext({ capabilities: [] });
      const output = renderBreakpointHandling(ctx);
      expect(output).toContain('Interactive mode');
      expect(output).toContain('Non-interactive mode');
      expect(output).toContain('--status ok');
    });
  });
});
