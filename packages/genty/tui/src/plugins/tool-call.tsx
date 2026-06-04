import React from 'react';
import { Box, Text } from 'ink';
import { definePlugin } from '../plugin.js';

const TERMINAL_TOOL_NAME = /^(bash|shell|exec_command|run_shell_command|terminal|command|write_stdin)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function previewValue(value: unknown, limit = 160): string {
  let preview = '';
  try {
    preview = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    preview = String(value);
  }
  return collapseWhitespace(preview).slice(0, limit);
}

function isTerminalTool(toolName: string): boolean {
  return TERMINAL_TOOL_NAME.test(toolName);
}

function terminalCommand(input: unknown): string {
  if (typeof input === 'string') {
    return collapseWhitespace(input);
  }
  if (isRecord(input)) {
    if (typeof input.cmd === 'string') {
      return collapseWhitespace(input.cmd);
    }
    if (typeof input.command === 'string') {
      return collapseWhitespace(input.command);
    }
    if (typeof input.chars === 'string') {
      return `stdin ${collapseWhitespace(input.chars)}`;
    }
  }
  return previewValue(input);
}

function terminalCwd(input: unknown): string | null {
  if (!isRecord(input)) return null;
  if (typeof input.cwd === 'string' && input.cwd.trim()) {
    return input.cwd;
  }
  if (typeof input.workdir === 'string' && input.workdir.trim()) {
    return input.workdir;
  }
  return null;
}

function terminalResult(output: unknown): { exitCode: number | null; stdout: string; stderr: string } {
  if (isRecord(output)) {
    return {
      exitCode: typeof output.exitCode === 'number' ? output.exitCode : null,
      stdout: typeof output.stdout === 'string' ? collapseWhitespace(output.stdout) : '',
      stderr: typeof output.stderr === 'string' ? collapseWhitespace(output.stderr) : '',
    };
  }
  return {
    exitCode: null,
    stdout: typeof output === 'string' ? collapseWhitespace(output) : previewValue(output),
    stderr: '',
  };
}

export default definePlugin({
  name: 'builtin:tool-call',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'tool-call-start',
      match: (ev) => ev.type === 'tool_call_start',
      component: ({ event }) => {
        if (event.type !== 'tool_call_start') return null;
        const input = event.inputAccumulated ?? '';
        if (isTerminalTool(event.toolName)) {
          return (
            <Box>
              <Text color="yellow">$ </Text>
              <Text bold>{terminalCommand(input)}</Text>
            </Box>
          );
        }
        return (
          <Box>
            <Text color="cyan">▶ {event.toolName}</Text>
            {input ? <Text dimColor> {collapseWhitespace(input).slice(0, 120)}</Text> : null}
          </Box>
        );
      },
    });
    ctx.registerEventRenderer({
      id: 'tool-call-ready',
      match: (ev) => ev.type === 'tool_call_ready',
      component: ({ event }) => {
        if (event.type !== 'tool_call_ready') return null;
        if (isTerminalTool(event.toolName)) {
          const command = terminalCommand(event.input);
          const cwd = terminalCwd(event.input);
          return (
            <Box>
              <Text color="yellow">$ </Text>
              <Text bold>{command}</Text>
              {cwd ? <Text dimColor> ({cwd})</Text> : null}
            </Box>
          );
        }
        return (
          <Box>
            <Text color="cyan">⏵ {event.toolName}</Text>
            <Text dimColor> {previewValue(event.input)}</Text>
          </Box>
        );
      },
    });
    ctx.registerEventRenderer({
      id: 'tool-result',
      match: (ev) => ev.type === 'tool_result',
      component: ({ event }) => {
        if (event.type !== 'tool_result') return null;
        if (isTerminalTool(event.toolName)) {
          const result = terminalResult(event.output);
          const ok = result.exitCode === null || result.exitCode === 0;
          const body = result.stdout || result.stderr;
          return (
            <Box>
              <Text color={ok ? 'green' : 'red'}>↳ exit {result.exitCode ?? 0}</Text>
              <Text dimColor> ({event.durationMs}ms)</Text>
              {body ? <Text dimColor> {body.slice(0, 160)}</Text> : null}
            </Box>
          );
        }
        return (
          <Box>
            <Text color="green">✓ {event.toolName} ({event.durationMs}ms)</Text>
            {event.output ? <Text dimColor> {previewValue(event.output)}</Text> : null}
          </Box>
        );
      },
    });
    ctx.registerEventRenderer({
      id: 'tool-error',
      match: (ev) => ev.type === 'tool_error',
      component: ({ event }) => {
        if (event.type !== 'tool_error') return null;
        const label = isTerminalTool(event.toolName) ? 'terminal' : event.toolName;
        return (
          <Box>
            <Text color="red">✗ {label}: {collapseWhitespace(event.error)}</Text>
          </Box>
        );
      },
    });
  },
});
