---
name: diataxis-doc-generator
description: Generate documentation following the Diataxis framework
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Diataxis Documentation Generator Skill

## Overview

This skill generates comprehensive documentation following the Diataxis framework, organizing content into tutorials, how-to guides, reference, and explanation categories for optimal developer learning.

## Capabilities

- Structure documentation as tutorials, how-to guides, reference, explanation
- Generate progressive getting started guides
- Create interactive API reference documentation
- Build code example repositories with multiple languages
- Implement documentation versioning
- Configure search and navigation
- Generate documentation from code comments
- Support multiple documentation platforms

## Target Processes

- API Documentation System
- SDK Onboarding and Tutorials
- Developer Experience Optimization

## Integration Points

- Docusaurus for React-based docs
- ReadTheDocs for Python projects
- Mintlify for modern documentation
- GitBook for collaborative docs
- MDX for interactive components

## Input Requirements

- API specification or source code
- Target audience profiles
- Documentation platform preference
- Branding and style guidelines
- Code example requirements

## Output Artifacts

- Structured documentation site
- Tutorial sequences
- How-to guide collection
- API reference pages
- Explanation articles
- Code examples repository
- Navigation configuration

## Usage Example

```yaml
skill:
  name: diataxis-doc-generator
  context:
    apiSpec: ./openapi.yaml
    platform: docusaurus
    languages:
      - javascript
      - python
      - curl
    includePlayground: true
    versioning: true
```

## Best Practices

1. Separate learning-oriented from task-oriented content
2. Keep tutorials focused on learning, not completeness
3. Make how-to guides goal-oriented
4. Ensure reference is accurate and complete
5. Write explanations to deepen understanding
6. Include runnable code examples
