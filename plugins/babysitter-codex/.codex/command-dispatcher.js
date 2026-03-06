'use strict';
const { resolveCommand, getSkillContent, listCommands, suggestCommand } = require('./skill-loader');

/**
 * Parse user input and dispatch to the appropriate babysitter skill.
 *
 * @param {string} input - Raw user input (e.g., "/babysitter:yolo build a REST API")
 * @returns {{ dispatched: boolean, command?: string, args?: string, instructions?: string, error?: string }}
 */
function dispatch(input) {
  const parsed = resolveCommand(input);

  if (!parsed) {
    // Check if it looks like a babysitter command but didn't match
    const trimmed = (input || '').trim();
    if (trimmed.startsWith('/babysitter')) {
      const token = trimmed.slice(1).split(/\s+/)[0];
      const suggestion = suggestCommand(token);
      return {
        dispatched: false,
        error: suggestion
          ? `Unknown command "${token}". Did you mean "${suggestion}"?`
          : `Unknown command "${token}". Run /babysitter:help to see available commands.`
      };
    }
    return { dispatched: false };
  }

  const instructions = getSkillContent(parsed.command);
  if (!instructions) {
    return {
      dispatched: false,
      error: `SKILL.md not found for command "${parsed.command}". Run /babysitter:help for available commands.`
    };
  }

  return {
    dispatched: true,
    command: parsed.command,
    args: parsed.args,
    instructions
  };
}

/**
 * Generate a help summary of all available commands.
 */
function helpSummary() {
  const commands = listCommands();
  const lines = [
    'Babysitter for Codex CLI — Available Commands',
    '',
    ...commands.map(c => `  /${c.name}  — ${c.description}${c.aliases.length ? ` (aliases: ${c.aliases.map(a => '/' + a).join(', ')})` : ''}`),
    '',
    'Usage: /<command> [arguments]',
    'Example: /babysitter:yolo build a REST API with authentication'
  ];
  return lines.join('\n');
}

/**
 * Check if input is a babysitter slash command.
 */
function isBabysitterCommand(input) {
  return (input || '').trim().startsWith('/babysitter');
}

module.exports = {
  dispatch,
  helpSummary,
  isBabysitterCommand
};
