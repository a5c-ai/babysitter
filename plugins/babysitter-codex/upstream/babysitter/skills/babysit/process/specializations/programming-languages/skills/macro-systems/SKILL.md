---
name: macro-systems
description: Expert skill for designing and implementing macro systems including hygienic macros, procedural macros, and macro expansion. Supports pattern-based macros, quasi-quotation, and hygiene management.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Macro Systems Skill

Design and implement macro systems for programming languages, from simple text-based macros to sophisticated hygienic macro systems.

## Capabilities

- Design macro invocation syntax and patterns
- Implement pattern-based macro matching and expansion
- Implement hygienic macro expansion with scope management
- Handle macro-generated identifier collision avoidance
- Implement procedural/syntax macros with AST manipulation
- Design quasi-quotation systems for code generation
- Handle macro debugging and error reporting
- Implement macro expansion tracing for development

## Usage

Invoke this skill when you need to:
- Design a macro system for a new language
- Implement hygienic macro expansion
- Create procedural macro APIs
- Build quasi-quotation facilities
- Debug macro expansion issues

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| macroType | string | Yes | Type of macro system (pattern, procedural, hygienic) |
| targetLanguage | string | Yes | Language for macro implementation (Rust, Scheme, etc.) |
| syntax | object | No | Custom syntax specifications |
| hygieneModel | string | No | Hygiene model (sets-of-scopes, marks, none) |
| features | array | No | Features to implement |

### Feature Options

```json
{
  "features": [
    "pattern-matching",
    "quasi-quotation",
    "hygiene",
    "procedural-macros",
    "expansion-tracing",
    "error-recovery",
    "recursive-macros",
    "macro-modularization"
  ]
}
```

## Output Structure

```
macro-system/
├── syntax/
│   ├── macro-definition.grammar     # Macro definition syntax
│   ├── macro-invocation.grammar     # Invocation syntax
│   └── quasi-quote.grammar          # Quasi-quotation syntax
├── expansion/
│   ├── pattern-matcher.ts           # Pattern matching engine
│   ├── template-substitution.ts     # Template instantiation
│   ├── hygiene-manager.ts           # Hygiene/scope management
│   └── expander.ts                  # Main expansion driver
├── procedural/
│   ├── proc-macro-api.ts            # Procedural macro API
│   ├── token-stream.ts              # Token manipulation
│   └── quote.ts                     # Quasi-quotation impl
├── debugging/
│   ├── expansion-trace.ts           # Expansion tracing
│   └── error-reporter.ts            # Macro error messages
└── tests/
    ├── hygiene.test.ts
    ├── patterns.test.ts
    └── expansion.test.ts
```

## Macro System Types

### Pattern-Based Macros (Scheme-style)

```scheme
;; Definition
(define-syntax my-or
  (syntax-rules ()
    [(my-or) #f]
    [(my-or e) e]
    [(my-or e1 e2 ...)
     (let ([t e1])
       (if t t (my-or e2 ...)))]))

;; Implementation pattern
interface MacroRule {
  pattern: Pattern;
  template: Template;
  literals: string[];
}

function matchPattern(pattern: Pattern, syntax: Syntax): Bindings | null {
  // Pattern matching with ellipsis handling
}

function substituteTemplate(template: Template, bindings: Bindings): Syntax {
  // Template instantiation with hygiene
}
```

### Procedural Macros (Rust-style)

```rust
// Derive macro example
#[proc_macro_derive(Debug)]
pub fn derive_debug(input: TokenStream) -> TokenStream {
    let ast = syn::parse(input).unwrap();
    impl_debug(&ast)
}

// Implementation pattern
interface ProcMacroContext {
  inputTokens: TokenStream;
  span: Span;
  hygiene: HygieneContext;
}

interface ProcMacro {
  expand(ctx: ProcMacroContext): TokenStream;
}
```

### Hygienic Expansion

