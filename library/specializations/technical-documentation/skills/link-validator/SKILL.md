---
name: link-validator
description: Comprehensive link checking and validation for documentation. Validate internal links, external URLs, anchors, detect redirects, monitor link rot, and generate sitemap validation reports.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-009
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Link Validation Skill

Comprehensive link checking and validation for documentation.

## Capabilities

- Internal link validation (cross-references)
- External URL checking with retry logic
- Anchor/fragment validation
- Redirect detection and updating
- Link rot monitoring and reporting
- Archive.org fallback suggestions
- sitemap.xml validation
- Link accessibility checking

## Usage

Invoke this skill when you need to:
- Validate all links in documentation
- Check for broken external URLs
- Verify anchor references
- Detect and fix redirects
- Monitor link health over time

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| inputPath | string | Yes | Path to documentation directory |
| action | string | Yes | validate, monitor, fix-redirects |
| checkExternal | boolean | No | Check external URLs (default: true) |
| timeout | number | No | Request timeout in seconds |
| retries | number | No | Retry count for failed requests |
| allowedDomains | array | No | Domains to always allow |
| blockedDomains | array | No | Domains to skip checking |

### Input Example

```json
{
  "inputPath": "./docs",
  "action": "validate",
  "checkExternal": true,
  "timeout": 30,
  "retries": 3
}
```

## Output Structure

### Validation Report

```json
{
  "summary": {
    "total": 342,
    "valid": 325,
    "broken": 12,
    "redirected": 5,
    "skipped": 0
  },
  "internal": {
    "total": 180,
    "valid": 178,
    "broken": 2
  },
  "external": {
    "total": 162,
    "valid": 147,
    "broken": 10,
    "redirected": 5
  },
  "issues": [
    {
      "type": "broken",
      "url": "https://api.example.com/v1/docs",
      "status": 404,
      "source": {
        "file": "docs/api/authentication.md",
        "line": 42,
        "text": "[API Documentation](https://api.example.com/v1/docs)"
      },
      "suggestion": {
        "archived": "https://web.archive.org/web/20250101/https://api.example.com/v1/docs",
        "alternative": null
      }
    },
    {
      "type": "redirect",
      "url": "http://example.com/old-page",
      "redirectTo": "https://example.com/new-page",
      "status": 301,
      "source": {
        "file": "docs/guides/migration.md",
        "line": 15
      },
      "suggestion": "Update to: https://example.com/new-page"
    },
    {
      "type": "anchor-missing",
      "url": "api/users.md#create-user",
      "source": {
        "file": "docs/quickstart.md",
        "line": 28
      },
      "suggestion": "Heading 'create-user' not found. Available: create, update, delete"
    }
  ],
  "performance": {
    "duration": 45.2,
    "requestsMade": 162,
    "avgResponseTime": 245
  }
}
```

## Configuration

### linkcheck.config.json

```json
{
  "input": "./docs",
  "output": "./reports/linkcheck.json",
  "options": {
    "checkExternal": true,
    "checkAnchors": true,
    "checkImages": true,
    "followRedirects": true,
    "timeout": 30000,
    "retries": 3,
    "retryDelay": 1000,
    "concurrency": 10,
    "userAgent": "Mozilla/5.0 LinkChecker/1.0"
  },
  "allowed": {
    "statusCodes": [200, 201, 204],
    "domains": ["localhost", "127.0.0.1"],
    "patterns": ["^https://internal\\.example\\.com"]
  },
  "blocked": {
    "domains": ["archive.org"],
    "patterns": ["^https://twitter\\.com"]
  },
  "replacements": {
    "http://example.com": "https://example.com",
    "/docs/v1/": "/docs/v2/"
  }
}
```

## Link Types

### Internal Links

```markdown
<!-- Relative path links -->
[Getting Started](./getting-started.md)
[API Reference](../api/index.md)

<!-- Anchor links -->
[Configuration](#configuration)
[API Users](./api/users.md#create-user)

<!-- Image links -->
![Architecture](./images/architecture.png)
```

### External Links

```markdown
<!-- Standard external links -->
[GitHub](https://github.com)
[Documentation](https://docs.example.com/guide)

<!-- Links with anchors -->
[MDN Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#instance_methods)
```

## Validation Rules

### Internal Link Rules

```javascript
const internalRules = {
  // File must exist
  fileExists: {
    severity: 'error',
    check: (link, context) => {
      const resolvedPath = resolvePath(link, context.file);
      return fs.existsSync(resolvedPath);
    }
  },

  // Anchor must exist in target file
  anchorExists: {
    severity: 'error',
    check: (link, context) => {
      const [file, anchor] = link.split('#');
      if (!anchor) return true;
      const headings = extractHeadings(file);
      return headings.some(h => slugify(h) === anchor);
    }
  },

  // Case sensitivity
  caseSensitive: {
    severity: 'warning',
    check: (link, context) => {
      const actual = findActualPath(link);
      return link === actual;
    }
  }
};
```

