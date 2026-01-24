---
name: synthesis-specification-language
description: Define specifications for program synthesis using examples, logical constraints, and sketches
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
  category: program-synthesis
  domain: computer-science
  tools:
    - SyGuS format
    - Sketch
    - Synthesis tools
  processes:
    - program-synthesis-specification
---

# Synthesis Specification Language Skill

## Purpose

Provides specification language capabilities for defining program synthesis problems through various specification methods.

## Capabilities

- **I/O Examples**: Specify behavior through input-output examples
- **Logical Specification**: Define pre and post conditions
- **Sketch Specification**: Use sketches with holes
- **Natural Language**: Translate natural language to specs
- **Specification Validation**: Validate specification consistency

## Usage Guidelines

1. **Specification Method Selection**
   - Use examples for simple behaviors
   - Use logic for complete specs
   - Use sketches for partial programs

2. **Specification Writing**
   - Ensure specification is complete
   - Check for consistency
   - Provide sufficient examples

3. **Validation**
   - Test specification against known programs
   - Check for ambiguity
   - Refine as needed

4. **Best Practices**
   - Start with examples
   - Add logical constraints
   - Verify specification intent
   - Document specification design
