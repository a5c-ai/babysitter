---
name: effect-systems
description: Expert skill for designing and implementing algebraic effect systems including effect annotation, inference, handlers, polymorphism, and row-based effect typing.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Effect Systems Skill

Design and implement algebraic effect systems for tracking and handling computational effects in programming languages.

## Capabilities

- Design effect annotation syntax
- Implement effect inference algorithms
- Implement effect checking and tracking
- Design effect handlers (algebraic effects)
- Handle effect polymorphism
- Implement effect rows and extensibility
- Design effect subtyping
- Generate effect-based optimizations

## Usage

Invoke this skill when you need to:
- Add an effect system to a language
- Implement algebraic effects and handlers
- Track computational effects in types
- Design effect polymorphism

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| effectModel | string | Yes | Model (algebraic, monadic, capability) |
| inferenceStrategy | string | Yes | Strategy (annotated, inferred, mixed) |
| features | array | No | Features to implement |
| builtinEffects | array | No | Built-in effects to include |

### Effect Model Options

```json
{
  "effectModel": "algebraic",  // Koka/Eff style
  "effectModel": "monadic",    // Haskell IO style
  "effectModel": "capability"  // Capability-based
}
```

### Feature Options

```json
{
  "features": [
    "effect-inference",
    "effect-handlers",
    "effect-polymorphism",
    "effect-rows",
    "effect-subtyping",
    "effect-abstraction",
    "resumption-control",
    "multi-shot-continuations"
  ]
}
```

## Output Structure

```
effect-system/
├── syntax/
│   ├── effect-annotation.grammar    # Effect annotation syntax
│   ├── effect-handler.grammar       # Handler syntax
│   └── effect-operation.grammar     # Operation syntax
├── typing/
│   ├── effect-types.ts              # Effect type definitions
│   ├── effect-inference.ts          # Effect inference
│   ├── effect-checking.ts           # Effect checking
│   └── effect-rows.ts               # Row polymorphism
├── handlers/
│   ├── handler-impl.ts              # Handler implementation
│   ├── continuation.ts              # Continuation management
│   └── resumption.ts                # Resumption handling
├── runtime/
│   ├── effect-runtime.ts            # Runtime effect support
│   └── builtin-effects.ts           # Built-in effects
└── tests/
    ├── inference.test.ts
    ├── handlers.test.ts
    └── polymorphism.test.ts
```

## Effect System Types

### Algebraic Effects (Koka-style)

```typescript
// Effect declaration
effect State<S> {
  get(): S
  put(s: S): ()
}

effect Exception<E> {
  raise(e: E): Nothing
}

// Effect types
type EffectType = {
  operations: Map<string, OperationType>;
}

interface OperationType {
  name: string;
  params: Type[];
  result: Type;
}

// Function types with effects
interface FunctionType {
  params: Type[];
  result: Type;
  effects: EffectRow;
}

// Effect rows (for polymorphism)
type EffectRow =
  | { type: 'empty' }
  | { type: 'single'; effect: EffectType }
  | { type: 'union'; effects: EffectType[] }
  | { type: 'variable'; name: string }           // Effect polymorphism
  | { type: 'extend'; base: EffectRow; effect: EffectType };
```

### Effect Handlers

```typescript
// Handler syntax
handle expr with {
  return(x) -> returnClause(x),
  get() -> getClause(resume),
  put(s) -> putClause(s, resume)
}

// Handler representation
interface Handler {
  effect: EffectType;
  returnClause: (value: any) => any;
  operationClauses: Map<string, OperationClause>;
}

interface OperationClause {
  operation: string;
  params: string[];
  resumeName: string;
  body: Expr;
}

// Handler typing
// handle[E] : (() -E> A) -> ((A -> B) & Handler[E]) -> B
function typeHandler(
  expr: Expr,
  handler: Handler,
  env: TypeEnv
): { resultType: Type; remainingEffects: EffectRow } {
  const exprType = inferType(expr, env);

  // Check that handler handles the effect
  checkHandlerCovers(handler, exprType.effects);

  // Result type comes from handler clauses
  const resultType = inferHandlerResult(handler, exprType.result, env);

  // Remove handled effect from row
  const remainingEffects = removeEffect(exprType.effects, handler.effect);

  return { resultType, remainingEffects };
}
```

## Effect Inference

```typescript
// Effect inference algorithm
function inferEffects(expr: Expr, env: TypeEnv): InferResult {
  switch (expr.type) {
    case 'var':
      return { type: lookupType(env, expr.name), effects: emptyRow() };

    case 'lambda':
      const bodyResult = inferEffects(expr.body, extendEnv(env, expr.param, expr.paramType));
      return {
        type: { type: 'function', param: expr.paramType, result: bodyResult.type, effects: bodyResult.effects },
        effects: emptyRow()  // Lambda itself is pure
      };

    case 'app':
      const fnResult = inferEffects(expr.fn, env);
      const argResult = inferEffects(expr.arg, env);
      const fnType = fnResult.type as FunctionType;
      return {
        type: fnType.result,
        effects: unionRows(fnResult.effects, argResult.effects, fnType.effects)
      };

    case 'perform':
      const opType = lookupOperation(env, expr.effect, expr.operation);
      const argEffects = expr.args.map(a => inferEffects(a, env).effects);
      return {
        type: opType.result,
        effects: unionRows(singleRow(expr.effect), ...argEffects)
      };

    case 'handle':
      const exprResult = inferEffects(expr.body, env);
      const handlerResult = checkHandler(expr.handler, exprResult, env);
      return handlerResult;

    // ... other cases
  }
}
```

