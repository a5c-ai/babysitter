# Sphinx Documentation Skill

Sphinx documentation system expertise for technical and API documentation.

## Overview

This skill provides comprehensive support for building documentation with Sphinx. It covers configuration, autodoc for Python APIs, reStructuredText authoring, themes, and multiple output formats including PDF.

## When to Use

- Setting up Python project documentation
- Generating API documentation from docstrings
- Cross-project references with intersphinx
- Creating PDF documentation
- Building scientific/technical documentation

## Quick Start

### Initialize Project

```bash
sphinx-quickstart docs
```

### Configure Autodoc

```python
# conf.py
extensions = ['sphinx.ext.autodoc', 'sphinx.ext.napoleon']
autodoc_default_options = {
    'members': True,
    'show-inheritance': True,
}
```

### Build Documentation

```bash
sphinx-build -b html docs docs/_build/html
```

## Key Features

### 1. Autodoc
- Extract docs from Python docstrings
- Google/NumPy style support
- Type hints integration

### 2. Intersphinx
- Cross-project references
- Link to Python docs
- External project linking

### 3. Multiple Outputs
- HTML (various themes)
- PDF via LaTeX
- ePub

### 4. Themes
- Read the Docs
- Furo
- Alabaster

## Configuration Example

```python
# conf.py
project = 'My Project'
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.intersphinx',
    'myst_parser',
]
html_theme = 'furo'
```

## reStructuredText Example

```rst
My Documentation
================

.. toctree::
   :maxdepth: 2

   installation
   api/index

.. automodule:: myproject
   :members:
```

## CLI Commands

```bash
# Build HTML
sphinx-build -b html docs docs/_build/html

# Build PDF
sphinx-build -b latex docs docs/_build/latex

# Auto-rebuild
sphinx-autobuild docs docs/_build/html

# Check links
sphinx-build -b linkcheck docs docs/_build/linkcheck
```

## Process Integration

| Process | Usage |
|---------|-------|
| `api-doc-generation.js` | Python API docs |
| `sdk-doc-generation.js` | SDK documentation |
| `docs-versioning.js` | Version management |

## Dependencies

- sphinx
- sphinx-rtd-theme or furo
- sphinx-autodoc-typehints
- myst-parser

## References

- [Sphinx](https://www.sphinx-doc.org/)
- [Read the Docs Theme](https://sphinx-rtd-theme.readthedocs.io/)
- [Furo Theme](https://pradyunsg.me/furo/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-004
**Category:** Documentation Site Generators
**Status:** Active
