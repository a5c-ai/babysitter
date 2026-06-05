import { describe, expect, it } from 'vitest';
import { renderCommandTemplate } from '../commandTemplates';

describe('doctor command template', () => {
  it('keeps StopHook diagnostics gated by SDK harness capability truth', () => {
    const output = renderCommandTemplate('doctor');

    expect(output).toContain('## Phase 0. Harness Capability Detection');
    expect(output).toContain('detectCallerHarness');
    expect(output).toContain('getAdapterByName');
    expect(output).toContain("supportsHookType?.('stop')");
    expect(output).toContain('HarnessCapability.StopHook');
    expect(output).toContain('If `supportsStopHook` is `false`, mark check 10 as `N/A`');
    expect(output).toContain('Do not mark missing `CLAUDE_PLUGIN_ROOT`');
    expect(output).toContain('Pi uses command-backed skills and extension/session events');
    expect(output).toContain('Continue with 10a-10f only when `supportsStopHook` is `true`');
  });

  it('treats N/A as neutral for final health and recommendations', () => {
    const output = renderCommandTemplate('doctor');

    expect(output).toContain('Treat N/A as neutral');
    expect(output).toContain('Do not add this N/A to warnings, failures, or recommendations.');
    expect(output).toContain('All 14 checks are PASS or N/A');
    expect(output).toContain('A report with PASS checks plus N/A-only capability skips is HEALTHY.');
    expect(output).toContain('Do not list N/A checks here unless the user asks for skipped capability checks');
  });

  it('keeps Claude-only remediation conditional on Claude Code', () => {
    const output = renderCommandTemplate('doctor');

    expect(output).toContain('For Claude Code only, check Claude settings files');
    expect(output).toContain("For non-Claude StopHook-capable harnesses, use that harness's plugin enablement file or extension registration mechanism instead of `~/.claude`.");
    expect(output).toContain('If the detected harness is `claude-code`');
    expect(output).toContain('For non-Claude harnesses, do not suggest `/debug`');
  });
});