## Effect Polymorphism

```typescript
// Effect-polymorphic function
// map : forall E. (a -E> b) -> List a -E> List b
interface EffectPolymorphicType {
  effectVars: string[];
  typeVars: string[];
  type: Type;
}

// Row polymorphism for effects
// foo : () -<State, E>-> Int   (E is a row variable)
type RowVariable = { type: 'rowVar'; name: string };

function unifyRows(row1: EffectRow, row2: EffectRow): Substitution {
  // Row unification algorithm
  if (row1.type === 'variable') {
    return { [row1.name]: row2 };
  }
  if (row2.type === 'variable') {
    return { [row2.name]: row1 };
  }
  if (row1.type === 'empty' && row2.type === 'empty') {
    return {};
  }
  // Handle union and extend cases...
}
```

## Continuation Management

```typescript
// Delimited continuations for effect handlers
interface Continuation<A, B> {
  resume(value: A): B;
}

// Multi-shot continuations (can resume multiple times)
interface MultiShotContinuation<A, B> extends Continuation<A, B> {
  clone(): MultiShotContinuation<A, B>;
}

// One-shot continuations (can only resume once)
interface OneShotContinuation<A, B> extends Continuation<A, B> {
  readonly consumed: boolean;
}

// Runtime continuation capture
class ContinuationCapture {
  capture<A, B>(
    prompt: Prompt,
    body: (k: Continuation<A, B>) => B
  ): B {
    // Capture the current continuation up to prompt
    const k = captureDelimited(prompt);
    return body(k);
  }
}
```

## Built-in Effects

```typescript
// Common built-in effects
const builtinEffects = {
  IO: {
    operations: {
      print: { params: [StringType], result: UnitType },
      readLine: { params: [], result: StringType },
      readFile: { params: [StringType], result: StringType },
      writeFile: { params: [StringType, StringType], result: UnitType }
    }
  },

  State: {
    typeParams: ['S'],
    operations: {
      get: { params: [], result: TypeVar('S') },
      put: { params: [TypeVar('S')], result: UnitType }
    }
  },

  Exception: {
    typeParams: ['E'],
    operations: {
      raise: { params: [TypeVar('E')], result: NothingType }
    }
  },

  Async: {
    operations: {
      await: { params: [PromiseType(TypeVar('A'))], result: TypeVar('A') },
      spawn: { params: [FunctionType([], TypeVar('A'), AsyncEffect)], result: TaskType(TypeVar('A')) }
    }
  },

  NonDet: {
    operations: {
      choice: { params: [], result: BoolType },
      fail: { params: [], result: NothingType }
    }
  }
};
```

## Effect-Based Optimization

```typescript
// Pure functions can be optimized more aggressively
function canOptimize(fn: FunctionType): OptimizationLevel {
  if (isEmptyRow(fn.effects)) {
    return 'pure';  // Full optimization: CSE, memoization, parallelization
  }
  if (onlyReads(fn.effects)) {
    return 'read-only';  // Can reorder, CSE
  }
  if (isLocalState(fn.effects)) {
    return 'local-state';  // Can inline, but not reorder
  }
  return 'effectful';  // Limited optimization
}

// Effect-based dead code elimination
function eliminateDeadCode(expr: Expr): Expr {
  const effects = inferEffects(expr);
  if (isEmptyRow(effects) && !isUsed(expr)) {
    return unit;  // Pure unused expression can be eliminated
  }
  return expr;
}
```

## Workflow

1. **Design effect syntax** - Declarations, annotations, handlers
2. **Define effect types** - Operations, rows, polymorphism
3. **Implement inference** - Effect inference algorithm
4. **Build effect checker** - Verify effect annotations
5. **Implement handlers** - Handler evaluation/compilation
6. **Add continuations** - Delimited continuation support
7. **Create builtins** - Common effects (IO, State, etc.)
8. **Generate tests** - Inference, handlers, polymorphism

## Best Practices Applied

- Row polymorphism for flexible effect composition
- Clear distinction between operations and handlers
- Support both inferred and annotated effects
- Efficient continuation representation
- Effect-based optimization opportunities
- Good error messages for effect mismatches

## References

- Algebraic Effects for Functional Programming: https://www.microsoft.com/en-us/research/publication/algebraic-effects-for-functional-programming/
- Koka Language: https://koka-lang.github.io/
- Eff Language: https://www.eff-lang.org/
- Effect Handlers in Scope: https://www.cs.ox.ac.uk/people/nicolas.wu/papers/Scope.pdf
- Frank Language: https://arxiv.org/abs/1611.09259

## Target Processes

- effect-system-design.js
- type-system-implementation.js
- concurrency-primitives.js
