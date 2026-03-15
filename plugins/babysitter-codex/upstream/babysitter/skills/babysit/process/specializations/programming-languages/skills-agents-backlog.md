# Programming Languages and Compilers Development - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Programming Languages processes beyond general-purpose capabilities. These tools would provide domain-specific expertise for lexer/parser development, AST manipulation, type systems, compiler backends, LLVM integration, interpreter implementation, and language server protocol support.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 25 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for compiler construction, language design, and language tooling development.

### Goals
- Provide deep expertise in lexical analysis, parsing algorithms, and grammar design
- Enable AST manipulation and tree transformation with specialized patterns
- Support sophisticated type system implementation including inference algorithms
- Integrate with LLVM for native code generation and optimization
- Provide interpreter and virtual machine implementation expertise
- Support Language Server Protocol (LSP) and Debug Adapter Protocol (DAP) development
- Enable memory management (GC) and JIT compilation expertise

---

## Skills Backlog

### SK-001: Lexer Generator Skill
**Slug**: `lexer-generator`
**Category**: Compiler Frontend

**Description**: Expert skill for generating and hand-writing lexers using various approaches including DFA-based lexers, table-driven lexers, and hand-written recursive lexers.

**Capabilities**:
- Generate lexer from regular expression specifications
- Implement maximal munch tokenization
- Handle Unicode character classes and normalization
- Implement efficient keyword recognition (tries, perfect hashing)
- Support incremental/resumable lexing for IDE integration
- Generate lexer tables and state machines
- Handle lexer modes and contexts (e.g., string interpolation)
- Implement error recovery with skip-to-next strategies

**Process Integration**:
- lexer-implementation.js
- language-grammar-design.js
- lsp-server-implementation.js
- repl-development.js

**Dependencies**: Flex-like generators, RE2/Hyperscan libraries

---

### SK-002: Parser Generator Skill
**Slug**: `parser-generator`
**Category**: Compiler Frontend

**Description**: Expert skill for parser generation and implementation using LL, LR, LALR, PEG, and Pratt parsing techniques.

**Capabilities**:
- Generate parsers from grammar specifications (ANTLR, Bison, tree-sitter)
- Implement recursive descent parsers with predictive parsing
- Implement Pratt parsers for expression handling
- Generate LALR/GLR parse tables
- Implement PEG parsers with packrat memoization
- Handle grammar conflicts (shift-reduce, reduce-reduce)
- Generate concrete syntax trees (CST) and AST transformations
- Implement operator precedence parsing

**Process Integration**:
- parser-development.js
- language-grammar-design.js
- ast-design.js
- lsp-server-implementation.js

**Dependencies**: ANTLR4, tree-sitter, Bison/Yacc

---

### SK-003: AST Manipulation Skill
**Slug**: `ast-manipulation`
**Category**: Compiler Infrastructure

**Description**: Expert skill for abstract syntax tree design, traversal, transformation, and manipulation patterns.

**Capabilities**:
- Design typed AST node hierarchies
- Implement visitor and transformer patterns
- Build AST rewriting systems
- Implement AST diffing and patching
- Generate AST pretty-printers and formatters
- Support AST serialization (JSON, binary)
- Implement pattern matching on AST structures
- Design span/location tracking systems

**Process Integration**:
- ast-design.js
- semantic-analysis.js
- ir-design.js
- code-generation-llvm.js
- lsp-server-implementation.js
- macro-system-implementation.js

**Dependencies**: None (core skill)

---

### SK-004: Type Theory Skill
**Slug**: `type-theory`
**Category**: Type Systems

**Description**: Expert skill in type theory foundations for implementing type systems including inference, checking, and subtyping.

**Capabilities**:
- Implement Hindley-Milner type inference with Algorithm W
- Implement constraint-based type inference with unification
- Design and implement bidirectional type checking
- Implement structural and nominal subtyping
- Handle variance (covariant, contravariant, invariant)
- Implement row polymorphism and record types
- Design flow-sensitive type narrowing
- Implement type error message generation

**Process Integration**:
- type-system-implementation.js
- semantic-analysis.js
- generics-polymorphism.js
- effect-system-design.js

**Dependencies**: Academic type theory literature

---

### SK-005: LLVM Backend Skill
**Slug**: `llvm-backend`
**Category**: Code Generation

**Description**: Expert skill for LLVM integration including IR generation, optimization passes, and native code emission.

