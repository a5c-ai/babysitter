'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Hash, List, Braces, Type, Calendar, ToggleLeft } from 'lucide-react';

type FrontmatterValue = string | number | boolean | null | undefined | FrontmatterValue[] | { [key: string]: FrontmatterValue };

interface FrontmatterDisplayProps {
  frontmatter: Record<string, FrontmatterValue>;
  className?: string;
  collapsed?: boolean;
}

interface TypeBadgeProps {
  type: string;
}

/**
 * Type badge component to display the data type of frontmatter values.
 */
function TypeBadge({ type }: TypeBadgeProps) {
  const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    string: { icon: <Type className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    number: { icon: <Hash className="h-3 w-3" />, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    boolean: { icon: <ToggleLeft className="h-3 w-3" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    array: { icon: <List className="h-3 w-3" />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    object: { icon: <Braces className="h-3 w-3" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' },
    date: { icon: <Calendar className="h-3 w-3" />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
    null: { icon: null, color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  };

  const config = typeConfig[type] ?? typeConfig.string!;

  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.icon}
      {type}
    </span>
  );
}

/**
 * Detect the type of a frontmatter value.
 */
function detectType(value: FrontmatterValue): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  // Check if string is a date
  if (typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
    if (dateRegex.test(value)) return 'date';
  }
  return 'string';
}

interface ValueRendererProps {
  value: FrontmatterValue;
  depth?: number;
}

/**
 * Recursive value renderer for nested frontmatter objects and arrays.
 */
function ValueRenderer({ value, depth = 0 }: ValueRendererProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const type = detectType(value);

  // Null/undefined
  if (value === null || value === undefined) {
    return <span className="italic text-zinc-400">null</span>;
  }

  // Boolean
  if (type === 'boolean') {
    return (
      <span className={value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
        {String(value)}
      </span>
    );
  }

  // Number
  if (type === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{String(value)}</span>;
  }

  // Date
  if (type === 'date') {
    return (
      <span className="text-teal-600 dark:text-teal-400">
        {new Date(value as string).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </span>
    );
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="italic text-zinc-400">[]</span>;
    }

    // Simple array (all primitives)
    const allPrimitive = value.every(
      (v) => typeof v !== 'object' || v === null
    );

    if (allPrimitive && value.length <= 5) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <span
              key={index}
              className="rounded bg-zinc-100 px-2 py-0.5 text-sm dark:bg-zinc-800"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    // Complex array - collapsible
    return (
      <div className="ml-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>{value.length} items</span>
        </button>
        {isExpanded && (
          <ul className="mt-1 space-y-1 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
            {value.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 text-xs text-zinc-400">[{index}]</span>
                <ValueRenderer value={item} depth={depth + 1} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Object
  if (type === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, FrontmatterValue>);
    if (entries.length === 0) {
      return <span className="italic text-zinc-400">{'{}'}</span>;
    }

    return (
      <div className="ml-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>{entries.length} properties</span>
        </button>
        {isExpanded && (
          <div className="mt-1 space-y-2 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
            {entries.map(([key, val]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="flex-shrink-0 font-medium text-zinc-600 dark:text-zinc-400">
                  {key}:
                </span>
                <ValueRenderer value={val} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // String (default)
  return <span className="text-zinc-800 dark:text-zinc-200">{String(value)}</span>;
}

/**
 * FrontmatterDisplay component for rendering YAML frontmatter as a key-value table.
 * Features:
 * - Key-value table layout
 * - Nested object expansion
 * - Array display
 * - Type badges (string, number, array, object, boolean, date)
 */
export function FrontmatterDisplay({
  frontmatter,
  className = '',
  collapsed = false,
}: FrontmatterDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const entries = Object.entries(frontmatter);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className={`my-4 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-left hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
      >
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Frontmatter
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">{entries.length} fields</span>
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Content table */}
      {!isCollapsed && (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-start gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              {/* Key */}
              <div className="flex w-32 flex-shrink-0 items-center gap-2">
                <span className="font-mono text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {key}
                </span>
              </div>

              {/* Type badge */}
              <div className="flex-shrink-0">
                <TypeBadge type={detectType(value)} />
              </div>

              {/* Value */}
              <div className="min-w-0 flex-1">
                <ValueRenderer value={value} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { FrontmatterValue };
export default FrontmatterDisplay;
