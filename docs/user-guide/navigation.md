---
title: Navigation Configuration
description: Sidebar and menu navigation structure for Babysitter documentation
category: config
last_updated: 2026-01-25
---

# Navigation Configuration

This document defines the navigation structure for the Babysitter User Guide documentation.

---

## Primary Navigation (Header)

```
+------------------------------------------------------------------------+
|  [Logo] Babysitter Docs                                                 |
+------------------------------------------------------------------------+
|  Home  |  Getting Started  |  Features  |  Tutorials  |  Reference  |  [Search]  |
+------------------------------------------------------------------------+
```

---

## Sidebar Navigation

### Getting Started

```yaml
- section: Getting Started
  path: /getting-started/
  items:
    - title: Overview
      path: /getting-started/README.md
    - title: Installation
      path: /getting-started/installation.md
    - title: Quickstart
      path: /getting-started/quickstart.md
    - title: First Run
      path: /getting-started/first-run.md
```

### Features

```yaml
- section: Features
  path: /features/
  items:
    - title: Process Library
      path: /features/process-library.md
      highlight: true
    - title: Two-Loops Architecture
      path: /features/two-loops-architecture.md
      highlight: true
    - title: Quality Convergence
      path: /features/quality-convergence.md
      highlight: true
    - title: Best Practices Guide
      path: /features/best-practices.md
      highlight: true
    - title: Breakpoints
      path: /features/breakpoints.md
    - title: Hooks
      path: /features/hooks.md
    - title: Process Definitions
      path: /features/process-definitions.md
    - title: Journal System
      path: /features/journal-system.md
    - title: Run Resumption
      path: /features/run-resumption.md
    - title: Parallel Execution
      path: /features/parallel-execution.md
```

### Tutorials

```yaml
- section: Tutorials
  path: /tutorials/
  items:
    - title: Build a REST API
      path: /tutorials/beginner-rest-api.md
      level: beginner
    - title: Custom Process
      path: /tutorials/intermediate-custom-process.md
      level: intermediate
    - title: Multi-Phase Workflows
      path: /tutorials/advanced-multi-phase.md
      level: advanced
```

### Reference

```yaml
- section: Reference
  path: /reference/
  items:
    - title: CLI Reference
      path: /reference/cli-reference.md
    - title: Configuration
      path: /reference/configuration.md
    - title: Error Catalog
      path: /reference/error-catalog.md
    - title: Glossary
      path: /reference/glossary.md
    - title: FAQ
      path: /reference/faq.md
    - title: Troubleshooting
      path: /reference/troubleshooting.md
```

---

## Navigation JSON Configuration

For documentation platforms that use JSON configuration (e.g., Docusaurus, VitePress):

```json
{
  "navbar": {
    "title": "Babysitter Docs",
    "logo": {
      "alt": "Babysitter Logo",
      "src": "img/logo.svg"
    },
    "items": [
      {
        "type": "doc",
        "docId": "index",
        "position": "left",
        "label": "Home"
      },
      {
        "type": "doc",
        "docId": "getting-started/README",
        "position": "left",
        "label": "Getting Started"
      },
      {
        "type": "dropdown",
        "label": "Features",
        "position": "left",
        "items": [
          { "label": "Process Library", "to": "/features/process-library" },
          { "label": "Best Practices Guide", "to": "/features/best-practices" },
          { "label": "Breakpoints", "to": "/features/breakpoints" },
          { "label": "Hooks", "to": "/features/hooks" },
          { "label": "Quality Convergence", "to": "/features/quality-convergence" },
          { "label": "Process Definitions", "to": "/features/process-definitions" },
          { "label": "Journal System", "to": "/features/journal-system" },
          { "label": "Run Resumption", "to": "/features/run-resumption" },
          { "label": "Parallel Execution", "to": "/features/parallel-execution" }
        ]
      },
      {
        "type": "dropdown",
        "label": "Tutorials",
        "position": "left",
        "items": [
          { "label": "Build a REST API", "to": "/tutorials/beginner-rest-api" },
          { "label": "Custom Process", "to": "/tutorials/intermediate-custom-process" },
          { "label": "Multi-Phase Workflows", "to": "/tutorials/advanced-multi-phase" }
        ]
      },
      {
        "type": "dropdown",
        "label": "Reference",
        "position": "left",
        "items": [
          { "label": "CLI Reference", "to": "/reference/cli-reference" },
          { "label": "Configuration", "to": "/reference/configuration" },
          { "label": "Error Catalog", "to": "/reference/error-catalog" },
          { "label": "Glossary", "to": "/reference/glossary" },
          { "label": "FAQ", "to": "/reference/faq" },
          { "label": "Troubleshooting", "to": "/reference/troubleshooting" }
        ]
      },
      {
        "type": "search",
        "position": "right"
      }
    ]
  },
  "sidebar": {
    "docs": [
      {
        "type": "doc",
        "id": "index",
        "label": "Home"
      },
      {
        "type": "category",
        "label": "Getting Started",
        "collapsed": false,
        "items": [
          "getting-started/README",
          "getting-started/installation",
          "getting-started/quickstart",
          "getting-started/first-run"
        ]
      },
      {
        "type": "category",
        "label": "Features",
        "collapsed": false,
        "items": [
          "features/process-library",
          "features/best-practices",
          "features/breakpoints",
          "features/hooks",
          "features/quality-convergence",
          "features/process-definitions",
          "features/journal-system",
          "features/run-resumption",
          "features/parallel-execution"
        ]
      },
      {
        "type": "category",
        "label": "Tutorials",
        "collapsed": false,
        "items": [
          "tutorials/beginner-rest-api",
          "tutorials/intermediate-custom-process",
          "tutorials/advanced-multi-phase"
        ]
      },
      {
        "type": "category",
        "label": "Reference",
        "collapsed": false,
        "items": [
          "reference/cli-reference",
          "reference/configuration",
          "reference/error-catalog",
          "reference/glossary",
          "reference/faq",
          "reference/troubleshooting"
        ]
      }
    ]
  }
}
```

