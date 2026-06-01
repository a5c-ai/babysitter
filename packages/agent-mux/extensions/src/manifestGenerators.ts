// Manifest generators for all targets
// This is a thin re-export shell — actual implementations live in targets/adapters/

export { generateClaudeCodeManifest } from './targets/adapters/claude-code.js';
export { generateCodexManifest } from './targets/adapters/codex.js';
export { generateCursorManifest } from './targets/adapters/cursor.js';
export { generateGeminiManifest } from './targets/adapters/gemini.js';
export { generateGithubCopilotManifest } from './targets/adapters/github-copilot.js';
export { generatePiManifest } from './targets/adapters/pi.js';
export { generateOhMyPiManifest } from './targets/adapters/oh-my-pi.js';
export { generateOpenCodeManifest } from './targets/adapters/opencode.js';
export { generateOpenClawPackageManifest, generateOpenClawManifest } from './targets/adapters/openclaw.js';
