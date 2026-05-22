import type { FullSession, SessionManager, SessionMessage } from '@a5c-ai/agent-mux';

export interface PendingResumeTarget {
  agent: string;
  sessionId: string;
}

export interface SessionDispatchPlan {
  agent: string;
  prompt: string;
  sessionId?: string;
  migration?: {
    sourceAgent: string;
    sourceSessionId: string;
    importedMessageCount: number;
    omittedMessageCount: number;
  };
}

export const CROSS_HARNESS_TRANSCRIPT_MESSAGE_LIMIT = 48;
export const CROSS_HARNESS_TRANSCRIPT_CHAR_BUDGET = 16_000;
const CROSS_HARNESS_MESSAGE_CHAR_LIMIT = 1_200;

export async function resolveSessionDispatchPlan(input: {
  sessions: Pick<SessionManager, 'get'>;
  pendingResume: PendingResumeTarget | null;
  requestedAgent: string;
  prompt: string;
}): Promise<SessionDispatchPlan> {
  const { sessions, pendingResume, requestedAgent, prompt } = input;
  if (!pendingResume) {
    return {
      agent: requestedAgent,
      prompt,
    };
  }
  if (pendingResume.agent === requestedAgent) {
    return {
      agent: requestedAgent,
      prompt,
      sessionId: pendingResume.sessionId,
    };
  }

  const sourceSession = await sessions.get(pendingResume.agent as never, pendingResume.sessionId);
  const transcript = buildCrossHarnessMigrationPrompt({
    sourceAgent: pendingResume.agent,
    sourceSessionId: pendingResume.sessionId,
    targetAgent: requestedAgent,
    sourceSession,
    prompt,
  });

  return {
    agent: requestedAgent,
    prompt: transcript.prompt,
    migration: {
      sourceAgent: pendingResume.agent,
      sourceSessionId: pendingResume.sessionId,
      importedMessageCount: transcript.importedMessageCount,
      omittedMessageCount: transcript.omittedMessageCount,
    },
  };
}

export function buildCrossHarnessMigrationPrompt(input: {
  sourceAgent: string;
  sourceSessionId: string;
  targetAgent: string;
  sourceSession: Pick<FullSession, 'messages' | 'title' | 'cwd' | 'model'>;
  prompt: string;
}): {
  prompt: string;
  importedMessageCount: number;
  omittedMessageCount: number;
} {
  const renderedMessages = input.sourceSession.messages
    .map(renderTranscriptMessage)
    .filter((entry): entry is string => entry.length > 0);
  const keptMessages = clampTranscript(renderedMessages);
  const omittedMessageCount = Math.max(renderedMessages.length - keptMessages.length, 0);
  const metadata = [
    `Source agent: ${input.sourceAgent}`,
    `Source session: ${input.sourceSessionId}`,
    input.sourceSession.title ? `Source title: ${input.sourceSession.title}` : null,
    input.sourceSession.cwd ? `Source cwd: ${input.sourceSession.cwd}` : null,
    input.sourceSession.model ? `Source model: ${input.sourceSession.model}` : null,
    `Target agent: ${input.targetAgent}`,
  ].filter((line: string | null): line is string => Boolean(line));

  const lines = [
    `Continue this conversation in a new ${input.targetAgent} session.`,
    `The prior context came from ${input.sourceAgent} session ${input.sourceSessionId}.`,
    'Treat the imported transcript as context only and answer the latest user instruction directly.',
    '',
    ...metadata,
    '',
    `Imported transcript (${keptMessages.length}/${renderedMessages.length} messages kept, newest last${omittedMessageCount > 0 ? `; ${omittedMessageCount} older messages omitted to fit the migration budget` : ''}):`,
    keptMessages.length > 0 ? keptMessages.join('\n\n') : '(no prior transcript messages were available)',
    '',
    'Latest user instruction:',
    input.prompt.trim(),
  ];

  return {
    prompt: lines.join('\n'),
    importedMessageCount: keptMessages.length,
    omittedMessageCount,
  };
}

function clampTranscript(messages: readonly string[]): string[] {
  const limited = messages.slice(-CROSS_HARNESS_TRANSCRIPT_MESSAGE_LIMIT);
  if (limited.length === 0) {
    return [];
  }

  const kept: string[] = [];
  let usedChars = 0;
  for (let index = limited.length - 1; index >= 0; index -= 1) {
    const entry = limited[index]!;
    const nextChars = usedChars + entry.length + (kept.length > 0 ? 2 : 0);
    if (kept.length > 0 && nextChars > CROSS_HARNESS_TRANSCRIPT_CHAR_BUDGET) {
      break;
    }
    kept.push(entry);
    usedChars = nextChars;
  }
  kept.reverse();
  return kept;
}

function renderTranscriptMessage(message: SessionMessage): string {
  const role = message.role;
  const parts: string[] = [];
  if (message.content.trim().length > 0) {
    parts.push(message.content.trim());
  }
  if (message.toolCalls && message.toolCalls.length > 0) {
    for (const toolCall of message.toolCalls) {
      const input = stringifyStructured(toolCall.input);
      parts.push(`Tool call ${toolCall.toolName}(${toolCall.toolCallId}): ${input}`);
    }
  }
  if (message.toolResult) {
    parts.push(
      `Tool result ${message.toolResult.toolName}(${message.toolResult.toolCallId}): ${stringifyStructured(message.toolResult.output)}`,
    );
  }

  const body = truncateTranscriptChunk(parts.join('\n'));
  if (body.length === 0) {
    return '';
  }
  return `[${role}] ${body}`;
}

function stringifyStructured(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncateTranscriptChunk(value: string): string {
  const normalized = value.replace(/\s+\n/g, '\n').trim();
  if (normalized.length <= CROSS_HARNESS_MESSAGE_CHAR_LIMIT) {
    return normalized;
  }
  return `${normalized.slice(0, CROSS_HARNESS_MESSAGE_CHAR_LIMIT - 3)}...`;
}