### External Link Rules

```javascript
const externalRules = {
  // URL must return success status
  statusOk: {
    severity: 'error',
    check: async (url) => {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    }
  },

  // HTTPS preferred
  httpsPreferred: {
    severity: 'warning',
    check: (url) => {
      return url.startsWith('https://') || isLocalhost(url);
    }
  },

  // No redirects (or update to final URL)
  noRedirects: {
    severity: 'info',
    check: async (url) => {
      const response = await fetch(url, { redirect: 'manual' });
      return !response.headers.get('location');
    }
  }
};
```

## Link Rot Monitoring

### Scheduled Checks

```yaml
# .github/workflows/link-check.yml
name: Link Check

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check links
        uses: lycheeverse/lychee-action@v1
        with:
          args: --verbose --no-progress './docs/**/*.md'
          fail: true

      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Broken links detected',
              body: 'Weekly link check found broken links. See workflow run for details.',
              labels: ['documentation', 'bug']
            })
```

### Historical Tracking

```json
{
  "history": [
    {
      "date": "2026-01-24",
      "total": 342,
      "broken": 12,
      "new_broken": 3,
      "fixed": 1
    },
    {
      "date": "2026-01-17",
      "total": 340,
      "broken": 10,
      "new_broken": 2,
      "fixed": 0
    }
  ],
  "trends": {
    "avg_broken_per_week": 2.5,
    "most_problematic_domains": [
      { "domain": "api.example.com", "broken_count": 5 },
      { "domain": "old-docs.example.com", "broken_count": 3 }
    ]
  }
}
```

## Archive.org Integration

### Fallback Suggestions

```javascript
async function findArchiveUrl(brokenUrl) {
  const archiveApi = `https://archive.org/wayback/available?url=${encodeURIComponent(brokenUrl)}`;

  try {
    const response = await fetch(archiveApi);
    const data = await response.json();

    if (data.archived_snapshots?.closest) {
      return {
        available: true,
        url: data.archived_snapshots.closest.url,
        timestamp: data.archived_snapshots.closest.timestamp
      };
    }
  } catch (error) {
    // Archive.org unavailable
  }

  return { available: false };
}
```

## Sitemap Validation

### sitemap.xml Check

```javascript
async function validateSitemap(sitemapUrl) {
  const response = await fetch(sitemapUrl);
  const xml = await response.text();
  const urls = parseSitemapXml(xml);

  const results = await Promise.all(
    urls.map(async (url) => {
      const check = await checkUrl(url.loc);
      return {
        url: url.loc,
        lastmod: url.lastmod,
        status: check.status,
        valid: check.valid
      };
    })
  );

  return {
    total: urls.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid),
    missingLastmod: results.filter(r => !r.lastmod).length
  };
}
```

## Workflow

1. **Scan files** - Find all Markdown files
2. **Extract links** - Parse internal and external links
3. **Validate internal** - Check file and anchor existence
4. **Validate external** - HTTP requests with retries
5. **Check anchors** - Verify fragment identifiers
6. **Detect redirects** - Note permanent redirects
7. **Generate report** - Output findings and suggestions

## Dependencies

```json
{
  "devDependencies": {
    "linkinator": "^6.0.0",
    "markdown-link-check": "^3.11.0",
    "lychee": "^0.14.0",
    "node-fetch": "^3.3.0"
  }
}
```

## CLI Commands

```bash
# Check all links
npx linkinator ./docs --recurse --format json > report.json

# Check with markdown-link-check
find docs -name '*.md' -exec npx markdown-link-check {} \;

# Use lychee (Rust-based, fast)
lychee './docs/**/*.md' --format json --output report.json

# Fix redirects automatically
node scripts/fix-redirects.js --input docs/ --report report.json
```

## Best Practices Applied

- Run link checks in CI/CD
- Monitor external links weekly
- Update redirected links promptly
- Use relative links for internal references
- Include archive.org fallbacks for important links
- Allowlist known-good domains

## References

- linkinator: https://github.com/JustinBeckwith/linkinator
- lychee: https://github.com/lycheeverse/lychee
- markdown-link-check: https://github.com/tcort/markdown-link-check
- Archive.org Wayback API: https://archive.org/help/wayback_api.php

## Target Processes

- docs-testing.js
- docs-audit.js
- docs-pr-workflow.js
