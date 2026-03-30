---
name: generics-implementation
description: Expert skill for implementing parametric polymorphism including type parameter bounds, monomorphization, type erasure, variance, higher-kinded types, and associated types.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Generics Implementation Skill

Implement parametric polymorphism for programming languages including generics, type bounds, and compilation strategies.

## Capabilities

- Design generic syntax and type parameter bounds
- Implement monomorphization (Rust-style)
- Implement type erasure (Java-style)
- Handle variance in generic types
- Implement higher-kinded types (if applicable)
- Design trait/interface bounds
- Handle associated types
- Implement generic method dispatch

## Usage

Invoke this skill when you need to:
- Add generics to a language
- Implement monomorphization or type erasure
- Design trait bounds and constraints
- Handle variance and subtyping with generics

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| compilationStrategy | string | Yes | Strategy (monomorphization, erasure, dictionary) |
| features | array | No | Features to implement |
| varianceModel | string | No | Variance handling (explicit, inferred, none) |
| boundsSystem | object | No | Bounds system configuration |

### Compilation Strategies

```json
{
  "compilationStrategy": "monomorphization",  // Rust, C++
  "compilationStrategy": "erasure",           // Java, TypeScript
  "compilationStrategy": "dictionary"         // Haskell, Swift witness tables
}
```

### Feature Options

```json
{
  "features": [
    "type-parameters",
    "trait-bounds",
    "associated-types",
    "variance",
    "higher-kinded-types",
    "default-type-parameters",
    "const-generics",
    "where-clauses",
    "specialization"
  ]
}
```

## Output Structure

```
generics/
├── syntax/
│   ├── type-params.grammar         # Type parameter syntax
│   ├── bounds.grammar              # Bounds and constraints
│   └── where-clause.grammar        # Where clause syntax
├── typing/
│   ├── generic-types.ts            # Generic type representation
│   ├── bounds-checking.ts          # Bounds verification
│   ├── variance.ts                 # Variance checking
│   └── instantiation.ts            # Type instantiation
├── compilation/
│   ├── monomorphization.ts         # Monomorphization
│   ├── erasure.ts                  # Type erasure
│   └── dictionary.ts               # Dictionary passing
├── inference/
│   ├── type-inference.ts           # Generic type inference
│   └── constraint-solving.ts       # Constraint resolution
└── tests/
    ├── bounds.test.ts
    ├── variance.test.ts
    └── compilation.test.ts
```

## Generic Type System

### Type Parameter Syntax

```typescript
// Basic generics
struct Vec<T> {
    data: T[],
    len: usize
}

// Multiple type parameters
struct HashMap<K, V> {
    buckets: Array<(K, V)>
}

// Type parameter bounds
fn sort<T: Ord>(arr: &mut [T]) { ... }

// Where clauses for complex bounds
fn process<T, U>(t: T, u: U) -> bool
where
    T: Clone + Debug,
    U: AsRef<T>
{ ... }

// Default type parameters
struct Container<T = i32> {
    value: T
}

// Const generics
struct Array<T, const N: usize> {
    data: [T; N]
}
```

### Generic Type Representation

```typescript
interface GenericType {
  name: string;
  typeParams: TypeParameter[];
  body: Type;
}

interface TypeParameter {
  name: string;
  bounds: TypeBound[];
  variance: Variance;
  default?: Type;
}

interface TypeBound {
  trait: TraitRef;
  // Additional constraints
}

type Variance = 'covariant' | 'contravariant' | 'invariant' | 'bivariant';

// Type application
interface TypeApplication {
  generic: GenericType;
  args: Type[];
}
```

## Monomorphization