```typescript
// Sets of Scopes hygiene model (Racket-style)
interface Syntax {
  datum: any;
  scopes: Set<Scope>;
  srcLoc: SourceLocation;
}

interface Scope {
  id: number;
  bindings: Map<Symbol, Binding>;
}

function introduceScope(syntax: Syntax, scope: Scope): Syntax {
  return { ...syntax, scopes: new Set([...syntax.scopes, scope]) };
}

function flipScope(syntax: Syntax, scope: Scope): Syntax {
  const newScopes = new Set(syntax.scopes);
  if (newScopes.has(scope)) {
    newScopes.delete(scope);
  } else {
    newScopes.add(scope);
  }
  return { ...syntax, scopes: newScopes };
}

function resolve(syntax: Syntax): Binding | undefined {
  // Find binding with maximal matching scope set
}
```

## Quasi-Quotation Implementation

```typescript
// Quasi-quote syntax
// `(list ,x ,@xs)  =>  (list (unquote x) (unquote-splicing xs))

interface QuasiQuote {
  template: QQTemplate;
}

type QQTemplate =
  | { type: 'literal'; value: any }
  | { type: 'unquote'; expr: Syntax }
  | { type: 'unquote-splicing'; expr: Syntax }
  | { type: 'list'; elements: QQTemplate[] };

function expandQuasiQuote(qq: QuasiQuote, env: Environment): Syntax {
  function expand(template: QQTemplate): Syntax {
    switch (template.type) {
      case 'literal':
        return quoteLiteral(template.value);
      case 'unquote':
        return evaluate(template.expr, env);
      case 'unquote-splicing':
        // Splice into enclosing list
        return evaluateAndSplice(template.expr, env);
      case 'list':
        return makeList(template.elements.flatMap(expand));
    }
  }
  return expand(qq.template);
}
```

## Expansion Tracing

```typescript
interface ExpansionStep {
  macroName: string;
  inputSyntax: Syntax;
  outputSyntax: Syntax;
  bindings: Map<string, Syntax>;
  location: SourceLocation;
}

class ExpansionTracer {
  private steps: ExpansionStep[] = [];

  recordStep(step: ExpansionStep): void {
    this.steps.push(step);
  }

  formatTrace(): string {
    return this.steps.map((step, i) =>
      `Step ${i + 1}: ${step.macroName}\n` +
      `  Input: ${formatSyntax(step.inputSyntax)}\n` +
      `  Output: ${formatSyntax(step.outputSyntax)}\n` +
      `  Bindings: ${formatBindings(step.bindings)}`
    ).join('\n\n');
  }
}
```

## Error Handling

```typescript
interface MacroError {
  type: 'pattern-mismatch' | 'hygiene-violation' | 'expansion-limit' | 'syntax-error';
  message: string;
  macroName: string;
  inputSyntax: Syntax;
  suggestions: string[];
}

function reportMacroError(error: MacroError): string {
  const base = `Macro expansion error in '${error.macroName}':\n${error.message}`;
  const context = `\nInput syntax:\n  ${formatSyntax(error.inputSyntax)}`;
  const hints = error.suggestions.length > 0
    ? `\n\nSuggestions:\n${error.suggestions.map(s => `  - ${s}`).join('\n')}`
    : '';
  return base + context + hints;
}
```

## Workflow

1. **Define macro syntax** - Grammar for definition and invocation
2. **Implement pattern matching** - Match invocations against patterns
3. **Build template substitution** - Instantiate templates with bindings
4. **Add hygiene management** - Handle identifier scoping
5. **Create procedural API** - For complex transformations
6. **Build quasi-quotation** - Code generation helpers
7. **Implement tracing** - For debugging macro expansion
8. **Generate test suite** - Hygiene, patterns, edge cases

## Best Practices Applied

- Clear separation of macro definition from expansion
- Hygiene by default, explicit unhygienic escape hatches
- Informative error messages with expansion context
- Expansion depth limits to prevent infinite recursion
- Source location preservation through expansion
- Incremental expansion for IDE support

## References

- Binding as Sets of Scopes: https://www.cs.utah.edu/plt/scope-sets/
- Rust Macros: https://doc.rust-lang.org/reference/macros.html
- Scheme R7RS Macros: https://small.r7rs.org/
- Racket Macro Stepper: https://docs.racket-lang.org/macro-debugger/

## Target Processes

- macro-system-implementation.js
- parser-development.js
- semantic-analysis.js