**Capabilities**:
- Generate LLVM IR from high-level AST/IR
- Configure and run LLVM optimization passes
- Implement custom LLVM passes
- Handle LLVM type system mapping
- Generate debug information (DWARF)
- Configure target machine and code generation options
- Implement LLVM JIT (ORC, MCJIT) integration
- Handle cross-compilation target triples

**Process Integration**:
- code-generation-llvm.js
- jit-compiler-development.js
- debugger-adapter-development.js
- ir-design.js

**Dependencies**: LLVM C++ API, llvm-sys bindings

---

### SK-006: SSA/IR Design Skill
**Slug**: `ssa-ir-design`
**Category**: Compiler Middle-end

**Description**: Expert skill for designing intermediate representations and implementing SSA (Static Single Assignment) construction.

**Capabilities**:
- Design control flow graph (CFG) structures
- Implement dominance tree computation
- Implement SSA construction algorithms (Cytron et al.)
- Design phi function placement and pruning
- Implement SSA destruction for register allocation
- Design sea-of-nodes IR representations
- Implement basic block reordering
- Design IR verification passes

**Process Integration**:
- ir-design.js
- code-generation-llvm.js
- jit-compiler-development.js
- semantic-analysis.js

**Dependencies**: Compiler optimization textbooks

---

### SK-007: Register Allocation Skill
**Slug**: `register-allocation`
**Category**: Code Generation

**Description**: Expert skill for register allocation algorithms including graph coloring, linear scan, and spill code generation.

**Capabilities**:
- Implement graph coloring register allocation
- Implement linear scan register allocation
- Generate spill code with minimal overhead
- Handle calling convention register constraints
- Implement register coalescing
- Handle pre-colored nodes and fixed registers
- Implement live range splitting
- Design register pressure analysis

**Process Integration**:
- jit-compiler-development.js
- code-generation-llvm.js
- bytecode-vm-implementation.js

**Dependencies**: None (algorithmic skill)

---

### SK-008: Garbage Collection Skill
**Slug**: `garbage-collection`
**Category**: Memory Management

**Description**: Expert skill for garbage collector design and implementation including various collection algorithms.

**Capabilities**:
- Implement mark-sweep collection
- Implement copying/semi-space collectors
- Implement generational collection with write barriers
- Implement concurrent/incremental marking (tri-color)
- Design object header layouts and type info
- Implement precise vs conservative root scanning
- Design card table and remembered set implementations
- Implement finalizers and weak references

**Process Integration**:
- garbage-collector-implementation.js
- memory-allocator-design.js
- interpreter-implementation.js
- bytecode-vm-implementation.js

**Dependencies**: GC Handbook literature

---

### SK-009: Memory Allocator Skill
**Slug**: `memory-allocator`
**Category**: Memory Management

**Description**: Expert skill for custom memory allocator design optimized for language runtime needs.

**Capabilities**:
- Implement bump/arena allocators
- Implement free-list allocators with size classes
- Design slab allocators for fixed-size objects
- Implement thread-local allocation buffers (TLAB)
- Handle large object allocation strategies
- Implement memory pooling and recycling
- Design memory profiling and statistics
- Implement address space layout optimization

**Process Integration**:
- memory-allocator-design.js
- garbage-collector-implementation.js
- interpreter-implementation.js
- bytecode-vm-implementation.js

**Dependencies**: jemalloc, tcmalloc references

---

### SK-010: Bytecode VM Skill
**Slug**: `bytecode-vm`
**Category**: Runtime

**Description**: Expert skill for bytecode virtual machine design including instruction set design, dispatch mechanisms, and stack/register architectures.

**Capabilities**:
- Design bytecode instruction sets
- Implement stack-based vs register-based VMs
- Implement efficient dispatch (switch, computed goto, threaded)
- Design compact bytecode encoding
- Implement bytecode verification
- Handle exception handling in bytecode
- Design inline caching for dynamic dispatch
- Implement bytecode serialization/deserialization

**Process Integration**:
- bytecode-vm-implementation.js
- interpreter-implementation.js
- jit-compiler-development.js
- repl-development.js

**Dependencies**: VM implementation literature

---

### SK-011: JIT Compilation Skill
**Slug**: `jit-compilation`
**Category**: Runtime Optimization

**Description**: Expert skill for just-in-time compilation including profiling, tiered compilation, and deoptimization.

