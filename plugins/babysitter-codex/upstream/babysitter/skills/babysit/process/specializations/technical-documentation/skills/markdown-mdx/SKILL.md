---
name: markdown-mdx
description: Advanced Markdown and MDX processing for technical documentation. Parse, validate, lint, and transform Markdown content with support for MDX components, front matter, and remark/rehype plugins.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-005
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Markdown/MDX Skill

Advanced Markdown and MDX processing for technical documentation.

## Capabilities

- Parse and validate Markdown syntax (CommonMark, GFM)
- MDX component development and integration
- Remark/Rehype plugin configuration
- Front matter parsing and validation
- Markdown linting (markdownlint rules)
- Table formatting and generation
- Link validation and URL checking
- Convert between documentation formats

## Usage

Invoke this skill when you need to:
- Lint and validate Markdown files
- Create or integrate MDX components
- Configure remark/rehype pipelines
- Validate front matter schemas
- Convert between documentation formats

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| inputPath | string | Yes | Path to Markdown/MDX file or directory |
| action | string | Yes | lint, validate, transform, parse-frontmatter |
| outputPath | string | No | Output path for transformed content |
| configPath | string | No | Path to markdownlint config |
| frontmatterSchema | object | No | JSON schema for front matter validation |
| plugins | array | No | Remark/rehype plugins to apply |

### Input Example

```json
{
  "inputPath": "./docs",
  "action": "lint",
  "configPath": ".markdownlint.json"
}
```

## Output Structure

### Lint Output

```json
{
  "files": 42,
  "errors": 5,
  "warnings": 12,
  "issues": [
    {
      "file": "docs/getting-started.md",
      "line": 15,
      "rule": "MD022",
      "message": "Headings should be surrounded by blank lines",
      "severity": "error"
    }
  ],
  "fixable": 8
}
```

### Front Matter Parse Output

```json
{
  "file": "docs/api/users.md",
  "frontmatter": {
    "title": "Users API",
    "description": "User management endpoints",
    "tags": ["api", "users"],
    "sidebar_position": 3
  },
  "valid": true,
  "content": "# Users API\n\nThis document..."
}
```

## Markdown Patterns

### CommonMark Extensions

```markdown
# Heading 1

## Heading 2 {#custom-id}

Paragraph with **bold**, *italic*, and `code`.

> Blockquote with
> multiple lines

- Unordered list
- With items
  - Nested item

1. Ordered list
2. With numbers

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

[Link text](https://example.com "Title")

![Alt text](image.png)

```javascript
const code = 'block';
```

---

Horizontal rule above.
```

### GitHub Flavored Markdown (GFM)

```markdown
## GFM Extensions

### Task Lists
- [x] Completed task
- [ ] Incomplete task

### Tables
| Left | Center | Right |
|:-----|:------:|------:|
| L    |   C    |     R |

### Strikethrough
~~deleted text~~

### Autolinks
https://example.com

### Footnotes
Here's a sentence with a footnote[^1].

[^1]: This is the footnote.

### Alerts
> [!NOTE]
> Useful information.

> [!WARNING]
> Critical content.
```

## MDX Patterns

### MDX Components

```mdx
---
title: Interactive Guide
---

import { Tabs, TabItem } from '@site/src/components/Tabs';
import CodeBlock from '@theme/CodeBlock';

# Getting Started

<Tabs>
  <TabItem value="npm" label="npm">
    ```bash
    npm install my-package
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```bash
    yarn add my-package
    ```
  </TabItem>
</Tabs>

## Configuration

<CodeBlock language="json" title="config.json">
{`{
  "setting": "value"
}`}
</CodeBlock>

export const Highlight = ({children, color}) => (
  <span style={{backgroundColor: color, padding: '0.2rem'}}>
    {children}
  </span>
);

