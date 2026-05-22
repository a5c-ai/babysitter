import path from 'node:path';
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface PromptInputProps {
  onSubmit: (value: string) => void;
  onCancel: () => void;
  label?: string;
  labelColor?: string;
  /** Optional prior submissions for up/down recall (most recent last). */
  history?: string[];
  /** Shift+Tab handler — typically used to cycle execution modes. */
  onShiftTab?: () => void;
  /** Initial draft restored when the composer is reopened. */
  initialState?: PromptInputState;
  /** Emits draft updates so the host can preserve them across dismissal. */
  onStateChange?: (state: PromptInputState) => void;
}

export type PromptInputSegment =
  | { kind: 'text'; value: string }
  | { kind: 'paste'; value: string; display: string }
  | { kind: 'file'; value: string; display: string };

export interface PromptInputState {
  segments: PromptInputSegment[];
}

interface PromptInputKey {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  return?: boolean;
  backspace?: boolean;
  delete?: boolean;
  escape?: boolean;
  upArrow?: boolean;
  downArrow?: boolean;
  tab?: boolean;
}

const LARGE_PASTE_THRESHOLD = 80;

export function createEmptyPromptInputState(): PromptInputState {
  return { segments: [] };
}

export function createPromptInputState(value = ''): PromptInputState {
  if (!value) return createEmptyPromptInputState();
  return { segments: [{ kind: 'text', value }] };
}

export function getPromptInputValue(state: PromptInputState): string {
  return state.segments.map((segment) => segment.value).join('');
}

export function getPromptInputDisplay(state: PromptInputState): string {
  return state.segments
    .map((segment) => {
      if (segment.kind === 'text') return segment.value;
      return segment.display;
    })
    .join('');
}

function mergeTextSegment(segments: PromptInputSegment[], value: string): PromptInputSegment[] {
  if (!value) return segments;
  const last = segments[segments.length - 1];
  if (last?.kind === 'text') {
    return [...segments.slice(0, -1), { kind: 'text', value: last.value + value }];
  }
  return [...segments, { kind: 'text', value }];
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function countLines(value: string): number {
  if (!value) return 1;
  return value.replace(/\r\n/g, '\n').split('\n').length;
}

function normalizePathToken(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('\'') && trimmed.endsWith('\''))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\\ /g, ' ');
}

function hasBareWhitespace(value: string): boolean {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('\'') && trimmed.endsWith('\''))
  ) {
    return false;
  }
  return /(^|[^\\])\s/.test(trimmed);
}

function looksLikeFilePath(value: string): boolean {
  return (
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('~/') ||
    /^[A-Za-z]:[\\/]/.test(value)
  );
}

function fileEmoji(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return '🖼';
  if (['.mp4', '.mov', '.mkv', '.webm'].includes(ext)) return '🎬';
  if (['.mp3', '.wav', '.ogg', '.flac'].includes(ext)) return '🎵';
  if (['.zip', '.tar', '.gz', '.tgz', '.rar', '.7z'].includes(ext)) return '📦';
  if (['.pdf', '.md', '.txt', '.doc', '.docx'].includes(ext)) return '📄';
  if (
    [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
      '.py',
      '.rs',
      '.go',
      '.java',
      '.c',
      '.cc',
      '.cpp',
      '.h',
      '.hpp',
      '.sh',
      '.yml',
      '.yaml',
    ].includes(ext)
  ) {
    return '🧩';
  }
  return '📎';
}

function asDroppedFileSegment(value: string): PromptInputSegment | null {
  if (!value || value.includes('\n') || value.includes('\r')) return null;
  const trailingWhitespace = value.match(/\s+$/)?.[0] ?? '';
  const candidate = value.slice(0, value.length - trailingWhitespace.length);
  if (hasBareWhitespace(candidate)) return null;
  const normalized = normalizePathToken(candidate);
  if (!normalized || !looksLikeFilePath(normalized)) return null;
  const baseName = path.basename(normalized);
  if (!baseName) return null;
  return {
    kind: 'file',
    value,
    display: `${fileEmoji(normalized)} ${baseName}${trailingWhitespace}`,
  };
}

function asPasteSegment(value: string): PromptInputSegment | null {
  if (!value) return null;
  if (!value.includes('\n') && !value.includes('\r') && value.length < LARGE_PASTE_THRESHOLD) {
    return null;
  }
  const lineCount = countLines(value);
  return {
    kind: 'paste',
    value,
    display: `[Pasted Text: ${pluralize(lineCount, 'line')}]`,
  };
}

