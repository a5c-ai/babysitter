# Generics Implementation Skill

Implement parametric polymorphism for programming languages including type parameters, bounds, variance, and compilation strategies.

## Overview

This skill provides expertise in implementing generics/parametric polymorphism. It covers the full spectrum from basic type parameters to advanced features like higher-kinded types, with support for different compilation strategies.

## When to Use

- Adding generics to a language
- Implementing monomorphization or type erasure
- Designing trait/interface bounds
- Handling variance with generics

## Expertise Areas

### Type Parameters

Core generic features:
- Type parameter syntax and parsing
- Type instantiation and application
- Default type parameters
- Const generics (value parameters)

### Bounds and Constraints

Type constraints:
- Trait/interface bounds
- Where clauses
- Multiple bounds
- Associated type constraints

### Compilation Strategies

Three main approaches:
- Monomorphization (C++, Rust)
- Type erasure (Java, TypeScript)
- Dictionary passing (Haskell, Swift)

### Variance

Subtyping with generics:
- Covariance, contravariance, invariance
- Variance inference
- Use-site vs declaration-site variance

## Quick Start

### Rust-Style Monomorphization

```json
{
  "compilationStrategy": "monomorphization",
  "features": [
    "type-parameters",
    "trait-bounds",
    "associated-types",
    "where-clauses",
    "const-generics"
  ],
  "varianceModel": "inferred"
}
```

### Java-Style Erasure

```json
{
  "compilationStrategy": "erasure",
  "features": [
    "type-parameters",
    "trait-bounds",
    "variance"
  ],
  "varianceModel": "explicit",
  "boundsSystem": {
    "upperBounds": true,
    "lowerBounds": true,
    "wildcards": true
  }
}
```

### Haskell-Style Dictionary

```json
{
  "compilationStrategy": "dictionary",
  "features": [
    "type-parameters",
    "trait-bounds",
    "higher-kinded-types",
    "associated-types"
  ]
}
```

## Generated Components

### Type System

```typescript
interface GenericTypeSystem {
  // Parse and validate type parameters
  parseTypeParams(source: string): TypeParameter[];

  // Instantiate generic type with arguments
  instantiate(generic: GenericType, args: Type[]): Type;

  // Check bounds satisfaction
  checkBounds(type: Type, bounds: TypeBound[]): boolean;

  // Infer type arguments
  inferTypeArgs(generic: GenericType, context: TypeContext): Type[];
}
```

### Compilation

```typescript
interface GenericCompiler {
  // Monomorphization
  monomorphize(program: Program): MonomorphizedProgram;

  // Type erasure
  erase(program: Program): ErasedProgram;

  // Dictionary passing
  elaborateDictionaries(program: Program): DictionaryProgram;
}
```

## Generic Syntax Examples

### Basic Generics

```rust
// Generic struct
struct Box<T> {
    value: T
}

// Generic function
fn identity<T>(x: T) -> T {
    x
}

// Multiple type parameters
fn swap<A, B>(pair: (A, B)) -> (B, A) {
    (pair.1, pair.0)
}

// Type instantiation
let box: Box<i32> = Box { value: 42 };
let s: String = identity("hello".to_string());
```

### Bounds and Constraints

```rust
// Single bound
fn print<T: Display>(x: T) {
    println!("{}", x);
}

// Multiple bounds
fn compare<T: Ord + Display>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

// Where clause
fn complex<T, U>(t: T, u: U) -> String
where
    T: Clone + Debug,
    U: AsRef<str> + Send,
{
    format!("{:?}: {}", t.clone(), u.as_ref())
}

// Associated type constraint
fn sum<I>(iter: I) -> I::Item
where
    I: Iterator,
    I::Item: Add<Output = I::Item> + Default,
{
    iter.fold(I::Item::default(), |acc, x| acc + x)
}
```

### Variance Examples

```scala
// Covariant: can use subtype
class Producer[+T] {
    def produce(): T
}
// Producer[Dog] <: Producer[Animal]

// Contravariant: can use supertype
class Consumer[-T] {
    def consume(t: T): Unit
}
// Consumer[Animal] <: Consumer[Dog]

// Invariant: must be exact
class Container[T] {
    var value: T  // mutable = invariant
}
```

## Compilation Strategies

### Monomorphization