**Capabilities**:
- Implement execution profiling and hot path detection
- Design tiered compilation strategies (baseline + optimizing)
- Implement on-stack replacement (OSR)
- Implement speculative optimizations with guards
- Design deoptimization frame reconstruction
- Implement inline caching and type feedback
- Design code cache management and eviction
- Implement method inlining heuristics

**Process Integration**:
- jit-compiler-development.js
- bytecode-vm-implementation.js
- interpreter-implementation.js

**Dependencies**: V8/HotSpot architecture references

---

### SK-012: Language Server Protocol Skill
**Slug**: `lsp-protocol`
**Category**: Tooling

**Description**: Expert skill for implementing Language Server Protocol servers with full IDE feature support.

**Capabilities**:
- Implement JSON-RPC transport layer
- Handle document synchronization (full and incremental)
- Implement semantic tokens for syntax highlighting
- Implement completion with resolve
- Implement hover information with type signatures
- Implement go-to-definition/references/implementations
- Implement document symbols and workspace symbols
- Implement rename with cross-file support
- Implement code actions and quick fixes
- Implement signature help

**Process Integration**:
- lsp-server-implementation.js
- debugger-adapter-development.js
- error-message-enhancement.js
- semantic-analysis.js

**Dependencies**: LSP specification, vscode-languageserver

---

### SK-013: Debug Adapter Protocol Skill
**Slug**: `dap-protocol`
**Category**: Tooling

**Description**: Expert skill for implementing Debug Adapter Protocol for debugger integration.

**Capabilities**:
- Implement DAP message handling
- Implement breakpoint management (line, conditional, function)
- Implement stepping (step in/out/over, continue)
- Implement stack trace retrieval
- Implement variable inspection and watch expressions
- Implement expression evaluation in debug context
- Handle launch vs attach configurations
- Implement exception breakpoints
- Support multi-threaded debugging

**Process Integration**:
- debugger-adapter-development.js
- lsp-server-implementation.js
- interpreter-implementation.js
- bytecode-vm-implementation.js

**Dependencies**: DAP specification, vscode-debugadapter

---

### SK-014: Error Message Skill
**Slug**: `error-messages`
**Category**: User Experience

**Description**: Expert skill for designing and implementing high-quality compiler error messages.

**Capabilities**:
- Design clear, actionable error message templates
- Implement source context display with underlines
- Generate fix suggestions and quick fixes
- Handle error cascades and suppression
- Implement multi-span error annotations
- Support machine-readable error output (JSON)
- Implement color/styled terminal output
- Design error recovery strategies for better diagnostics

**Process Integration**:
- error-message-enhancement.js
- parser-development.js
- type-system-implementation.js
- semantic-analysis.js
- lsp-server-implementation.js

**Dependencies**: Elm/Rust error message guidelines

---

### SK-015: Source Map Skill
**Slug**: `source-maps`
**Category**: Tooling

**Description**: Expert skill for generating and consuming source maps for debugging compiled code.

**Capabilities**:
- Generate source maps in various formats (V3 JSON, DWARF)
- Map generated positions to original source
- Handle inlined functions in source maps
- Implement source map composition/chaining
- Generate VLQ-encoded mappings
- Support names array for identifiers
- Handle multi-file source map indices
- Integrate with debuggers and stack traces

**Process Integration**:
- source-map-generation.js
- code-generation-llvm.js
- debugger-adapter-development.js
- jit-compiler-development.js

**Dependencies**: Source map V3 specification

---

### SK-016: FFI Design Skill
**Slug**: `ffi-design`
**Category**: Interoperability

**Description**: Expert skill for designing and implementing foreign function interfaces to native code.

**Capabilities**:
- Design FFI declaration syntax
- Implement type marshaling between languages
- Handle C calling conventions (cdecl, stdcall, fastcall)
- Implement callback support (native calling managed)
- Handle string encoding conversions
- Implement struct layout matching (padding, alignment)
- Design memory ownership transfer rules
- Support dynamic library loading

**Process Integration**:
- ffi-implementation.js
- interpreter-implementation.js
- bytecode-vm-implementation.js
- code-generation-llvm.js

**Dependencies**: libffi, platform ABI documentation

---

### SK-017: Macro System Skill
**Slug**: `macro-systems`
**Category**: Metaprogramming

**Description**: Expert skill for designing and implementing macro systems including hygienic macros.

