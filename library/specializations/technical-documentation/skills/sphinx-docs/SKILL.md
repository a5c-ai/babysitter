---
name: sphinx-docs
description: Sphinx documentation system expertise for technical and API documentation. Configure projects, autodoc for Python APIs, intersphinx for cross-project linking, extensions, and multiple output formats.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-004
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Sphinx Documentation Skill

Sphinx documentation system expertise for technical and API documentation.

## Capabilities

- Configure conf.py for various projects
- Write and manage reStructuredText (RST) content
- Configure autodoc for Python API documentation
- Set up intersphinx for cross-project linking
- Create and manage Sphinx extensions
- Generate multiple output formats (HTML, PDF, ePub)
- Theme configuration (Read the Docs, Furo)
- LaTeX and PDF customization

## Usage

Invoke this skill when you need to:
- Set up Sphinx documentation for Python projects
- Generate API documentation from docstrings
- Configure cross-project references
- Create custom extensions
- Generate PDF documentation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | init, configure, autodoc, build |
| projectPath | string | Yes | Path to Sphinx project |
| outputFormat | string | No | html, pdf, epub (default: html) |
| theme | string | No | sphinx_rtd_theme, furo, alabaster |
| extensions | array | No | Sphinx extensions to enable |

### Input Example

```json
{
  "action": "configure",
  "projectPath": "./docs",
  "theme": "furo",
  "extensions": ["autodoc", "napoleon", "intersphinx"]
}
```

## Project Configuration

### conf.py

```python
# Configuration file for the Sphinx documentation builder.

import os
import sys

# Add project root to path for autodoc
sys.path.insert(0, os.path.abspath('..'))

# -- Project information -----------------------------------------------------

project = 'My Project'
copyright = '2026, My Organization'
author = 'My Team'
version = '1.0'
release = '1.0.0'

# -- General configuration ---------------------------------------------------

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
    'sphinx.ext.mathjax',
    'sphinx_copybutton',
    'myst_parser',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# Source file suffixes
source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}

# Master document
master_doc = 'index'

# -- Options for HTML output -------------------------------------------------

html_theme = 'furo'
html_static_path = ['_static']
html_css_files = ['custom.css']

html_theme_options = {
    'light_css_variables': {
        'color-brand-primary': '#2980b9',
        'color-brand-content': '#2980b9',
    },
    'dark_css_variables': {
        'color-brand-primary': '#3498db',
        'color-brand-content': '#3498db',
    },
    'sidebar_hide_name': False,
    'navigation_with_keys': True,
}

# -- Options for autodoc -----------------------------------------------------

autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__',
    'show-inheritance': True,
}

autodoc_typehints = 'description'
autodoc_typehints_format = 'short'

# -- Options for Napoleon (Google/NumPy docstrings) --------------------------

napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = True
napoleon_use_admonition_for_notes = True
napoleon_use_admonition_for_references = True
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True
napoleon_use_keyword = True
napoleon_attr_annotations = True

# -- Options for intersphinx -------------------------------------------------

intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
    'numpy': ('https://numpy.org/doc/stable/', None),
    'pandas': ('https://pandas.pydata.org/docs/', None),
    'requests': ('https://requests.readthedocs.io/en/latest/', None),
}

# -- Options for autosummary -------------------------------------------------

autosummary_generate = True
autosummary_imported_members = True

# -- Options for todo --------------------------------------------------------

todo_include_todos = True

# -- Options for LaTeX/PDF output --------------------------------------------

latex_elements = {
    'papersize': 'letterpaper',
    'pointsize': '11pt',
    'preamble': r'''
        \usepackage{charter}
        \usepackage[defaultsans]{lato}
        \usepackage{inconsolata}
    ''',
}

latex_documents = [
    (master_doc, 'myproject.tex', 'My Project Documentation',
     'My Team', 'manual'),
]
```

## reStructuredText Patterns

### Document Structure

```rst
My Project Documentation
========================

Welcome to My Project's documentation.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   installation
   quickstart
   api/index
   changelog

Introduction
------------

This is the introduction to my project.

.. note::

   This is an important note.

.. warning::

   This is a warning message.

.. code-block:: python

   from myproject import Client

   client = Client(api_key="your-key")
   result = client.query("Hello")
```

### API Documentation