This is <Highlight color="#25c2a0">highlighted text</Highlight>.
```

### MDX Component Library

```jsx
// components/Callout.jsx
export function Callout({ type = 'info', title, children }) {
  const styles = {
    info: { bg: '#e7f5ff', border: '#339af0' },
    warning: { bg: '#fff3bf', border: '#fab005' },
    error: { bg: '#ffe3e3', border: '#fa5252' },
    success: { bg: '#d3f9d8', border: '#40c057' }
  };

  return (
    <div style={{
      backgroundColor: styles[type].bg,
      borderLeft: `4px solid ${styles[type].border}`,
      padding: '1rem',
      margin: '1rem 0'
    }}>
      {title && <strong>{title}</strong>}
      {children}
    </div>
  );
}
```

```mdx
import { Callout } from '@site/src/components/Callout';

<Callout type="warning" title="Deprecation Notice">
  This API will be removed in version 3.0.
</Callout>
```

## Markdownlint Configuration

### .markdownlint.json

```json
{
  "default": true,
  "MD013": false,
  "MD033": {
    "allowed_elements": ["details", "summary", "Tabs", "TabItem"]
  },
  "MD041": false,
  "MD024": {
    "siblings_only": true
  },
  "MD046": {
    "style": "fenced"
  },
  "MD048": {
    "style": "backtick"
  }
}
```

### markdownlint-cli2 Configuration

```yaml
# .markdownlint-cli2.yaml
config:
  default: true
  MD013: false

globs:
  - "docs/**/*.md"
  - "!node_modules"
  - "!.git"

ignores:
  - "CHANGELOG.md"

customRules:
  - markdownlint-rule-search-replace
```

## Remark/Rehype Plugins

### remark.config.mjs

```javascript
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkToc from 'remark-toc';
import remarkSlug from 'remark-slug';

export default {
  plugins: [
    remarkGfm,
    remarkFrontmatter,
    remarkMdxFrontmatter,
    [remarkToc, { heading: 'contents', tight: true }],
    remarkSlug
  ]
};
```

### rehype.config.mjs

```javascript
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';

export default {
  plugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    [rehypePrism, { showLineNumbers: true }]
  ]
};
```

## Front Matter Schema

### JSON Schema for Validation

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["title"],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "maxLength": 300
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    },
    "sidebar_position": {
      "type": "integer",
      "minimum": 0
    },
    "draft": {
      "type": "boolean",
      "default": false
    }
  },
  "additionalProperties": false
}
```

## Workflow

1. **Parse content** - Load Markdown/MDX files
2. **Extract front matter** - Parse YAML front matter
3. **Validate structure** - Check against schema
4. **Lint content** - Apply markdownlint rules
5. **Transform** - Apply remark/rehype plugins
6. **Report findings** - Output validation results

## Dependencies

```json
{
  "devDependencies": {
    "markdownlint-cli2": "^0.12.0",
    "remark": "^15.0.0",
    "remark-gfm": "^4.0.0",
    "remark-frontmatter": "^5.0.0",
    "remark-mdx": "^3.0.0",
    "rehype": "^13.0.0",
    "gray-matter": "^4.0.0",
    "ajv": "^8.0.0"
  }
}
```

## CLI Commands

```bash
# Lint all Markdown files
npx markdownlint-cli2 "docs/**/*.md"

# Fix auto-fixable issues
npx markdownlint-cli2 --fix "docs/**/*.md"

# Parse and validate front matter
node scripts/validate-frontmatter.js docs/

# Convert Markdown to HTML
npx remark docs/guide.md -o build/guide.html
```

## Best Practices Applied

- Use ATX-style headings (#)
- Consistent list markers (- for unordered)
- Fenced code blocks with language identifier
- Front matter for metadata
- Descriptive link text (not "click here")
- Alt text for all images
- One sentence per line for better diffs

## References

- CommonMark: https://commonmark.org/
- GFM: https://github.github.com/gfm/
- MDX: https://mdxjs.com/
- markdownlint: https://github.com/DavidAnson/markdownlint
- remark: https://remark.js.org/
- rehype: https://github.com/rehypejs/rehype

## Target Processes

- style-guide-enforcement.js
- docs-testing.js
- docs-audit.js
- content-strategy.js