**Capabilities**:
- Design macro invocation syntax
- Implement pattern-based macro matching
- Implement hygienic macro expansion (marks, scopes)
- Handle macro-generated identifier collision
- Implement procedural/syntax macros
- Design quasi-quotation systems
- Handle macro debugging and error reporting
- Implement macro expansion tracing

**Process Integration**:
- macro-system-implementation.js
- parser-development.js
- semantic-analysis.js

**Dependencies**: Scheme macros literature

---

### SK-018: Module System Skill
**Slug**: `module-systems`
**Category**: Language Features

**Description**: Expert skill for designing module systems including resolution, loading, and visibility.

**Capabilities**:
- Design module/import/export syntax
- Implement module resolution algorithms
- Handle cyclic module dependencies
- Implement visibility/access control
- Design namespace management
- Support module aliases and re-exports
- Implement lazy/on-demand module loading
- Design package/crate system integration

**Process Integration**:
- module-system-design.js
- semantic-analysis.js
- interpreter-implementation.js
- lsp-server-implementation.js

**Dependencies**: ES modules, Rust modules references

---

### SK-019: Pattern Matching Skill
**Slug**: `pattern-matching`
**Category**: Language Features

**Description**: Expert skill for implementing pattern matching including exhaustiveness checking and compilation to decision trees.

**Capabilities**:
- Parse pattern syntax (constructor, wildcard, binding)
- Implement exhaustiveness and usefulness checking
- Compile patterns to decision trees
- Implement guard clause handling
- Design or-patterns and as-patterns
- Implement nested pattern matching
- Optimize pattern match coverage
- Generate efficient match dispatch code

**Process Integration**:
- pattern-matching-implementation.js
- parser-development.js
- code-generation-llvm.js
- interpreter-implementation.js

**Dependencies**: ML pattern matching literature

---

### SK-020: Concurrency Primitives Skill
**Slug**: `concurrency-primitives`
**Category**: Runtime

**Description**: Expert skill for implementing language-level concurrency support including threads, channels, and synchronization.

**Capabilities**:
- Design threading API and primitives
- Implement mutex and condition variables
- Implement channel-based message passing
- Design async/await and coroutine systems
- Implement work-stealing schedulers
- Handle thread-local storage
- Design memory model and ordering
- Implement green threads/goroutines

**Process Integration**:
- concurrency-primitives.js
- interpreter-implementation.js
- bytecode-vm-implementation.js
- garbage-collector-implementation.js

**Dependencies**: Concurrency theory, Go scheduler references

---

### SK-021: REPL Development Skill
**Slug**: `repl-development`
**Category**: Tooling

**Description**: Expert skill for building interactive REPLs with rich editing and evaluation features.

**Capabilities**:
- Implement readline integration with history
- Handle multi-line input detection
- Implement tab completion for identifiers
- Design incremental compilation for REPL
- Handle top-level expression evaluation
- Implement persistent REPL state
- Design pretty-printing for values
- Support special REPL commands (:help, :type, etc.)

**Process Integration**:
- repl-development.js
- interpreter-implementation.js
- lsp-server-implementation.js

**Dependencies**: rustyline, readline libraries

---

### SK-022: Grammar Design Skill
**Slug**: `grammar-design`
**Category**: Language Design

**Description**: Expert skill for formal grammar design including disambiguation, precedence, and validation.

**Capabilities**:
- Write EBNF/BNF grammar specifications
- Design unambiguous grammars
- Handle operator precedence and associativity
- Analyze grammar conflicts
- Design grammar for specific parser classes (LL, LR, PEG)
- Document grammar with examples
- Design syntax for common language constructs
- Handle grammar evolution and backwards compatibility

**Process Integration**:
- language-grammar-design.js
- lexer-implementation.js
- parser-development.js

**Dependencies**: Parsing theory literature

---

### SK-023: Effect System Skill
**Slug**: `effect-systems`
**Category**: Type Systems

**Description**: Expert skill for designing and implementing algebraic effect systems.

**Capabilities**:
- Design effect annotation syntax
- Implement effect inference
- Implement effect checking and tracking
- Design effect handlers (algebraic effects)
- Handle effect polymorphism
- Implement effect rows and extensibility
- Design effect subtyping
- Generate effect-based optimizations

**Process Integration**:
- effect-system-design.js
- type-system-implementation.js
- concurrency-primitives.js

