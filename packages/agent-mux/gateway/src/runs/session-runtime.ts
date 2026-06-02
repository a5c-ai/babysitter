import type { WorkspaceRuntimeLogLine, WorkspaceRuntimeSurface, WorkspaceTerminalCommand } from '@a5c-ai/agent-mux-comm';

import type { LoggedRunEvent } from './event-log.js';
import type { RunEntry } from './types.js';

const TERMINAL_TOOL_NAME = /^(bash|shell|exec_command|run_shell_command|terminal|command|write_stdin)$/i;
const DEV_SERVER_COMMAND = /\b((?:npm|pnpm|yarn|bun|deno)\s+(?:run|task\s+)?dev|next\s+dev|vite(?:\s+dev)?|turbo\s+dev|webpack(?:-dev-server)?|http-server|serve\b|python\s+-m\s+http\.server)\b/i;
const READY_SIGNAL = /\b(ready|listening|local|localhost|127\.0\.0\.1|0\.0\.0\.0|compiled successfully|available on|started server)\b/i;
const HTTP_URL = /https?:\/\/[^\s"'`<>]+/g;
const LOCALHOST_URL = /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d{2,5}\b/g;
const PORT_FLAG = /(?:--port|-p|\sport\s+)(\d{2,5})\b/i;
const MAX_RETAINED_LOG_LINES = 2000;
const DEFAULT_DEVICE_PROFILES = [
  { id: 'desktop', label: 'Desktop 1440', width: 1440, height: 960 },
  { id: 'tablet', label: 'Tablet 820', width: 820, height: 1180 },
  { id: 'mobile', label: 'Mobile 390', width: 390, height: 844 },
] as const;

type MutableCommand = {
  id: string;
  runId: string;
  source: 'shell' | 'tool';
  toolName?: string;
  command: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
  endedAt?: number;
  exitCode?: number;
  logs: WorkspaceRuntimeLogLine[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function appendLog(target: WorkspaceRuntimeLogLine[], stream: WorkspaceRuntimeLogLine['stream'], text: string, timestamp: number): void {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  for (const line of trimmed.split(/\r?\n/)) {
    const cleaned = line.trim();
    if (!cleaned) {
      continue;
    }
    target.push({ timestamp, stream, text: cleaned });
    if (target.length > MAX_RETAINED_LOG_LINES) {
      target.splice(0, target.length - MAX_RETAINED_LOG_LINES);
    }
  }
}

function collectStrings(value: unknown, bucket: string[], depth = 0): void {
  if (value == null || depth > 4) {
    return;
  }
  if (typeof value === 'string') {
    bucket.push(value);
    return;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    bucket.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, bucket, depth + 1);
    }
    return;
  }
  if (isRecord(value)) {
    for (const item of Object.values(value)) {
      collectStrings(item, bucket, depth + 1);
    }
  }
}

function normalizeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `http://${value}`;
}

function addUrls(urlMap: Map<string, number>, text: string, timestamp: number): void {
  for (const match of text.matchAll(HTTP_URL)) {
    urlMap.set(match[0], timestamp);
  }
  for (const match of text.matchAll(LOCALHOST_URL)) {
    urlMap.set(normalizeUrl(match[0]), timestamp);
  }
}

function commandFromToolInput(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  if (isRecord(input)) {
    if (typeof input.cmd === 'string') {
      return input.cmd;
    }
    if (typeof input.command === 'string') {
      return input.command;
    }
    if (typeof input.chars === 'string') {
      return `stdin ${input.chars}`;
    }
  }
  return JSON.stringify(input) ?? String(input);
}

function urlList(urlMap: Map<string, number>): string[] {
  return Array.from(urlMap.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([url]) => url);
}

function latestTimestamp(logs: WorkspaceRuntimeLogLine[]): number | undefined {
  return logs[logs.length - 1]?.timestamp;
}

function toCommand(command: MutableCommand): WorkspaceTerminalCommand {
  return {
    id: command.id,
    runId: command.runId,
    source: command.source,
    toolName: command.toolName,
    command: command.command,
    status: command.status,
    startedAt: command.startedAt,
    endedAt: command.endedAt,
    exitCode: command.exitCode,
    logs: command.logs,
  };
}

