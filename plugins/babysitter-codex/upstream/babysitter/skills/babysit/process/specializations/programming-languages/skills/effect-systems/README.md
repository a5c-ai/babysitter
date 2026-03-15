# Effect Systems Skill

Design and implement algebraic effect systems for tracking and handling computational effects in programming languages.

## Overview

This skill provides expertise in effect system design and implementation. It covers algebraic effects, effect inference, handlers, polymorphism, and the integration of effect tracking into a type system.

## When to Use

- Adding an effect system to a language
- Implementing algebraic effects and handlers
- Tracking side effects in the type system
- Designing effect polymorphism

## Expertise Areas

### Algebraic Effects

Modern effect systems:
- Effect declarations with operations
- Effect handlers with resumptions
- Delimited continuations
- Multi-shot vs one-shot handlers

### Effect Inference

Automatic effect tracking:
- Constraint-based inference
- Row polymorphism for effects
- Effect variable unification
- Principal effect types

### Effect Handlers

Handler implementation:
- Return clause handling
- Operation interception
- Continuation capture and resume
- Handler composition

### Effect Optimization

Effect-based optimizations:
- Pure function optimization
- Effect-based parallelization
- Dead code elimination
- Effect-aware inlining

## Quick Start

### Algebraic Effect System

```json
{
  "effectModel": "algebraic",
  "inferenceStrategy": "inferred",
  "features": [
    "effect-inference",
    "effect-handlers",
    "effect-polymorphism",
    "effect-rows"
  ],
  "builtinEffects": ["IO", "State", "Exception"]
}
```

### Monadic Effect System

```json
{
  "effectModel": "monadic",
  "inferenceStrategy": "annotated",
  "features": [
    "effect-checking",
    "effect-abstraction",
    "effect-subtyping"
  ]
}
```

## Generated Components

### Effect Type System

```typescript
interface EffectTypeSystem {
  // Declare a new effect
  declareEffect(name: string, operations: Operation[]): EffectType;

  // Infer effects of expression
  inferEffects(expr: Expr, env: TypeEnv): EffectRow;

  // Check effect annotations
  checkEffects(expr: Expr, expected: EffectRow): boolean;

  // Unify effect rows
  unifyRows(row1: EffectRow, row2: EffectRow): Substitution;
}
```

### Handler System

```typescript
interface HandlerSystem {
  // Type check handler
  checkHandler(handler: Handler, handledType: Type): Type;

  // Compile handler to runtime representation
  compileHandler(handler: Handler): CompiledHandler;

  // Execute handled computation
  runHandled(expr: Expr, handler: CompiledHandler): any;
}
```

## Effect System Examples

### Effect Declaration

```
// Declare a State effect
effect State<S> {
  get(): S
  put(s: S): ()
}

// Declare an Exception effect
effect Exception<E> {
  raise(e: E): Nothing
}

// Declare a non-determinism effect
effect NonDet {
  choice(): Bool
  fail(): Nothing
}
```

### Using Effects

```
// Function that uses State effect
fun counter(): Int / State<Int> {
  val current = get()
  put(current + 1)
  current
}

// Function that uses Exception effect
fun divide(a: Int, b: Int): Int / Exception<String> {
  if (b == 0) {
    raise("division by zero")
  } else {
    a / b
  }
}

// Effect polymorphic function
fun map<A, B, E>(f: A -> B / E, xs: List<A>): List<B> / E {
  match xs {
    [] -> []
    [x, ...rest] -> [f(x), ...map(f, rest)]
  }
}
```

### Effect Handlers

```
// Handle State with a value
handle counter() with {
  return(x) -> x,
  get() -> resume(42),
  put(s) -> resume(())
}
// Result: 42

// Handle State with state threading
fun runState<S, A>(init: S, comp: () -> A / State<S>): (A, S) {
  handle comp() with {
    return(x) -> (x, init),
    get() -> resume(init),
    put(s) -> {
      // Continue with new state
      handle resume(()) with state = s
    }
  }
}

// Handle Exception
handle divide(10, 0) with {
  return(x) -> Some(x),
  raise(e) -> None
}
// Result: None

// Handle NonDet (collect all results)
handle {
  val a = if choice() then 1 else 2
  val b = if choice() then 10 else 20
  a + b
} with {
  return(x) -> [x],
  choice() -> resume(true) ++ resume(false),
  fail() -> []
}
// Result: [11, 21, 12, 22]
```