**Dependencies**: Effect systems research literature

---

### SK-024: Generics Implementation Skill
**Slug**: `generics-impl`
**Category**: Type Systems

**Description**: Expert skill for implementing parametric polymorphism including monomorphization and type erasure.

**Capabilities**:
- Design generic syntax and type parameter bounds
- Implement monomorphization (Rust-style)
- Implement type erasure (Java-style)
- Handle variance in generic types
- Implement higher-kinded types (if applicable)
- Design trait/interface bounds
- Handle associated types
- Implement generic method dispatch

**Process Integration**:
- generics-polymorphism.js
- type-system-implementation.js
- code-generation-llvm.js
- ir-design.js

**Dependencies**: Generic programming literature

---

### SK-025: Tree-sitter Skill
**Slug**: `tree-sitter`
**Category**: Tooling

**Description**: Expert skill for creating tree-sitter grammars for incremental parsing and syntax highlighting.

**Capabilities**:
- Write tree-sitter grammar.js files
- Handle tree-sitter external scanners
- Design queries for syntax highlighting
- Implement incremental parsing support
- Handle tree-sitter error recovery
- Generate bindings for various languages
- Integrate with editors (VS Code, Neovim, Helix)
- Test grammars with corpus files

**Process Integration**:
- language-grammar-design.js
- lexer-implementation.js
- parser-development.js
- lsp-server-implementation.js

**Dependencies**: tree-sitter CLI, tree-sitter crates

---

---

## Agents Backlog

### AG-001: Compiler Frontend Architect Agent
**Slug**: `compiler-frontend-architect`
**Category**: Language Design

**Description**: Senior compiler frontend expert specializing in lexer, parser, and AST design with deep knowledge of parsing theory.

**Expertise Areas**:
- Formal grammar design and analysis
- Parsing algorithm selection (LL, LR, LALR, PEG, Pratt)
- Lexer optimization and Unicode handling
- AST design patterns and best practices
- Error recovery and diagnostic generation
- Incremental parsing for IDE support

**Persona**:
- Role: Principal Compiler Frontend Engineer
- Experience: 10+ years compiler development, multiple production language implementations
- Background: Dragon Book, Crafting Interpreters, academic parsing research

**Process Integration**:
- language-grammar-design.js (all phases)
- lexer-implementation.js (all phases)
- parser-development.js (all phases)
- ast-design.js (all phases)
- error-message-enhancement.js (all phases)

---

### AG-002: Type System Engineer Agent
**Slug**: `type-system-engineer`
**Category**: Type Theory

**Description**: Expert in type theory and type system implementation with deep knowledge of inference algorithms.

**Expertise Areas**:
- Hindley-Milner type inference
- Bidirectional type checking
- Subtyping and variance
- Dependent types fundamentals
- Type error diagnosis and localization
- Gradual typing and flow analysis
- Effect systems and algebraic effects

**Persona**:
- Role: Senior Type System Engineer
- Experience: 8+ years type system research and implementation
- Background: TAPL, ATTAPL, academic type theory, TypeScript/Flow/Rust compiler experience

**Process Integration**:
- type-system-implementation.js (all phases)
- semantic-analysis.js (type-related phases)
- generics-polymorphism.js (all phases)
- effect-system-design.js (all phases)

---

### AG-003: LLVM Compiler Engineer Agent
**Slug**: `llvm-engineer`
**Category**: Code Generation

**Description**: Expert in LLVM infrastructure for native code generation, optimization, and JIT compilation.

**Expertise Areas**:
- LLVM IR generation and semantics
- LLVM optimization pass configuration
- Custom LLVM pass development
- Debug information generation (DWARF, CodeView)
- Cross-compilation and target configuration
- ORC JIT implementation
- LLVM intrinsics and builtins

**Persona**:
- Role: Staff LLVM Compiler Engineer
- Experience: 8+ years LLVM development
- Background: Clang, Rust compiler, Julia, major LLVM-based language implementations

**Process Integration**:
- code-generation-llvm.js (all phases)
- ir-design.js (LLVM-related phases)
- jit-compiler-development.js (codegen phases)
- debugger-adapter-development.js (debug info)

---

### AG-004: Runtime Systems Engineer Agent
**Slug**: `runtime-systems-engineer`
**Category**: Runtime

**Description**: Expert in language runtime implementation including memory management, GC, and virtual machines.

