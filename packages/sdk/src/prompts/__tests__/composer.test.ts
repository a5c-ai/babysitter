import { describe, expect, it } from 'vitest';
import {
  createPromptContextFromCatalog,
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
import { renderCodingPhilosophy } from '../parts/codingPhilosophy';
import { renderToolPreferences } from '../parts/toolPreferences';
import { renderOutputEfficiency } from '../parts/outputEfficiency';
import { renderGitSafety } from '../parts/gitSafety';

// ---------------------------------------------------------------------------
// 1. Context factories
// ---------------------------------------------------------------------------
describe('context factories', () => {
  describe('createPromptContextFromCatalog', () => {
    it('returns harness="claude-code"', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.harness).toBe('claude-code');
    });

    it('sets pluginRootVar to ${CLAUDE_PLUGIN_ROOT}', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.pluginRootVar).toBe('${CLAUDE_PLUGIN_ROOT}');
    });

    it('sets loopControlTerm to "stop-hook"', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.loopControlTerm).toBe('stop-hook');
    });

    it('sets harnessLabel to "Claude Code"', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.harnessLabel).toBe('Claude Code');
    });

    it('defaults interactive to true', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.interactive).toBe(true);
    });

    it('sets hookDriven to true', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.hookDriven).toBe(true);
    });

    it('sets hasNonNegotiables to false', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.hasNonNegotiables).toBe(false);
    });

    it('sets hasIntentFidelityChecks to false', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      expect(ctx.hasIntentFidelityChecks).toBe(false);
    });
  });

  describe('createPromptContextFromCatalog', () => {
    it('returns harness="codex"', () => {
      const ctx = createPromptContextFromCatalog('codex');
      expect(ctx.harness).toBe('codex');
    });

    it('defaults hookDriven to true (overridden at instruction-generation time by session state detection)', () => {
      const ctx = createPromptContextFromCatalog('codex');
      expect(ctx.hookDriven).toBe(true);
    });

    it('sets hasNonNegotiables to true', () => {
      const ctx = createPromptContextFromCatalog('codex');
      expect(ctx.hasNonNegotiables).toBe(true);
    });

    it('sets hasIntentFidelityChecks to true', () => {
      const ctx = createPromptContextFromCatalog('codex');
      expect(ctx.hasIntentFidelityChecks).toBe(true);
    });

    it('sets loopControlTerm to "stop-hook"', () => {
      const ctx = createPromptContextFromCatalog('codex');
      expect(ctx.loopControlTerm).toBe('stop-hook');
    });

    it('sets pluginRootVar to ${CODEX_PLUGIN_ROOT}', () => {
      const ctx = createPromptContextFromCatalog('codex');
      expect(ctx.pluginRootVar).toBe('${CODEX_PLUGIN_ROOT}');
    });
  });

  describe('createPromptContextFromCatalog', () => {
    it('returns harness="pi"', () => {
      const ctx = createPromptContextFromCatalog('pi');
      expect(ctx.harness).toBe('pi');
    });

    it('sets loopControlTerm to "skill-driven"', () => {
      const ctx = createPromptContextFromCatalog('pi');
      expect(ctx.loopControlTerm).toBe('skill-driven');
    });

    it('sets pluginRootVar to ${PI_PLUGIN_ROOT}', () => {
      const ctx = createPromptContextFromCatalog('pi');
      expect(ctx.pluginRootVar).toBe('${PI_PLUGIN_ROOT}');
    });

    it('sets hasNonNegotiables to false', () => {
      const ctx = createPromptContextFromCatalog('pi');
      expect(ctx.hasNonNegotiables).toBe(false);
    });

    it('sets hasIntentFidelityChecks to false', () => {
      const ctx = createPromptContextFromCatalog('pi');
      expect(ctx.hasIntentFidelityChecks).toBe(false);
    });

    it('sets hookDriven to false', () => {
      const ctx = createPromptContextFromCatalog('pi');
      expect(ctx.hookDriven).toBe(false);
    });
  });

  describe('overrides', () => {
    it('createPromptContextFromCatalog respects interactive override', () => {
      const ctx = createPromptContextFromCatalog('claude-code', { interactive: false });
      expect(ctx.interactive).toBe(false);
    });

    it('createPromptContextFromCatalog respects harness override', () => {
      const ctx = createPromptContextFromCatalog('codex', { harnessLabel: 'Custom Codex' });
      expect(ctx.harnessLabel).toBe('Custom Codex');
    });

    it('createPromptContextFromCatalog respects loopControlTerm override', () => {
      const ctx = createPromptContextFromCatalog('pi', { loopControlTerm: 'custom-driver' });
      expect(ctx.loopControlTerm).toBe('custom-driver');
    });
  });
});

