import { JSDOM } from 'jsdom';
import type { DOMPurify } from 'dompurify';

import { extractMermaidCodeBlocks } from './mermaidMarkdown';

export type HostRenderedMermaidBlock = {
  blockIndex: number;
  raw: string;
  lightSvgDataUrl?: string;
  darkSvgDataUrl?: string;
  error?: string;
};

type DOMPurifyInstance = DOMPurify;

type DomWindow = Window &
  typeof globalThis & {
    DOMPurify?: DOMPurifyInstance;
  };
type GlobalShim = Window &
  typeof globalThis &
  Record<string | symbol, unknown> & {
    DOMPurify?: DOMPurifyInstance;
  };

const DEFAULT_MAX_BLOCKS = 12;
let envReady: Promise<void> | undefined;
let renderSeq = 0;
let mermaidPromise: Promise<(typeof import('mermaid'))['default']> | undefined;
const globalOverrides = new Map<PropertyKey, unknown>();

const loadMermaid = async () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => mod.default);
  }
  return mermaidPromise;
};

function forceSetGlobalProperty<K extends keyof GlobalShim>(key: K, value: GlobalShim[K]): void {
  const globalTarget = globalThis as GlobalShim;
  const propertyKey = key as PropertyKey;
  const descriptor = Object.getOwnPropertyDescriptor(globalTarget, propertyKey);
  const enumerable = descriptor?.enumerable ?? true;
  const matchesValue = () => (globalTarget as Record<PropertyKey, unknown>)[propertyKey] === value;

  const defineWritableValue = (): boolean => {
    try {
      Object.defineProperty(globalTarget, propertyKey, {
        configurable: true,
        enumerable,
        writable: true,
        value,
      });
      return true;
    } catch {
      return false;
    }
  };

  const defineGetterBackedValue = (): boolean => {
    try {
      globalOverrides.set(propertyKey, value);
      Object.defineProperty(globalTarget, propertyKey, {
        configurable: true,
        enumerable,
        get: () => globalOverrides.get(propertyKey) as GlobalShim[K],
        set: (next: GlobalShim[K]) => {
          globalOverrides.set(propertyKey, next);
        },
      });
      return true;
    } catch {
      return false;
    }
  };

  const assignDirectly = (): boolean => {
    try {
      (globalTarget as Record<PropertyKey, unknown>)[propertyKey] = value;
    } catch {
      return false;
    }
    return matchesValue();
  };

  const applyDescriptorSetter = (): boolean => {
    if (typeof descriptor?.set !== 'function') return false;
    try {
      descriptor.set.call(globalTarget, value);
      return matchesValue();
    } catch {
      return false;
    }
  };

  const deleteIfConfigurable = (): boolean => {
    if (!descriptor || descriptor.configurable) {
      if (descriptor) {
        try {
          Reflect.deleteProperty(globalTarget, propertyKey);
        } catch {
          // Best effort delete; proceed regardless.
        }
      }
      return true;
    }
    return false;
  };

  const ensureValueAssigned = (): void => {
    if (!matchesValue()) {
      throw new Error(`Failed to set global property "${String(propertyKey)}".`);
    }
  };

  if (deleteIfConfigurable()) {
    if (!defineWritableValue()) {
      if (!defineGetterBackedValue() && !assignDirectly()) {
        ensureValueAssigned();
        return;
      }
    }
    ensureValueAssigned();
    return;
  }

  if (applyDescriptorSetter()) {
    ensureValueAssigned();
    return;
  }

  if (descriptor?.writable && assignDirectly()) {
    ensureValueAssigned();
    return;
  }

  if (assignDirectly()) {
    ensureValueAssigned();
    return;
  }

  if (defineGetterBackedValue()) {
    ensureValueAssigned();
    return;
  }

  if (defineWritableValue()) {
    ensureValueAssigned();
    return;
  }

  throw new Error(`Unable to override global property "${String(propertyKey)}".`);
}

function ensureSvgGetBBox(windowAny: DomWindow): void {
  const rectFactory = (width: number, height: number): DOMRect => {
    if (typeof windowAny.DOMRect === 'function') {
      return new windowAny.DOMRect(0, 0, width, height);
    }
    return {
      x: 0,
      y: 0,
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      toJSON() {
        return this;
      },
    } as DOMRect;
  };

  type SvgPrototype = { getBBox?: () => DOMRect };
  const attachPolyfill = (proto?: SvgPrototype): void => {
    if (!proto) return;
    if (typeof proto.getBBox === 'function') return;
    Object.defineProperty(proto, 'getBBox', {
      configurable: true,
      writable: true,
      value: function getBBoxPolyfill(this: Element): DOMRect {
        const textLength = (this.textContent ?? '').length;
        const width = Math.max(1, textLength) * 8;
        const height = Math.max(12, Math.ceil(textLength / 8) * 12);
        return rectFactory(width, height);
      },
    });
  };

  attachPolyfill(windowAny.SVGGraphicsElement?.prototype as SvgPrototype | undefined);
  attachPolyfill(windowAny.SVGElement?.prototype as SvgPrototype | undefined);
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return String(err ?? 'Unknown Mermaid render error.');
}

