'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { List } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  markdown: string;
  className?: string;
  maxDepth?: number;
  onHeadingClick?: (id: string) => void;
}

interface TocItemProps {
  heading: Heading;
  isActive: boolean;
  onClick: (id: string) => void;
  children?: React.ReactNode;
}

/**
 * Generate a slug from heading text for anchor links.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .trim();
}

/**
 * Extract headings from markdown content.
 */
function extractHeadings(markdown: string, maxDepth: number = 3): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split('\n');
  const slugCounts: Record<string, number> = {};

  for (const line of lines) {
    // Match ATX-style headings (# Heading)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match && match[1] && match[2]) {
      const level = match[1].length;
      if (level <= maxDepth) {
        const text = match[2].trim();
        let slug = slugify(text);

        // Handle duplicate slugs
        const existingCount = slugCounts[slug];
        if (existingCount !== undefined && existingCount > 0) {
          slugCounts[slug] = existingCount + 1;
          slug = `${slug}-${slugCounts[slug]}`;
        } else {
          slugCounts[slug] = 1;
        }

        headings.push({
          id: slug,
          text,
          level,
        });
      }
    }
  }

  return headings;
}

/**
 * Build a nested tree structure from flat headings list.
 */
interface HeadingNode extends Heading {
  children: HeadingNode[];
}

function buildTree(headings: Heading[]): HeadingNode[] {
  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  for (const heading of headings) {
    const node: HeadingNode = { ...heading, children: [] };

    // Find parent in stack
    while (stack.length > 0) {
      const lastItem = stack[stack.length - 1];
      if (lastItem && lastItem.level >= heading.level) {
        stack.pop();
      } else {
        break;
      }
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
      }
    }

    stack.push(node);
  }

  return root;
}

/**
 * Individual TOC item component.
 */
function TocItem({ heading, isActive, onClick, children }: TocItemProps) {
  const indent = (heading.level - 1) * 12;

  return (
    <li>
      <a
        href={`#${heading.id}`}
        onClick={(e) => {
          e.preventDefault();
          onClick(heading.id);
        }}
        className={`block truncate rounded px-2 py-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          isActive
            ? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-zinc-600 dark:text-zinc-400'
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {heading.text}
      </a>
      {children}
    </li>
  );
}

/**
 * Recursive renderer for nested TOC tree.
 */
function renderTree(
  nodes: HeadingNode[],
  activeId: string,
  onClick: (id: string) => void
): React.ReactNode {
  if (nodes.length === 0) return null;

  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <TocItem
          key={node.id}
          heading={node}
          isActive={activeId === node.id}
          onClick={onClick}
        >
          {node.children.length > 0 && renderTree(node.children, activeId, onClick)}
        </TocItem>
      ))}
    </ul>
  );
}

/**
 * TableOfContents component for generating a navigable table of contents from markdown.
 * Features:
 * - Extract headings from markdown content
 * - Nested list structure based on heading levels
 * - Click to scroll to heading
 * - Active heading highlight based on scroll position
 */
export function TableOfContents({
  markdown,
  className = '',
  maxDepth = 3,
  onHeadingClick,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  // Extract and structure headings
  const headings = useMemo(() => extractHeadings(markdown, maxDepth), [markdown, maxDepth]);
  const tree = useMemo(() => buildTree(headings), [headings]);

  // Track active heading based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -80% 0%',
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  // Handle heading click
  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);

      // Update URL hash without jumping
      window.history.pushState(null, '', `#${id}`);
    }

    onHeadingClick?.(id);
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className={`rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      aria-label="Table of contents"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <List className="h-4 w-4 text-zinc-500" />
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          On this page
        </span>
      </div>

      {/* TOC tree */}
      {renderTree(tree, activeId, handleClick)}

      {/* Heading count */}
      <div className="mt-3 border-t border-zinc-200 pt-2 text-xs text-zinc-500 dark:border-zinc-700">
        {headings.length} headings
      </div>
    </nav>
  );
}

/**
 * Export utility functions for external use.
 */
export { extractHeadings, slugify };
export type { Heading };

export default TableOfContents;