// ---------------------------------------------------------------------------
// 2. composeBabysitSkillPrompt
// ---------------------------------------------------------------------------
describe('composeBabysitSkillPrompt', () => {
  it('contains --harness claude-code for Claude Code context', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('--harness claude-code');
  });

  it('contains "stop-hook" for Claude Code context', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('stop-hook');
  });

  it('does NOT contain non-negotiables for Claude Code context', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).not.toContain('## Non-Negotiables');
  });

  it('contains --harness codex for Codex context', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('codex'));
    expect(output).toContain('--harness codex');
  });

  it('contains non-hook-driven caveat for Codex context when hookDriven is false', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('codex', { hookDriven: false }));
    expect(output).toContain('does not support hooks');
  });

  it('contains non-negotiables for Codex context', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('codex'));
    expect(output).toContain('## Non-Negotiables');
  });

  it('contains --harness pi for PI context', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('pi'));
    expect(output).toContain('--harness pi');
  });

  it('contains "skill-driven" for PI context', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('pi'));
    expect(output).toContain('skill-driven');
  });

  it('does NOT contain non-hook-driven caveat for PI context (uses skill-driven)', () => {
    const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('pi'));
    expect(output).not.toContain('Non-hook-driven continuation');
  });
});

// ---------------------------------------------------------------------------
// 3. composeProcessCreatePrompt
// ---------------------------------------------------------------------------
describe('composeProcessCreatePrompt', () => {
  it('contains interview phase content', () => {
    const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('Interview phase');
    expect(output).toContain('Interactive mode');
  });

  it('contains process creation guidelines', () => {
    const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('Process creation phase');
  });

  it('contains task kinds table', () => {
    const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('## Task Kinds');
    expect(output).toContain('| Kind |');
  });

  it('does NOT contain run:create section', () => {
    const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).not.toContain('### 2. Create run and bind session');
  });

  it('does NOT contain orchestration iteration section', () => {
    const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).not.toContain('### 3. Run Iteration');
  });

  it('includes intent fidelity checks for Codex', () => {
    const output = composeProcessCreatePrompt(createPromptContextFromCatalog('codex'));
    expect(output).toContain('Intent Fidelity Checks');
  });

  it('does NOT include intent fidelity checks for Claude Code', () => {
    const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).not.toContain('Intent Fidelity Checks');
  });
});

// ---------------------------------------------------------------------------
// 4. composeOrchestrationPrompt
// ---------------------------------------------------------------------------
describe('composeOrchestrationPrompt', () => {
  it('contains run:create section', () => {
    const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('### 2. Create run and bind session');
  });

  it('contains run:iterate section', () => {
    const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('run:iterate');
  });

  it('contains breakpoint handling', () => {
    const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('Breakpoint Handling');
  });

  it('contains loop control', () => {
    const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('STOP after every phase');
  });

  it('uses inputs.json in task IO examples', () => {
    const output = renderTaskExamples(createPromptContextFromCatalog('claude-code'));
    const taskKinds = renderTaskKinds(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('tasks/${taskCtx.effectId}/inputs.json');
    expect(taskKinds).toContain('tasks/${taskCtx.effectId}/inputs.json');
  });

  it('does NOT contain interview phase', () => {
    const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).not.toContain('#### Interview phase');
  });

  it('does NOT contain process creation guidelines', () => {
    const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).not.toContain('#### Process creation phase');
  });
});