---

## Mobile Navigation

```
+---------------------------+
| [Hamburger] Babysitter    |
+---------------------------+
| [Search icon]             |
+---------------------------+

[Hamburger expanded:]
+---------------------------+
| Home                      |
| Getting Started      [>]  |
| Features             [>]  |
| Tutorials            [>]  |
| Reference            [>]  |
+---------------------------+
| Quick Links               |
| - Installation            |
| - CLI Reference           |
| - Glossary                |
+---------------------------+
```

---

## Footer Navigation

```
+-------------------------------------------------------------------------+
| Getting Started   | Features          | Tutorials      | Reference      |
| - Installation    | - Breakpoints     | - REST API     | - CLI          |
| - Quickstart      | - Hooks           | - Custom Proc. | - Config       |
| - First Run       | - Quality Conv.   | - Multi-Phase  | - Errors       |
|                   | - Processes       |                | - Glossary     |
+-------------------------------------------------------------------------+
| Resources                                                                |
| GitHub | Issues | Discussions | Releases | Support                      |
+-------------------------------------------------------------------------+
```

---

## Breadcrumb Configuration

| Page | Breadcrumb Path |
|------|-----------------|
| Home | `Docs` |
| Installation | `Docs > Getting Started > Installation` |
| Process Library | `Docs > Features > Process Library` |
| Best Practices Guide | `Docs > Features > Best Practices Guide` |
| Breakpoints | `Docs > Features > Breakpoints` |
| Hooks | `Docs > Features > Hooks` |
| REST API Tutorial | `Docs > Tutorials > Build a REST API` |
| CLI Reference | `Docs > Reference > CLI Reference` |
| Glossary | `Docs > Reference > Glossary` |

---

## Quick Access Links

### Pinned Pages

1. [Installation](./getting-started/installation.md) - Get started quickly
2. [CLI Reference](./reference/cli-reference.md) - Command lookup
3. [Troubleshooting](./reference/troubleshooting.md) - Fix common issues
4. [Glossary](./reference/glossary.md) - Understand terminology

### Most Visited (Analytics-Based)

Configure based on actual usage data:
- Getting Started
- First Run
- Breakpoints
- CLI Reference

---

## Search Configuration

```json
{
  "search": {
    "provider": "algolia",
    "options": {
      "indexName": "babysitter-docs",
      "facetFilters": [
        "category:tutorials",
        "category:features",
        "category:reference",
        "level:beginner",
        "level:intermediate",
        "level:advanced"
      ],
      "searchParameters": {
        "hitsPerPage": 10,
        "attributesToSnippet": ["content:50"],
        "snippetEllipsisText": "..."
      }
    },
    "placeholders": {
      "default": "Search documentation...",
      "mobile": "Search..."
    },
    "shortcuts": {
      "open": ["ctrl+k", "cmd+k"],
      "close": ["esc"]
    }
  }
}
```

---

## Version Selector

For multi-version documentation:

```json
{
  "versions": {
    "current": {
      "label": "0.0.123 (Latest)",
      "path": "/docs/"
    },
    "archived": [
      {
        "label": "0.0.122",
        "path": "/docs/0.0.122/"
      },
      {
        "label": "0.0.121",
        "path": "/docs/0.0.121/"
      }
    ]
  }
}
```

---

*Last updated: 2026-01-25*