```typescript
// Monomorphization: generate specialized code for each type instantiation

interface MonomorphizationContext {
  instantiations: Map<string, Type[]>[];  // Track all instantiations
  generatedCode: Map<string, GeneratedFunction>;
}

function monomorphize(
  program: Program,
  entryPoints: FunctionRef[]
): MonomorphizedProgram {
  const ctx: MonomorphizationContext = {
    instantiations: [],
    generatedCode: new Map()
  };

  // Collect all instantiations starting from entry points
  for (const entry of entryPoints) {
    collectInstantiations(entry, ctx);
  }

  // Generate specialized code for each instantiation
  for (const [signature, typeArgs] of ctx.instantiations) {
    const original = lookupGenericFunction(signature);
    const specialized = specializeFunction(original, typeArgs);
    ctx.generatedCode.set(mangleName(signature, typeArgs), specialized);
  }

  return buildMonomorphizedProgram(ctx);
}

function specializeFunction(
  fn: GenericFunction,
  typeArgs: Type[]
): SpecializedFunction {
  // Substitute type parameters with concrete types
  const substitution = buildSubstitution(fn.typeParams, typeArgs);

  return {
    name: mangleName(fn.name, typeArgs),
    params: fn.params.map(p => substituteType(p.type, substitution)),
    returnType: substituteType(fn.returnType, substitution),
    body: substituteInBody(fn.body, substitution)
  };
}

// Name mangling for monomorphized functions
function mangleName(baseName: string, typeArgs: Type[]): string {
  return `${baseName}_${typeArgs.map(typeToString).join('_')}`;
}
```

## Type Erasure

```typescript
// Type erasure: erase generic types at runtime, use casts

function eraseGenericType(type: Type): Type {
  if (type.kind === 'typeParam') {
    // Erase to bound (or Object if unbounded)
    return type.bounds.length > 0
      ? type.bounds[0]  // Erase to first bound
      : ObjectType;
  }

  if (type.kind === 'application') {
    // Erase type arguments
    return eraseGenericType(type.generic);
  }

  if (type.kind === 'generic') {
    // Erase body
    return eraseGenericType(type.body);
  }

  return type;
}

// Insert casts at usage sites
function insertCasts(expr: Expr, expectedType: Type, actualType: Type): Expr {
  const erasedExpected = eraseGenericType(expectedType);
  const erasedActual = eraseGenericType(actualType);

  if (!typesEqual(erasedExpected, erasedActual)) {
    return {
      type: 'cast',
      expr: expr,
      targetType: erasedExpected
    };
  }

  return expr;
}
```

## Variance

```typescript
// Variance checking
type Variance = 'covariant' | 'contravariant' | 'invariant' | 'bivariant';

interface VarianceChecker {
  // Compute variance of type parameter in type
  computeVariance(typeParam: TypeParameter, type: Type): Variance;

  // Check if variance annotation is correct
  checkVariance(generic: GenericType): VarianceError[];

  // Infer variance from usage
  inferVariance(generic: GenericType): Map<TypeParameter, Variance>;
}

function computeVariance(param: TypeParameter, type: Type): Variance {
  switch (type.kind) {
    case 'typeParam':
      return type.name === param.name ? 'covariant' : 'bivariant';

    case 'function':
      // Contravariant in parameter types, covariant in return
      const paramVariance = combineVariances(
        type.params.map(p => flipVariance(computeVariance(param, p)))
      );
      const returnVariance = computeVariance(param, type.returnType);
      return combineVariance(paramVariance, returnVariance);

    case 'application':
      // Combine based on declared variance of type constructor
      return combineVariances(
        type.args.map((arg, i) => {
          const declaredVariance = type.generic.typeParams[i].variance;
          const usageVariance = computeVariance(param, arg);
          return multiplyVariance(declaredVariance, usageVariance);
        })
      );

    case 'mutable':
      // Mutable positions are invariant
      return 'invariant';

    default:
      return 'bivariant';
  }
}

// Variance rules for subtyping
function isSubtype(sub: Type, sup: Type): boolean {
  if (sub.kind === 'application' && sup.kind === 'application') {
    if (sub.generic !== sup.generic) return false;

    return sub.args.every((subArg, i) => {
      const supArg = sup.args[i];
      const variance = sub.generic.typeParams[i].variance;

      switch (variance) {
        case 'covariant':
          return isSubtype(subArg, supArg);
        case 'contravariant':
          return isSubtype(supArg, subArg);
        case 'invariant':
          return typesEqual(subArg, supArg);
        case 'bivariant':
          return true;
      }
    });
  }
  // ... other cases
}
```

## Trait Bounds

