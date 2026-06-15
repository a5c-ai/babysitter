/**
 * GAP-TOOLS-037: Fetch Content Processing.
 *
 * Utilities for processing fetched HTML content: stripping tags,
 * extracting text, collecting links and images, and smart truncation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FetchProcessorOptions {
  /** Maximum length of extracted text. */
  maxLength?: number;
  /** Whether to extract text content from HTML. Default: true. */
  extractText?: boolean;
  /** Whether to remove <script> tags. Default: true. */
  removeScripts?: boolean;
  /** Whether to remove <style> tags. Default: true. */
  removeStyles?: boolean;
}

export interface ProcessedContent {
  /** Extracted text content. */
  text: string;
  /** Page title from <title> tag, if found. */
  title?: string;
  /** Links found in the document. */
  links: Array<{ href: string; text: string }>;
  /** Images found in the document. */
  images: Array<{ src: string; alt: string }>;
  /** Additional metadata. */
  metadata: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Process raw HTML content according to the given options.
 */
export function processHtmlContent(
  html: string,
  options: FetchProcessorOptions = {},
): ProcessedContent {
  const {
    removeScripts = true,
    removeStyles = true,
    extractText = true,
    maxLength,
  } = options;

  let processed = html;

  // Extract title before stripping
  const title = extractTitle(processed);

  // Collect links before stripping
  const links = extractLinks(processed);

  // Collect images before stripping
  const images = extractImages(processed);

  // Remove script tags and content
  if (removeScripts) {
    processed = processed.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  }

  // Remove style tags and content
  if (removeStyles) {
    processed = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  }

  // Extract text
  let text: string;
  if (extractText) {
    // Remove all remaining HTML tags
    text = processed
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  } else {
    text = processed;
  }

  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    text = truncateContent(text, maxLength);
  }

  const metadata: Record<string, string> = {};
  if (title) metadata.title = title;
  metadata.originalLength = String(html.length);
  metadata.processedLength = String(text.length);

  return { text, title, links, images, metadata };
}

/**
 * Smart truncation at sentence boundaries.
 * Tries to break at the last sentence-ending punctuation before maxLength.
 */
export function truncateContent(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);

  // Try to find the last sentence boundary
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('!\n'),
    truncated.lastIndexOf('?\n'),
  );

  if (lastSentenceEnd > maxLength * 0.5) {
    return truncated.slice(0, lastSentenceEnd + 1) + ' [...]';
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.5) {
    return truncated.slice(0, lastSpace) + ' [...]';
  }

  return truncated + ' [...]';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : undefined;
}

function extractLinks(html: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const regex = /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (href) links.push({ href, text });
  }

  return links;
}

function extractImages(html: string): Array<{ src: string; alt: string }> {
  const images: Array<{ src: string; alt: string }> = [];
  const regex = /<img\s[^>]*src=["']([^"']*)["'][^>]*>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : '';
    if (src) images.push({ src, alt });
  }

  return images;
}