```
// Source
fn max<T: Ord>(a: T, b: T) -> T { if a > b { a } else { b } }

max(1, 2);
max("a", "b");

// Compiled (two specialized versions)
fn max_i32(a: i32, b: i32) -> i32 { if a > b { a } else { b } }
fn max_str(a: &str, b: &str) -> &str { if a > b { a } else { b } }

max_i32(1, 2);
max_str("a", "b");
```

**Pros**: Fast runtime, no boxing, full optimization
**Cons**: Code bloat, longer compile times

### Type Erasure

```
// Source (Java-like)
class Box<T> {
    T value;
    T get() { return value; }
}

Box<String> box = new Box<>();
String s = box.get();

// Compiled (erased to Object)
class Box {
    Object value;
    Object get() { return value; }
}

Box box = new Box();
String s = (String) box.get();  // Cast inserted
```

**Pros**: No code bloat, fast compilation
**Cons**: Runtime casts, no primitive specialization, lost type info

### Dictionary Passing

```
// Source (Haskell-like)
class Eq a where
    eq :: a -> a -> Bool

elem :: Eq a => a -> [a] -> Bool
elem x xs = any (eq x) xs

// Compiled (dictionary passed)
data EqDict a = EqDict { eq :: a -> a -> Bool }

elem :: EqDict a -> a -> [a] -> Bool
elem dict x xs = any (eq dict x) xs
```

**Pros**: Separate compilation, runtime polymorphism
**Cons**: Indirect calls, dictionary allocation

## Integration with Processes

| Process | Integration |
|---------|-------------|
| generics-polymorphism.js | Full generics implementation |
| type-system-implementation.js | Generic type checking |
| code-generation-llvm.js | Monomorphization codegen |
| ir-design.js | Generic IR representation |

## Advanced Features

### Associated Types

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<u32> { ... }
}

// Usage without naming concrete type
fn first<I: Iterator>(iter: &mut I) -> Option<I::Item> {
    iter.next()
}
```

### Higher-Kinded Types

```haskell
-- Functor takes a type constructor (* -> *)
class Functor f where
    fmap :: (a -> b) -> f a -> f b

-- Implementations for different type constructors
instance Functor Maybe where
    fmap f Nothing = Nothing
    fmap f (Just x) = Just (f x)

instance Functor [] where
    fmap = map
```

### Const Generics

```rust
// Type parameter that is a value, not a type
struct Array<T, const N: usize> {
    data: [T; N]
}

fn zeros<const N: usize>() -> Array<i32, N> {
    Array { data: [0; N] }
}

let arr: Array<i32, 5> = zeros();
```

## Error Messages

### Bound Not Satisfied

```
Error: The trait `Display` is not implemented for `MyType`

  fn print<T: Display>(x: T) { println!("{}", x); }
           ^^^^^^^^^
  print(MyType { value: 42 });
        ^^^^^^^^^^^^^^^^^^^^
        `MyType` does not implement `Display`

Help: Consider implementing `Display` for `MyType`:

  impl Display for MyType {
      fn fmt(&self, f: &mut Formatter) -> Result {
          write!(f, "MyType({})", self.value)
      }
  }
```

### Variance Error

```
Error: Invariant type used in covariant position

  struct Container<T> {
      value: Cell<T>  // Cell makes T invariant
  }

  fn upcast(c: Container<Dog>) -> Container<Animal> {
                                  ^^^^^^^^^^^^^^^^^
  Cannot convert Container<Dog> to Container<Animal>
  because Container<T> is invariant in T

Note: T appears in a mutable context (Cell<T>), making it invariant
```

## Best Practices

1. **Start Simple**: Basic generics first, add advanced features later
2. **Choose Strategy Early**: Monomorphization vs erasure affects design
3. **Variance by Default**: Infer variance when possible
4. **Clear Bound Errors**: Show what's missing and how to fix
5. **Avoid Code Bloat**: Track monomorphization size
6. **Support Inference**: Users shouldn't always specify type args

## References

- [Rust Generics](https://doc.rust-lang.org/book/ch10-00-generics.html)
- [Java Generics FAQ](http://www.angelikalanger.com/GenericsFAQ/JavaGenericsFAQ.html)
- [Variance in Scala](https://docs.scala-lang.org/tour/variances.html)
- [Higher-Kinded Types](https://typelevel.org/blog/2016/08/21/hkts-moving-forward.html)
- [Type Classes vs Objects](https://www.cs.cmu.edu/~rwh/papers/objects/popl93.pdf)
