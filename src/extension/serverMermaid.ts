import { JSDOM } from 'jsdom';
import mermaid from 'mermaid';

import { extractMermaidCodeBlocks } from './mermaidMarkdown';

export type HostRenderedMermaidBlock = {
  blockIndex: number;
  raw: string;
  lightSvgDataUrl?: string;
  darkSvgDataUrl?: string;
  error?: string;
};

type DomWindow = Window & typeof globalThis;
type GlobalShim = Window & typeof globalThis & Record<string, unknown>;

const DEFAULT_MAX_BLOCKS = 12;
let envReady: Promise<void> | undefined;
let renderSeq = 0;

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
  envReady = Promise.resolve().then(() => {
    const dom = new JSDOM('<div id="mermaid-root"></div>', { pretendToBeVisual: true });
    const windowAny = dom.window as unknown as DomWindow;
    const globalAny = globalThis as GlobalShim;

    globalAny.window = windowAny;
    globalAny.document = windowAny.document;
    globalAny.navigator = windowAny.navigator;
    globalAny.self = globalAny;
    globalAny.parent = globalAny;
    globalAny.Element = windowAny.Element;
    globalAny.SVGElement = windowAny.SVGElement;
    globalAny.HTMLElement = windowAny.HTMLElement;
    globalAny.getComputedStyle = windowAny.getComputedStyle?.bind(windowAny);
    globalAny.requestAnimationFrame =
      windowAny.requestAnimationFrame?.bind(windowAny) ||
      ((cb: (...args: unknown[]) => void) => setTimeout(() => cb(Date.now()), 16));
    globalAny.cancelAnimationFrame =
      windowAny.cancelAnimationFrame?.bind(windowAny) || ((id: number) => clearTimeout(Number(id)));
    globalAny.performance = windowAny.performance;
    globalAny.MutationObserver = windowAny.MutationObserver;
  });
  return envReady;
}

async function renderSvgVariant(code: string, theme: 'default' | 'dark'): Promise<string> {
  await ensureMermaidEnvironment();
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
