# Unified Plugin System
## System Requirements and Technical Specification

Version: Draft v0.1
Status: Proposed implementation spec
Audience: Platform engineers, compiler/install/runtime engineers
Dependency note: This system depends on the hooks-proxy subsystem for portable hook execution and normalization.([developers.openai.com](https://developers.openai.com/codex/plugins/build))pe here.

---

## 1. Purpose

Build the next component of the unified framework around the Unified Plugin Format (UPF):

- validation
- compilation
- installation
- publishing support
- discovery metadata generation
- capability checks
- diagnostics
- verification of target support

This system consumes UPF source packages and produces target-native bundles plus installation and publishing artifacts.

This spec does **not** define the hooks-proxy runtime. Hooks-proxy is a dependency used by hook-capable targets.

---

## 2. Scope

### In scope

- UPF package ingestion and validation
- target capability profiles
- target compilers
- bundle generation
- installation planning
- target-native installation execution where possible
- catalog / marketplace artifact generation
- compatibility diagnostics
- support verification framework

### Out of scope

- hooks-proxy internals
- MCP protocol internals
- target-native in-process runtime APIs beyond what is needed for compiler mapping
- marketplace hosting infrastructure
- general-purpose remote execution or control plane

---

## 3. Key Design Decision

The system is a **source-package compiler and distribution framework**, not a universal runtime plugin ABI.

Reason:

- some ecosystems are primarily manifest-and-content bundle systems
- some ecosystems are in-process runtime plugin systems
- some ecosystems support only subsets of bundled component types
- some features exist in docs, examples, or repos before they are fully stable in runtime behavior

Therefore the system must separate:

1. canonical source package model
2. target capability profiles
3. target compilers
4. install and verification pipelines

---

## 4. Terminology

### Source package

A plugin package authored in UPF.

### Target profile

A machine-readable description of what a given harness or ecosystem supports.

### Compiler

A component that converts a UPF source package into a native target bundle.

### Bundle

The generated target-native installable or loadable package.

### Installer

A component that installs a target bundle into the target ecosystem.

### Catalog generator

A component that emits marketplace or discovery artifacts for a target.

### Verifier

A component that checks whether the target actually supports the emitted features in the current product version and environment.

---

## 5. High-Level Architecture

```text
UPF source package
  -> validator
  -> target capability resolver
  -> target compiler
  -> bundle artifact
  -> installer plan
  -> optional installer execution
  -> optional catalog generation
  -> diagnostics + verification report
```

Subsystems:

- manifest parser
- package validator
- capability registry
- compiler core
- target compilers
- installer core
- target installers
- verifier
- diagnostics engine
- catalog generators

---

## 6. Functional Requirements

### 6.1 Validation

The system must validate:

- UPF manifest structure
- component path existence
- component schema shape where applicable
- hook component declaration points to hooks-proxy-compatible structure
- settings schema references
- target overrides consistency

### 6.2 Compilation

The system must compile a source package into one or more target bundles.

The compiler must:

- select only target-supported components
- wire hooks through hooks-proxy where hooks are present
- emit target-native manifests and file layouts
- preserve package identity and versioning metadata
- preserve portable semantics where possible
- emit explicit degradation warnings where semantics are lossy or unsupported

### 6.3 Installation

The system must support:

- dry-run install plans
- target-native installation when possible
- fallback installation when the target lacks a native mechanism
- scope-aware installs when the target supports multiple scopes

### 6.4 Discovery and publishing support

The system must generate target-native catalog or marketplace metadata where supported.

### 6.5 Diagnostics

The system must surface:

- unsupported components
- lossy mappings
- namespacing conflicts
- missing runtime prerequisites
- version/support uncertainty

### 6.6 Verification

The system must support active verification of critical assumptions for third-party ecosystems.

This is required because target docs, examples, and runtime behavior may not always be perfectly aligned.

---

## 7. Non-Functional Requirements

- deterministic compiler output
- safe path handling across platforms
- explicit failure modes
- machine-readable diagnostics
- high testability using fixture corpora
- no silent success when features are only partially supported

---

## 8. Target Classes

### 8.1 Class A: content-bundle targets

Examples:

- Claude Code
- Codex
- Gemini CLI
- GitHub Copilot CLI
- Cursor

Characteristics:

- installable bundle or manifest-oriented ecosystem
- content-based component packaging
- target-native manifests and conventions
- varying support for hooks, agents, commands, MCP, skills

### 8.2 Class B: runtime-adapter targets

Examples:

- OpenCode
- pi / mono-pi coding agent
- oh-my-pi
- OpenClaw native plugins

Characteristics:

- in-process event/plugin runtime
- richer runtime APIs
- may require generated adapter code rather than pure content packaging

### 8.3 Class C: observer/gateway ecosystems

Examples:

- Hermes gateway hooks and similar surfaces

Characteristics:

- non-blocking or automation-first
- not a good fit for the initial plugin compiler scope

---

## 9. Target Capability Profiles

Each target must have a capability profile.

### 9.1 Profile schema

```ts
interface TargetCapabilityProfile {
  target: string;
  class: "content-bundle" | "runtime-adapter" | "observer";
  manifest: {
    required: boolean;
    filename?: string;
    location?: string;
  };
  components: {
    skills: SupportMode;
    agents: SupportMode;
    commands: SupportMode;
    hooks: SupportMode;
    mcpServers: SupportMode;
    apps: SupportMode;
    rules: SupportMode;
    context: SupportMode;
    assets: SupportMode;
    lspServers?: SupportMode;
    monitors?: SupportMode;
  };
  installScopes: string[];
  namespacing: {
    skills?: string;
    agents?: string;
    commands?: string;
  };
  catalogs: {
    supported: boolean;
    format?: string;
  };
  verification: {
    requiredChecks: string[];
    warnings: string[];
  };
}

type SupportMode = "native" | "emulated" | "lossy" | "verify" | "unsupported";
```

### 9.2 Important rule

Profiles must encode **real operational support**, not optimistic assumptions.

If product docs, examples, and runtime behavior are not fully aligned, the profile should use `verify` or `lossy`, not `native`.

---

## 10. Core Subsystems

## 10.1 Validator

Responsibilities:

- parse `a5c-plugin.json`
- validate required fields
- validate component paths
- validate duplicate identifiers
- validate target overrides
- validate settings schema references
- validate that hook components declare hooks-proxy runtime usage

Outputs:

- normalized package object
- validation errors
- validation warnings

## 10.2 Capability Registry

Responsibilities:

- store target capability profiles
- support versioned target profiles
- support runtime feature flags
- expose support lookup APIs to compilers and installers

## 10.3 Compiler Core

Responsibilities:

- orchestrate compilation pipeline
- merge source package with target profile and overrides
- compute degradation plan
- call target-specific compiler
- record diagnostics

## 10.4 Target Compiler

Responsibilities:

- generate target-native structure
- map component paths
- generate target-native manifest(s)
- wire hooks through hooks-proxy dependency if hooks are included
- emit any adapter code or wrapper metadata required by the target

## 10.5 Installer Core

Responsibilities:

- compute install plan
- determine scope
- choose native vs fallback installation strategy
- call target-native installer adapter

## 10.6 Verifier

Responsibilities:

- run product/version-sensitive checks
- confirm that emitted features are actually loaded and usable
- record environment-sensitive caveats

## 10.7 Catalog Generator

Responsibilities:

- emit target-native marketplace/catalog entries where supported
- map source metadata to target discovery metadata

## 10.8 Doctor/Diagnostics Engine

Responsibilities:

- summarize package compatibility
- show lossy mappings
- show unresolved verification requirements
- explain fallbacks and risks

---

## 11. Compilation Pipeline

### 11.1 Pipeline steps

1. load source package
2. validate source package
3. load target profile
4. apply target override layer
5. compute component mapping plan
6. compute degradation plan
7. compile target-native bundle
8. generate diagnostics
9. optionally generate install plan
10. optionally run verification

### 11.2 Compilation output

A compilation result must include:

- bundle path
- target name
- emitted files summary
- diagnostics
- support status by component
- install plan
- verification checklist

---

## 12. Component Mapping Rules

## 12.1 Skills

- preferred as direct file-based mapping where the target supports skills
- target compiler is responsible for target-specific namespacing
- duplicate skill names must be detected and surfaced

## 12.2 Agents
n
- compile only where agents or subagents are supported
- where the target distinguishes agents from subagents, compiler must map intentionally
- where support is partial or undocumented, mark `verify`

## 12.3 Commands

- compile only where custom command surfaces exist
- target command naming rules must be handled by the compiler

## 12.4 Hooks

- hooks-proxy is a dependency, not part of this subsystem
- target compiler wires hook declarations into target-native hook config or adapter layer
- compiler must not invent runtime hook semantics on its own
- if a target has partial or unstable hook support, compiler must emit warnings and verification steps

## 12.5 MCP servers

- map portable MCP config into target-native MCP config where possible
- emit warnings when auth, trust, transport, or scope semantics differ

## 12.6 Apps/connectors

- only compile to targets that support app or connector packaging
- otherwise drop or mark unsupported explicitly

## 12.7 Rules/context

- map into target-native instructions/rules/context surfaces where they exist
- do not silently merge them into hooks or skills unless the target compiler explicitly defines that mapping

## 12.8 Assets

- map to target-native icons/logos/screenshots as supported

---

## 13. Hook Integration Boundary

The plugin system must treat hooks-proxy as a dependency with a clean contract.

### 13.1 What this system does

- detect hook components in UPF
- include hooks-proxy as a runtime dependency when needed
- generate target-native hook registration or wiring
- expose diagnostics if the target cannot support the requested hook behavior

### 13.2 What this system does not do

- normalize lifecycle events
- implement session/bootstrap fan-out
- implement execution context propagation
- implement hook stdin/stdout adaptation

Those responsibilities belong to hooks-proxy.

---

## 14. Installation Model

### 14.1 Installation strategies

For each target, the installer must choose one of:

- `native-install`
- `native-link`
- `copy-into-target-location`
- `generate-local-cache-bundle`
- `adapter-only`

### 14.2 Scope model

Common install scopes:

- `user`
- `workspace`
- `project`
- `managed`

Targets may support only a subset.

### 14.3 Installer requirements

- never assume the same path layout across targets
- support dry-run mode
- support uninstall plan generation
- preserve provenance metadata
- record installed version and source digest if possible

---

## 15. Catalog and Publishing Model

### 15.1 Principle

Package artifact generation and catalog generation are separate steps.

### 15.2 Package artifact

The compiled target bundle.

### 15.3 Catalog artifact

The discovery metadata for a target ecosystem.

### 15.4 Requirements

- catalog generation must be optional
- catalog fields are target-specific
- the system must not invent a fake universal marketplace format as the runtime truth
- it may optionally emit a framework-owned meta-catalog in the future, but target-native catalogs remain authoritative for target installs

---

## 16. Verification Framework

This is a critical subsystem.

### 16.1 Why it exists

Third-party plugin ecosystems evolve quickly. Public docs, public example repositories, and runtime behavior may diverge temporarily.

Therefore compilers and installers must support explicit verification steps.

### 16.2 Verification levels

- `none`
- `static`
- `smoke`
- `interactive`

### 16.3 Static verification

Checks:

- required manifest fields exist
- expected files exist
- target-native structure is valid

### 16.4 Smoke verification

Checks:

- target discovers installed plugin
- target sees packaged skills/agents/commands/hooks/MCP where expected
- target reports no parse errors

### 16.5 Interactive verification

Checks:

- actual behavior after installation
- skill discoverability
- agent availability
- hook execution
- MCP tool visibility

### 16.6 Required rule

If a target profile marks a component as `verify`, the installer must not present success as fully confirmed unless verification passes or the user explicitly accepts unverified installation.

---

## 17. Diagnostics Model

Diagnostics must be structured and machine-readable.

### 17.1 Diagnostic levels

- `info`
- `warning`
- `error`
- `blocked`

### 17.2 Diagnostic categories

- validation
- compatibility
- compilation
- installation
- verification
- namespacing
- runtime dependency

### 17.3 Example diagnostics

- target supports hooks only partially; behavior must be verified
- packaged agents are present in source package but unsupported by target
- skill names will be namespaced differently on target
- fallback installation path used because target lacks native install mechanism

---

## 18. Target-Specific Notes for Initial Design

This section is intentionally pragmatic and must be kept under active review.

### 18.1 Claude

Treat Claude as a strong content-bundle target with native plugin packaging for skills, agents, hooks, MCP, and related surfaces.

Compiler expectations:

- direct native bundle generation
- native plugin manifest and layout
- hooks compiled to native hook configuration while using hooks-proxy for portable hook logic

### 18.2 Codex

Codex requires special caution.

Design assumption for now:

- support native plugin packaging
- treat skills and MCP as strong/clear support
- treat hooks, agents, and commands as **support that must be verified**

Reason:

- official docs strongly document plugin manifests, skills, app mappings, and MCP
- broader companion surfaces may exist in example repositories and ecosystem practice
- runtime support and documentation may not yet be perfectly aligned

Compiler expectations:

- do not strip hook/agent/command components by default
- compile them behind verification-aware profiles
- emit warnings when relying on surfaces not fully validated in the current runtime

### 18.3 Gemini

Treat Gemini as a content-bundle target with broad extension packaging and a separate manifest plus convention-based component directories.

Compiler expectations:

- native extension generation
- component-directory mapping for commands, hooks, skills, agents, etc.
- workspace/user enable-disable awareness

### 18.4 GitHub Copilot CLI

Treat Copilot as a content-bundle target with plugin packaging for agents, skills, hooks, and MCP.

Compiler expectations:

- native plugin manifest generation
- precedence-aware naming diagnostics
- target-native install and marketplace support when available

### 18.5 Cursor

Treat Cursor as a content-bundle target with experimental/still-maturing packaging behavior.

Compiler expectations:

- native plugin bundle generation
- strong diagnostics and verification by default
- avoid over-claiming support without smoke checks

### 18.6 OpenCode

Treat OpenCode as a runtime-adapter target.

Compiler expectations:

- generate adapter-backed runtime package rather than pretending the target consumes the same manifest as content-bundle targets
- map portable content to OpenCode-native directories or plugin modules where possible

### 18.7 pi / oh-my-pi

Treat as runtime-adapter targets.

Compiler expectations:

- generate integration modules or adapter bundles
- do not pretend they are merely content manifests

### 18.8 OpenClaw

Treat OpenClaw as both:

- native runtime-adapter target for its in-process plugin system
- possible import target for content-bundle ecosystems where appropriate

Compiler expectations:

- keep native plugin path and imported-bundle path separate conceptually

---

## 19. Required CLI Surface

### 19.1 `compile`

Compile a UPF package for one target.

```bash
a5c-plugin compile --target <target> [--verify <level>]
```

### 19.2 `compile-all`

Compile all enabled targets.

### 19.3 `install`

Install compiled bundle to a target environment.

### 19.4 `plan-install`

Show dry-run install plan.

### 19.5 `verify`

Run verification for a compiled or installed bundle.

### 19.6 `doctor`

Show compatibility and diagnostics report.

### 19.7 `catalog`

Generate target-native catalog entry.

---

## 20. Internal Package/Module Structure

Suggested modules:

- `core/manifest`
- `core/validator`
- `core/capabilities`
- `core/diagnostics`
- `core/compiler`
- `core/installer`
- `core/verifier`
- `targets/claude`
- `targets/codex`
- `targets/gemini`
- `targets/copilot`
- `targets/cursor`
- `targets/opencode`
- `targets/pi`
- `targets/openclaw`
- `catalogs/*`

---

## 21. Data Contracts

### 21.1 Normalized package model

A normalized in-memory representation of the UPF source package.

### 21.2 Compilation result

```ts
interface CompilationResult {
  target: string;
  status: "success" | "warning" | "error";
  bundlePath?: string;
  emittedFiles: string[];
  support: Record<string, "native" | "emulated" | "lossy" | "verify" | "unsupported">;
  diagnostics: Diagnostic[];
  installPlan?: InstallPlan;
  verificationChecklist: string[];
}
```

### 21.3 Install plan

```ts
interface InstallPlan {
  target: string;
  strategy: string;
  scope: string;
  actions: InstallAction[];
  warnings: string[];
}
```

---

## 22. Error Handling

### 22.1 Validation errors

Must block compilation.

### 22.2 Compatibility warnings

May allow compilation but must be surfaced.

### 22.3 Unsupported component errors

Behavior depends on build mode:

- strict mode: fail
- permissive mode: compile remaining supported components and warn

### 22.4 Verification failures

Must block “verified” status but may still allow an installed state marked as unverified if the user explicitly accepts it.

---

## 23. Security and Trust Requirements

- preserve source provenance metadata where possible
- do not silently widen requested capabilities
- clearly show when runtime code or subprocess dependencies are introduced
- treat hook and command wiring as security-sensitive
- require explicit consent flags where target or package policy demands it

---

## 24. Testing Strategy

### 24.1 Unit tests

- manifest parsing
- validation rules
- capability resolution
- diagnostics rendering
- install plan generation

### 24.2 Fixture tests

- one UPF package fixture per component combination
- one expected target bundle snapshot per target

### 24.3 Compatibility tests

- target-specific smoke tests for packaged skills, hooks, agents, commands, and MCP
- versioned support matrix tests where possible

### 24.4 Regression tests

- preserve behavior across target ecosystem changes
- update target profiles when docs/runtime support changes

---

## 25. Notes on Third-Party Verification

This system interacts with third-party products and open-source projects whose support details may change.

Therefore the following rule is mandatory:

**Any target-specific technical detail that affects packaging, installation, discoverability, precedence, or runtime behavior must be treated as externally versioned and must be re-verified during implementation and release hardening.**

This includes, for example:

- whether packaged hooks are loaded from plugin-local paths
- whether packaged agents or commands are discoverable by the target agent
- path layout expectations on each operating system
- namespacing and precedence behavior
- whether target marketplace ingestion or local install behaves as documented

The spec should be implemented with verification hooks and version-aware target profiles, not with static assumptions alone.

---

## 26. Recommended v1 Strategy

1. implement UPF validation
2. implement strong content-bundle targets first:
   - Claude
   - Gemini
   - Copilot
3. implement Codex with verification-aware packaging for hooks/agents/commands
4. implement Cursor with experimental profile and verification-first UX
5. add runtime-adapter targets after the compiler core stabilizes

Reason:

- gives faster path to useful bundles
- lets hooks-proxy integration settle on the shell-hook class first
- avoids over-designing runtime-adapter targets too early

---

## 27. Open Questions

1. Should the compiler emit one combined metadata file alongside every bundle for debugging and provenance?
2. Should verification be mandatory by default for targets marked experimental or verify-heavy?
3. How much target-specific auto-fix behavior should installers attempt?
4. Should runtime-adapter targets share one adapter scaffold generator, or each get bespoke compiler logic?
5. Should the system later support an A5C-owned cross-target catalog as a convenience layer?

---

## 28. Bottom Line

The unified plugin system should be built as a **compiler + installer + verifier framework around UPF**, with hooks-proxy treated as a dependency for hook-capable targets.

The most important engineering discipline is to separate:

- source truth
- target capability assumptions
- compiled output
- verified runtime support

That separation is what keeps the system honest, portable, and maintainable across fast-moving plugin ecosystems.