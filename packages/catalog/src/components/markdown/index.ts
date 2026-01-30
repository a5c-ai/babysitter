/**
 * Markdown Components
 *
 * A comprehensive markdown rendering solution with:
 * - GitHub Flavored Markdown support
 * - Syntax highlighting for code blocks
 * - Frontmatter display
 * - Table of contents generation
 * - Custom link handling with route rewriting
 * - Responsive image handling with lightbox
 */

// Main renderer
export { MarkdownRenderer } from './MarkdownRenderer';
export { default as MarkdownRendererDefault } from './MarkdownRenderer';

// Individual components
export { CodeBlock } from './CodeBlock';
export { FrontmatterDisplay } from './FrontmatterDisplay';
export type { FrontmatterValue } from './FrontmatterDisplay';
export { TableOfContents, extractHeadings, slugify } from './TableOfContents';
export { LinkHandler, analyzeLinkHref } from './LinkHandler';
export { ImageHandler } from './ImageHandler';

// Types
export type { Heading } from './TableOfContents';

// CSS import helper - consumers should import this in their layout
export const MARKDOWN_CSS_PATH = './markdown.css';
