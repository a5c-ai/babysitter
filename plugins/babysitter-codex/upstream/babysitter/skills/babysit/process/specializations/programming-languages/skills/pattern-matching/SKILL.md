---
name: pattern-matching
description: Expert skill for implementing pattern matching including exhaustiveness checking, decision tree compilation, and efficient match dispatch code generation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Pattern Matching Skill

Implement pattern matching for programming languages including exhaustiveness checking, usefulness analysis, and efficient compilation to decision trees.

## Capabilities

- Parse pattern syntax (constructor, wildcard, binding, literals)
- Implement exhaustiveness and usefulness checking
- Compile patterns to decision trees
- Implement guard clause handling
- Design or-patterns and as-patterns
- Implement nested pattern matching
- Optimize pattern match coverage
- Generate efficient match dispatch code

## Usage

Invoke this skill when you need to:
- Add pattern matching to a language
- Implement exhaustiveness checking
- Compile patterns efficiently
- Handle complex pattern features

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| patternTypes | array | Yes | Types of patterns to support |
| targetLanguage | string | Yes | Language for implementation |
| compilationStrategy | string | No | Strategy (decision-tree, backtracking) |
| features | array | No | Advanced features to implement |

### Pattern Types

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
  ]
}
```

### Feature Options

```json
{
  "features": [
    "exhaustiveness-checking",
    "usefulness-checking",
    "decision-tree-compilation",
    "guard-clauses",
    "nested-patterns",
    "view-patterns",
    "active-patterns"
  ]
}
```

## Output Structure

```
pattern-matching/
├── syntax/
│   ├── pattern.grammar            # Pattern syntax
│   └── match-expr.grammar         # Match expression syntax
├── analysis/
│   ├── exhaustiveness.ts          # Exhaustiveness checker
│   ├── usefulness.ts              # Usefulness/redundancy checker
│   └── pattern-types.ts           # Pattern type inference
├── compilation/
│   ├── decision-tree.ts           # Decision tree builder
│   ├── code-generator.ts          # Code generation
│   └── optimizer.ts               # Pattern optimization
├── runtime/
│   ├── matcher.ts                 # Runtime matching (interpreter)
│   └── guards.ts                  # Guard evaluation
└── tests/
    ├── exhaustiveness.test.ts
    ├── compilation.test.ts
    └── runtime.test.ts
```

## Pattern Syntax

```typescript
// Pattern ADT
type Pattern =
  | { type: 'wildcard' }                              // _
  | { type: 'variable'; name: string }                // x
  | { type: 'literal'; value: Literal }               // 42, "hello", true
  | { type: 'constructor'; name: string; args: Pattern[] }  // Some(x), Cons(h, t)
  | { type: 'tuple'; elements: Pattern[] }            // (x, y, z)
  | { type: 'record'; fields: Map<string, Pattern> }  // { name: n, age: a }
  | { type: 'list'; elements: Pattern[]; rest?: Pattern }  // [x, y, ...rest]
  | { type: 'or'; patterns: Pattern[] }               // p1 | p2
  | { type: 'as'; pattern: Pattern; name: string }    // p as x
  | { type: 'guard'; pattern: Pattern; guard: Expr }; // p if cond

// Match expression
interface MatchExpr {
  scrutinee: Expr;
  arms: MatchArm[];
}

interface MatchArm {
  pattern: Pattern;
  guard?: Expr;
  body: Expr;
}
```

## Exhaustiveness Checking

```typescript
// Based on "Warnings for Pattern Matching" (Maranget)

type PatternMatrix = Pattern[][];  // rows = arms, columns = scrutinees

// Check if pattern matrix is exhaustive
function isExhaustive(matrix: PatternMatrix, types: Type[]): boolean {
  if (matrix.length === 0) return false;
  if (types.length === 0) return true;

  const firstCol = matrix.map(row => row[0]);
  const sigma = getConstructorSignature(types[0]);

  if (sigma.isComplete(firstCol)) {
    // All constructors present - check specializations
    return sigma.constructors.every(ctor =>
      isExhaustive(specialize(matrix, ctor), specializationTypes(types, ctor))
    );
  } else {
    // Some constructors missing - check default matrix
    return isExhaustive(defaultMatrix(matrix), types.slice(1));
  }
}

// Generate witness for non-exhaustiveness
function findUncoveredCase(matrix: PatternMatrix, types: Type[]): Pattern[] | null {
  if (matrix.length === 0) {
    // Empty matrix - any value is uncovered
    return types.map(generateWildcard);
  }
  if (types.length === 0) return null;  // Exhaustive

  const sigma = getConstructorSignature(types[0]);
  const firstCol = matrix.map(row => row[0]);

  if (sigma.isComplete(firstCol)) {
    for (const ctor of sigma.constructors) {
      const witness = findUncoveredCase(
        specialize(matrix, ctor),
        specializationTypes(types, ctor)
      );
      if (witness) {
        return [applyConstructor(ctor, witness.slice(0, ctor.arity)), ...witness.slice(ctor.arity)];
      }
    }
    return null;
  } else {
    // Find missing constructor
    const missing = sigma.constructors.find(c => !firstCol.some(p => matchesCtor(p, c)));
    if (missing) {
      return [generatePattern(missing), ...types.slice(1).map(generateWildcard)];
    }
    return findUncoveredCase(defaultMatrix(matrix), types.slice(1));
  }
}
```

## Decision Tree Compilation

```typescript
// Decision tree for efficient matching
type DecisionTree =
  | { type: 'fail' }
  | { type: 'leaf'; bindings: Map<string, Access>; body: Expr }
  | { type: 'switch'; access: Access; cases: SwitchCase[]; default?: DecisionTree };

