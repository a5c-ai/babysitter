---
name: pdf-generation
description: Professional PDF documentation generation. Convert Markdown to PDF with custom templates, styling, table of contents, cross-references, and optimized output for print and archival.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-020
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# PDF Generation Skill

Professional PDF documentation generation.

## Capabilities

- Markdown to PDF conversion
- Custom PDF templates and styling
- Table of contents generation
- Cross-reference and link handling
- Image optimization for print
- PDF/A compliance for archival
- Multi-chapter document assembly
- Cover page and headers/footers

## Usage

Invoke this skill when you need to:
- Generate PDF documentation from Markdown
- Create printable user guides
- Archive documentation as PDF
- Produce branded PDF output
- Build multi-chapter manuals

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| inputPath | string | Yes | Path to Markdown source(s) |
| outputPath | string | Yes | Output PDF file path |
| template | string | No | Path to PDF template |
| config | object | No | PDF generation options |
| metadata | object | No | Document metadata |
| toc | boolean | No | Generate table of contents |

### Input Example

```json
{
  "inputPath": "./docs",
  "outputPath": "./output/documentation.pdf",
  "template": "./templates/manual.html",
  "toc": true,
  "metadata": {
    "title": "Product Documentation",
    "author": "Documentation Team",
    "version": "1.0.0"
  }
}
```

## Output Structure

### Single PDF Output

```
output/
└── documentation.pdf
    ├── Cover page
    ├── Table of Contents
    ├── Chapter 1: Getting Started
    │   ├── Installation
    │   └── Quick Start
    ├── Chapter 2: User Guide
    │   ├── Configuration
    │   └── Features
    ├── Chapter 3: API Reference
    └── Appendix
```

### Multi-PDF Output

```
output/
├── getting-started.pdf
├── user-guide.pdf
├── api-reference.pdf
└── complete-manual.pdf
```

## Pandoc Configuration

### pandoc-defaults.yaml

```yaml
from: markdown+smart+yaml_metadata_block+implicit_figures+table_captions
to: pdf
pdf-engine: xelatex

variables:
  documentclass: report
  papersize: letter
  fontsize: 11pt
  geometry:
    - margin=1in
    - top=1.25in
    - bottom=1.25in
  mainfont: "Source Serif Pro"
  sansfont: "Source Sans Pro"
  monofont: "Source Code Pro"
  linkcolor: blue
  urlcolor: blue
  toccolor: black
  toc-depth: 3

include-before-body:
  - cover.tex

include-in-header:
  - preamble.tex

metadata:
  title: "Documentation"
  author: "Documentation Team"
  date: "2026-01-24"
  lang: en-US

toc: true
toc-title: "Table of Contents"
number-sections: true
colorlinks: true
highlight-style: pygments
```

### LaTeX Preamble (preamble.tex)

```latex
% Custom styling
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage{xcolor}
\usepackage{listings}
\usepackage{graphicx}

% Header/Footer
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\leftmark}
\fancyhead[R]{\thepage}
\fancyfoot[C]{\small Documentation v1.0}

% Code block styling
\lstset{
    basicstyle=\ttfamily\small,
    breaklines=true,
    frame=single,
    backgroundcolor=\color{gray!10}
}

% Heading styles
\titleformat{\chapter}[display]
  {\normalfont\huge\bfseries}
  {\chaptertitlename\ \thechapter}{20pt}{\Huge}

% Link colors
\definecolor{linkblue}{RGB}{0,102,204}
```

## WeasyPrint Configuration

### weasyprint-config.css

```css
@page {
    size: letter;
    margin: 1in;
    margin-top: 1.25in;
    margin-bottom: 1.25in;

    @top-center {
        content: string(chapter-title);
        font-size: 10pt;
        color: #666;
    }

    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
    }
}

@page :first {
    @top-center { content: none; }
    @bottom-center { content: none; }
}

/* Cover page */
.cover {
    page: cover;
    text-align: center;
    padding-top: 3in;
}

.cover h1 {
    font-size: 36pt;
    color: #333;
}

.cover .version {
    font-size: 14pt;
    color: #666;
    margin-top: 1in;
}

/* Table of contents */
#toc {
    page-break-after: always;
}

#toc h2 {
    font-size: 24pt;
    margin-bottom: 0.5in;
}

#toc a {
    text-decoration: none;
    color: inherit;
}

#toc a::after {
    content: leader('.') target-counter(attr(href), page);
}

/* Chapters */
h1 {
    string-set: chapter-title content();
    page-break-before: always;
    font-size: 28pt;
    border-bottom: 2px solid #333;
    padding-bottom: 0.25in;
}

h2 { font-size: 20pt; margin-top: 0.5in; }
h3 { font-size: 16pt; margin-top: 0.3in; }

/* Code blocks */
pre {
    background-color: #f5f5f5;
    padding: 0.5em;
    border-radius: 4px;
    font-size: 9pt;
    overflow-x: auto;
    page-break-inside: avoid;
}

code {
    font-family: "Source Code Pro", monospace;
    background-color: #f0f0f0;
    padding: 0.1em 0.3em;
    border-radius: 3px;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    page-break-inside: avoid;
}

th, td {
    border: 1px solid #ddd;
    padding: 0.5em;
    text-align: left;
}

th {
    background-color: #f5f5f5;
    font-weight: bold;
}

/* Images */
img {
    max-width: 100%;
    height: auto;
}

figure {
    text-align: center;
    page-break-inside: avoid;
}

figcaption {
    font-style: italic;
    color: #666;
    margin-top: 0.5em;
}

/* Links */
a {
    color: #0066cc;
    text-decoration: none;
}

/* Print optimizations */
@media print {
    a[href^="http"]::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
    }
}
```