export function buildWorkspaceRuntimeSurface(input: {
  cwd?: string;
  runs: RunEntry[];
  eventsByRunId: Map<string, LoggedRunEvent[]>;
}): WorkspaceRuntimeSurface | undefined {
  const sortedRuns = [...input.runs].sort((left, right) => left.startedAt - right.startedAt);
  const commands: MutableCommand[] = [];
  const toolCommands = new Map<string, MutableCommand>();
  const previewUrls = new Map<string, number>();
  const devServerUrls = new Map<string, number>();
  const devServerLogs: WorkspaceRuntimeLogLine[] = [];
  let activeShellCommand: MutableCommand | null = null;
  let devServerCommand: string | undefined;
  let devServerStatus: WorkspaceRuntimeSurface['devServer']['status'] = 'idle';
  let devServerPort: number | undefined;
  let updatedAt = 0;

  for (const run of sortedRuns) {
    const events = [...(input.eventsByRunId.get(run.runId) ?? [])].sort((left, right) => left.seq - right.seq);
    for (const logged of events) {
      updatedAt = Math.max(updatedAt, logged.ts);
      const event = logged.event;
      const type = typeof event.type === 'string' ? event.type : 'unknown';
      const strings: string[] = [];
      collectStrings(event, strings);
      for (const text of strings) {
        addUrls(previewUrls, text, logged.ts);
      }

      if (type === 'shell_start') {
        const command = typeof event.command === 'string' ? event.command : '';
        const next: MutableCommand = {
          id: `${run.runId}:shell:${logged.seq}`,
          runId: run.runId,
          source: 'shell',
          command,
          status: 'running',
          startedAt: logged.ts,
          logs: [],
        };
        commands.push(next);
        activeShellCommand = next;
        if (DEV_SERVER_COMMAND.test(command)) {
          devServerCommand = command;
          devServerStatus = 'starting';
          const port = command.match(PORT_FLAG)?.[1];
          devServerPort = port ? Number(port) : devServerPort;
          appendLog(devServerLogs, 'system', command, logged.ts);
        }
        continue;
      }

      if (type === 'shell_stdout_delta' || type === 'shell_stderr_delta') {
        const text = typeof event.delta === 'string' ? event.delta : '';
        if (activeShellCommand) {
          appendLog(activeShellCommand.logs, type === 'shell_stdout_delta' ? 'stdout' : 'stderr', text, logged.ts);
        }
        if (devServerCommand) {
          appendLog(devServerLogs, type === 'shell_stdout_delta' ? 'stdout' : 'stderr', text, logged.ts);
          if (READY_SIGNAL.test(text)) {
            devServerStatus = 'running';
          }
          for (const url of urlList(previewUrls)) {
            if (text.includes(url.replace(/^https?:\/\//, ''))) {
              devServerUrls.set(url, logged.ts);
            }
          }
        }
        continue;
      }

      if (type === 'shell_exit') {
        if (activeShellCommand) {
          activeShellCommand.endedAt = logged.ts;
          activeShellCommand.exitCode = typeof event.exitCode === 'number' ? event.exitCode : 0;
          activeShellCommand.status = activeShellCommand.exitCode === 0 ? 'completed' : 'failed';
          if (devServerCommand === activeShellCommand.command && devServerStatus !== 'running') {
            devServerStatus = activeShellCommand.status === 'failed' ? 'error' : 'idle';
          }
        }
        activeShellCommand = null;
        continue;
      }

      if ((type === 'tool_call_ready' || type === 'tool_call_start') && TERMINAL_TOOL_NAME.test(String(event.toolName ?? ''))) {
        const toolCallId = String(event.toolCallId ?? `${run.runId}:${logged.seq}`);
        const command = commandFromToolInput(type === 'tool_call_ready' ? event.input : event.inputAccumulated);
        const next: MutableCommand = {
          id: `${run.runId}:${toolCallId}`,
          runId: run.runId,
          source: 'tool',
          toolName: String(event.toolName ?? ''),
          command,
          status: 'running',
          startedAt: logged.ts,
          logs: [],
        };
        commands.push(next);
        toolCommands.set(toolCallId, next);
        if (DEV_SERVER_COMMAND.test(command)) {
          devServerCommand = command;
          devServerStatus = 'starting';
          const port = command.match(PORT_FLAG)?.[1];
          devServerPort = port ? Number(port) : devServerPort;
          appendLog(devServerLogs, 'system', command, logged.ts);
        }
        continue;
      }

      if (type === 'tool_result' && TERMINAL_TOOL_NAME.test(String(event.toolName ?? ''))) {
        const toolCallId = String(event.toolCallId ?? '');
        const command = toolCommands.get(toolCallId);
        const outputStrings: string[] = [];
        collectStrings(event.output, outputStrings);
        if (command) {
          command.endedAt = logged.ts;
          command.status = 'completed';
          appendLog(command.logs, 'stdout', outputStrings.join('\n'), logged.ts);
        }
        if (devServerCommand && command?.command === devServerCommand) {
          appendLog(devServerLogs, 'stdout', outputStrings.join('\n'), logged.ts);
          if (outputStrings.some((value) => READY_SIGNAL.test(value))) {
            devServerStatus = 'running';
          } else if (devServerStatus !== 'running') {
            devServerStatus = 'idle';
          }
        }
        for (const text of outputStrings) {
          addUrls(devServerUrls, text, logged.ts);
        }
        continue;
      }

      if (type === 'tool_error' && TERMINAL_TOOL_NAME.test(String(event.toolName ?? ''))) {
        const toolCallId = String(event.toolCallId ?? '');
        const command = toolCommands.get(toolCallId);
        const errorText = typeof event.error === 'string' ? event.error : 'tool error';
        if (command) {
          command.endedAt = logged.ts;
          command.status = 'failed';
          appendLog(command.logs, 'stderr', errorText, logged.ts);
        }
        if (devServerCommand && command?.command === devServerCommand) {
          devServerStatus = 'error';
          appendLog(devServerLogs, 'stderr', errorText, logged.ts);
        }
      }
    }
  }

  const preview = urlList(previewUrls);
  const devUrls = urlList(devServerUrls);
  const terminalCommands = commands
    .sort((left, right) => right.startedAt - left.startedAt)
    .slice(0, 6)
    .map(toCommand);
  const devLogTimestamp = latestTimestamp(devServerLogs);
  const previewDetectedAt = preview.length > 0 ? previewUrls.get(preview[0]) : undefined;
  const primaryDevUrl = devUrls[0] ?? preview[0];
  const primaryPreviewUrl = preview[0] ?? devUrls[0];

  if (!input.cwd && terminalCommands.length === 0 && preview.length === 0 && devUrls.length === 0) {
    return undefined;
  }

  if (!devServerCommand && primaryDevUrl) {
    devServerStatus = 'running';
  }

  const portMatch = primaryDevUrl?.match(/:(\d{2,5})(?:\/|$)/);
  devServerPort = portMatch ? Number(portMatch[1]) : devServerPort;

  return {
    workspacePath: input.cwd,
    updatedAt,
    preview: {
      status: primaryPreviewUrl ? 'ready' : 'unavailable',
      primaryUrl: primaryPreviewUrl,
      urls: preview.length > 0 ? preview : devUrls,
      detectedAt: previewDetectedAt,
      deviceProfiles: DEFAULT_DEVICE_PROFILES,
    },
    terminal: {
      status: terminalCommands.some((command) => command.status === 'running') ? 'active' : 'idle',
      commands: terminalCommands,
    },
    devServer: {
      status: devServerStatus,
      command: devServerCommand,
      primaryUrl: primaryDevUrl,
      urls: devUrls.length > 0 ? devUrls : preview,
      port: devServerPort,
      detectedAt: devLogTimestamp ?? previewDetectedAt,
      logs: devServerLogs,
    },
  };
}
