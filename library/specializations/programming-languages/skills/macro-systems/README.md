# Macro Systems Skill

Design and implement macro systems for programming languages, from simple pattern-based macros to sophisticated hygienic macro systems with procedural capabilities.

## Overview

This skill provides expertise in macro system design and implementation. It covers the full spectrum from simple text substitution macros to advanced hygienic macro systems with sets-of-scopes hygiene, procedural macros, and quasi-quotation facilities.

## When to Use

- Designing a new macro system for a programming language
- Implementing hygienic macro expansion
- Adding procedural/syntax macro capabilities
- Building code generation facilities
- Debugging macro expansion issues

## Expertise Areas

### Pattern-Based Macros

The skill implements pattern matching macros similar to Scheme's syntax-rules:
- Ellipsis patterns for variadic matching
- Literal identifier matching
- Nested pattern structures
- Template instantiation with captured bindings

### Hygienic Expansion

Prevents accidental identifier capture:
- Sets-of-scopes model (Racket)
- Marks-based hygiene (traditional)
- Explicit hygiene breaking for advanced use cases
- Scope introduction and flipping

### Procedural Macros

For transformations beyond pattern matching:
- Token stream manipulation
- AST transformation APIs
- Derive macros for automatic trait implementations
- Attribute macros for declarations

### Quasi-Quotation

Code generation helpers:
- Quotation and unquotation syntax
- Splicing for lists
- Nested quasi-quotes
- Hygiene-aware code generation

## Quick Start

### Basic Pattern Macro

```json
{
  "macroType": "pattern",
  "targetLanguage": "custom",
  "features": ["pattern-matching", "quasi-quotation"],
  "syntax": {
    "definition": "define-macro name (pattern ...) => template",
    "invocation": "(name args ...)"
  }
}
```

### Hygienic Macro System

```json
{
  "macroType": "hygienic",
  "targetLanguage": "scheme-like",
  "hygieneModel": "sets-of-scopes",
  "features": [
    "pattern-matching",
    "hygiene",
    "expansion-tracing",
    "error-recovery"
  ]
}
```

### Procedural Macro System

```json
{
  "macroType": "procedural",
  "targetLanguage": "rust-like",
  "features": [
    "procedural-macros",
    "quasi-quotation",
    "derive-macros",
    "attribute-macros"
  ]
}
```

## Generated Components

### Core Expansion Engine

```typescript
// Pattern matcher
class PatternMatcher {
  match(pattern: Pattern, syntax: Syntax): Bindings | null;
  matchEllipsis(pattern: Pattern[], syntax: Syntax[]): Bindings | null;
}

// Template substitution
class TemplateSubstitutor {
  substitute(template: Template, bindings: Bindings): Syntax;
  handleEllipsis(template: Template, bindings: Bindings): Syntax[];
}

// Hygiene manager
class HygieneManager {
  introduceScope(syntax: Syntax): Syntax;
  resolve(identifier: Syntax): Binding | undefined;
}
```

### Procedural Macro API

```typescript
// Token stream for macro input/output
interface TokenStream {
  tokens: Token[];
  parse<T>(): T;
  extend(other: TokenStream): void;
}

// Proc macro context
interface ProcMacroContext {
  input: TokenStream;
  span: Span;
  call_site(): Span;
  def_site(): Span;
  mixed_site(): Span;
}
```

## Macro Examples

### Simple Pattern Macro

```
define-macro when (condition body ...)
  => (if condition (begin body ...))

// Usage
(when (> x 0)
  (print "positive")
  (return x))

// Expands to
(if (> x 0)
  (begin
    (print "positive")
    (return x)))
```

### Hygienic Macro

```scheme
;; This macro is hygienic - internal 'tmp' won't clash
(define-syntax swap!
  (syntax-rules ()
    [(swap! a b)
     (let ([tmp a])
       (set! a b)
       (set! b tmp))]))

;; Safe even with:
(let ([tmp 1] [x 2])
  (swap! tmp x))  ; Works correctly!
```

### Procedural Derive Macro

```rust
#[proc_macro_derive(Debug)]
pub fn derive_debug(input: TokenStream) -> TokenStream {
    let ast: DeriveInput = parse(input);
    let name = &ast.ident;

    quote! {
        impl Debug for #name {
            fn fmt(&self, f: &mut Formatter) -> Result {
                write!(f, stringify!(#name))
            }
        }
    }
}
```

## Debugging Support

### Expansion Tracing

```
$ compile --trace-macros source.scm

Macro expansion trace:
  Step 1: when
    Input: (when (> x 0) (print "positive"))
    Output: (if (> x 0) (begin (print "positive")))
    Location: source.scm:10:1

  Step 2: if
    Input: (if (> x 0) (begin (print "positive")))
    Output: <primitive if>
    Location: source.scm:10:1 (expanded)
```

### Error Messages

```
Error: Macro pattern mismatch in 'define-struct'

  Input: (define-struct point x y z)

  Expected patterns:
    (define-struct name (field ...))
    (define-struct name (field ...) #:mutable)

  The macro expects fields to be wrapped in parentheses.

  Suggestion: Try (define-struct point (x y z))

  At: example.scm:5:1
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| macro-system-implementation.js | Full macro system design and implementation |
| parser-development.js | Macro invocation parsing |
| semantic-analysis.js | Post-expansion semantic checks |

## Hygiene Models

### Sets of Scopes (Racket)

Most expressive, handles complex macro compositions:
- Each syntax object carries a set of scopes
- Binding resolution finds maximal scope subset match
- Supports macro-generating macros correctly

### Marks (Traditional)

Simpler but less powerful:
- Each expansion adds a mark
- Identifiers match if marks are identical
- May have issues with complex macro patterns

### None (C-style)

Simple text substitution:
- No hygiene guarantees
- User must manually avoid capture
- Simplest to implement

## Best Practices

1. **Default to Hygiene**: Make hygiene the default, with explicit escapes
2. **Preserve Locations**: Track source locations through expansion
3. **Limit Recursion**: Set expansion depth limits
4. **Trace Support**: Build in expansion tracing from the start
5. **Clear Errors**: Report macro errors with context and suggestions
6. **Test Extensively**: Hygiene edge cases are subtle

## References

- [Binding as Sets of Scopes](https://www.cs.utah.edu/plt/scope-sets/) - Matthew Flatt's paper
- [Rust Macros by Example](https://doc.rust-lang.org/reference/macros-by-example.html)
- [Scheme R7RS Syntax-Rules](https://small.r7rs.org/)
- [Fear of Macros](https://www.greghendershott.com/fear-of-macros/) - Racket macro tutorial
- [The Little Schemer](https://mitpress.mit.edu/books/little-schemer) - Foundation concepts
