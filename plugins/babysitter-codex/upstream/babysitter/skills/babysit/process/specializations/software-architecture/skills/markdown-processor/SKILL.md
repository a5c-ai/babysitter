---
name: markdown-processor
description: Specialized skill for processing Markdown and MDX documentation. Supports parsing, rendering, TOC generation, link validation, frontmatter processing, and diagram embedding.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: documentation
  backlog-id: SK-SA-004
---

# markdown-processor

You are **markdown-processor** - a specialized skill for processing Markdown and MDX documentation. This skill enables AI-powered documentation processing and validation across all architecture documentation workflows.

## Overview

This skill enables comprehensive Markdown/MDX processing including:
- Parse and render Markdown/MDX with extended syntax
- Generate and update table of contents
- Validate internal and external links
- Process and validate frontmatter (YAML/TOML)
- Embed and validate diagrams (Mermaid, PlantUML)
- Convert between formats (Markdown to HTML, PDF)

## Prerequisites

- Node.js (v18+) for tooling
- Optional: remark, unified, markdown-it, mdx-js

## Capabilities

### 1. Markdown Parsing and AST

Parse Markdown to AST for manipulation:

```javascript
// Using remark
import { remark } from 'remark';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

const processor = remark()
  .use(remarkParse)
  .use(remarkStringify);

const ast = processor.parse(`
# Document Title

This is a paragraph with **bold** and *italic* text.

## Section

- List item 1
- List item 2
`);

// AST manipulation example
function transformHeadings(tree) {
  visit(tree, 'heading', (node) => {
    if (node.depth === 1) {
      // Add anchor to h1
      node.children = [{
        type: 'link',
        url: `#${slugify(toString(node))}`,
        children: node.children
      }];
    }
  });
}
```

### 2. Table of Contents Generation

Generate and insert TOC:

```markdown
<!-- Original document -->
# Document Title

## Introduction

Content here...

## Architecture

### System Overview

Content here...

### Components

Content here...

## Conclusion

Content here...

---

<!-- Generated TOC -->
## Table of Contents

