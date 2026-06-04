export interface TuiViewport {
  width: number;
  height: number;
  contentWidth: number;
  isNarrow: boolean;
  isVeryNarrow: boolean;
  isShort: boolean;
  listRowLimit: number;
  overlayRowLimit: number;
}

export interface TuiSegment {
  key: string;
  text: string;
  color?: string;
  dimColor?: boolean;
}

export function createViewport(width: number, height: number): TuiViewport {
  const safeWidth = Math.max(Number.isFinite(width) ? width : 80, 24);
  const safeHeight = Math.max(Number.isFinite(height) ? height : 24, 12);
  return {
    width: safeWidth,
    height: safeHeight,
    contentWidth: Math.max(16, safeWidth - 4),
    isNarrow: safeWidth < 90,
    isVeryNarrow: safeWidth < 68,
    isShort: safeHeight < 22,
    listRowLimit: Math.max(3, safeHeight - 10),
    overlayRowLimit: Math.max(3, safeHeight - 8),
  };
}

export function truncateEnd(value: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (value.length <= maxWidth) return value;
  if (maxWidth === 1) return '…';
  return `${value.slice(0, maxWidth - 1)}…`;
}

export function truncateMiddle(value: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (value.length <= maxWidth) return value;
  if (maxWidth === 1) return '…';
  if (maxWidth === 2) return `${value[0] ?? ''}…`;
  const remaining = maxWidth - 1;
  const head = Math.ceil(remaining / 2);
  const tail = Math.floor(remaining / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`;
}

export function packSegments(segments: TuiSegment[], width: number): TuiSegment[][] {
  const maxWidth = Math.max(width, 8);
  const lines: TuiSegment[][] = [];
  let current: TuiSegment[] = [];
  let used = 0;

  for (const segment of segments) {
    const segWidth = segment.text.length;
    const separatorWidth = current.length === 0 ? 0 : 3;
    if (current.length > 0 && used + separatorWidth + segWidth > maxWidth) {
      lines.push(current);
      current = [segment];
      used = segWidth;
      continue;
    }
    current.push(segment);
    used += separatorWidth + segWidth;
  }

  if (current.length > 0) lines.push(current);
  return lines;
}

export function visibleWindow(cursor: number, total: number, maxItems: number): {
  start: number;
  end: number;
} {
  const count = Math.max(1, Math.min(total, maxItems));
  const start = Math.max(0, Math.min(cursor - Math.floor(count / 2), total - count));
  return { start, end: start + count };
}