**Expertise Areas**:
- Garbage collector algorithms and implementation
- Memory allocator design
- Bytecode VM architecture
- JIT compilation strategies
- Runtime profiling and optimization
- Thread and concurrency support
- FFI and native code interop

**Persona**:
- Role: Principal Runtime Engineer
- Experience: 10+ years VM and runtime development
- Background: V8, HotSpot JVM, PyPy, Ruby MRI/JRuby experience

**Process Integration**:
- interpreter-implementation.js (all phases)
- bytecode-vm-implementation.js (all phases)
- garbage-collector-implementation.js (all phases)
- memory-allocator-design.js (all phases)
- jit-compiler-development.js (runtime phases)
- concurrency-primitives.js (all phases)

---

### AG-005: Language Tooling Engineer Agent
**Slug**: `language-tooling-engineer`
**Category**: Tooling

**Description**: Expert in language tooling including LSP servers, debugger adapters, and development environments.

**Expertise Areas**:
- Language Server Protocol implementation
- Debug Adapter Protocol implementation
- Incremental compilation for IDE
- Code completion and IntelliSense
- Refactoring operations
- Source map generation
- REPL development

**Persona**:
- Role: Senior Language Tooling Engineer
- Experience: 7+ years IDE and tooling development
- Background: Rust Analyzer, TypeScript language server, VS Code extension development

**Process Integration**:
- lsp-server-implementation.js (all phases)
- debugger-adapter-development.js (all phases)
- repl-development.js (all phases)
- source-map-generation.js (all phases)
- error-message-enhancement.js (tooling phases)

---

### AG-006: JIT Compiler Specialist Agent
**Slug**: `jit-specialist`
**Category**: Runtime Optimization

**Description**: Expert in just-in-time compilation techniques including profiling, tiered compilation, and speculative optimization.

**Expertise Areas**:
- Profiling and hot path detection
- Tiered compilation architectures
- Speculative optimization and guards
- Deoptimization and bailout handling
- Inline caching and type feedback
- On-stack replacement (OSR)
- Code cache management

**Persona**:
- Role: Staff JIT Compiler Engineer
- Experience: 8+ years JIT development
- Background: V8 TurboFan, HotSpot C2, GraalVM, LuaJIT experience

**Process Integration**:
- jit-compiler-development.js (all phases)
- bytecode-vm-implementation.js (JIT phases)
- interpreter-implementation.js (optimization phases)

---

### AG-007: Memory Management Expert Agent
**Slug**: `memory-management-expert`
**Category**: Memory Management

**Description**: Expert in garbage collection and memory allocation for language runtimes.

**Expertise Areas**:
- GC algorithm selection and tradeoffs
- Generational and concurrent collection
- Write barrier implementation
- Object layout and header design
- Memory allocator strategies
- Heap profiling and analysis
- Memory leak detection

**Persona**:
- Role: Principal Memory Management Engineer
- Experience: 8+ years GC and allocator development
- Background: GC Handbook authors, V8 GC team, Go GC, Azul C4 experience

**Process Integration**:
- garbage-collector-implementation.js (all phases)
- memory-allocator-design.js (all phases)
- interpreter-implementation.js (memory phases)
- bytecode-vm-implementation.js (memory phases)

---

### AG-008: Semantic Analysis Engineer Agent
**Slug**: `semantic-analysis-engineer`
**Category**: Compiler Frontend

**Description**: Expert in semantic analysis including name resolution, scope analysis, and symbol table management.

**Expertise Areas**:
- Symbol table design and implementation
- Name resolution algorithms
- Scope and visibility rules
- Forward reference handling
- Semantic validation rules
- Control flow analysis
- Data flow analysis basics

**Persona**:
- Role: Senior Semantic Analysis Engineer
- Experience: 7+ years compiler frontend development
- Background: Multi-pass compiler experience, IDE semantic analysis

**Process Integration**:
- semantic-analysis.js (all phases)
- type-system-implementation.js (environment phases)
- module-system-design.js (resolution phases)
- lsp-server-implementation.js (semantic phases)

---

### AG-009: IR Design Specialist Agent
**Slug**: `ir-design-specialist`
**Category**: Compiler Middle-end

**Description**: Expert in intermediate representation design and SSA construction for compiler optimization.

