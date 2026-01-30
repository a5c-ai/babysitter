'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

import { CodeBlock } from './CodeBlock';
import { FrontmatterDisplay } from './FrontmatterDisplay';
import { TableOfContents, slugify } from './TableOfContents';
import { LinkHandler } from './LinkHandler';
import { ImageHandler } from './ImageHandler';

import './markdown.css';

interface MarkdownRendererProps {
  content: string;
  frontmatter?: Record<string, unknown>;
  className?: string;
  basePath?: string;
  showFrontmatter?: boolean;
  showTableOfContents?: boolean;
  tocMaxDepth?: number;
  enableImageLightbox?: boolean;
  showLineNumbers?: boolean;
}

/**
 * Custom heading component that adds anchor IDs for navigation.
 */
function createHeadingComponent(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const HeadingComponent = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = React.Children.toArray(children)
      .filter((child) => typeof child === 'string')
      .join('');
    const id = slugify(text);

    const commonProps = {
      id,
      className: 'group scroll-mt-20',
      ...props,
    };

    const anchorLink = (
      <a
        href={`#${id}`}
        className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={`Link to ${text}`}
      >
        #
      </a>
    );

    switch (level) {
      case 1:
        return <h1 {...commonProps}>{children}{anchorLink}</h1>;
      case 2:
        return <h2 {...commonProps}>{children}{anchorLink}</h2>;
      case 3:
        return <h3 {...commonProps}>{children}{anchorLink}</h3>;
      case 4:
        return <h4 {...commonProps}>{children}{anchorLink}</h4>;
      case 5:
        return <h5 {...commonProps}>{children}{anchorLink}</h5>;
      case 6:
        return <h6 {...commonProps}>{children}{anchorLink}</h6>;
      default:
        return <h1 {...commonProps}>{children}{anchorLink}</h1>;
    }
  };

  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
}

/**
 * MarkdownRenderer component for rendering markdown with full features.
 * Features:
 * - Uses react-markdown for parsing
 * - GitHub Flavored Markdown via remark-gfm
 * - Syntax highlighting via rehype-highlight
 * - Custom components for links, code, images
 * - Table support with styling
 * - Task list support
 * - Optional frontmatter display
 * - Optional table of contents
 */
export function MarkdownRenderer({
  content,
  frontmatter,
  className = '',
  basePath = '',
  showFrontmatter = true,
  showTableOfContents = false,
  tocMaxDepth = 3,
  enableImageLightbox = true,
  showLineNumbers = false,
}: MarkdownRendererProps) {
  // Memoize custom components to prevent unnecessary re-renders
  const components = useMemo<Components>(
    () => ({
      // Headings with anchor IDs
      h1: createHeadingComponent(1),
      h2: createHeadingComponent(2),
      h3: createHeadingComponent(3),
      h4: createHeadingComponent(4),
      h5: createHeadingComponent(5),
      h6: createHeadingComponent(6),

      // Code blocks and inline code
      code: ({ className, children, ...props }) => {
        // Check if this is a code block (has language class) or inline code
        const isInline = !className;

        // Extract filename from meta if present (e.g., ```js filename="example.js")
        // Note: react-markdown doesn't pass meta by default, but we handle the class
        const filename = undefined; // Would need custom rehype plugin for this

        return (
          <CodeBlock
            className={className}
            inline={isInline}
            showLineNumbers={showLineNumbers && !isInline}
            filename={filename}
            {...props}
          >
            {children}
          </CodeBlock>
        );
      },

      // Custom links
      a: ({ href, children, ...props }) => (
        <LinkHandler href={href} basePath={basePath} {...props}>
          {children}
        </LinkHandler>
      ),

      // Custom images
      img: ({ src, alt, title }) => (
        <ImageHandler
          src={typeof src === 'string' ? src : undefined}
          alt={alt}
          title={title}
          basePath={basePath}
          enableLightbox={enableImageLightbox}
        />
      ),

      // Styled tables
      table: ({ children, ...props }) => (
        <div className="my-4 overflow-x-auto">
          <table
            className="min-w-full divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700"
            {...props}
          >
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="bg-zinc-50 dark:bg-zinc-800" {...props}>
          {children}
        </thead>
      ),
      th: ({ children, ...props }) => (
        <th
          className="px-4 py-2 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          className="border-t border-zinc-200 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          {...props}
        >
          {children}
        </td>
      ),

      // Styled blockquotes
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="my-4 border-l-4 border-zinc-300 bg-zinc-50 py-2 pl-4 pr-4 italic text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          {...props}
        >
          {children}
        </blockquote>
      ),

      // Task lists
      input: ({ type, checked, ...props }) => {
        if (type === 'checkbox') {
          return (
            <input
              type="checkbox"
              checked={checked}
              disabled
              className="mr-2 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
              {...props}
            />
          );
        }
        return <input type={type} {...props} />;
      },

      // Styled lists
      ul: ({ children, ...props }) => (
        <ul className="my-2 list-disc space-y-1 pl-6" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="my-2 list-decimal space-y-1 pl-6" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="text-zinc-700 dark:text-zinc-300" {...props}>
          {children}
        </li>
      ),

      // Paragraphs
      p: ({ children, ...props }) => (
        <p className="my-4 leading-relaxed text-zinc-700 dark:text-zinc-300" {...props}>
          {children}
        </p>
      ),

      // Horizontal rule
      hr: (props) => (
        <hr
          className="my-8 border-zinc-200 dark:border-zinc-700"
          {...props}
        />
      ),

      // Strong and emphasis
      strong: ({ children, ...props }) => (
        <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic" {...props}>
          {children}
        </em>
      ),
    }),
    [basePath, enableImageLightbox, showLineNumbers]
  );

  return (
    <div className={`markdown-renderer ${className}`}>
      {/* Frontmatter display */}
      {showFrontmatter && frontmatter && Object.keys(frontmatter).length > 0 && (
        <FrontmatterDisplay frontmatter={frontmatter as Record<string, import('./FrontmatterDisplay').FrontmatterValue>} />
      )}

      {/* Layout with optional TOC */}
      <div className={showTableOfContents ? 'flex gap-8' : ''}>
        {/* Main content */}
        <article className={`prose prose-zinc dark:prose-invert max-w-none ${showTableOfContents ? 'flex-1' : ''}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </article>

        {/* Table of contents sidebar */}
        {showTableOfContents && (
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-8">
              <TableOfContents markdown={content} maxDepth={tocMaxDepth} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default MarkdownRenderer;
