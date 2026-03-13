# PDF Generation Skill

Professional PDF documentation generation.

## Overview

This skill provides comprehensive PDF generation capabilities for documentation, including Markdown to PDF conversion, custom templates, table of contents, professional styling, and PDF/A compliance for archival purposes.

## When to Use

- Generating PDF documentation from Markdown
- Creating printable user guides and manuals
- Archiving documentation as PDF/A
- Producing branded, professional PDF output
- Building multi-chapter documents

## Quick Start

### Generate PDF

```json
{
  "inputPath": "./docs",
  "outputPath": "./output/documentation.pdf",
  "toc": true,
  "metadata": {
    "title": "Product Documentation",
    "version": "1.0.0"
  }
}
```

### With Custom Template

```json
{
  "inputPath": "./docs",
  "outputPath": "./output/manual.pdf",
  "template": "./templates/manual.html",
  "config": {
    "paperSize": "letter",
    "margins": "1in"
  }
}
```

## Key Features

### 1. Conversion
- Markdown to PDF
- HTML to PDF
- Multiple input files

### 2. Styling
- Custom CSS/LaTeX templates
- Professional typography
- Code syntax highlighting

### 3. Structure
- Auto-generated TOC
- Chapter/section numbering
- Cross-references

### 4. Output Options
- Standard PDF
- PDF/A for archival
- Print-optimized

## Tools Supported

| Tool | Best For |
|------|----------|
| Pandoc | Flexible conversion, LaTeX quality |
| WeasyPrint | CSS-based styling |
| Puppeteer | Complex HTML layouts |
| Prince | Professional publishing |

## Configuration Example

### Pandoc (pandoc-defaults.yaml)

```yaml
from: markdown+smart
to: pdf
pdf-engine: xelatex
toc: true
number-sections: true
variables:
  documentclass: report
  papersize: letter
  fontsize: 11pt
```

### WeasyPrint CSS

```css
@page {
    size: letter;
    margin: 1in;
    @bottom-center {
        content: counter(page);
    }
}
```

## CLI Commands

```bash
# Pandoc
pandoc docs/*.md -o manual.pdf --toc

# WeasyPrint
weasyprint input.html output.pdf -s style.css

# Multi-chapter manual
pandoc intro.md guide.md api.md -o complete.pdf --toc
```

## Output Quality

| Feature | Pandoc/LaTeX | WeasyPrint |
|---------|--------------|------------|
| Typography | Excellent | Good |
| Code blocks | Excellent | Good |
| Tables | Good | Excellent |
| Complex layouts | Good | Excellent |
| File size | Smaller | Larger |

## Process Integration

| Process | Usage |
|---------|-------|
| `docs-versioning.js` | Versioned PDF releases |
| `user-guide-docs.js` | User manuals |
| `runbook-docs.js` | Printable runbooks |
| `adr-docs.js` | ADR archives |

## Dependencies

System:
- Pandoc
- LaTeX (TeX Live or MiKTeX)
- WeasyPrint (Python)

## References

- [Pandoc](https://pandoc.org/)
- [WeasyPrint](https://weasyprint.org/)
- [LaTeX](https://www.latex-project.org/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-020
**Category:** Output Formats
**Status:** Active
