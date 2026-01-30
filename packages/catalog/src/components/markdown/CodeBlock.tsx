'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Check, Copy, File } from 'lucide-react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
  showLineNumbers?: boolean;
  filename?: string;
}

/**
 * CodeBlock component for rendering code with syntax highlighting.
 * Features:
 * - Language detection from className
 * - Copy-to-clipboard functionality
 * - Optional line numbers
 * - Filename header display
 * - Language badge
 */
export function CodeBlock({
  children,
  className,
  inline,
  showLineNumbers = false,
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Extract language from className (e.g., "language-typescript" -> "typescript")
  const language = useMemo(() => {
    if (!className) return undefined;
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : undefined;
  }, [className]);

  // Get display name for language
  const languageDisplayName = useMemo(() => {
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      ts: 'TypeScript',
      jsx: 'JSX',
      tsx: 'TSX',
      py: 'Python',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      php: 'PHP',
      swift: 'Swift',
      kotlin: 'Kotlin',
      scala: 'Scala',
      sh: 'Shell',
      bash: 'Bash',
      zsh: 'Zsh',
      powershell: 'PowerShell',
      sql: 'SQL',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      xml: 'XML',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      less: 'Less',
      md: 'Markdown',
      markdown: 'Markdown',
      dockerfile: 'Dockerfile',
      docker: 'Docker',
      graphql: 'GraphQL',
      prisma: 'Prisma',
      toml: 'TOML',
      ini: 'INI',
      nginx: 'Nginx',
      apache: 'Apache',
    };
    if (!language) return undefined;
    return languageMap[language.toLowerCase()] || language.toUpperCase();
  }, [language]);

  // Extract code text from children
  const codeText = useMemo(() => {
    if (typeof children === 'string') return children;
    if (React.isValidElement(children)) {
      const props = children.props as { children?: unknown };
      if (typeof props.children === 'string') {
        return props.children;
      }
    }
    return '';
  }, [children]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [codeText]);

  // Render inline code
  if (inline) {
    return (
      <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
        {children}
      </code>
    );
  }

  // Split code into lines for line numbers
  const lines = codeText.split('\n');
  const lineCount = lines.length;

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header with filename and/or language badge */}
      {(filename || languageDisplayName) && (
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center gap-2">
            {filename && (
              <>
                <File className="h-4 w-4 text-zinc-500" />
                <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                  {filename}
                </span>
              </>
            )}
          </div>
          {languageDisplayName && (
            <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
              {languageDisplayName}
            </span>
          )}
        </div>
      )}

      {/* Code content */}
      <div className="relative">
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-md border border-zinc-200 bg-white p-1.5 opacity-0 shadow-sm transition-opacity hover:bg-zinc-50 group-hover:opacity-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        {/* Code with optional line numbers */}
        <div className="overflow-x-auto">
          {showLineNumbers ? (
            <div className="flex">
              {/* Line numbers column */}
              <div className="flex-none select-none border-r border-zinc-200 bg-zinc-100 px-3 py-4 text-right font-mono text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                {lines.map((_: string, index: number) => (
                  <div key={index} className="leading-6">
                    {index + 1}
                  </div>
                ))}
              </div>
              {/* Code column */}
              <pre className="flex-1 overflow-x-auto p-4">
                <code className={`${className || ''} font-mono text-sm leading-6`}>{children}</code>
              </pre>
            </div>
          ) : (
            <pre className="overflow-x-auto p-4">
              <code className={`${className || ''} font-mono text-sm leading-6`}>{children}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Line count indicator for long code blocks */}
      {lineCount > 20 && (
        <div className="border-t border-zinc-200 bg-zinc-100 px-4 py-1 text-right text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
          {lineCount} lines
        </div>
      )}
    </div>
  );
}

export default CodeBlock;