## Effect Rows

### Row Polymorphism

```
// Effect rows allow composing effects
type Row = <Effect1, Effect2, ...E>

// E is a row variable - can be extended
fun foo(): Int / <State<Int>, E> {
  get() + 1
}

// Can add more effects
fun bar(): Int / <State<Int>, Exception<String>, E> {
  if get() < 0 {
    raise("negative")
  }
  foo()
}
```

### Row Operations

```typescript
// Empty row (pure)
type Pure = <>

// Single effect
type Stateful<S> = <State<S>>

// Union of effects
type IOAndState<S> = <IO, State<S>>

// Row extension
type Extended<E> = <State<Int>, E>  // E can be any row
```

## Effect Inference

### Algorithm

```typescript
function inferEffects(expr: Expr): EffectRow {
  switch (expr.type) {
    case 'literal':
    case 'variable':
      return emptyRow();  // Pure

    case 'perform':
      // Performing an operation has that effect
      return singleRow(expr.effect);

    case 'application':
      // Combine function and argument effects
      const fnEffects = inferEffects(expr.fn);
      const argEffects = inferEffects(expr.arg);
      const callEffects = getFunctionEffects(expr.fn);
      return unionRows(fnEffects, argEffects, callEffects);

    case 'handle':
      // Handler removes the handled effect
      const bodyEffects = inferEffects(expr.body);
      return removeEffect(bodyEffects, expr.handler.effect);
  }
}
```

### Error Messages

```
Error: Effect not handled

  fun main(): Int / <> {  // Expected pure
      ^^^^^^^^^^^^^^^^^
      val x = get()       // Has State effect
              ^^^
              This uses effect 'State<Int>' which is not handled

  Help: Either:
    1. Add effect to signature: fun main(): Int / <State<Int>>
    2. Handle the effect: handle { ... } with stateHandler
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| effect-system-design.js | Full effect system design |
| type-system-implementation.js | Effect type integration |
| concurrency-primitives.js | Async effects |

## Effect System Comparison

| Feature | Algebraic | Monadic | Capability |
|---------|-----------|---------|------------|
| Inference | Full | Limited | Limited |
| Handlers | First-class | Transformers | Implicit |
| Resumption | Multi-shot | N/A | N/A |
| Composition | Row polymorphism | Monad transformers | Capability passing |
| Examples | Koka, Eff | Haskell | Scala 3 |

## Performance Considerations

### Continuation Representation

| Strategy | Memory | Speed | Multi-shot |
|----------|--------|-------|------------|
| CPS transform | Low | Fast | Yes |
| Stack copying | High | Medium | Yes |
| One-shot optimized | Low | Fast | No |

### Effect-Based Optimization

```typescript
// Pure functions enable more optimizations
function optimizePure(fn: FunctionType): Optimization[] {
  if (isEffectFree(fn.effects)) {
    return [
      'common-subexpression-elimination',
      'memoization',
      'parallelization',
      'dead-code-elimination'
    ];
  }
  return [];
}
```

## Best Practices

1. **Default to Inference**: Let the compiler infer effects when possible
2. **Use Row Polymorphism**: For flexible effect composition
3. **One-Shot When Possible**: More efficient than multi-shot
4. **Handle Close to Use**: Handle effects as close to their use as practical
5. **Effect Boundaries**: Define clear effect boundaries in APIs
6. **Document Effects**: Even with inference, document expected effects

## References

- [Algebraic Effects for Functional Programming](https://www.microsoft.com/en-us/research/publication/algebraic-effects-for-functional-programming/)
- [Koka Language](https://koka-lang.github.io/koka/doc/index.html)
- [Eff Language](https://www.eff-lang.org/)
- [Effect Handlers in Scope](https://www.cs.ox.ac.uk/people/nicolas.wu/papers/Scope.pdf)
- [Do Be Do Be Do](https://arxiv.org/abs/1611.09259) - Frank language paper
- [Effekt Language](https://effekt-lang.org/)