## Cover Page Template

### cover.html

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: "Source Sans Pro", sans-serif;
            text-align: center;
            padding-top: 200px;
        }
        .logo {
            max-width: 200px;
            margin-bottom: 50px;
        }
        h1 {
            font-size: 48px;
            color: #333;
            margin-bottom: 20px;
        }
        .subtitle {
            font-size: 24px;
            color: #666;
            margin-bottom: 100px;
        }
        .version {
            font-size: 18px;
            color: #999;
        }
        .date {
            font-size: 14px;
            color: #999;
            margin-top: 10px;
        }
        .footer {
            position: absolute;
            bottom: 50px;
            width: 100%;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <img src="logo.png" alt="Company Logo" class="logo">
    <h1>{{title}}</h1>
    <p class="subtitle">{{subtitle}}</p>
    <p class="version">Version {{version}}</p>
    <p class="date">{{date}}</p>
    <div class="footer">
        <p>{{company}}</p>
        <p>Confidential</p>
    </div>
</body>
</html>
```

## Multi-Chapter Assembly

### build-manual.js

```javascript
const pandoc = require('pandoc');
const fs = require('fs');
const path = require('path');

async function buildManual(config) {
  const chapters = [
    { title: 'Getting Started', files: ['intro.md', 'installation.md', 'quickstart.md'] },
    { title: 'User Guide', files: ['configuration.md', 'features.md', 'advanced.md'] },
    { title: 'API Reference', files: ['api/*.md'] },
    { title: 'Appendix', files: ['glossary.md', 'changelog.md'] }
  ];

  // Combine all Markdown files
  let combined = '';

  for (const chapter of chapters) {
    combined += `# ${chapter.title}\n\n`;

    for (const filePattern of chapter.files) {
      const files = glob.sync(filePattern, { cwd: config.docsDir });
      for (const file of files) {
        const content = fs.readFileSync(path.join(config.docsDir, file), 'utf8');
        // Adjust heading levels
        const adjusted = adjustHeadings(content, 1);
        combined += adjusted + '\n\n';
      }
    }
  }

  // Write combined file
  const tempFile = '/tmp/combined.md';
  fs.writeFileSync(tempFile, combined);

  // Run Pandoc
  await pandoc({
    input: tempFile,
    output: config.outputPath,
    args: [
      '--defaults', config.pandocDefaults,
      '--metadata-file', config.metadataFile
    ]
  });

  return { output: config.outputPath };
}
```

## PDF/A Compliance

### Generate Archival PDF

```bash
# Using Pandoc with PDF/A output
pandoc input.md \
  -o output.pdf \
  --pdf-engine=xelatex \
  -V 'pdfa=1b' \
  --include-in-header=pdfa-header.tex

# pdfa-header.tex
\usepackage{hyperref}
\hypersetup{
    pdfstartview=,
    colorlinks=false,
    pdfpagelayout=SinglePage
}
\usepackage[a-1b]{pdfx}
```

## Workflow

1. **Collect sources** - Gather Markdown files
2. **Preprocess** - Handle includes and variables
3. **Convert** - Transform Markdown to intermediate format
4. **Apply template** - Add styling and structure
5. **Generate TOC** - Build table of contents
6. **Render PDF** - Output final PDF
7. **Optimize** - Compress images and fonts

## Dependencies

```json
{
  "devDependencies": {
    "pandoc": "^0.2.0",
    "weasyprint": "via pip",
    "puppeteer": "^21.0.0",
    "pdf-lib": "^1.17.0"
  }
}
```

### System Dependencies

```bash
# macOS
brew install pandoc
brew install --cask basictex
pip install weasyprint

# Ubuntu
sudo apt install pandoc texlive-xetex texlive-fonts-recommended
pip install weasyprint

# Windows (via Chocolatey)
choco install pandoc miktex
pip install weasyprint
```

## CLI Commands

```bash
# Single file with Pandoc
pandoc input.md -o output.pdf --defaults pandoc-defaults.yaml

# Multiple files combined
pandoc docs/*.md -o manual.pdf --toc --number-sections

# Using WeasyPrint
weasyprint input.html output.pdf -s style.css

# Using Puppeteer (for HTML-based PDFs)
node generate-pdf.js --input docs/ --output manual.pdf
```

## Best Practices Applied

- Use vector graphics when possible
- Optimize images for print (300 DPI)
- Include page numbers and headers
- Generate hyperlinked TOC
- Handle page breaks for code blocks
- Embed fonts for consistency
- Test on different PDF readers

## References

- Pandoc: https://pandoc.org/
- WeasyPrint: https://weasyprint.org/
- LaTeX: https://www.latex-project.org/
- PDF/A: https://www.pdfa.org/

## Target Processes

- docs-versioning.js
- user-guide-docs.js
- runbook-docs.js
- adr-docs.js