// ---------------------------------------------------------------------------
// 5. composeBreakpointPrompt
// ---------------------------------------------------------------------------
describe('composeBreakpointPrompt', () => {
  it('contains breakpoint routing fields table', () => {
    const output = composeBreakpointPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('Breakpoint routing fields');
    expect(output).toContain('`expert`');
    expect(output).toContain('`tags`');
    expect(output).toContain('`strategy`');
  });

  it('contains retry/refine pattern code block', () => {
    const output = composeBreakpointPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('retry/refine pattern');
    expect(output).toContain('lastFeedback');
    expect(output).toContain('for (let attempt');
  });

  it('contains posting examples with --status ok', () => {
    const output = composeBreakpointPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('--status ok');
    expect(output).toContain('"approved": true');
    expect(output).toContain('"approved": false');
  });

  it('contains results posting section', () => {
    const output = composeBreakpointPrompt(createPromptContextFromCatalog('claude-code'));
    expect(output).toContain('task:post');
  });
});

// ---------------------------------------------------------------------------
// 5b. New prompt sections (GAP-PROMPT-008/009/011/012)
// ---------------------------------------------------------------------------
describe('new prompt sections', () => {
  describe('composeBabysitSkillPrompt includes all 4 new sections', () => {
    it('contains Coding Philosophy heading', () => {
      const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Coding Philosophy');
    });

    it('contains Tool Preferences heading', () => {
      const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Tool Preferences');
    });

    it('contains Output Efficiency heading', () => {
      const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Output Efficiency');
    });

    it('contains Git Operations Protocol heading', () => {
      const output = composeBabysitSkillPrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Git Operations Protocol');
    });
  });

  describe('composeProcessCreatePrompt includes codingPhilosophy, toolPreferences, gitSafety', () => {
    it('contains Coding Philosophy heading', () => {
      const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Coding Philosophy');
    });

    it('contains Tool Preferences heading', () => {
      const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Tool Preferences');
    });

    it('contains Git Operations Protocol heading', () => {
      const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Git Operations Protocol');
    });

    it('does NOT contain Output Efficiency heading', () => {
      const output = composeProcessCreatePrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).not.toContain('# Output Efficiency');
    });
  });

  describe('composeOrchestrationPrompt includes outputEfficiency', () => {
    it('contains Output Efficiency heading', () => {
      const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).toContain('# Output Efficiency');
    });

    it('does NOT contain Coding Philosophy heading', () => {
      const output = composeOrchestrationPrompt(createPromptContextFromCatalog('claude-code'));
      expect(output).not.toContain('# Coding Philosophy');
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Interactive vs non-interactive
// ---------------------------------------------------------------------------
describe('interactive vs non-interactive', () => {
  it('interactive Claude Code context: babysit prompt references AskUserQuestion tool', () => {
    const ctx = createPromptContextFromCatalog('claude-code', { interactive: true });
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('AskUserQuestion tool');
  });

  it('non-interactive Claude Code context: babysit prompt references non-interactive mode', () => {
    const ctx = createPromptContextFromCatalog('claude-code', { interactive: false });
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('Non-interactive mode');
  });

  it('interview section references the interactiveToolName', () => {
    const ctx = createPromptContextFromCatalog('claude-code');
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('no AskUserQuestion tool');
  });

  it('PI context uses its own interactiveToolName', () => {
    const ctx = createPromptContextFromCatalog('pi');
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('AskUserQuestion');
  });

  it('interactive=undefined shows both interactive and non-interactive sections', () => {
    const ctx = createPromptContextFromCatalog('claude-code', { interactive: undefined });
    const output = composeBabysitSkillPrompt(ctx);
    expect(output).toContain('Interactive mode');
    expect(output).toContain('Non-interactive mode');
  });

  it('interactive=undefined: context accepts undefined value', () => {
    const ctx = createPromptContextFromCatalog('claude-code', { interactive: undefined });
    expect(ctx.interactive).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Individual parts
// ---------------------------------------------------------------------------
describe('individual parts', () => {
  describe('renderNonNegotiables', () => {
    it('returns empty for Claude Code context', () => {
      const result = renderNonNegotiables(createPromptContextFromCatalog('claude-code'));
      expect(result).toBe('');
    });

    it('returns non-empty for Codex context', () => {
      const result = renderNonNegotiables(createPromptContextFromCatalog('codex'));
      expect(result).not.toBe('');
      expect(result).toContain('Non-Negotiables');
    });

    it('returns empty for PI context', () => {
      const result = renderNonNegotiables(createPromptContextFromCatalog('pi'));
      expect(result).toBe('');
    });
  });

  describe('renderIntentFidelityChecks', () => {
    it('returns empty for PI context', () => {
      const result = renderIntentFidelityChecks(createPromptContextFromCatalog('pi'));
      expect(result).toBe('');
    });

    it('returns non-empty for Codex context', () => {
      const result = renderIntentFidelityChecks(createPromptContextFromCatalog('codex'));
      expect(result).not.toBe('');
      expect(result).toContain('Intent Fidelity Checks');
    });

    it('returns empty for Claude Code context', () => {
      const result = renderIntentFidelityChecks(createPromptContextFromCatalog('claude-code'));
      expect(result).toBe('');
    });
  });

  describe('renderLoopControl', () => {
    it('uses in-turn loop language when hookDriven=false', () => {
      const result = renderLoopControl(createPromptContextFromCatalog('codex', { hookDriven: false }));
      expect(result).toContain('Drive the orchestration loop in-turn');
      expect(result).toContain('Hooks are not available');
    });

    it('does NOT mention in-turn for Claude Code context (hookDriven=true)', () => {
      const result = renderLoopControl(createPromptContextFromCatalog('claude-code'));
      expect(result).not.toContain('in-turn');
    });

    it('uses stop-hook language for Claude Code', () => {
      const result = renderLoopControl(createPromptContextFromCatalog('claude-code'));
      expect(result).toContain('STOP after every phase');
      expect(result).toContain('stop-hook');
    });

    it('renders no loop-control section for PI', () => {
      const result = renderLoopControl(createPromptContextFromCatalog('pi'));
      expect(result).toBe('');
    });
  });
});

// ---------------------------------------------------------------------------
// 7b. Dedicated render function tests for new prompt sections
// ---------------------------------------------------------------------------
describe('renderCodingPhilosophy', () => {
  it('returns non-empty string', () => {
    const result = renderCodingPhilosophy(createPromptContextFromCatalog('claude-code'));
    expect(result).not.toBe('');
  });

  it('contains "premature abstraction"', () => {
    const result = renderCodingPhilosophy(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('premature abstraction');
  });

  it('contains "prefer editing existing files"', () => {
    const result = renderCodingPhilosophy(createPromptContextFromCatalog('claude-code'));
    expect(result.toLowerCase()).toContain('prefer editing existing files');
  });
});

describe('renderToolPreferences', () => {
  it('returns non-empty string', () => {
    const result = renderToolPreferences(createPromptContextFromCatalog('claude-code'));
    expect(result).not.toBe('');
  });

  it('contains "Read"', () => {
    const result = renderToolPreferences(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('Read');
  });

  it('contains "Edit"', () => {
    const result = renderToolPreferences(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('Edit');
  });

  it('contains "Glob"', () => {
    const result = renderToolPreferences(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('Glob');
  });

  it('contains "Grep"', () => {
    const result = renderToolPreferences(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('Grep');
  });

  it('contains "read a file before editing"', () => {
    const result = renderToolPreferences(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('read a file before editing');
  });
});

describe('renderOutputEfficiency', () => {
  it('returns non-empty string', () => {
    const result = renderOutputEfficiency(createPromptContextFromCatalog('claude-code'));
    expect(result).not.toBe('');
  });

  it('contains "one sentence"', () => {
    const result = renderOutputEfficiency(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('one sentence');
  });

  it('contains "Lead with the answer"', () => {
    const result = renderOutputEfficiency(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('Lead with the answer');
  });
});

describe('renderGitSafety', () => {
  it('returns non-empty string', () => {
    const result = renderGitSafety(createPromptContextFromCatalog('claude-code'));
    expect(result).not.toBe('');
  });

  it('contains "NEVER update the git config"', () => {
    const result = renderGitSafety(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('NEVER update the git config');
  });

  it('contains "force"', () => {
    const result = renderGitSafety(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('force');
  });

  it('contains "--no-verify"', () => {
    const result = renderGitSafety(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('--no-verify');
  });

  it('contains "NEW commit"', () => {
    const result = renderGitSafety(createPromptContextFromCatalog('claude-code'));
    expect(result).toContain('NEW commit');
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
      const ctx = createPromptContextFromCatalog('pi');
      const output = renderTaskKinds(ctx);
      expect(output).toContain('execution.harness');
      expect(output).toContain('execution.permissions');
      expect(output).toContain('execution.model');
      expect(output).toContain('not a universal plugin contract');
      expect(output).toContain('do not treat them as a cross-harness security boundary');
    });

    it('shows harness and permissions in task kinds code example', () => {
      const ctx = createPromptContextFromCatalog('pi');
      const output = renderTaskKinds(ctx);
      expect(output).toContain("harness: 'pi'");
      expect(output).toContain("permissions:");
    });

    it('does not show breakpoint routing fields', () => {
      const ctx = createPromptContextFromCatalog('pi');
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('Breakpoint routing fields');
      expect(output).not.toContain('`expert`');
      expect(output).not.toContain('`tags`');
      expect(output).not.toContain('`strategy`');
      expect(output).not.toContain('`previousFeedback`');
      expect(output).not.toContain('`attempt`');
    });

    it('does not show retry/refine convergence pattern', () => {
      const ctx = createPromptContextFromCatalog('pi');
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('retry/refine pattern');
      expect(output).not.toContain('lastFeedback');
    });
  });

  describe('Claude Code context (breakpoint-routing, NO harness-routing)', () => {
    it('hides execution.harness and execution.permissions in task kinds', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      const output = renderTaskKinds(ctx);
      expect(output).not.toContain('execution.harness');
      expect(output).not.toContain('execution.permissions');
    });

    it('always shows execution.model in task kinds', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      const output = renderTaskKinds(ctx);
      expect(output).toContain('execution.model');
    });

    it('shows breakpoint routing fields (has breakpoint-routing)', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      const output = renderBreakpointHandling(ctx);
      expect(output).toContain('Breakpoint routing fields');
      expect(output).toContain('`expert`');
      expect(output).toContain('`strategy`');
    });

    it('shows retry/refine pattern (has breakpoint-routing)', () => {
      const ctx = createPromptContextFromCatalog('claude-code');
      const output = renderBreakpointHandling(ctx);
      expect(output).toContain('retry/refine pattern');
    });
  });

  describe('context with NO capabilities', () => {
    it('hides execution.harness and execution.permissions', () => {
      const ctx = createPromptContextFromCatalog('claude-code', { capabilities: [] });
      const output = renderTaskKinds(ctx);
      expect(output).not.toContain('execution.harness');
      expect(output).not.toContain('execution.permissions');
    });

    it('always shows execution.model', () => {
      const ctx = createPromptContextFromCatalog('claude-code', { capabilities: [] });
      const output = renderTaskKinds(ctx);
      expect(output).toContain('execution.model');
    });

    it('hides breakpoint routing fields', () => {
      const ctx = createPromptContextFromCatalog('claude-code', { capabilities: [] });
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('Breakpoint routing fields');
      expect(output).not.toContain('`expert`');
      expect(output).not.toContain('`strategy`');
    });

    it('hides retry/refine pattern', () => {
      const ctx = createPromptContextFromCatalog('claude-code', { capabilities: [] });
      const output = renderBreakpointHandling(ctx);
      expect(output).not.toContain('retry/refine pattern');
      expect(output).not.toContain('lastFeedback');
    });

    it('still shows basic breakpoint handling (interactive/non-interactive)', () => {
      const ctx = createPromptContextFromCatalog('claude-code', { capabilities: [] });
      const output = renderBreakpointHandling(ctx);
      expect(output).toContain('Interactive mode');
      expect(output).toContain('Non-interactive mode');
      expect(output).toContain('--status ok');
    });
  });
});