**Expertise Areas**:
- SSA form construction and destruction
- Control flow graph algorithms
- Dominance computation
- IR design tradeoffs (sea-of-nodes, basic blocks)
- Optimization pass design
- IR verification
- Phi function placement

**Persona**:
- Role: Staff Compiler IR Engineer
- Experience: 7+ years IR and optimization development
- Background: LLVM IR, Graal IR, academic compiler optimization

**Process Integration**:
- ir-design.js (all phases)
- code-generation-llvm.js (IR phases)
- jit-compiler-development.js (IR phases)

---

### AG-010: Language Feature Designer Agent
**Slug**: `language-feature-designer`
**Category**: Language Design

**Description**: Expert in programming language feature design with knowledge of prior art and implementation tradeoffs.

**Expertise Areas**:
- Pattern matching design and implementation
- Module system design
- Macro system design (hygienic, procedural)
- Generics and polymorphism design
- Effect system design
- Error handling mechanisms
- Concurrency primitives design

**Persona**:
- Role: Principal Language Designer
- Experience: 10+ years language design and implementation
- Background: Academic PL research, multiple production language involvement

**Process Integration**:
- pattern-matching-implementation.js (all phases)
- module-system-design.js (all phases)
- macro-system-implementation.js (all phases)
- generics-polymorphism.js (design phases)
- effect-system-design.js (design phases)
- concurrency-primitives.js (design phases)

---

### AG-011: Performance Engineer Agent
**Slug**: `compiler-performance-engineer`
**Category**: Performance

**Description**: Expert in compiler and runtime performance analysis, benchmarking, and optimization.

**Expertise Areas**:
- Compiler performance profiling
- Runtime benchmarking methodology
- Hot path identification
- Memory usage optimization
- Startup time optimization
- Compilation speed optimization
- Performance regression testing

**Persona**:
- Role: Senior Performance Engineer
- Experience: 6+ years performance engineering
- Background: Benchmark development, profiler development, perf optimization

**Process Integration**:
- All processes (benchmarking phases)
- jit-compiler-development.js (performance phases)
- garbage-collector-implementation.js (performance phases)
- bytecode-vm-implementation.js (performance phases)

---

### AG-012: FFI and Interop Engineer Agent
**Slug**: `ffi-interop-engineer`
**Category**: Interoperability

**Description**: Expert in foreign function interfaces and language interoperability.

**Expertise Areas**:
- C ABI and calling conventions
- Type marshaling strategies
- Callback and closure handling
- Memory ownership across boundaries
- Dynamic library loading
- Platform-specific considerations
- Safety and sandboxing

**Persona**:
- Role: Senior FFI Engineer
- Experience: 6+ years native interop development
- Background: Python ctypes/cffi, Rust FFI, JNI, Node.js N-API experience

**Process Integration**:
- ffi-implementation.js (all phases)
- interpreter-implementation.js (FFI phases)
- bytecode-vm-implementation.js (FFI phases)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| language-grammar-design.js | SK-022, SK-001, SK-002, SK-025 | AG-001 |
| lexer-implementation.js | SK-001, SK-014, SK-025 | AG-001 |
| parser-development.js | SK-002, SK-003, SK-014 | AG-001 |
| ast-design.js | SK-003, SK-014 | AG-001, AG-008 |
| type-system-implementation.js | SK-004, SK-024, SK-014 | AG-002 |
| semantic-analysis.js | SK-003, SK-004, SK-018 | AG-008, AG-002 |
| ir-design.js | SK-006, SK-003 | AG-009, AG-003 |
| code-generation-llvm.js | SK-005, SK-006, SK-007, SK-015 | AG-003 |
| interpreter-implementation.js | SK-010, SK-009, SK-016 | AG-004 |
| repl-development.js | SK-021, SK-001, SK-012 | AG-005, AG-004 |
| bytecode-vm-implementation.js | SK-010, SK-011, SK-009 | AG-004, AG-006 |
| jit-compiler-development.js | SK-011, SK-007, SK-005, SK-006 | AG-006, AG-003 |
| garbage-collector-implementation.js | SK-008, SK-009 | AG-007 |
| memory-allocator-design.js | SK-009, SK-008 | AG-007 |
| concurrency-primitives.js | SK-020, SK-009 | AG-004, AG-010 |
| lsp-server-implementation.js | SK-012, SK-003, SK-014 | AG-005 |
| debugger-adapter-development.js | SK-013, SK-015, SK-012 | AG-005 |
| error-message-enhancement.js | SK-014, SK-012 | AG-001, AG-005 |
| source-map-generation.js | SK-015, SK-005 | AG-005, AG-003 |
| ffi-implementation.js | SK-016, SK-009 | AG-012 |
| macro-system-implementation.js | SK-017, SK-003, SK-002 | AG-010, AG-001 |
| module-system-design.js | SK-018, SK-003 | AG-010, AG-008 |
| pattern-matching-implementation.js | SK-019, SK-002, SK-003 | AG-010, AG-001 |
| generics-polymorphism.js | SK-024, SK-004 | AG-002, AG-010 |
| effect-system-design.js | SK-023, SK-004 | AG-002, AG-010 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-003 | AST Manipulation | Code Analysis, Static Analysis, IDE Development |
| SK-012 | Language Server Protocol | IDE Development, Web Development, Any Language Tooling |
| SK-013 | Debug Adapter Protocol | IDE Development, DevOps, Any Debugging |
| SK-014 | Error Messages | All development specializations |
| SK-015 | Source Maps | Web Development, Mobile Development |
| SK-016 | FFI Design | Embedded Systems, Systems Programming |
| SK-020 | Concurrency Primitives | Systems Programming, Backend Development |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-005 | Language Tooling Engineer | IDE Development, Web Development |
| AG-011 | Performance Engineer | All performance-critical specializations |
| AG-012 | FFI and Interop Engineer | Embedded Systems, Systems Programming |