```typescript
// Trait bound checking
interface BoundsChecker {
  // Check if type satisfies bound
  satisfiesBound(type: Type, bound: TypeBound): boolean;

  // Find implementation for trait
  resolveImpl(type: Type, trait: TraitRef): TraitImpl | null;

  // Check where clause
  checkWhereClause(clause: WhereClause, env: TypeEnv): boolean;
}

function satisfiesBound(type: Type, bound: TypeBound): boolean {
  // Look for trait implementation
  const impl = findTraitImpl(type, bound.trait);
  if (!impl) return false;

  // Check associated type constraints
  for (const [name, constraint] of bound.associatedTypes) {
    const actualType = resolveAssociatedType(impl, name);
    if (!typesEqual(actualType, constraint)) return false;
  }

  return true;
}

// Where clause example:
// where T: Iterator<Item = U>, U: Display
interface WhereClause {
  constraints: BoundConstraint[];
}

interface BoundConstraint {
  type: Type;
  bounds: TypeBound[];
}
```

## Associated Types

```typescript
// Associated types in traits
trait Iterator {
  type Item;
  fn next(&mut self) -> Option<Self::Item>;
}

impl Iterator for Range {
  type Item = i32;
  fn next(&mut self) -> Option<i32> { ... }
}

// Associated type representation
interface AssociatedType {
  name: string;
  bounds: TypeBound[];
  default?: Type;
}

interface TraitImpl {
  trait: TraitRef;
  forType: Type;
  associatedTypes: Map<string, Type>;
  methods: Map<string, Function>;
}

// Resolve associated type
function resolveAssociatedType(
  type: Type,
  trait: TraitRef,
  assocName: string
): Type {
  const impl = findTraitImpl(type, trait);
  if (!impl) throw new Error(`No impl of ${trait} for ${type}`);

  const assocType = impl.associatedTypes.get(assocName);
  if (!assocType) throw new Error(`Associated type ${assocName} not found`);

  return assocType;
}
```

## Higher-Kinded Types

```typescript
// Higher-kinded types: types that take type constructors as parameters

// Kind system
type Kind =
  | { kind: 'type' }                    // * - concrete type
  | { kind: 'arrow'; from: Kind; to: Kind };  // * -> * - type constructor

// Example: Functor takes a type constructor F : * -> *
trait Functor<F: * -> *> {
  fn map<A, B>(fa: F<A>, f: A -> B) -> F<B>;
}

// Implementation
interface HigherKindedType {
  name: string;
  kind: Kind;
}

function checkKind(type: Type, expectedKind: Kind): boolean {
  const actualKind = inferKind(type);
  return kindsEqual(actualKind, expectedKind);
}

function inferKind(type: Type): Kind {
  if (type.kind === 'typeParam') {
    return type.declaredKind;
  }
  if (type.kind === 'application') {
    // F<A> : check F : K1 -> K2 and A : K1, result is K2
    const fnKind = inferKind(type.constructor);
    if (fnKind.kind !== 'arrow') throw new Error('Expected type constructor');
    checkKind(type.arg, fnKind.from);
    return fnKind.to;
  }
  // ... other cases
}
```

## Workflow

1. **Design generic syntax** - Type parameters, bounds, where clauses
2. **Implement type system** - Generic types, instantiation
3. **Add bounds checking** - Verify trait bounds
4. **Implement variance** - Covariance, contravariance
5. **Choose compilation** - Monomorphization or erasure
6. **Add associated types** - If using traits
7. **Consider HKT** - For advanced use cases
8. **Generate tests** - Bounds, variance, compilation

## Best Practices Applied

- Clear separation of type checking and compilation
- Efficient monomorphization with deduplication
- Proper variance inference and checking
- Clear error messages for bound violations
- Support for type inference with generics
- Incremental compilation support

## References

- Rust Generics: https://doc.rust-lang.org/book/ch10-00-generics.html
- Java Generics: https://docs.oracle.com/javase/tutorial/java/generics/
- Type Classes vs Objects: https://www.cs.cmu.edu/~rwh/papers/objects/popl93.pdf
- Higher-Kinded Types: https://typelevel.org/blog/2016/08/21/hkts-moving-forward.html

## Target Processes

- generics-polymorphism.js
- type-system-implementation.js
- code-generation-llvm.js
- ir-design.js