- [Introduction](#introduction)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Components](#components)
- [Conclusion](#conclusion)
```

### 3. Frontmatter Processing

Parse and validate YAML/TOML frontmatter:

```markdown
---
title: Architecture Overview
author: John Doe
date: 2026-01-24
tags: [architecture, documentation]
status: draft
custom:
  reviewers: [jane, bob]
  category: technical
---

# Architecture Overview

Document content...
```

```javascript
// Frontmatter schema validation
const frontmatterSchema = {
  type: 'object',
  required: ['title', 'date'],
  properties: {
    title: { type: 'string', maxLength: 100 },
    author: { type: 'string' },
    date: { type: 'string', format: 'date' },
    tags: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['draft', 'review', 'published'] }
  }
};
```

### 4. Link Validation

Validate internal and external links:

```javascript
// Link validation report
const validationReport = {
  totalLinks: 45,
  internal: {
    valid: 30,
    broken: 2,
    details: [
      { file: 'overview.md', link: './api.md', status: 'valid' },
      { file: 'setup.md', link: './missing.md', status: 'broken' }
    ]
  },
  external: {
    valid: 10,
    broken: 1,
    skipped: 2,
    details: [
      { file: 'resources.md', link: 'https://example.com', status: 'valid' },
      { file: 'references.md', link: 'https://dead-link.com', status: 'broken', error: '404' }
    ]
  },
  anchors: {
    valid: 20,
    broken: 1,
    details: [
      { file: 'guide.md', anchor: '#installation', status: 'broken' }
    ]
  }
};
```

### 5. Diagram Embedding

Embed and validate diagrams:

````markdown
# System Architecture

## C4 Context Diagram

```mermaid
C4Context
    title System Context Diagram

    Person(user, "User", "A user of the system")
    System(system, "Our System", "The main system")
    System_Ext(ext, "External Service", "Third party service")

    Rel(user, system, "Uses")
    Rel(system, ext, "Calls")
```

## Sequence Diagram

```plantuml
@startuml
participant User
participant System
participant Database

User -> System: Request
System -> Database: Query
Database --> System: Result
System --> User: Response
@enduml
```
````

### 6. MDX Processing

Process MDX with React components:

```mdx
---
title: Interactive Documentation
---

import { CodeBlock, Alert, Tabs } from '@components';

# Interactive Guide

<Alert type="info">
  This is an interactive documentation page.
</Alert>

## Code Examples

<Tabs>
  <Tab label="JavaScript">
    ```javascript
    const hello = () => console.log('Hello');
    ```
  </Tab>
  <Tab label="Python">
    ```python
    def hello():
        print('Hello')
    ```
  </Tab>
</Tabs>

## API Reference

<CodeBlock
  language="typescript"
  live={true}
  code={`
    interface User {
      id: string;
      name: string;
    }
  `}
/>
```

### 7. Format Conversion

Convert Markdown to other formats:

```bash
# Markdown to HTML
pandoc input.md -o output.html

# Markdown to PDF
pandoc input.md -o output.pdf --pdf-engine=xelatex

# Markdown to DOCX
pandoc input.md -o output.docx

# Markdown to RST
pandoc input.md -o output.rst -t rst
```

## MCP Server Integration

This skill is foundational and integrates with:

| Server | Description | Usage |
|--------|-------------|-------|
| All documentation MCP servers | Markdown is universal output | Rendering and validation |

## Best Practices

### Document Structure

```markdown
# Document Title

> Brief description or abstract

## Table of Contents

<!-- toc -->

## Introduction

Overview and context...

## Main Content

### Subsection 1

Content...

### Subsection 2

Content...

## Conclusion

Summary and next steps...

## References

- [Reference 1](url)
- [Reference 2](url)

## Appendix

Additional information...
```

### Markdown Style Guide

```yaml
style_rules:
  headings:
    - "Use ATX-style headings (#)"
    - "One H1 per document"
    - "Don't skip heading levels"

  lists:
    - "Use - for unordered lists"
    - "Use 1. for ordered lists"
    - "Indent with 2 spaces"

  code:
    - "Use fenced code blocks with language"
    - "Use inline code for short references"

  links:
    - "Use reference-style links for repeated URLs"
    - "Add meaningful link text"

  images:
    - "Always include alt text"
    - "Use relative paths for local images"
```

### Accessibility

```markdown
<!-- Good: Descriptive alt text -->
![System architecture diagram showing microservices connections](./architecture.png)

<!-- Good: Descriptive link text -->
See the [installation guide](./install.md) for setup instructions.

<!-- Bad: Non-descriptive -->
Click [here](./install.md).
```

## Process Integration

This skill integrates with ALL documentation-generating processes:
- `c4-model-documentation.js` - Architecture docs
- `adr-documentation.js` - Decision records
- `api-design-specification.js` - API documentation
- All other documentation processes

## Output Format

When processing documents, provide structured output:

```json
{
  "operation": "process",
  "status": "success",
  "document": {
    "path": "./docs/architecture.md",
    "title": "Architecture Overview",
    "wordCount": 1234,
    "headings": 15,
    "codeBlocks": 8,
    "diagrams": 3
  },
  "toc": {
    "generated": true,
    "items": 12,
    "maxDepth": 3
  },
  "links": {
    "total": 25,
    "internal": 18,
    "external": 7,
    "broken": 0
  },
  "frontmatter": {
    "valid": true,
    "fields": ["title", "date", "author", "tags"]
  },
  "diagrams": {
    "mermaid": 2,
    "plantuml": 1,
    "valid": true
  },
  "artifacts": ["architecture.md", "architecture.html"],
  "warnings": [
    "Line 45: Image missing alt text"
  ],
  "errors": []
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invalid frontmatter` | YAML syntax error | Fix YAML formatting |
| `Broken internal link` | File not found | Update link or create file |
| `Invalid diagram syntax` | Mermaid/PlantUML error | Fix diagram syntax |
| `Heading hierarchy` | Skipped heading level | Use sequential levels |

## Constraints

- Follow consistent Markdown style
- Validate all links before publishing
- Include frontmatter for metadata
- Use semantic heading hierarchy
- Provide alt text for images