---

## Implementation Priority

### Phase 1: Core Compiler Skills (Highest Impact)
1. **SK-001**: Lexer Generator - Foundation for all language processing
2. **SK-002**: Parser Generator - Essential for syntax analysis
3. **SK-003**: AST Manipulation - Core data structure handling
4. **SK-004**: Type Theory - Critical for typed languages
5. **SK-022**: Grammar Design - Language design foundation

### Phase 2: Core Compiler Agents (Highest Impact)
1. **AG-001**: Compiler Frontend Architect - Highest process coverage for frontend
2. **AG-002**: Type System Engineer - Critical for semantic analysis
3. **AG-004**: Runtime Systems Engineer - Essential for execution

### Phase 3: Code Generation & Runtime
1. **SK-005**: LLVM Backend - Native code generation
2. **SK-006**: SSA/IR Design - Optimization foundation
3. **SK-010**: Bytecode VM - Interpreter performance
4. **SK-011**: JIT Compilation - Runtime optimization
5. **AG-003**: LLVM Compiler Engineer
6. **AG-006**: JIT Compiler Specialist

### Phase 4: Memory Management
1. **SK-008**: Garbage Collection - Automatic memory management
2. **SK-009**: Memory Allocator - Performance-critical allocation
3. **AG-007**: Memory Management Expert

### Phase 5: Language Tooling
1. **SK-012**: Language Server Protocol - IDE integration
2. **SK-013**: Debug Adapter Protocol - Debugging support
3. **SK-014**: Error Messages - User experience
4. **SK-021**: REPL Development - Interactive development
5. **AG-005**: Language Tooling Engineer

### Phase 6: Advanced Language Features
1. **SK-017**: Macro Systems - Metaprogramming
2. **SK-018**: Module Systems - Code organization
3. **SK-019**: Pattern Matching - Advanced features
4. **SK-023**: Effect Systems - Advanced type features
5. **SK-024**: Generics Implementation - Polymorphism
6. **AG-010**: Language Feature Designer

### Phase 7: Infrastructure & Performance
1. **SK-007**: Register Allocation - Code quality
2. **SK-015**: Source Maps - Debugging infrastructure
3. **SK-016**: FFI Design - Native interop
4. **SK-020**: Concurrency Primitives - Parallelism
5. **SK-025**: Tree-sitter - Editor integration
6. **AG-008**: Semantic Analysis Engineer
7. **AG-009**: IR Design Specialist
8. **AG-011**: Performance Engineer
9. **AG-012**: FFI and Interop Engineer

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 25 |
| Agents Identified | 12 |
| Shared Skill Candidates | 7 |
| Shared Agent Candidates | 3 |
| Total Processes Covered | 25 |

---

**Created**: 2026-01-24
**Version**: 1.1.0
**Status**: Phase 6 - All Skills and Agents Implemented
**Completed**: 2026-01-24
