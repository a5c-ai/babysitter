# Pattern Matching Skill

Implement pattern matching for programming languages including exhaustiveness checking, decision tree compilation, and efficient code generation.

## Overview

This skill provides expertise in implementing pattern matching, a powerful feature for destructuring data and controlling program flow. It covers the full pipeline from parsing patterns to generating efficient match code.

## When to Use

- Adding pattern matching to a language
- Implementing exhaustiveness checking
- Compiling patterns to efficient code
- Handling advanced pattern features

## Expertise Areas

### Pattern Types

Support for various pattern kinds:
- Wildcards (`_`)
- Variables (`x`, `name`)
- Literals (`42`, `"hello"`, `true`)
- Constructors (`Some(x)`, `Cons(h, t)`)
- Tuples (`(x, y, z)`)
- Records (`{ name, age }`)
- Lists (`[a, b, ...rest]`)
- Or-patterns (`Red | Green | Blue`)
- As-patterns (`(h :: t) as list`)
- Guards (`x if x > 0`)

### Exhaustiveness Analysis

Based on Maranget's algorithm:
- Matrix-based exhaustiveness checking
- Witness generation for uncovered cases
- Redundancy/usefulness checking
- Conservative handling of guards

### Decision Tree Compilation

Efficient pattern matching:
- Column selection heuristics
- Decision tree construction
- Code generation from trees
- Optimization passes

## Quick Start

### Basic Pattern Matching

```json
{
  "patternTypes": [
    "wildcard",
    "variable",
    "literal",
    "constructor"
  ],
  "compilationStrategy": "decision-tree",
  "features": [
    "exhaustiveness-checking",
    "usefulness-checking"
  ]
}
```

### Advanced Pattern Matching

```json
{
  "patternTypes": [
    "wildcard",
    "variable",
    "literal",
    "constructor",
    "tuple",
    "record",
    "list",
    "or-pattern",
    "as-pattern",
    "guard"
  ],
  "compilationStrategy": "decision-tree",
  "features": [
    "exhaustiveness-checking",
    "usefulness-checking",
    "decision-tree-compilation",
    "guard-clauses",
    "nested-patterns"
  ]
}
```

## Generated Components

### Exhaustiveness Checker

```typescript
interface ExhaustivenessChecker {
  // Check if match is exhaustive
  isExhaustive(patterns: Pattern[], type: Type): boolean;

  // Generate example of uncovered case
  findUncovered(patterns: Pattern[], type: Type): Pattern | null;

  // Check for redundant patterns
  findRedundant(patterns: Pattern[], type: Type): number[];
}
```

### Decision Tree Compiler

```typescript
interface PatternCompiler {
  // Compile to decision tree
  compile(arms: MatchArm[], scrutineeType: Type): DecisionTree;

  // Generate code from tree
  generateCode(tree: DecisionTree, target: CodeGenerator): Code;

  // Optimize decision tree
  optimize(tree: DecisionTree): DecisionTree;
}
```

## Pattern Syntax Examples

### Basic Patterns

```rust
match value {
    // Wildcard - matches anything
    _ => "anything",

    // Variable - binds value
    x => format!("got {}", x),

    // Literal - exact match
    42 => "the answer",
    "hello" => "greeting",
    true => "yes",

    // Constructor - destructure ADT
    Some(x) => x,
    None => default,

    // Tuple - destructure tuple
    (x, y) => x + y,

    // Record - destructure struct
    Point { x, y } => (x * x + y * y).sqrt(),
}
```

### Advanced Patterns

```rust
match list {
    // List patterns
    [] => "empty",
    [x] => "singleton",
    [x, y] => "pair",
    [x, y, ..rest] => "at least two",

    // Or-patterns
    Red | Green | Blue => "primary color",

    // As-patterns
    node @ Node { left, right } => {
        println!("Processing {:?}", node);
        process(left, right)
    }

    // Guards
    x if x > 0 => "positive",
    x if x < 0 => "negative",
    _ => "zero",
}
```

