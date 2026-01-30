'use client';

import React, { useMemo } from 'react';
import { ExternalLink as ExternalLinkIcon, FileText, Link as LinkIcon } from 'lucide-react';

interface LinkHandlerProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
  basePath?: string;
}

interface LinkConfig {
  isExternal: boolean;
  isAnchor: boolean;
  isCatalogRoute: boolean;
  resolvedHref: string;
}

/**
 * Determine the type and resolved URL for a link.
 */
function analyzeLinkHref(href: string | undefined, basePath: string): LinkConfig {
  if (!href) {
    return {
      isExternal: false,
      isAnchor: false,
      isCatalogRoute: false,
      resolvedHref: '#',
    };
  }

  // Anchor link (starts with #)
  if (href.startsWith('#')) {
    return {
      isExternal: false,
      isAnchor: true,
      isCatalogRoute: false,
      resolvedHref: href,
    };
  }

  // External link (absolute URL with protocol)
  if (/^https?:\/\//.test(href)) {
    return {
      isExternal: true,
      isAnchor: false,
      isCatalogRoute: false,
      resolvedHref: href,
    };
  }

  // Email link
  if (href.startsWith('mailto:')) {
    return {
      isExternal: true,
      isAnchor: false,
      isCatalogRoute: false,
      resolvedHref: href,
    };
  }

  // Internal markdown link - rewrite to catalog route
  // Examples:
  // - ./other-doc.md -> /catalog/basePath/other-doc
  // - ../sibling/doc.md -> /catalog/parentPath/sibling/doc
  // - /absolute/path.md -> /catalog/absolute/path

  let resolvedPath = href;

  // Remove .md extension
  resolvedPath = resolvedPath.replace(/\.md$/i, '');

  // Handle relative paths
  if (resolvedPath.startsWith('./')) {
    resolvedPath = `${basePath}/${resolvedPath.slice(2)}`;
  } else if (resolvedPath.startsWith('../')) {
    // Navigate up from basePath
    const baseSegments = basePath.split('/').filter(Boolean);
    let upCount = 0;
    let remaining = resolvedPath;

    while (remaining.startsWith('../')) {
      upCount++;
      remaining = remaining.slice(3);
    }

    const newBase = baseSegments.slice(0, -upCount).join('/');
    resolvedPath = newBase ? `${newBase}/${remaining}` : remaining;
  } else if (!resolvedPath.startsWith('/')) {
    // Relative path without ./ prefix
    resolvedPath = `${basePath}/${resolvedPath}`;
  }

  // Ensure path starts with /catalog
  if (!resolvedPath.startsWith('/catalog')) {
    resolvedPath = `/catalog${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
  }

  return {
    isExternal: false,
    isAnchor: false,
    isCatalogRoute: true,
    resolvedHref: resolvedPath,
  };
}

/**
 * External link component with icon.
 */
function ExternalLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-blue-600 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-600 dark:hover:text-blue-300 ${className}`}
    >
      {children}
      <ExternalLinkIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      <span className="sr-only">(opens in new tab)</span>
    </a>
  );
}

/**
 * Internal link component for catalog navigation.
 */
function InternalLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1 text-blue-600 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-600 dark:hover:text-blue-300 ${className}`}
    >
      <FileText className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      {children}
    </a>
  );
}

/**
 * Anchor link component for same-page navigation.
 */
function AnchorLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = href.slice(1);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-blue-600 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-600 dark:hover:text-blue-300 ${className}`}
    >
      <LinkIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      {children}
    </a>
  );
}

/**
 * LinkHandler component for custom link rendering in markdown.
 * Features:
 * - Rewrites internal markdown links to catalog routes
 * - Detects external links and shows icon
 * - Opens external links in new tab
 * - Smooth scrolling for anchor links
 */
export function LinkHandler({
  href,
  children,
  className = '',
  basePath = '',
}: LinkHandlerProps) {
  const linkConfig = useMemo(
    () => analyzeLinkHref(href, basePath),
    [href, basePath]
  );

  if (linkConfig.isExternal) {
    return (
      <ExternalLink href={linkConfig.resolvedHref} className={className}>
        {children}
      </ExternalLink>
    );
  }

  if (linkConfig.isAnchor) {
    return (
      <AnchorLink href={linkConfig.resolvedHref} className={className}>
        {children}
      </AnchorLink>
    );
  }

  if (linkConfig.isCatalogRoute) {
    return (
      <InternalLink href={linkConfig.resolvedHref} className={className}>
        {children}
      </InternalLink>
    );
  }

  // Fallback for unknown link types
  return (
    <a
      href={linkConfig.resolvedHref}
      className={`text-blue-600 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-500 dark:text-blue-400 dark:decoration-blue-600 dark:hover:text-blue-300 ${className}`}
    >
      {children}
    </a>
  );
}

/**
 * Export utility function for link analysis.
 */
export { analyzeLinkHref };

export default LinkHandler;
