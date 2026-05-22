// Adapter registry — built dynamically from the agent-catalog graph

export type { HarnessOutputAdapter } from './interface.js';
export { BaseHarnessOutputAdapter } from './base.js';

import { listPluginTargetDescriptors } from '@a5c-ai/agent-catalog';
import type { HarnessOutputAdapter } from './interface.js';
import { ClaudeCodeAdapter } from './claude-code.js';
import { CodexAdapter } from './codex.js';
import { CursorAdapter } from './cursor.js';
import { GeminiAdapter } from './gemini.js';
import { GithubCopilotAdapter } from './github-copilot.js';
import { HermesAdapter } from './hermes.js';
import { OpenCodeAdapter } from './opencode.js';
import { OpenClawAdapter } from './openclaw.js';
import { PiAdapter } from './pi.js';
import { OhMyPiAdapter } from './oh-my-pi.js';

// Re-export individual adapter classes
export { ClaudeCodeAdapter } from './claude-code.js';
export { CodexAdapter } from './codex.js';
export { CursorAdapter } from './cursor.js';
export { GeminiAdapter } from './gemini.js';
export { GithubCopilotAdapter } from './github-copilot.js';
export { HermesAdapter } from './hermes.js';
export { OpenCodeAdapter } from './opencode.js';
export { OpenClawAdapter } from './openclaw.js';
export { PiAdapter } from './pi.js';
export { OhMyPiAdapter } from './oh-my-pi.js';

// Re-export hook/manifest generators for backward compatibility
export { generateClaudeCodeHooksJson, generateClaudeCodeManifest } from './claude-code.js';
export { generateCodexHooksJson, generateCodexManifest } from './codex.js';
export { generateCursorHooksJson, generateCursorManifest } from './cursor.js';
export { generateHermesHooksJson, generateHermesManifest } from './hermes.js';
export { generateGeminiHooksJson, generateGeminiManifest } from './gemini.js';
export { generateGithubCopilotHooksJson, generateGithubCopilotManifest } from './github-copilot.js';
export { generateOpenCodeHooksJson, generateOpenCodeManifest } from './opencode.js';
export { generateOpenClawHooksJson, generateOpenClawManifest, generateOpenClawPackageManifest } from './openclaw.js';
export { generatePiManifest } from './pi.js';
export { generateOhMyPiManifest } from './oh-my-pi.js';

// Map hookRegistrationFormat → adapter constructor.
// The adapter receives its targetId from the catalog at construction time.
const ADAPTER_CLASS_BY_FORMAT: Record<string, new (targetName: string) => HarnessOutputAdapter> = {
  'claude-code': ClaudeCodeAdapter,
  'codex': CodexAdapter,
  'cursor': CursorAdapter,
  'gemini': GeminiAdapter,
  'github-copilot': GithubCopilotAdapter,
  'hermes': HermesAdapter,
  'opencode': OpenCodeAdapter,
  'openclaw': OpenClawAdapter,
};

const ADAPTER_CLASS_BY_TARGET: Record<string, new (targetName: string) => HarnessOutputAdapter> = {
  'pi': PiAdapter,
  'oh-my-pi': OhMyPiAdapter,
};

// Build registry dynamically from the catalog graph — adapter names come from Atlas
const ADAPTER_REGISTRY: Record<string, HarnessOutputAdapter> = {};
for (const descriptor of listPluginTargetDescriptors()) {
  const format = descriptor.hookRegistrationFormat;
  const AdapterClass = (format && ADAPTER_CLASS_BY_FORMAT[format]) || ADAPTER_CLASS_BY_TARGET[descriptor.targetId];
  if (AdapterClass) {
    ADAPTER_REGISTRY[descriptor.targetId] = new AdapterClass(descriptor.targetId);
  }
}

export function getAdapter(targetName: string): HarnessOutputAdapter | undefined {
  return ADAPTER_REGISTRY[targetName];
}

export { ADAPTER_REGISTRY };
