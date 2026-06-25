---
title: Navigation Configuration
description: Sidebar and menu navigation structure for Babysitter documentation
category: config
last_updated: 2026-06-23
---

# Navigation Configuration

This document defines the navigation structure for the Babysitter User Guide documentation.

---

## Primary Navigation (Header)

```
+------------------------------------------------------------------------+
|  [Logo] Babysitter Docs                                                 |
+------------------------------------------------------------------------+
|  Home  |  Getting Started  |  Ecosystem  |  Architecture  |  Tutorials  |  Features  |  Harnesses  |  Reference  |  [Search]  |
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
    - title: Migration (Prod to v6)
      path: /getting-started/migration.md
    - title: Upgrade to v6
      path: /getting-started/upgrade-to-v6.md
```

### Tutorials

```yaml
- section: Tutorials
  path: /tutorials/
  items:
    - title: Tutorials Overview
      path: /tutorials/index.md
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

### Ecosystem

```yaml
- section: Ecosystem
  path: /ecosystem/
  items:
    - title: Ecosystem Overview
      path: /ecosystem/overview.md
    - title: babysitter-sdk (core engine)
      path: /ecosystem/babysitter-sdk.md
    - title: adapters (the family)
      path: /ecosystem/adapters.md
    - title: atlas (catalog & knowledge graph)
      path: /ecosystem/atlas.md
    - title: genty (agent runtime)
      path: /ecosystem/genty.md
    - title: observer-dashboard
      path: /ecosystem/observer-dashboard.md
    - title: kradle (K8s Git forge — MVP)
      path: /ecosystem/kradle.md
    - title: kip-sdk (memory substrate — spec only)
      path: /ecosystem/kip-sdk.md
```

### Architecture

```yaml
- section: Architecture
  path: /architecture.md
  items:
    - title: Architecture & How It Fits Together
      path: /architecture.md
```

### Features

```yaml
- section: Features
  path: /features/
  items:
    - title: Features Overview
      path: /features/index.md
    - title: Architecture Overview
      path: /features/architecture-overview.md
    - title: Two-Loops Architecture
      path: /features/two-loops-architecture.md
      highlight: true
    - title: Adapters
      path: /features/adapters.md
      highlight: true
    - title: Process Library
      path: /features/process-library.md
      highlight: true
    - title: Process Definitions
      path: /features/process-definitions.md
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
    - title: Journal System
      path: /features/journal-system.md
    - title: Run Resumption
      path: /features/run-resumption.md
    - title: Parallel Execution
      path: /features/parallel-execution.md
```

### Harnesses

```yaml
- section: Harnesses
  path: /harnesses/
  items:
    - title: Install Matrix
      path: /harnesses/install-matrix.md
    - title: Claude Code
      path: /harnesses/claude-code.md
    - title: Codex
      path: /harnesses/codex.md
