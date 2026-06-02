# Plugin Ecosystem Lifecycle

→ [Documentation Index](README.md) | Previous: [Package Specifications](package-specs.md) | Next: [Security Architecture](security-architecture.md)

## Normative V6 Support Surface

The current V6 plugin position is:

- metaplugins are higher-order capability abstractions over plugin and hook surfaces,
- on legacy non-Babysitter agents, `@a5c-ai/agent-mux-extensions` is the compiler and distribution path for the concrete plugin outputs those metaplugins need,
- `plugins/babysitter-unified/` is a first-party unified plugin source that can carry metaplugin concerns, not a synonym for metaplugins,
- memory systems, governance layers, policy engines, and discipline-enforcement bundles are in scope as metaplugin use cases.

V6 does not require a future standalone meta-plugin host package before those use cases can be documented or shipped. The current install surface remains per-harness plugin bundles compiled from a unified source, while the metaplugin remains the capability-level abstraction above those bundles.

## Current Plugin Reality

For the current repository, "plugin ecosystem" means the concrete lifecycle that already exists:

- unified plugin source trees with `plugin.json`, `versions.json`, and referenced files,
- compiler validation and per-target emission through `@a5c-ai/agent-mux-extensions`,
- git-backed marketplaces indexed by `marketplace.json`,
- explicit CLI install, configure, update, uninstall, and registry commands,
- compatibility checks grounded in manifests, generated outputs, and migration files.

This document is intentionally about those implementation surfaces. It is not a marketplace-governance charter.

## Authoring Surface

### Unified Plugin Sources

The cross-harness authoring surface is a unified plugin directory. At minimum, the compiler expects:

- `plugin.json` as the canonical manifest,
- `versions.json` with required SDK version data,
- referenced hook, command, skill, agent, and context files that exist on disk.

The compiler validation step checks schema validity and verifies that referenced files actually exist. That makes manifest accuracy and file layout part of the executable contract, not documentation-only guidance.

### Package-Level Plugin Surfaces

The SDK-facing plugin package surface is instruction-oriented:

- `install.md`, `configure.md`, and `uninstall.md` carry the agent-readable lifecycle instructions,
- optional `install-process.js`, `configure-process.js`, and `uninstall-process.js` can automate those lifecycle stages,
- `migrations/` contains version-to-version update steps,
- `process/` can carry packaged process definitions.

This is the practical boundary current users interact with. Plugin packages are not described by certification state, revenue policy, or moderation workflow. They are described by manifests, instruction files, optional process files, and migration artifacts.

## Validation And Compilation

### Validation Rules

Current validation is compiler- and package-oriented:

- validate the unified `plugin.json` schema,
- require `versions.json` and its SDK version field,
- verify referenced hook handlers, command files, skill files, agent files, and context files,
- reject duplicate skill names and other manifest errors.

Those checks are the current quality gate. They establish whether a plugin source tree is structurally valid enough to compile or ship.

### Compilation Outputs

`@a5c-ai/agent-mux-extensions` is the current compiler for harness-specific plugin outputs. The public surface is:

- `compile` to emit target plugin bundles,
- `validate` to check a unified plugin directory without writing outputs,
- `init` to scaffold a valid unified source tree,
- `list-targets` to expose the supported target registry.

For V6 planning, compatibility claims should be tied to those emitted bundles and the manifests that drive them. If compiler behavior changes, the check is whether real generated outputs and target metadata still line up, not whether an imagined ecosystem policy still sounds plausible.

## Marketplace And Install Lifecycle

### Marketplace Discovery

Current marketplaces are git repositories with a `marketplace.json` manifest. The SDK:

- clones marketplaces locally,
- resolves the active manifest path,
- lists available plugin packages from manifest entries,
- resolves package paths relative to the manifest location.

That is the present discovery model. The repo does not currently evidence a first-party moderation, certification, takedown, or dispute-resolution system layered over that marketplace format.

### Install And Configure

Current lifecycle commands are explicit and deterministic at the SDK layer:

- `plugin:add-marketplace`
- `plugin:update-marketplace`
- `plugin:list-plugins`
- `plugin:install`
- `plugin:configure`
- `plugin:uninstall`
- `plugin:list-installed`
- `plugin:update-registry`
- `plugin:remove-from-registry`

`plugin:install` resolves the package from the marketplace, reads `install.md`, and returns any optional `install-process.js`. `plugin:configure` and `plugin:uninstall` do the same for their respective lifecycle files. The AI agent performs the package instructions; the SDK handles resolution, manifest reading, and registry operations.

### Registry Tracking

Installed state is tracked in `plugin-registry.json`, scoped globally or per project. The registry records which plugins are installed, which marketplace they came from, and which version is active.

That registry is the current operational record. It is the concrete answer to "what is installed now?" and "what version is this project on?".

## Updates, Compatibility, And Rollback Boundaries

### Update Behavior

Plugin updates are currently explicit. `plugin:update`:

- reads the installed version from the registry,
- resolves the target version from the marketplace manifest,
- computes the shortest migration chain through `migrations/`,
- returns the ordered migration instructions or process files needed for the upgrade.

This is the current compatibility mechanism: manifest metadata plus migration files. The system does not currently promise universal automatic updates or platform-wide automatic rollback.

### Compatibility Source Of Truth

Compatibility claims should be grounded in:

- plugin manifests,
- marketplace metadata,
- compiler-emitted target outputs,
- package instruction files,
- migration chains that actually exist.

If a compatibility matrix or requirement is documented, it should be derivable from one of those artifacts.

### Rollback Boundaries

Current rollback behavior is package- and operator-defined, not platform-governance-defined. In practice that means:

- uninstall instructions can remove plugin-managed state,
- reconfiguration can move a project to a supported setup,
- migration design can preserve forward or backward movement where authors explicitly provide it.

There is no repo evidence for a universal automatic rollback service supervising all plugins.

## Out Of Scope For Current V6 Docs

The following ideas may become future product or platform concerns, but they are not current plugin-ecosystem guarantees and should not be written as if they already exist:

- certification programs or trust tiers beyond concrete manifest validation,
- compliance attestations such as SOC 2, GDPR, or HIPAA validation pipelines,
- dispute resolution, takedown programs, or marketplace moderation operations,
- revenue sharing or paid marketplace settlement mechanics,
- ML-based performance-regression detection for installed plugins,
- automatic mitigation or automatic rollback services,
- developer certification or support-tier programs.

Those topics require separate implementation evidence and decision records before they become normative.

## Documentation Rule

When V6 documents describe the plugin ecosystem, prefer:

- manifests over aspirational policy,
- install and update flows over marketplace mythology,
- compiler validation over certification language,
- generated outputs over abstract ecosystem diagrams.

That keeps the plugin story aligned with the repo's executable surfaces and makes the compiler, manifests, and package lifecycle easier to reason about.

---

**Related Documents**: [Package Specifications](package-specs.md) | [Security Architecture](security-architecture.md) | [Testing Framework](testing-framework.md)
