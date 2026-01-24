---
name: dsl-compiler-generator
description: Generate compilers and interpreters for domain-specific languages
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
  category: programming-language-theory
  domain: computer-science
  tools:
    - ANTLR
    - Xtext
    - Racket
  processes:
    - dsl-design-implementation
    - compiler-optimization-design
---

# DSL Compiler Generator Skill

## Purpose

Provides domain-specific language implementation capabilities for generating parsers, type checkers, and interpreters from language specifications.

## Capabilities

- **Parser Generation**: Generate parsers from grammar specifications
- **Type Checker Generation**: Generate type checkers from typing rules
- **Interpreter Generation**: Generate interpreters from semantics
- **Code Generation**: Generate code generators for compilation
- **Workbench Integration**: Integrate with language workbenches

## Usage Guidelines

1. **Grammar Specification**
   - Define concrete syntax
   - Specify precedence and associativity
   - Handle lexical details

2. **Semantic Specification**
   - Define abstract syntax
   - Specify type rules
   - Define evaluation semantics

3. **Implementation Generation**
   - Generate parser from grammar
   - Generate type checker
   - Generate interpreter or compiler

4. **Best Practices**
   - Start with complete examples
   - Test parser coverage
   - Provide good error messages
   - Document DSL thoroughly
