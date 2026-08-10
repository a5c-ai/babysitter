/**
 * Milestone D — GATE 1 PRODUCTION wiring (§9.1 / AC-49 / AC-33).
 *
 * Proves the wiring that was MISSING (adversarial-review defect #3): a policy verifier
 * bridge composed in FRONT of the existing hooks bridge, installed on the production
 * ToolDispatcher, DENIES a covered unauthorized call and the deny is un-bypassable.
 *
 * Authored from the design:
 *   §9.1 — the beforeToolUse hook is the injection point; a covered call without a valid
 *          CommandAuthorization returns { decision: 'deny' } and short-circuits execution.
 *   §9.4 / AC-49 — GATE 1 is the LOAD-BEARING, un-bypassable gate; a later bridge cannot
 *          relax a policy deny.
 */
import { describe, it, expect } from 'vitest';

import { ToolDispatcher } from '../dispatch.js';
import { ToolRegistry } from '../registry.js';
import { composePolicyBridge } from '../policy-verifier-wiring.js';
import { NoopToolHookBridge } from '../hooks.js';
import type { ToolHookBridge, ToolHookResult } from '../hooks.js';
import type { ToolCallContext, ToolDescriptor } from '../types.js';

/** A stand-in policy bridge that DENIES the covered tool and passes everything else. */
class FakePolicyBridge implements ToolHookBridge {
  constructor(private readonly coveredTool: string) {}
  async beforeToolUse(ctx: ToolCallContext): Promise<ToolHookResult | undefined> {
    if (ctx.toolName === this.coveredTool) {
      // Mirror the real bridge: a covered action with no valid authorization denies.
      return { decision: 'deny', reason: 'covered action has no CommandAuthorization — deny' };
    }
    return { decision: 'allow' };
  }
  async afterToolUse(): Promise<ToolHookResult | undefined> {
    return undefined;
  }
}

/** An "existing" bridge that ALWAYS allows — proves the policy deny is un-bypassable. */
class AllowAllBridge implements ToolHookBridge {
  async beforeToolUse(): Promise<ToolHookResult | undefined> {
    return { decision: 'allow' };
  }
  async afterToolUse(): Promise<ToolHookResult | undefined> {
    return undefined;
  }
}

function registryWith(tools: string[]): ToolRegistry {
  const reg = new ToolRegistry();
  for (const name of tools) {
    const descriptor: ToolDescriptor = {
      name,
      description: name,
      parameters: { type: 'object' },
      source: 'builtin',
    };
    reg.register(descriptor);
  }
  return reg;
}

describe('Milestone D — GATE 1 production wiring (composePolicyBridge / ToolDispatcher)', () => {
  it('composePolicyBridge returns the existing bridge when there is no policy bridge (anchor unpinned)', () => {
    const existing = new NoopToolHookBridge();
    expect(composePolicyBridge(undefined, existing)).toBe(existing);
  });

  it('composePolicyBridge returns the policy bridge alone when there is no existing bridge', () => {
    const policy = new FakePolicyBridge('Bash');
    expect(composePolicyBridge(policy, undefined)).toBe(policy);
  });

  it('a covered unauthorized call is DENIED by the composed GATE-1 bridge and NEVER executes', async () => {
    const registry = registryWith(['Bash']);
    const composed = composePolicyBridge(new FakePolicyBridge('Bash'), new AllowAllBridge());
    const dispatcher = new ToolDispatcher({ registry, ...(composed ? { hooks: composed } : {}) });

    let executed = false;
    const result = await dispatcher.dispatch(
      { toolName: 'Bash', input: { command: 'aws s3 rm s3://prod/secret' }, toolCallId: 'call_1' },
      async () => {
        executed = true;
        return 'ran';
      },
    );

    // The policy deny short-circuits: the executor NEVER runs and the error surfaces.
    expect(executed).toBe(false);
    expect(result.output).toBeNull();
    expect(result.error).toContain('CommandAuthorization');
  });

  it('a policy deny is UN-BYPASSABLE — an allow-all existing bridge cannot relax it', async () => {
    const registry = registryWith(['Bash']);
    // Policy bridge FIRST (front) so its deny wins over the allow-all second bridge.
    const composed = composePolicyBridge(new FakePolicyBridge('Bash'), new AllowAllBridge());
    const dispatcher = new ToolDispatcher({ registry, ...(composed ? { hooks: composed } : {}) });

    let executed = false;
    await dispatcher.dispatch(
      { toolName: 'Bash', input: { command: 'aws s3 rm s3://prod/secret' }, toolCallId: 'call_2' },
      async () => {
        executed = true;
        return 'ran';
      },
    );
    expect(executed).toBe(false);
  });

  it('an UNCOVERED call (not the covered tool) passes through and executes', async () => {
    const registry = registryWith(['Read']);
    const composed = composePolicyBridge(new FakePolicyBridge('Bash'), new AllowAllBridge());
    const dispatcher = new ToolDispatcher({ registry, ...(composed ? { hooks: composed } : {}) });

    let executed = false;
    const result = await dispatcher.dispatch(
      { toolName: 'Read', input: { path: 'README.md' }, toolCallId: 'call_3' },
      async () => {
        executed = true;
        return 'file contents';
      },
    );
    expect(executed).toBe(true);
    expect(result.output).toBe('file contents');
  });
});
