// Hook registration file generators for all targets
// This is a thin re-export shell — actual implementations live in targets/adapters/

export { generateClaudeCodeHooksJson } from './targets/adapters/claude-code.js';
export { generateCodexHooksJson } from './targets/adapters/codex.js';
export { generateCursorHooksJson } from './targets/adapters/cursor.js';
export { generateGeminiHooksJson } from './targets/adapters/gemini.js';
export { generateGithubCopilotHooksJson } from './targets/adapters/github-copilot.js';
export { generateOpenCodeHooksJson } from './targets/adapters/opencode.js';
export { generateOpenClawHooksJson } from './targets/adapters/openclaw.js';
