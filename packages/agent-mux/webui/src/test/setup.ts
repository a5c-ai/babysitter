import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

vi.mock('lucide-react', () => {
  const createIconMock = (name: string) => {
    const Icon = React.forwardRef<SVGSVGElement, any>(function IconMock(props: any, ref: any) {
      return React.createElement('svg', {
        ...props,
        ref,
        'data-testid': `icon-${name}`,
        'data-lucide': name,
      });
    });
    Icon.displayName = name;
    return Icon;
  };

  const iconNames = [
    'Activity', 'AlertCircle', 'AlertTriangle', 'Archive', 'ArrowLeft', 'ArrowRight', 'ArrowRightLeft',
    'ArrowUpDown', 'Bell', 'Bot', 'CalendarDays', 'Check', 'CheckCircle2', 'ChevronDown', 'ChevronLeft',
    'ChevronRight', 'ChevronUp', 'Circle', 'Clock', 'Clock3', 'Code', 'Cog', 'Columns3', 'Copy',
    'CornerDownRight', 'ExternalLink', 'Eye', 'EyeOff', 'FileDiff', 'FileImage', 'FileJson', 'FileStack',
    'FileText', 'Files', 'FolderGit2', 'FolderOpen', 'GitBranch', 'Github', 'GripVertical', 'Hand',
    'Hammer', 'Hash', 'HelpCircle', 'History', 'Inbox', 'Info', 'Laptop2', 'Layers', 'LayoutDashboard',
    'Link2', 'ListTodo', 'Loader2', 'LoaderCircle', 'Logs', 'MessageSquareText', 'MessageSquareWarning',
    'MessagesSquare', 'Moon', 'Palette', 'PanelLeft', 'PanelRight', 'Pause', 'Percent', 'Pin', 'Play',
    'PinOff', 'PlayCircle', 'PlaySquare', 'Plus', 'Power', 'Puzzle', 'Radar', 'RefreshCw', 'RotateCcw', 'Search',
    'Settings', 'ShieldCheck', 'Siren', 'Smartphone', 'Sparkles', 'Square', 'Sun', 'TabletSmartphone', 'Tag',
    'Terminal', 'TerminalSquare', 'Timer', 'TimerReset', 'Trash2', 'UserRoundPlus', 'Users', 'WandSparkles',
    'Webhook', 'Wifi', 'WifiOff', 'Workflow', 'Wrench', 'X', 'XCircle',
  ];

  const mocks: Record<string, any> = {};
  for (const name of iconNames) {
    mocks[name] = createIconMock(name);
  }
  return mocks;
});

expect.extend(matchers);

afterEach(() => {
  if (typeof globalThis.cancelAnimationFrame !== 'function') {
    globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
  if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
  }
  cleanup();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {
    void this.callback;
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: {
    writeText: async (_text: string) => {},
    readText: async () => '',
    write: async () => {},
    read: async () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  },
});

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

const raf = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
const caf = (id: number) => clearTimeout(id);

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = raf;
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = caf;
}
if (typeof window.requestAnimationFrame === 'undefined') {
  window.requestAnimationFrame = raf;
}
if (typeof window.cancelAnimationFrame === 'undefined') {
  window.cancelAnimationFrame = caf;
}