```

### Reference

```yaml
- section: Reference
  path: /reference/
  items:
    - title: Reference Overview
      path: /reference/index.md
    - title: Adapter Types (all 20)
      path: /reference/adapter-types.md
    - title: Slash Commands
      path: /reference/slash-commands.md
      highlight: true
    - title: CLI Reference
      path: /reference/cli-reference.md
    - title: Adapters CLI
      path: /reference/adapters-cli.md
    - title: Configuration
      path: /reference/configuration.md
    - title: Security
      path: /reference/security.md
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
        "label": "Tutorials",
        "position": "left",
        "items": [
          { "label": "Tutorials Overview", "to": "/tutorials/" },
          { "label": "Build a REST API", "to": "/tutorials/beginner-rest-api" },
          { "label": "Custom Process", "to": "/tutorials/intermediate-custom-process" },
          { "label": "Multi-Phase Workflows", "to": "/tutorials/advanced-multi-phase" }
        ]
      },
      {
        "type": "dropdown",
        "label": "Ecosystem",
        "position": "left",
        "items": [
          { "label": "Ecosystem Overview", "to": "/ecosystem/overview" },
          { "label": "babysitter-sdk (core engine)", "to": "/ecosystem/babysitter-sdk" },
          { "label": "adapters (the family)", "to": "/ecosystem/adapters" },
          { "label": "atlas (catalog & knowledge graph)", "to": "/ecosystem/atlas" },
          { "label": "genty (agent runtime)", "to": "/ecosystem/genty" },
          { "label": "observer-dashboard", "to": "/ecosystem/observer-dashboard" },
          { "label": "kradle (K8s Git forge — MVP)", "to": "/ecosystem/kradle" },
          { "label": "kip-sdk (memory substrate — spec only)", "to": "/ecosystem/kip-sdk" }
        ]
      },
      {
        "type": "doc",
        "docId": "architecture",
        "position": "left",
        "label": "Architecture"
      },
      {
        "type": "dropdown",
        "label": "Features",
        "position": "left",
        "items": [
          { "label": "Features Overview", "to": "/features/" },
          { "label": "Architecture Overview", "to": "/features/architecture-overview" },
          { "label": "Two-Loops Architecture", "to": "/features/two-loops-architecture" },
          { "label": "Adapters", "to": "/features/adapters" },
          { "label": "Process Library", "to": "/features/process-library" },
          { "label": "Process Definitions", "to": "/features/process-definitions" },
          { "label": "Quality Convergence", "to": "/features/quality-convergence" },
          { "label": "Best Practices Guide", "to": "/features/best-practices" },
          { "label": "Breakpoints", "to": "/features/breakpoints" },
          { "label": "Hooks", "to": "/features/hooks" },
          { "label": "Journal System", "to": "/features/journal-system" },
          { "label": "Run Resumption", "to": "/features/run-resumption" },
          { "label": "Parallel Execution", "to": "/features/parallel-execution" }
        ]
      },
      {
        "type": "dropdown",
        "label": "Harnesses",
        "position": "left",
        "items": [
          { "label": "Install Matrix", "to": "/harnesses/install-matrix" },
          { "label": "Claude Code", "to": "/harnesses/claude-code" },
          { "label": "Codex", "to": "/harnesses/codex" }
        ]
      },
      {
        "type": "dropdown",
        "label": "Reference",
        "position": "left",
        "items": [
          { "label": "Reference Overview", "to": "/reference/" },
          { "label": "Adapter Types (all 20)", "to": "/reference/adapter-types" },
          { "label": "Slash Commands", "to": "/reference/slash-commands" },
          { "label": "CLI Reference", "to": "/reference/cli-reference" },
          { "label": "Adapters CLI", "to": "/reference/adapters-cli" },
          { "label": "Configuration", "to": "/reference/configuration" },
          { "label": "Security", "to": "/reference/security" },
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
          "getting-started/first-run",
          "getting-started/migration",
          "getting-started/upgrade-to-v6"
        ]
      },
      {
        "type": "category",
        "label": "Ecosystem",
        "collapsed": false,
        "items": [
          "ecosystem/overview",
          "ecosystem/babysitter-sdk",
          "ecosystem/adapters",
          "ecosystem/atlas",
          "ecosystem/genty",
          "ecosystem/observer-dashboard",
          "ecosystem/kradle",
          "ecosystem/kip-sdk"
        ]
      },
      {
        "type": "doc",
        "id": "architecture",
        "label": "Architecture"
      },
      {
        "type": "category",
        "label": "Tutorials",
        "collapsed": false,
        "link": { "type": "doc", "id": "tutorials/index" },
        "items": [
          "tutorials/beginner-rest-api",
          "tutorials/intermediate-custom-process",
          "tutorials/advanced-multi-phase"
        ]
      },
      {
        "type": "category",
        "label": "Features",
        "collapsed": false,
        "link": { "type": "doc", "id": "features/index" },
        "items": [
          "features/architecture-overview",
          "features/two-loops-architecture",
          "features/adapters",
          "features/process-library",
          "features/process-definitions",
          "features/quality-convergence",
          "features/best-practices",
          "features/breakpoints",
          "features/hooks",
          "features/journal-system",
          "features/run-resumption",
          "features/parallel-execution"
        ]
      },
      {
        "type": "category",
        "label": "Harnesses",
        "collapsed": false,
        "items": [
          "harnesses/install-matrix",
          "harnesses/claude-code",
          "harnesses/codex"
        ]
      },
      {
        "type": "category",
        "label": "Reference",
        "collapsed": false,
        "link": { "type": "doc", "id": "reference/index" },
        "items": [
          "reference/adapter-types",
          "reference/slash-commands",
          "reference/cli-reference",
          "reference/adapters-cli",
          "reference/configuration",
          "reference/security",
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
| Ecosystem            [>]  |
| Architecture              |
| Tutorials            [>]  |
| Features             [>]  |
| Harnesses            [>]  |
| Reference            [>]  |
+---------------------------+
| Quick Links               |
| - Installation            |
| - Ecosystem Overview      |
| - Architecture            |
| - CLI Reference           |
| - Glossary                |
+---------------------------+
```

---

## Footer Navigation

```
+-------------------------------------------------------------------------+
| Getting Started   | Ecosystem      | Features          | Reference      |
| - Installation    | - Overview     | - Two-Loops       | - CLI          |
| - Quickstart      | - Adapters     | - Adapters        | - Adapter Types|
| - First Run       | - genty        | - Quality Conv.   | - Config       |
| - Architecture    | - kradle       | - Breakpoints     | - Glossary     |
+-------------------------------------------------------------------------+
| Resources                                                                |
| GitHub | Issues | Discussions | Releases | Support                      |
+-------------------------------------------------------------------------+
```

---

## Breadcrumb Configuration

Every content page opens with a compact breadcrumb of the form `Docs › Section › Page`, rendered as Markdown links so it works on GitBook, Docusaurus, and plain GitHub. Examples:

| Page | Breadcrumb Path |
|------|-----------------|
| Home | `Docs` |
| Ecosystem Overview | `Docs › Ecosystem › Overview` |
| babysitter-sdk | `Docs › Ecosystem › babysitter-sdk` |
| Architecture | `Docs › Architecture` |
| Adapter Types | `Docs › Reference › Adapter Types` |
| Installation | `Docs › Getting Started › Installation` |
| Two-Loops Architecture | `Docs › Features › Two-Loops Architecture` |
| Process Library | `Docs › Features › Process Library` |
| Best Practices Guide | `Docs › Features › Best Practices Guide` |
| Breakpoints | `Docs › Features › Breakpoints` |
| Hooks | `Docs › Features › Hooks` |
| REST API Tutorial | `Docs › Tutorials › Build a REST API` |
| Install Matrix | `Docs › Harnesses › Install Matrix` |
| CLI Reference | `Docs › Reference › CLI Reference` |
| Security | `Docs › Reference › Security` |
| Glossary | `Docs › Reference › Glossary` |

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

## Versioning

The user guide currently tracks the current release only:

```json
{
  "versions": {
    "current": {
      "label": "v6 (5.1.0)",
      "path": "/docs/"
    }
  }
}
```

---

*Last updated: 2026-06-23*
