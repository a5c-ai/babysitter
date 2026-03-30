# Markdown Processor Skill

## Overview

The `markdown-processor` skill provides specialized capabilities for processing Markdown and MDX documentation. It's a foundational skill used by all documentation-generating processes.

## Quick Start

### Prerequisites

1. **Node.js** (v18+) - For tooling
2. **Optional Tools** - remark, unified, markdown-it, pandoc

### Installation

The skill is included in the babysitter-sdk. For enhanced capabilities:

```bash
# Install remark ecosystem
npm install remark remark-parse remark-stringify remark-gfm

# Install markdown-link-check
npm install -g markdown-link-check

# Install pandoc (macOS)
brew install pandoc
```

## Usage

### Basic Operations

```bash
# Generate table of contents
/skill markdown-processor toc \
  --input ./docs/guide.md \
  --insert

# Validate links
/skill markdown-processor validate-links \
  --directory ./docs \
  --recursive

# Process frontmatter
/skill markdown-processor frontmatter \
  --input ./docs/article.md \
  --validate-schema ./schemas/frontmatter.json

# Convert format
/skill markdown-processor convert \
  --input ./docs/guide.md \
  --output ./dist/guide.html \
  --format html
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(markdownTask, {
  operation: 'validate',
  inputPath: './docs',
  recursive: true,
  checks: ['links', 'frontmatter', 'diagrams', 'style']
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Parsing** | Parse Markdown to AST |
| **TOC Generation** | Auto-generate table of contents |
| **Link Validation** | Check internal and external links |
| **Frontmatter** | Parse and validate YAML/TOML |
| **Diagrams** | Embed Mermaid, PlantUML |
| **MDX Support** | Process MDX with React components |
| **Conversion** | Convert to HTML, PDF, DOCX |

## Examples

### Example 1: Full Document Validation

```bash
/skill markdown-processor validate \
  --directory ./docs \
  --recursive \
  --checks links,frontmatter,style,headings \
  --report ./reports/docs-validation.json
```

### Example 2: Generate Documentation Site

```bash
/skill markdown-processor build \
  --source ./docs \
  --output ./dist \
  --format html \
  --toc \
  --syntax-highlight
```

### Example 3: Batch Frontmatter Update

```bash
/skill markdown-processor update-frontmatter \
  --directory ./docs \
  --set "status=published" \
  --set "date=$(date +%Y-%m-%d)"
```

### Example 4: Link Report

```bash
/skill markdown-processor link-report \
  --directory ./docs \
  --recursive \
  --include-external \
  --output ./reports/links.json
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MARKDOWN_STYLE` | Style guide preset | `default` |
| `LINK_CHECK_TIMEOUT` | External link timeout | `5000` |
| `PANDOC_PATH` | Path to pandoc | `pandoc` |

### Skill Configuration

```yaml
# .babysitter/skills/markdown-processor.yaml
markdown-processor:
  style:
    preset: google  # google, microsoft, custom
    rules:
      headingStyle: atx
      listIndent: 2
      codeBlockStyle: fenced
  toc:
    maxDepth: 3
    marker: "<!-- toc -->"
    bulletChar: "-"
  links:
    checkExternal: true
    timeout: 5000
    ignorePatterns:
      - "localhost"
      - "example.com"
  frontmatter:
    required: [title, date]
    optional: [author, tags, status]
  diagrams:
    mermaid: true
    plantuml: true
    renderOnBuild: true
```

### Custom Style Rules

```yaml
# .markdownlint.yaml
default: true
MD001: true  # heading levels should only increment by one level at a time
MD003:
  style: atx  # ATX-style headings
MD004:
  style: dash  # Unordered list style
MD007:
  indent: 2  # List indent
MD013:
  line_length: 120
  tables: false
MD033:
  allowed_elements: [details, summary, div]
```

## Process Integration

### Processes Using This Skill

This skill is used by ALL 20 documentation-generating processes:

| Process Category | Processes |
|-----------------|-----------|
| Architecture | c4-model-documentation, system-design-review |
| Decision | adr-documentation, tech-stack-evaluation |
| API | api-design-specification |
| Domain | ddd-strategic-modeling, event-storming |
| All others | Every process that outputs documentation |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const processMarkdownTask = defineTask({
  name: 'process-markdown',
  description: 'Process and validate Markdown documentation',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Process Markdown: ${inputs.path}`,
      skill: {
        name: 'markdown-processor',
        context: {
          operation: inputs.operation,
          inputPath: inputs.path,
          recursive: inputs.recursive || false,
          checks: inputs.checks || ['links', 'frontmatter'],
          outputFormat: inputs.outputFormat,
          outputPath: inputs.outputPath
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Markdown Extensions

### GitHub Flavored Markdown (GFM)

```markdown
## GFM Features

### Tables

| Feature | Supported |
|---------|-----------|
| Tables | Yes |
| Task lists | Yes |

### Task Lists

- [x] Completed task
- [ ] Pending task

### Autolinks

https://example.com is automatically linked.

### Strikethrough

~~This text is struck through.~~

### Footnotes

Here is a footnote reference[^1].

[^1]: This is the footnote.
```

### Extended Features

```markdown
## Extended Markdown

### Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2

### Abbreviations

The HTML specification is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

### Admonitions

:::note
This is a note admonition.
:::

:::warning
This is a warning admonition.
:::
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Invalid frontmatter` | Check YAML syntax |
| `TOC not updating` | Check marker placement |
| `External link timeout` | Increase timeout or skip |
| `Diagram not rendering` | Validate diagram syntax |

### Debug Mode

```bash
DEBUG=markdown-processor /skill markdown-processor validate \
  --input ./docs/guide.md \
  --verbose
```

## Related Skills

- **tech-writing-linter** - Documentation quality checks
- **docs-site-generator** - Documentation site building
- **c4-diagram-generator** - Architecture diagrams

## References

- [CommonMark Spec](https://commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [remark](https://remark.js.org/)
- [MDX](https://mdxjs.com/)
- [Pandoc](https://pandoc.org/)
- [markdownlint](https://github.com/DavidAnson/markdownlint)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SA-004
**Category:** Documentation
**Status:** Active
