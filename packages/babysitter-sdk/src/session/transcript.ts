export interface TranscriptLastAssistantMessage {
  found: boolean;
  text: string | null;
}

export function parseTranscriptLastAssistantMessage(
  content: string,
): TranscriptLastAssistantMessage {
  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  let lastAssistant: unknown = null;

  for (const line of lines) {
    try {
      const parsed: unknown = JSON.parse(line);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        const isAssistant =
          obj.role === 'assistant' ||
          obj.type === 'assistant' ||
          (obj.message &&
            typeof obj.message === 'object' &&
            (obj.message as Record<string, unknown>).role === 'assistant');
        if (isAssistant) {
          lastAssistant = parsed;
        }
      }
    } catch {
      // Skip malformed lines.
    }
  }

  if (!lastAssistant) {
    return { found: false, text: null };
  }

  const message = lastAssistant as Record<string, unknown>;
  const contentBlocks = (message.message && typeof message.message === 'object'
    ? (message.message as Record<string, unknown>).content
    : message.content) as Array<Record<string, unknown>> | undefined;

  if (!Array.isArray(contentBlocks)) {
    return { found: false, text: null };
  }

  const textParts = contentBlocks
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string);

  if (textParts.length === 0) {
    return { found: false, text: null };
  }

  return { found: true, text: textParts.join('\n') };
}

export function extractPromiseTag(text: string): string | null {
  const match = text.match(/<promise>([\s\S]*?)<\/promise>/);
  if (!match) {
    return null;
  }

  return match[1].trim().replace(/\s+/g, ' ');
}