function sanitizeSvg(svg: string): string {
  return String(svg || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

function svgToDataUrl(svg: string): string {
  const sanitized = sanitizeSvg(svg);
  const base64 = Buffer.from(sanitized, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function ensureMermaidEnvironment(): Promise<void> {
  if (envReady) return envReady;
  envReady = (async () => {
    const dom = new JSDOM('<div id="mermaid-root"></div>', { pretendToBeVisual: true });
    const windowAny = dom.window as unknown as DomWindow;
    forceSetGlobalProperty('window', windowAny);
    forceSetGlobalProperty('document', windowAny.document);
    forceSetGlobalProperty('navigator', windowAny.navigator);
    forceSetGlobalProperty('self', windowAny);
    forceSetGlobalProperty('parent', windowAny);
    forceSetGlobalProperty('Element', windowAny.Element);
    forceSetGlobalProperty('SVGElement', windowAny.SVGElement);
    ensureSvgGetBBox(windowAny);
    forceSetGlobalProperty('HTMLElement', windowAny.HTMLElement);
    forceSetGlobalProperty('getComputedStyle', windowAny.getComputedStyle?.bind(windowAny));
    forceSetGlobalProperty(
      'requestAnimationFrame',
      windowAny.requestAnimationFrame?.bind(windowAny) ||
        ((cb: (...args: unknown[]) => void) => setTimeout(() => cb(Date.now()), 16)),
    );
    forceSetGlobalProperty(
      'cancelAnimationFrame',
      windowAny.cancelAnimationFrame?.bind(windowAny) || ((id: number) => clearTimeout(Number(id))),
    );
    forceSetGlobalProperty('performance', windowAny.performance);
    forceSetGlobalProperty('MutationObserver', windowAny.MutationObserver);

    const createDOMPurify = (
      (await import('dompurify')) as { default: (win?: unknown) => DOMPurifyInstance }
    ).default;
    const DOMPurify = createDOMPurify(windowAny as unknown as Window);
    windowAny.DOMPurify = DOMPurify;
    forceSetGlobalProperty('DOMPurify', DOMPurify);
  })();
  return envReady;
}

async function renderSvgVariant(code: string, theme: 'default' | 'dark'): Promise<string> {
  await ensureMermaidEnvironment();
  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme,
  });
  const id = `mermaid-${Date.now()}-${renderSeq++}`;
  const { svg } = await mermaid.render(id, code);
  if (!svg) throw new Error('Mermaid returned no SVG output.');
  return svgToDataUrl(svg);
}

async function renderBlockVariants(raw: string): Promise<{
  lightSvgDataUrl?: string;
  darkSvgDataUrl?: string;
  error?: string;
}> {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) {
    return { error: 'Diagram is empty.' };
  }

  const result: { lightSvgDataUrl?: string; darkSvgDataUrl?: string; error?: string } = {};
  try {
    result.lightSvgDataUrl = await renderSvgVariant(trimmed, 'default');
  } catch (err) {
    result.error = toErrorMessage(err);
    return result;
  }

  try {
    result.darkSvgDataUrl = await renderSvgVariant(trimmed, 'dark');
  } catch (err) {
    result.darkSvgDataUrl = result.lightSvgDataUrl;
    result.error = toErrorMessage(err);
  }

  return result;
}

export async function renderMermaidBlocksFromMarkdown(params: {
  markdown: string;
  preferMermaid?: boolean;
  maxBlocks?: number;
}): Promise<HostRenderedMermaidBlock[]> {
  const { markdown, preferMermaid, maxBlocks } = params;
  const extractOpts = preferMermaid === undefined ? undefined : { preferMermaid };
  const blocks = extractMermaidCodeBlocks(markdown, extractOpts);
  if (blocks.length === 0) {
    return [];
  }

  const limit = Math.max(1, Math.floor(maxBlocks ?? DEFAULT_MAX_BLOCKS));
  const results: HostRenderedMermaidBlock[] = [];

  for (const block of blocks) {
    if (results.length >= limit) {
      results.push({
        blockIndex: block.blockIndex,
        raw: block.code,
        error: `Mermaid preview limit (${limit}) reached for this file.`,
      });
      continue;
    }

    const rendered = await renderBlockVariants(block.code);
    results.push({
      blockIndex: block.blockIndex,
      raw: block.code,
      ...rendered,
    });
  }

  return results;
}
