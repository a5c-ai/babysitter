import { describe, it, expect } from 'vitest';
import { normalizeEvent } from '../normalizer/normalize';
import type { PhaseMapping } from '../types/lifecycle';
import fs from 'fs';
import path from 'path';

/**
 * Shape of the versioned fixture file.
 */
interface FixtureFile {
  version: string;
  adapter: string;
  description: string;
  events: FixtureEvent[];
}

interface FixtureEvent {
  nativeEventName: string;
  stdin: Record<string, unknown>;
  env: Record<string, string>;
  expected: {
    phase: string;
    supportLevel: string;
    adapter: string;
    payloadKeys?: string[];
  };
}

// --- Adapter mappings (inlined here to avoid cross-package imports) ---

const CLAUDE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'session.start', nativeHook: 'SessionStart', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'session.end', nativeHook: 'SessionEnd', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'session.compact.before', nativeHook: 'PreCompact', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'turn.user_prompt_submitted', nativeHook: 'UserPromptSubmit', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'tool.before', nativeHook: 'PreToolUse', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'tool' },
  { canonicalPhase: 'tool.after', nativeHook: 'PostToolUse', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'tool' },
  { canonicalPhase: 'turn.stop', nativeHook: 'Stop', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'subagent.end', nativeHook: 'SubagentStop', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'subagent' },
  { canonicalPhase: 'notification', nativeHook: 'Notification', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'notification' },
];

const CODEX_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'session.start', nativeHook: 'SessionStart', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'session.end', nativeHook: 'SessionEnd', supportLevel: 'lossy', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'turn.user_prompt_submitted', nativeHook: 'UserPromptSubmit', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'turn.stop', nativeHook: 'Stop', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'tool.before', nativeHook: 'tool.before', supportLevel: 'lossy', blockCapability: true, mutationCapability: false, scope: 'tool' },
  { canonicalPhase: 'tool.after', nativeHook: 'tool.after', supportLevel: 'lossy', blockCapability: false, mutationCapability: false, scope: 'tool' },
];

const GEMINI_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'session.start', nativeHook: 'SessionStart', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'session.end', nativeHook: 'SessionEnd', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'planner.before_tool_selection', nativeHook: 'BeforeToolSelection', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'planner' },
  { canonicalPhase: 'model.before_request', nativeHook: 'BeforeModel', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'model' },
  { canonicalPhase: 'model.after_response', nativeHook: 'AfterModel', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'model' },
  { canonicalPhase: 'turn.before_agent', nativeHook: 'BeforeAgent', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'turn.after_agent', nativeHook: 'AfterAgent', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'tool.before', nativeHook: 'BeforeToolExecution', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'tool' },
  { canonicalPhase: 'tool.after', nativeHook: 'AfterToolExecution', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'tool' },
];

const COPILOT_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'session.start', nativeHook: 'sessionStart', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'session.end', nativeHook: 'sessionEnd', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'turn.user_prompt_submitted', nativeHook: 'userPromptSubmitted', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'tool.before', nativeHook: 'preToolUse', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'tool' },
  { canonicalPhase: 'tool.after', nativeHook: 'postToolUse', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'tool' },
  { canonicalPhase: 'turn.error', nativeHook: 'error', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'turn' },
];

const ADAPTER_MAPPINGS_MAP: Record<string, PhaseMapping[]> = {
  claude: CLAUDE_MAPPINGS,
  codex: CODEX_MAPPINGS,
  gemini: GEMINI_MAPPINGS,
  copilot: COPILOT_MAPPINGS,
};

const FIXTURE_FILES = ['claude-v1.json', 'codex-v1.json', 'gemini-v1.json', 'copilot-v1.json'];

describe('Adapter compatibility fixtures', () => {
  for (const fixtureFile of FIXTURE_FILES) {
    describe(fixtureFile, () => {
      const fixturePath = path.join(__dirname, 'fixtures', fixtureFile);
      const raw = fs.readFileSync(fixturePath, 'utf-8');
      const fixture: FixtureFile = JSON.parse(raw);

      it('should have a valid fixture structure', () => {
        expect(fixture.version).toBe('v1');
        expect(fixture.adapter).toBeTruthy();
        expect(fixture.events.length).toBeGreaterThan(0);
      });

      for (const event of fixture.events) {
        it(`should normalize ${event.nativeEventName} to ${event.expected.phase}`, () => {
          const mappings = ADAPTER_MAPPINGS_MAP[fixture.adapter];
          expect(mappings).toBeDefined();

          const result = normalizeEvent({
            adapter: fixture.adapter,
            rawEventName: event.nativeEventName,
            stdinPayload: event.stdin,
            env: event.env,
            adapterMappings: mappings,
          });

          // Verify canonical event structure
          expect(result.version).toBe('a5c.hooks.v1');
          expect(result.adapter).toBe(event.expected.adapter);
          expect(result.phase).toBe(event.expected.phase);
          expect(result.supportLevel).toBe(event.expected.supportLevel);
          expect(result.rawEventName).toBe(event.nativeEventName);

          // Verify execution context exists
          expect(result.execution).toBeDefined();
          expect(result.execution.adapter).toBe(fixture.adapter);
          expect(result.execution.nativeEventName).toBe(event.nativeEventName);

          // Verify payload contains expected keys if specified
          if (event.expected.payloadKeys) {
            for (const key of event.expected.payloadKeys) {
              expect(result.payload).toHaveProperty(key);
            }
          }

          // Verify env buckets exist
          expect(result.env).toBeDefined();
          expect(result.env.input).toBeDefined();
          expect(result.env.persisted).toBeDefined();
        });
      }
    });
  }
});