```rst
API Reference
=============

Client Module
-------------

.. automodule:: myproject.client
   :members:
   :undoc-members:
   :show-inheritance:

.. autoclass:: myproject.Client
   :members:
   :special-members: __init__

.. autofunction:: myproject.utils.helper

Autosummary
-----------

.. autosummary::
   :toctree: generated

   myproject.Client
   myproject.Config
   myproject.utils
```

### Cross-References

```rst
Cross-References
----------------

See :doc:`installation` for setup instructions.

Reference to :ref:`custom-label`.

Link to :class:`myproject.Client`.

Link to :meth:`myproject.Client.query`.

Link to :func:`myproject.utils.helper`.

External link to :py:class:`requests.Session`.

.. _custom-label:

Custom Section
--------------

This section has a custom label.
```

## Autodoc Configuration

### Python Docstrings (Google Style)

```python
class Client:
    """API client for My Service.

    This client provides methods to interact with the My Service API.

    Args:
        api_key: The API key for authentication.
        base_url: Base URL for API requests. Defaults to production.
        timeout: Request timeout in seconds.

    Attributes:
        session: The underlying HTTP session.

    Example:
        >>> client = Client(api_key="your-key")
        >>> result = client.query("Hello")
        >>> print(result.text)
        'Hello, World!'

    Note:
        The client automatically handles rate limiting.

    Raises:
        AuthenticationError: If the API key is invalid.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.example.com",
        timeout: int = 30
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout

    def query(self, text: str) -> Response:
        """Send a query to the API.

        Args:
            text: The query text to send.

        Returns:
            Response object containing the API response.

        Raises:
            APIError: If the API returns an error.
            TimeoutError: If the request times out.

        Example:
            >>> response = client.query("What is the weather?")
            >>> print(response.status)
            'success'
        """
        pass
```

## Themes

### Read the Docs Theme

```python
# conf.py
html_theme = 'sphinx_rtd_theme'

html_theme_options = {
    'navigation_depth': 4,
    'collapse_navigation': False,
    'sticky_navigation': True,
    'includehidden': True,
    'titles_only': False,
}
```

### Furo Theme

```python
# conf.py
html_theme = 'furo'

html_theme_options = {
    'light_logo': 'logo-light.png',
    'dark_logo': 'logo-dark.png',
    'sidebar_hide_name': True,
    'top_of_page_button': 'edit',
}
```

## MyST Parser (Markdown Support)

### conf.py Configuration

```python
extensions = [
    'myst_parser',
]

myst_enable_extensions = [
    'colon_fence',
    'deflist',
    'dollarmath',
    'fieldlist',
    'html_admonition',
    'html_image',
    'replacements',
    'smartquotes',
    'substitution',
    'tasklist',
]

myst_heading_anchors = 3
```

### MyST Markdown

```markdown
# My Document

:::{note}
This is a note using MyST syntax.
:::

:::{warning}
This is a warning.
:::

```{code-block} python
:linenos:
:emphasize-lines: 2

def hello():
    print("Hello, World!")
```

{ref}`custom-label`
```

## Workflow

1. **Initialize project** - Run sphinx-quickstart
2. **Configure** - Edit conf.py
3. **Write content** - Create RST/MD files
4. **Set up autodoc** - Configure API documentation
5. **Build** - Generate output
6. **Deploy** - Publish documentation

## Dependencies

```text
# requirements-docs.txt
sphinx>=7.0.0
sphinx-rtd-theme>=2.0.0
furo>=2024.1.0
sphinx-copybutton>=0.5.0
sphinx-autodoc-typehints>=2.0.0
myst-parser>=2.0.0
```

## CLI Commands

```bash
# Initialize project
sphinx-quickstart docs

# Build HTML
sphinx-build -b html docs docs/_build/html

# Build PDF (via LaTeX)
sphinx-build -b latex docs docs/_build/latex
cd docs/_build/latex && make

# Build with auto-reload
sphinx-autobuild docs docs/_build/html

# Check for broken links
sphinx-build -b linkcheck docs docs/_build/linkcheck
```

## Best Practices Applied

- Use Napoleon for Google/NumPy docstrings
- Enable intersphinx for cross-references
- Configure autodoc typehints
- Add viewcode for source links
- Use MyST for Markdown support
- Generate autosummary for API docs

## References

- Sphinx: https://www.sphinx-doc.org/
- Read the Docs Theme: https://sphinx-rtd-theme.readthedocs.io/
- Furo: https://pradyunsg.me/furo/
- MyST Parser: https://myst-parser.readthedocs.io/

## Target Processes

- api-doc-generation.js
- sdk-doc-generation.js
- docs-versioning.js