## Exhaustiveness Examples

### Complete Match

```rust
enum Color { Red, Green, Blue }

match color {
    Red => 1,
    Green => 2,
    Blue => 3,
}
// OK: All constructors covered
```

### Non-Exhaustive Match

```rust
enum Option<T> { Some(T), None }

match opt {
    Some(x) => x,
}
// Error: Non-exhaustive pattern match
// Missing: None
```

### Redundant Pattern

```rust
match x {
    0 => "zero",
    n => "other",
    1 => "one",  // Warning: unreachable pattern
}
```

## Decision Tree Example

### Input Match

```rust
match (x, y) {
    (Red, _) => 1,
    (_, Red) => 2,
    (Green, Green) => 3,
    (Blue, Blue) => 4,
    _ => 5,
}
```

### Compiled Decision Tree

```
switch x:
  Red ->
    leaf: return 1
  Green ->
    switch y:
      Red -> leaf: return 2
      Green -> leaf: return 3
      Blue -> leaf: return 5
  Blue ->
    switch y:
      Red -> leaf: return 2
      Green -> leaf: return 5
      Blue -> leaf: return 4
```

### Generated Code

```c
int match(Color x, Color y) {
    switch (x) {
        case Red: return 1;
        case Green:
            switch (y) {
                case Red: return 2;
                case Green: return 3;
                case Blue: return 5;
            }
        case Blue:
            switch (y) {
                case Red: return 2;
                case Green: return 5;
                case Blue: return 4;
            }
    }
}
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| pattern-matching-implementation.js | Full pattern matching implementation |
| parser-development.js | Pattern parsing |
| code-generation-llvm.js | Efficient code generation |
| interpreter-implementation.js | Runtime pattern matching |

## Error Messages

### Non-Exhaustive Match

```
Error: Non-exhaustive pattern match

  match opt {
        ^^^ this match is not exhaustive

Missing patterns:
  - None

Help: Add a pattern for `None` or use a wildcard `_` pattern
```

### Redundant Pattern

```
Warning: Unreachable pattern

  match x {
      0 => "zero",
      n => "other",
      1 => "one",
      ^ this pattern is unreachable

The pattern `n` above already matches all values.
Consider removing this pattern or reordering the match arms.
```

## Performance Considerations

### Column Selection Heuristics

Good heuristics improve generated code:

| Heuristic | Description | When to Use |
|-----------|-------------|-------------|
| First column | Always pick first | Simple, baseline |
| Most constructors | Column with most distinct ctors | Large switches |
| Fewer defaults | Column with fewer wildcard matches | Reduce backtracking |
| Necessary | Column that must be tested | Optimal coverage |

### Tree Optimization

```typescript
// Merge identical subtrees
function shareSubtrees(tree: DecisionTree): DecisionTree;

// Eliminate redundant tests
function eliminateRedundant(tree: DecisionTree): DecisionTree;

// Reorder for cache efficiency
function optimizeLayout(tree: DecisionTree): DecisionTree;
```

## Best Practices

1. **Check Exhaustiveness First**: Before compilation
2. **Warn on Redundancy**: Help users catch bugs
3. **Preserve Source Locations**: For good error messages
4. **Handle Guards Conservatively**: Can't know guard outcome statically
5. **Optimize Decision Trees**: Good column selection matters
6. **Test Edge Cases**: Empty matches, single patterns, all wildcards

## References

- [Warnings for Pattern Matching](https://moscova.inria.fr/~maranget/papers/warn/) - Maranget's seminal paper
- [Compiling Pattern Matching](https://www.cs.tufts.edu/~nr/cs257/archive/luc-maranget/jun08.pdf) - Implementation guide
- [Rust Patterns Reference](https://doc.rust-lang.org/reference/patterns.html)
- [OCaml Pattern Matching](https://ocaml.org/docs/pattern-matching)
- [Haskell Pattern Guards](https://wiki.haskell.org/Pattern_guard)
