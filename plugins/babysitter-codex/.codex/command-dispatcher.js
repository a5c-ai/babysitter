'use strict';
const { resolveCommand, getSkillContent, listCommands, suggestCommand } = require('./skill-loader');
const { getCommandMapping } = require('./codex-mapping');
const {
  handleModelCommand,
  handleIssueCommand,
  handleResumeSelector,
  handleDoctorCommand,
} = require('./mode-handlers');

function normalizePhrase(input) {
  const trimmed = (input || '').trim();
  if (!/^babysitter(?:\s|:)/i.test(trimmed)) return null;
  if (/^babysitter:/i.test(trimmed)) {
    return `/${trimmed}`;
  }
  const parts = trimmed.split(/\s+/);
  const mode = parts[1] || 'call';
  const args = parts.slice(2).join(' ');
  return `/babysitter:${mode}${args ? ` ${args}` : ''}`;
}

/**
 * Parse user input and dispatch to the appropriate babysitter skill.
 *
 * Supports natural-language command phrases first, with optional legacy
 * `/babysitter:*` aliases for compatibility.
 */
function dispatch(input) {
  const trimmed = (input || '').trim();
  const parsed = resolveCommand(trimmed) || resolveCommand(normalizePhrase(trimmed) || '');

  if (!parsed) {
    if (trimmed.startsWith('/babysitter') || /^babysitter(?:\s|:)/i.test(trimmed)) {
      const token = trimmed.startsWith('/')
        ? trimmed.slice(1).split(/\s+/)[0]
        : `babysitter:${(trimmed.split(/\s+/)[1] || 'call').trim()}`;
      const suggestion = suggestCommand(token);
      return {
        dispatched: false,
        error: suggestion
          ? `Unknown command "${token}". Did you mean "${suggestion}"?`
          : `Unknown command "${token}". Run "babysitter help" to see available commands.`,
      };
    }
    return { dispatched: false };
  }

  const instructions = getSkillContent(parsed.command);
  if (!instructions) {
    return {
      dispatched: false,
      error: `SKILL.md not found for command "${parsed.command}". Run "babysitter help" for available commands.`,
    };
  }

  let data = null;
  if (parsed.command === 'babysitter:model') {
    data = handleModelCommand(parsed.args, { repoRoot: process.cwd() });
  } else if (parsed.command === 'babysitter:issue') {
    data = handleIssueCommand(parsed.args, { repoRoot: process.cwd() });
  } else if (parsed.command === 'babysitter:resume') {
    data = handleResumeSelector(parsed.args, { repoRoot: process.cwd() });
  } else if (parsed.command === 'babysitter:doctor') {
    data = handleDoctorCommand(parsed.args, { repoRoot: process.cwd() });
  }

  return {
    dispatched: true,
    contractVersion: 'v1',
    command: parsed.command,
    args: parsed.args,
    instructions,
    mapping: getCommandMapping(parsed.command, process.cwd()),
    data,
  };
}

function helpSummary() {
  const commands = listCommands();
  const lines = [
    'Babysitter for Codex CLI - Available Commands',
    '',
    ...commands.map((c) => `  ${c.name.replace(/^babysitter:/, 'babysitter ')}  - ${c.description}`),
    '',
    'Preferred usage: babysitter <mode> [arguments]',
    'Example: babysitter yolo build a REST API with authentication',
    'Legacy /babysitter:* aliases are compatibility-only, not native Codex commands.',
  ];
  return lines.join('\n');
}

function isBabysitterCommand(input) {
  const trimmed = (input || '').trim();
  return trimmed.startsWith('/babysitter') || /^babysitter(?:\s|:)/i.test(trimmed);
}

module.exports = {
  dispatch,
  helpSummary,
  isBabysitterCommand,
};
