# Markdown/MDX Skill

Advanced Markdown and MDX processing for technical documentation.

## Overview

This skill provides comprehensive support for Markdown and MDX content processing, including parsing, validation, linting, and transformation. It supports CommonMark, GitHub Flavored Markdown (GFM), and MDX for React-based documentation.

## When to Use

- Linting Markdown files for consistency
- Validating front matter against schemas
- Creating MDX components for interactive docs
- Configuring remark/rehype pipelines
- Converting between documentation formats

## Quick Start

### Lint Markdown Files

```json
{
  "inputPath": "./docs",
  "action": "lint",
  "configPath": ".markdownlint.json"
}
```

### Validate Front Matter

```json
{
  "inputPath": "./docs",
  "action": "parse-frontmatter",
  "frontmatterSchema": {
    "required": ["title", "description"]
  }
}
```

### Transform with Plugins

```json
{
  "inputPath": "./docs/guide.md",
  "action": "transform",
  "plugins": ["remark-gfm", "remark-toc"],
  "outputPath": "./build/guide.md"
}
```

## Supported Formats

| Format | Description |
|--------|-------------|
| CommonMark | Standard Markdown |
| GFM | GitHub Flavored Markdown |
| MDX | Markdown with JSX |
| YAML Front Matter | Metadata in documents |

## Key Features

### 1. Markdown Linting
- markdownlint integration
- Custom rule configuration
- Auto-fix support

### 2. MDX Components
- React component integration
- Interactive documentation
- Code playgrounds

### 3. Front Matter Processing
- YAML parsing
- JSON schema validation
- Metadata extraction

### 4. Plugin Ecosystem
- remark plugins (parsing)
- rehype plugins (HTML)
- Custom transformers

## Markdownlint Configuration

Create `.markdownlint.json`:

```json
{
  "default": true,
  "MD013": false,
  "MD033": {
    "allowed_elements": ["Tabs", "TabItem"]
  }
}
```

## MDX Example

```mdx
---
title: Quick Start
---

import Tabs from '@theme/Tabs';

# Getting Started

<Tabs>
  <TabItem value="npm">npm install</TabItem>
  <TabItem value="yarn">yarn add</TabItem>
</Tabs>
```

## CLI Commands

```bash
# Lint Markdown
npx markdownlint-cli2 "docs/**/*.md"

# Fix issues
npx markdownlint-cli2 --fix "docs/**/*.md"

# Validate front matter
node scripts/validate-frontmatter.js
```

## Process Integration

| Process | Usage |
|---------|-------|
| `style-guide-enforcement.js` | Enforce writing standards |
| `docs-testing.js` | Validate Markdown in CI |
| `docs-audit.js` | Content quality analysis |
| `content-strategy.js` | Content structure review |

## Dependencies

- markdownlint-cli2
- remark / remark-gfm
- rehype
- gray-matter
- @mdx-js/mdx

## References

- [CommonMark Spec](https://commonmark.org/)
- [GFM Spec](https://github.github.com/gfm/)
- [MDX Documentation](https://mdxjs.com/)
- [markdownlint Rules](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-005
**Category:** Content Authoring
**Status:** Active