interface SwitchCase {
  constructor: Constructor;
  tree: DecisionTree;
}

interface Access {
  root: string;
  path: AccessStep[];
}

type AccessStep =
  | { type: 'field'; index: number }
  | { type: 'deref' };

// Compile patterns to decision tree
function compilePatterns(arms: MatchArm[], scrutinee: Access): DecisionTree {
  if (arms.length === 0) return { type: 'fail' };

  // Find best column to split on (heuristic)
  const column = selectColumn(arms);

  // Group arms by constructor in that column
  const groups = groupByConstructor(arms, column);

  if (groups.size === 0) {
    // All wildcards - just use first arm
    const bindings = extractBindings(arms[0].pattern, scrutinee);
    return { type: 'leaf', bindings, body: arms[0].body };
  }

  // Build switch node
  const cases: SwitchCase[] = [];
  for (const [ctor, ctorArms] of groups) {
    const specializedAccess = extendAccess(scrutinee, ctor);
    cases.push({
      constructor: ctor,
      tree: compilePatterns(specializeArms(ctorArms, ctor), specializedAccess)
    });
  }

  const defaultArms = arms.filter(arm => isWildcard(arm.pattern, column));
  const defaultTree = defaultArms.length > 0
    ? compilePatterns(defaultArms, scrutinee)
    : undefined;

  return { type: 'switch', access: scrutinee, cases, default: defaultTree };
}
```

## Guard Clause Handling

```typescript
// Guards complicate exhaustiveness - we must be conservative
interface GuardedArm {
  pattern: Pattern;
  guard: Expr | null;
  body: Expr;
}

// For exhaustiveness: treat guarded patterns as potentially failing
function exhaustivenessWithGuards(arms: GuardedArm[], types: Type[]): Warning[] {
  const warnings: Warning[] = [];

  // Remove guards for exhaustiveness check (conservative)
  const unguardedMatrix = arms.map(arm => [arm.pattern]);
  if (!isExhaustive(unguardedMatrix, types)) {
    // May still be exhaustive if guards cover all cases
    // But we can't know statically - warn
    warnings.push({
      type: 'possibly-non-exhaustive',
      message: 'Match may not be exhaustive (guards present)',
      suggestion: 'Consider adding a catch-all pattern'
    });
  }

  return warnings;
}

// Decision tree with guards
type GuardedTree =
  | { type: 'fail' }
  | { type: 'guard'; test: Expr; success: GuardedTree; failure: GuardedTree }
  | { type: 'leaf'; bindings: Map<string, Access>; body: Expr }
  | { type: 'switch'; access: Access; cases: SwitchCase[]; default?: GuardedTree };
```

## Code Generation

```typescript
// Generate code from decision tree
function generateCode(tree: DecisionTree, target: CodeTarget): Code {
  switch (tree.type) {
    case 'fail':
      return target.emitMatchFailure();

    case 'leaf':
      const setup = Array.from(tree.bindings.entries())
        .map(([name, access]) => target.emitBinding(name, access));
      return target.emitBlock([...setup, target.emitExpr(tree.body)]);

    case 'switch':
      return target.emitSwitch(
        target.emitAccess(tree.access),
        tree.cases.map(c => ({
          test: target.emitConstructorTest(c.constructor),
          body: generateCode(c.tree, target)
        })),
        tree.default ? generateCode(tree.default, target) : target.emitMatchFailure()
      );
  }
}

// Example output for Rust
function emitRustMatch(tree: DecisionTree): string {
  // Input: match x { Some(y) => y + 1, None => 0 }
  // Output:
  // match x {
  //   Some(ref __0) => {
  //     let y = __0;
  //     y + 1
  //   }
  //   None => 0
  // }
}
```

## Or-Patterns and As-Patterns

```typescript
// Or-pattern: matches if any sub-pattern matches
// (Red | Green | Blue) => "color"

function expandOrPattern(pattern: Pattern): Pattern[] {
  if (pattern.type === 'or') {
    return pattern.patterns.flatMap(expandOrPattern);
  }
  // Recursively expand in sub-patterns
  // ...
  return [pattern];
}

// As-pattern: binds entire match to name
// (x :: xs) as list => (list, x)

function handleAsPattern(
  pattern: AsPattern,
  access: Access,
  bindings: Map<string, Access>
): void {
  // Bind the name to current access
  bindings.set(pattern.name, access);
  // Continue with inner pattern
  extractBindings(pattern.pattern, access, bindings);
}
```

## Workflow

1. **Define pattern syntax** - Grammar for patterns
2. **Implement pattern parser** - Parse patterns to AST
3. **Build exhaustiveness checker** - Matrix-based analysis
4. **Add usefulness checker** - Detect redundant patterns
5. **Implement decision tree compilation** - Efficient matching
6. **Generate target code** - From decision trees
7. **Handle guards** - Conservative guard analysis
8. **Write tests** - Exhaustiveness, compilation, runtime

## Best Practices Applied

- Conservative exhaustiveness with guards
- Informative non-exhaustiveness witnesses
- Efficient decision tree compilation
- Proper binding extraction order
- Support for nested patterns
- Clear redundancy warnings

## References

- Warnings for Pattern Matching (Maranget): https://moscova.inria.fr/~maranget/papers/warn/
- Compiling Pattern Matching: https://www.cs.tufts.edu/~nr/cs257/archive/luc-maranget/jun08.pdf
- Rust Pattern Matching: https://doc.rust-lang.org/reference/patterns.html
- OCaml Pattern Matching: https://ocaml.org/docs/pattern-matching

## Target Processes

- pattern-matching-implementation.js
- parser-development.js
- code-generation-llvm.js
- interpreter-implementation.js
