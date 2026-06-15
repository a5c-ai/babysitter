# Security Architecture

→ [Documentation Index](README.md) | Previous: [Plugin Ecosystem](plugin-ecosystem.md) | Next: [Testing Framework](testing-framework.md)

## V6 Security Status

This document is intentionally conservative. Under the V6 architecture rules, security language is normative only when it maps to current repository surfaces, operational workflows, and explicit validation. Hard isolation, capability-safety, or enterprise security-program language is deferred unless the repo also shows the implementation and tests for it → [V6 Architecture Specification](v6-architecture-specification.md)

### Normative For This Stage

- process-defined governance and approval gates,
- event-sourced run journals and replayable state,
- plugin manifests, hook routing, and per-harness plugin compilation as concrete control surfaces,
- conservative documentation of sandbox and permission limits instead of blanket guarantees.

### Deferred For This Stage

- enterprise identity and authorization programs,
- tamper-evident or cryptographically protected audit systems,
- active anomaly detection and automatic threat response,
- strong plugin isolation or capability enforcement claims.

## Threat Model and Documentation Boundaries

### Primary Attack Vectors

**Code Injection**: Malicious plugin code, unsafe hook behavior, or prompt-driven command execution

**Privilege Escalation**: A tool, plugin, or harness obtaining broader filesystem, process, or network access than intended

**Data Exposure**: Unauthorized access to session state, prompts, credentials, or project artifacts

**Resource Exhaustion**: Infinite loops, runaway shells, or excessive memory/CPU usage

**Supply Chain Risk**: Compromised dependencies, plugin bundles, or generated install surfaces → [Plugin Ecosystem](plugin-ecosystem.md)

### Trust Boundaries As They Exist Now

**Harness Boundary**: External CLIs and model providers are operational dependencies, not proven isolation barriers

**Filesystem Boundary**: The current stack uses filesystem-backed state, artifacts, and plugin surfaces, so access must be treated as a real security concern rather than an abstract platform detail

**Plugin and Hook Boundary**: Unified plugin sources, manifests, and hook adapters are validation surfaces that require careful review, packaging discipline, and explicit documentation of limits

**Network Boundary**: External services and package registries expand the attack surface and require per-integration scrutiny

## Normative V6 Security Controls

### Governance and Approval Controls

**Human Approval Breakpoints**: Risky workflow steps can require explicit user approval before execution

**Deterministic Workflow Gates**: Process-defined shell checks, replay, and task state give V6 a concrete way to validate some operational claims without implying broader security guarantees

**Rollback-Oriented Execution**: Runs, journals, and task artifacts make it possible to inspect what happened and recover from bad orchestration state

### Packaging and Validation Controls

**Plugin Manifests and Generated Bundles**: The concrete delivery path is the plugin and hook surface that the repo already builds and ships

**Command-Level Validation**: Claims that exceed generic risk framing should point to real commands, tests, or package outputs, not only to architecture narrative

**Scoped Documentation**: V6 documentation must distinguish current controls from future ambitions instead of presenting a full enterprise security stack as already shipped

### Sandbox and Isolation Language

**No Hard Isolation Claim**: V6 does not claim process isolation, capability safety, or plugin-safe execution by default

**Harness-Specific Limits**: A harness may expose permission prompts, sandboxing modes, or restricted tool surfaces, but those are implementation details that must be documented where they actually exist

**Evidence Before Assurance**: Any stronger security statement needs implementation evidence and explicit test coverage before it becomes normative → [V6 Architecture Specification](v6-architecture-specification.md)

## Deferred Security Goals

The following topics may still matter strategically, but they are not current V6 commitments:

- **Enterprise Identity**: Multi-factor authentication, Single Sign-On integration, and X.509-based service authentication
- **Enterprise Authorization**: Role-based access control, attribute-based access control, and centralized policy-enforcement narratives
- **Tamper-Evident Audit Guarantees**: Cryptographic signatures, checksums, or comparable audit-log integrity systems
- **Active Monitoring and Automated Response**: Anomaly detection, automatic threat mitigation, and automated forensic or recovery flows
- **Stronger Isolation**: Harder plugin containment, runtime capability enforcement, and deeper resource-abuse controls

These items should be described as goals, hypotheses, or future implementation work until the repo contains the concrete enforcement path and validation that would justify stronger wording.

## Documentation Rule For Security Topics

- mark sections as normative or deferred,
- tie normative claims to present repo surfaces, commands, or tests,
- prefer explicit limitations over assurance language,
- treat future security programs as roadmap material rather than present architecture.

## Secure Development Posture For This Stage

### Security-Oriented Engineering Practices

**Least Privilege As An Operating Goal**: Prefer narrow permissions and reviewable task scopes, but do not represent that preference as a proved platform guarantee

**Defense Through Reviewable Surfaces**: Process definitions, journals, manifests, and generated outputs are part of the control story because they can be inspected and validated

**Validation Before Promotion**: Security-sensitive claims should move from deferred to normative only when backed by implementation evidence, tests, and repository paths

**Rollback Planning**: Recovery and rollback remain essential because the current stack is operationally complex and not yet a fully hardened security platform

---

**Related Documents**: [Plugin Ecosystem](plugin-ecosystem.md) | [Package Specifications](package-specs.md) | [Implementation Roadmap](v6-implementation-roadmap.md)
