# MkDocs/Material Skill

MkDocs with Material theme expertise for Python-centric documentation.

## Overview

This skill provides comprehensive support for building documentation sites with MkDocs and the Material theme. It covers configuration, plugins, admonitions, versioning, internationalization, and advanced Material features.

## When to Use

- Setting up Python project documentation
- Configuring Material theme features
- Adding MkDocs plugins
- Setting up versioning with mike
- Enabling multi-language support

## Quick Start

### Initialize Project

```bash
mkdocs new my-docs
cd my-docs
pip install mkdocs-material
```

### Configure Material Theme

```yaml
# mkdocs.yml
site_name: My Documentation
theme:
  name: material
  features:
    - navigation.tabs
    - search.highlight
    - content.code.copy
```

## Key Features

### 1. Material Theme
- Dark/light mode
- Navigation features
- Search enhancements

### 2. Admonitions
- Notes, warnings, tips
- Collapsible blocks
- Custom admonitions

### 3. Code Features
- Syntax highlighting
- Code annotations
- Copy button

### 4. Versioning
- mike integration
- Version dropdown
- Alias support

### 5. Plugins
- Search, macros, mermaid
- PDF export
- Git revision dates

## Configuration Example

```yaml
# mkdocs.yml
site_name: My Docs
theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
  features:
    - navigation.instant
    - content.code.copy

plugins:
  - search
  - mermaid2

markdown_extensions:
  - admonition
  - pymdownx.superfences
  - pymdownx.tabbed
```

## Admonition Examples

```markdown
!!! note "Important"
    This is a note.

!!! warning
    This is a warning.

??? example "Collapsible"
    Hidden by default.
```

## CLI Commands

```bash
# Serve locally
mkdocs serve

# Build site
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy

# Version with mike
mike deploy --push 1.0 latest
```

## Process Integration

| Process | Usage |
|---------|-------|
| `docs-as-code-pipeline.js` | CI/CD setup |
| `docs-versioning.js` | mike versioning |
| `knowledge-base-setup.js` | Site structure |
| `how-to-guides.js` | Guide templates |

## Dependencies

- mkdocs
- mkdocs-material
- mkdocs-material-extensions
- mike (versioning)

## References

- [MkDocs](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [mike](https://github.com/jimporter/mike)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-003
**Category:** Documentation Site Generators
**Status:** Active
