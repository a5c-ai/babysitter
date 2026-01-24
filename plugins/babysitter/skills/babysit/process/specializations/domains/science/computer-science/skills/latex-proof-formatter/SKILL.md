---
name: latex-proof-formatter
description: Format proofs and algorithms in publication-quality LaTeX
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: research-documentation
  domain: computer-science
  tools:
    - LaTeX
    - Overleaf
    - algorithmicx
  processes:
    - theoretical-cs-paper-development
---

# LaTeX Proof Formatter Skill

## Purpose

Provides publication-quality LaTeX formatting for proofs, algorithms, and theoretical computer science papers.

## Capabilities

- **Algorithm Formatting**: Format pseudocode with algorithmicx
- **Inference Rules**: Typeset inference rules
- **Proof Environments**: Format structured proofs
- **Cross-References**: Manage theorem numbering and references
- **BibTeX Integration**: Handle citations properly

## Usage Guidelines

1. **Document Setup**
   - Configure document class
   - Include appropriate packages
   - Define custom commands

2. **Algorithm Formatting**
   - Use algorithm2e or algorithmicx
   - Maintain consistent style
   - Include line numbers

3. **Proof Writing**
   - Use theorem environments
   - Structure proofs clearly
   - Add appropriate labels

4. **Best Practices**
   - Follow venue style guidelines
   - Use semantic markup
   - Maintain consistent notation
   - Keep source readable
