import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next/dynamic — pass through to the real component synchronously.
// The loader function (e.g. () => import("./agent-panel")) returns a Promise,
// but in vitest the module is already loaded. We extract the module path from
// the loader's toString() to resolve it synchronously. As a fallback, we use
// async resolution with React state.
vi.mock('next/dynamic', () => {
  const dynamic = (loader: () => Promise<any>, _opts?: any) => {
    // Attempt synchronous resolution: call loader and intercept the result.
    // In vitest, the dynamic import resolves on the next microtick, so we
    // eagerly kick it off and cache the result for subsequent renders.
    let Resolved: React.ComponentType<any> | null = null;
    const loadPromise = loader().then((mod: any) => {
      Resolved = mod.default || mod;
    });

    const DynamicComponent = (props: any) => {
      const [Comp, setComp] = React.useState<React.ComponentType<any> | null>(() => Resolved);

      React.useEffect(() => {
        if (!Comp && !Resolved) {
          loadPromise.then(() => {
            if (Resolved) setComp(() => Resolved);
          });
        } else if (!Comp && Resolved) {
          setComp(() => Resolved);
        }
      }, [Comp]);

      const Active = Comp || Resolved;
      if (Active) {
        return React.createElement(Active, props);
      }
      if (_opts?.loading) {
        return React.createElement(_opts.loading, {});
      }
      return null;
    };
    DynamicComponent.displayName = 'DynamicComponent';
    (DynamicComponent as any).preload = () => loadPromise;
    return DynamicComponent;
  };
  return { __esModule: true, default: dynamic };
});

// Mock lucide-react to avoid React version mismatch in monorepo
// (observer has React 18 locally, root has React 19)
vi.mock('lucide-react', () => {
  const createIconMock = (name: string) => {
    const Icon = React.forwardRef<SVGSVGElement, any>(
      function IconMock(props: any, ref: any) {
        return React.createElement('svg', {
          ...props,
          ref,
          'data-testid': `icon-${name}`,
          'data-lucide': name,
        });
      },
    );
    Icon.displayName = name;
    return Icon;
  };

  // All icon names used across the codebase
  const iconNames = [
    'Activity', 'AlarmClock', 'AlertCircle', 'AlertTriangle', 'ArrowLeft', 'ArrowRight',
    'ArrowUpDown', 'Bell', 'BellRing', 'Bot',
    'CalendarDays', 'Check', 'CheckCircle2', 'ChevronDown', 'ChevronLeft',
    'ChevronRight', 'ChevronUp', 'Circle', 'Clock', 'Code', 'Cog', 'Copy',
    'ExternalLink', 'Eye', 'EyeOff', 'FileJson', 'FileText', 'FolderOpen',
    'GitBranch', 'Github',
    'Hand', 'Hash', 'HelpCircle', 'History', 'Inbox', 'Info', 'Layers',
    'LayoutGrid', 'List', 'Loader2', 'Moon', 'MoonStar', 'Palette',
    'Pause', 'PauseCircle', 'Percent', 'Pin', 'Plus', 'Puzzle', 'RefreshCw',
    'Search', 'Settings',
    'Sun', 'Tag', 'Terminal', 'Timer', 'Trash2', 'Wifi', 'WifiOff',
    'X', 'XCircle',
  ];

  const mocks: Record<string, any> = {};
  for (const name of iconNames) {
    mocks[name] = createIconMock(name);
  }
  return mocks;
});

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
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

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}

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

// Mock navigator.clipboard (configurable so userEvent can re-stub it)
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

// Mock ResizeObserver (used by Radix UI components)
class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});