export function insertPromptInput(
  state: PromptInputState,
  value: string,
): PromptInputState {
  if (!value) return state;
  const fileSegment = asDroppedFileSegment(value);
  if (fileSegment) {
    return { segments: [...state.segments, fileSegment] };
  }
  const pasteSegment = asPasteSegment(value);
  if (pasteSegment) {
    return { segments: [...state.segments, pasteSegment] };
  }
  return { segments: mergeTextSegment(state.segments, value) };
}

export function insertPromptLineBreak(state: PromptInputState): PromptInputState {
  return { segments: mergeTextSegment(state.segments, '\n') };
}

export function deletePromptInput(state: PromptInputState): PromptInputState {
  if (state.segments.length === 0) return state;
  const last = state.segments[state.segments.length - 1];
  if (last.kind !== 'text') {
    return { segments: state.segments.slice(0, -1) };
  }
  if (last.value.length <= 1) {
    return { segments: state.segments.slice(0, -1) };
  }
  return {
    segments: [
      ...state.segments.slice(0, -1),
      { kind: 'text', value: last.value.slice(0, -1) },
    ],
  };
}

function linesForDisplay(display: string): string[] {
  const lines = display.split('\n');
  return lines.length > 0 ? lines : [''];
}

function applyInputChange(
  update: React.SetStateAction<PromptInputState>,
  setValue: React.Dispatch<React.SetStateAction<PromptInputState>>,
  onStateChange?: (state: PromptInputState) => void,
) {
  setValue((current) => {
    const next = typeof update === 'function' ? update(current) : update;
    onStateChange?.(next);
    return next;
  });
}

export function PromptInput({
  onSubmit,
  onCancel,
  label = 'prompt> ',
  labelColor = 'cyan',
  history,
  onShiftTab,
  initialState,
  onStateChange,
}: PromptInputProps) {
  const [value, setValue] = useState<PromptInputState>(() => initialState ?? createEmptyPromptInputState());
  // -1 = current draft; 0..history.length-1 = recalled entry (0 = most recent)
  const [histIdx, setHistIdx] = useState<number>(-1);
  const [draft, setDraft] = useState<PromptInputState>(() => initialState ?? createEmptyPromptInputState());

  function setComposer(update: React.SetStateAction<PromptInputState>) {
    applyInputChange(update, setValue, onStateChange);
  }

  function recall(direction: 'up' | 'down') {
    if (!history || history.length === 0) return;
    if (direction === 'up') {
      const next = histIdx + 1;
      if (next >= history.length) return;
      if (histIdx === -1) setDraft(value);
      const recalled = history[history.length - 1 - next] ?? '';
      setHistIdx(next);
      setComposer(createPromptInputState(recalled));
    } else {
      const next = histIdx - 1;
      if (next < -1) return;
      setHistIdx(next);
      setComposer(next === -1 ? draft : createPromptInputState(history[history.length - 1 - next] ?? ''));
    }
  }

  useInput((input, key) => {
    const isSubmitKey = (key.return || input === '\r' || input === '\n') && input.length <= 1;
    if (key.shift && key.tab && onShiftTab) {
      onShiftTab();
      return;
    }
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.ctrl && isSubmitKey) {
      setComposer((current) => insertPromptLineBreak(current));
      setHistIdx(-1);
      return;
    }
    if (isSubmitKey) {
      onSubmit(getPromptInputValue(value));
      setComposer(createEmptyPromptInputState());
      setHistIdx(-1);
      setDraft(createEmptyPromptInputState());
      return;
    }
    if (key.upArrow) {
      recall('up');
      return;
    }
    if (key.downArrow) {
      recall('down');
      return;
    }
    if (key.backspace || key.delete) {
      setComposer((current) => deletePromptInput(current));
      setHistIdx(-1);
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setComposer((current) => insertPromptInput(current, input));
      setHistIdx(-1);
    }
  });

  const displayLines = linesForDisplay(getPromptInputDisplay(value));

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={labelColor}>{label}</Text>
        <Text>{displayLines[0] ?? ''}</Text>
        {displayLines.length === 1 ? <Text color={labelColor}>▌</Text> : null}
      </Box>
      {displayLines.slice(1).map((line, index) => (
        <Box key={`${index}-${line}`} paddingLeft={label.length}>
          <Text>{line}</Text>
          {index === displayLines.length - 2 ? <Text color={labelColor}>▌</Text> : null}
        </Box>
      ))}
    </Box>
  );
}
