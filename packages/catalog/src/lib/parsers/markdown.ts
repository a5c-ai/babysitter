/**
 * Markdown content parser with section extraction
 * Parses markdown content and extracts structured sections
 */

import type { ParseResult, MarkdownSection } from './types';

// =============================================================================
// MARKDOWN SECTION PARSER
// =============================================================================

/**
 * Regular expression patterns for markdown parsing
 */
const PATTERNS = {
  // Match markdown headers (# to ######)
  header: /^(#{1,6})\s+(.+)$/,
  // Match unordered list items
  listItem: /^[-*+]\s+(.+)$/,
  // Match ordered list items
  orderedListItem: /^\d+\.\s+(.+)$/,
  // Match bold text
  bold: /\*\*([^*]+)\*\*|__([^_]+)__/g,
  // Match italic text
  italic: /\*([^*]+)\*|_([^_]+)_/g,
  // Match links
  link: /\[([^\]]+)\]\(([^)]+)\)/g,
};

/**
 * Parse markdown content into structured sections
 *
 * @param content - Markdown content (without frontmatter)
 * @returns Array of parsed sections
 */
export function parseMarkdownSections(content: string): ParseResult<MarkdownSection[]> {
  try {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];
    const stack: Array<{ section: MarkdownSection; level: number }> = [];
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(PATTERNS.header);

      if (headerMatch) {
        // Save accumulated content to previous section
        const lastItem = stack[stack.length - 1];
        if (lastItem !== undefined) {
          lastItem.section.content = currentContent.join('\n').trim();
        }
        currentContent = [];

        const hashMarks = headerMatch[1];
        const titleText = headerMatch[2];
        const level = hashMarks ? hashMarks.length : 1;
        const title = titleText ? titleText.trim() : '';

        const newSection: MarkdownSection = {
          title,
          level,
          content: '',
          subsections: [],
        };

        // Pop sections from stack until we find a parent
        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top !== undefined && top.level >= level) {
            stack.pop();
          } else {
            break;
          }
        }

        if (stack.length === 0) {
          // Top-level section
          sections.push(newSection);
        } else {
          // Subsection
          const parent = stack[stack.length - 1];
          if (parent !== undefined && parent.section.subsections) {
            parent.section.subsections.push(newSection);
          }
        }

        stack.push({ section: newSection, level });
      } else {
        currentContent.push(line);
      }
    }

    // Save remaining content
    const lastStackItem = stack[stack.length - 1];
    if (lastStackItem !== undefined) {
      lastStackItem.section.content = currentContent.join('\n').trim();
    }

    // Clean up empty subsections arrays
    cleanEmptySubsections(sections);

    return {
      success: true,
      data: sections,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing markdown';
    return {
      success: false,
      error: {
        code: 'MARKDOWN_PARSE_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Remove empty subsections arrays recursively
 */
function cleanEmptySubsections(sections: MarkdownSection[]): void {
  for (const section of sections) {
    if (section.subsections && section.subsections.length === 0) {
      delete section.subsections;
    } else if (section.subsections) {
      cleanEmptySubsections(section.subsections);
    }
  }
}

/**
 * Find a section by title (case-insensitive)
 *
 * @param sections - Array of sections to search
 * @param title - Title to find
 * @returns Found section or undefined
 */
export function findSection(
  sections: MarkdownSection[],
  title: string
): MarkdownSection | undefined {
  const normalizedTitle = title.toLowerCase().trim();

  for (const section of sections) {
    if (section.title.toLowerCase().trim() === normalizedTitle) {
      return section;
    }

    if (section.subsections) {
      const found = findSection(section.subsections, title);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Find sections matching a pattern
 *
 * @param sections - Array of sections to search
 * @param pattern - Regular expression pattern
 * @returns Array of matching sections
 */
export function findSectionsByPattern(
  sections: MarkdownSection[],
  pattern: RegExp
): MarkdownSection[] {
  const results: MarkdownSection[] = [];

  for (const section of sections) {
    if (pattern.test(section.title)) {
      results.push(section);
    }

    if (section.subsections) {
      results.push(...findSectionsByPattern(section.subsections, pattern));
    }
  }

  return results;
}

/**
 * Extract list items from section content
 *
 * @param content - Section content
 * @returns Array of list items
 */
export function extractListItems(content: string): string[] {
  const items: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const unorderedMatch = line.match(PATTERNS.listItem);
    if (unorderedMatch) {
      const item = unorderedMatch[1];
      if (item) {
        items.push(item.trim());
      }
      continue;
    }

    const orderedMatch = line.match(PATTERNS.orderedListItem);
    if (orderedMatch) {
      const item = orderedMatch[1];
      if (item) {
        items.push(item.trim());
      }
    }
  }

  return items;
}

/**
 * Extract list items from a section by title
 *
 * @param sections - Array of sections
 * @param sectionTitle - Title of section to extract from
 * @returns Array of list items
 */
export function extractListFromSection(
  sections: MarkdownSection[],
  sectionTitle: string
): string[] {
  const section = findSection(sections, sectionTitle);
  if (!section) {
    return [];
  }

  return extractListItems(section.content);
}

/**
 * Get plain text from markdown content
 *
 * @param content - Markdown content
 * @returns Plain text without markdown formatting
 */
export function getPlainText(content: string): string {
  let text = content;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`[^`]+`/g, (match) => match.slice(1, -1));

  // Remove links but keep text
  text = text.replace(PATTERNS.link, '$1');

  // Remove bold markers but keep text
  text = text.replace(PATTERNS.bold, '$1$2');

  // Remove italic markers but keep text
  text = text.replace(PATTERNS.italic, '$1$2');

  // Remove headers markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove list markers
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');

  return text.trim();
}

/**
 * Flatten all sections into a single array
 *
 * @param sections - Nested sections
 * @returns Flat array of all sections
 */
export function flattenSections(sections: MarkdownSection[]): MarkdownSection[] {
  const result: MarkdownSection[] = [];

  for (const section of sections) {
    result.push(section);
    if (section.subsections) {
      result.push(...flattenSections(section.subsections));
    }
  }

  return result;
}

/**
 * Get section hierarchy path
 *
 * @param sections - All sections
 * @param targetTitle - Title to find path for
 * @returns Array of section titles from root to target
 */
export function getSectionPath(sections: MarkdownSection[], targetTitle: string): string[] {
  const normalizedTarget = targetTitle.toLowerCase().trim();

  function findPath(
    sects: MarkdownSection[],
    currentPath: string[]
  ): string[] | null {
    for (const section of sects) {
      const newPath = [...currentPath, section.title];

      if (section.title.toLowerCase().trim() === normalizedTarget) {
        return newPath;
      }

      if (section.subsections) {
        const found = findPath(section.subsections, newPath);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  return findPath(sections, []) ?? [];
}

/**
 * Extract section summary (first paragraph or first N characters)
 *
 * @param section - Section to summarize
 * @param maxLength - Maximum length of summary
 * @returns Summary text
 */
export function getSectionSummary(section: MarkdownSection, maxLength: number = 200): string {
  const plainText = getPlainText(section.content);
  const paragraphs = plainText.split('\n\n');
  const firstParagraph = paragraphs[0] ?? '';

  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }

  // Truncate at word boundary
  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Count words in markdown content
 *
 * @param content - Markdown content
 * @returns Word count
 */
export function countWords(content: string): number {
  const plainText = getPlainText(content);
  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Extract all headings from content
 *
 * @param content - Markdown content
 * @returns Array of heading objects
 */
export function extractHeadings(content: string): Array<{ level: number; title: string }> {
  const headings: Array<{ level: number; title: string }> = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(PATTERNS.header);
    if (match) {
      const hashMarks = match[1];
      const titleText = match[2];
      headings.push({
        level: hashMarks ? hashMarks.length : 1,
        title: titleText ? titleText.trim() : '',
      });
    }
  }

  return headings;
}
