// Adapter registry and exports

export type { HarnessOutputAdapter } from './interface.js';
export { BaseHarnessOutputAdapter } from './base.js';

import type { HarnessOutputAdapter } from './interface.js';
import { ClaudeCodeAdapter } from './claude-code.js';
import { CodexAdapter } from './codex.js';
import { CursorAdapter } from './cursor.js';
import { GeminiAdapter } from './gemini.js';
import { GithubCopilotAdapter } from './github-copilot.js';
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
export { OpenCodeAdapter } from './opencode.js';
export { OpenClawAdapter } from './openclaw.js';
export { PiAdapter } from './pi.js';
export { OhMyPiAdapter } from './oh-my-pi.js';

// Re-export hook/manifest generators for backward compatibility
export { generateClaudeCodeHooksJson, generateClaudeCodeManifest } from './claude-code.js';
export { generateCodexHooksJson, generateCodexManifest } from './codex.js';
export { generateCursorHooksJson, generateCursorManifest } from './cursor.js';
export { generateGeminiHooksJson, generateGeminiManifest } from './gemini.js';
export { generateGithubCopilotHooksJson, generateGithubCopilotManifest } from './github-copilot.js';
export { generateOpenCodeHooksJson, generateOpenCodeManifest } from './opencode.js';
export { generateOpenClawHooksJson, generateOpenClawManifest, generateOpenClawPackageManifest } from './openclaw.js';
export { generatePiManifest } from './pi.js';
export { generateOhMyPiManifest } from './oh-my-pi.js';

const ADAPTER_REGISTRY: Record<string, HarnessOutputAdapter> = {
  'claude-code': new ClaudeCodeAdapter(),
  'codex': new CodexAdapter(),
  'cursor': new CursorAdapter(),
  'gemini': new GeminiAdapter(),
  'github-copilot': new GithubCopilotAdapter(),
  'opencode': new OpenCodeAdapter(),
  'openclaw': new OpenClawAdapter(),
  'pi': new PiAdapter(),
  'oh-my-pi': new OhMyPiAdapter(),
};

export function getAdapter(targetName: string): HarnessOutputAdapter | undefined {
  return ADAPTER_REGISTRY[targetName];
}

export { ADAPTER_REGISTRY };
