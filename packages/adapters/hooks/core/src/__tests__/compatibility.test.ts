import { describe, it, expect } from 'vitest';
import { normalizeEvent } from '../normalizer/normalize';
import fs from 'fs';
import path from 'path';
import { CLAUDE_PHASE_MAPPINGS } from '../../../adapter-claude/src/mappings';
import { CODEX_PHASE_MAPPINGS } from '../../../adapter-codex/src/mappings';
import { GEMINI_PHASE_MAPPINGS } from '../../../adapter-gemini/src/mappings';
import { COPILOT_PHASE_MAPPINGS } from '../../../adapter-copilot/src/mappings';

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

const ADAPTER_MAPPINGS_MAP = {
  claude: CLAUDE_PHASE_MAPPINGS,
  codex: CODEX_PHASE_MAPPINGS,
  gemini: GEMINI_PHASE_MAPPINGS,
  copilot: COPILOT_PHASE_MAPPINGS,
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
