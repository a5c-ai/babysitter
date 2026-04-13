# CharlesWiltgen/Axiom

- **Archetype:** mega-skill-pack
- **Stars:** 810
- **Last pushed:** 2026-04-10
- **License:** MIT
- **Discovered:** 2026-04-12
- **Version:** 2.39.6
- **Source**: gh-search

## Summary

Battle-tested Claude Code plugin for iOS/macOS (xOS) development. 175 skills covering UI, data, concurrency, performance, networking, accessibility, and AI integration. 38 specialized auditor agents that scan for issues (memory leaks, concurrency violations, build problems). 12 slash commands for quick diagnostics. Includes `xclog` binary for simulator/device console capture.

Structured as a full Claude Code plugin with marketplace.json, hooks (session-start, stop-validation, swift-guardrails, subagent-start, user-prompt-submit), and a health-check meta-auditor agent that orchestrates parallel domain auditors with signal-based conditional execution.

## Assessment

High extractable value. The health-check meta-auditor pattern (detect signals -> launch conditional auditors in parallel -> deduplicate findings -> unified report) is a reusable multi-phase audit orchestration process. The 38 specialized auditors each follow a consistent scan-classify-report pattern. The domain expertise (iOS/Swift/SwiftUI) is deep and production-tested at v2.39.6.

The plugin structure itself is a reference for how to build a comprehensive domain-specific babysitter plugin with hooks, agents, commands, and skills.

## Extraction Priority

**HIGH** - Both process patterns (audit orchestration) and plugin architecture (domain skill pack with hooks) are directly extractable.

---

## Processes

### 1. Multi-Domain Health Check Audit

**Placement:** `specializations/shared/multi-domain-health-audit.js`

A generic multi-phase audit orchestration process extracted from Axiom's health-check meta-auditor pattern. Not iOS-specific -- the pattern works for any codebase with multiple audit domains.

**Phases:**
1. **Discovery** - Scan codebase files to detect which technology signals are present (e.g., grep for framework imports, config files, file patterns)
2. **Auditor Selection** - Map detected signals to relevant auditor tasks. Split into "always run" (universal concerns like security, performance, accessibility) and "conditional" (framework-specific auditors triggered by signal presence)
3. **Parallel Execution** - Launch all selected auditors concurrently via `ctx.parallel.all()`. Each auditor scans for issues in its domain and returns findings with file:line references and severity
4. **Deduplication & Synthesis** - Merge findings from all auditors, deduplicate by file:line, rank by severity, produce unified health report

**Key insight from Axiom:** The conditional auditor selection based on grep signals prevents wasted work. A ROS2 project shouldn't run SwiftUI auditors. The signal-detection phase makes the audit pipeline adaptive.

**Tasks:**
- `detect-signals` (node) - grep/glob for technology markers, return signal map
- `run-auditor` (orchestrator_task) - parameterized auditor execution, one per domain
- `synthesize-report` (node) - deduplicate, rank, format findings

### 2. iOS App Store Submission Pipeline

**Placement:** `specializations/ios/app-store-submission.js`

Extracted from Axiom's app-store-submission skill and the chain of auditors that feed into it.

**Phases:**
1. **Pre-submission audit** - Run accessibility, security/privacy, App Store guidelines, and codable auditors
2. **Fix critical blockers** - Address any findings that would cause App Store rejection
3. **Submission preparation** - Screenshots, metadata, privacy declarations
4. **Validation** - Final pre-flight check against Apple's review guidelines

## Plugin Ideas

### 1. iOS Development Skill Pack (Axiom-derived)

**Format:** Babysitter marketplace plugin with install.md

**install.md description:** Installs a curated set of iOS/macOS development skills, auditor agents, and Xcode integration hooks. Includes Swift guardrails hook (pre-tool-use validation for Swift files), session-start context injection, and stop-validation hook. Skills cover SwiftUI, SwiftData, Core Data, concurrency (Swift 6), performance profiling, accessibility, networking, and Apple Intelligence integration.

**Key components:**
- Skills: iOS build diagnostics, testing patterns, UI/SwiftUI, data persistence, concurrency, performance, networking, system integration, accessibility, AI/Foundation Models
- Agents: 38 specialized auditor agents (memory, concurrency, security, build, crash analysis, etc.)
- Commands: `/audit`, `/fix-build`, `/run-tests`, `/health-check`, `/console`, `/analyze-crash`, `/profile`, `/screenshot`, `/status`
- Hooks: swift-guardrails (PreToolUse), session-start (context injection), stop-validation (build verification)
- Binary tool: `xclog` for simulator/device console capture

**Why this is a plugin, not a process:** It's persistent tooling that enhances the development environment, not a one-shot workflow. The skills activate contextually based on what the developer is working on.

### 2. Codebase Health Dashboard Plugin

**Format:** Babysitter marketplace plugin with install.md

**install.md description:** Installs a generic codebase health monitoring system inspired by Axiom's health-check meta-auditor. Provides a `/health-check` command that auto-detects project technologies, runs appropriate auditors in parallel, and produces a unified report. Ships with auditor definitions for common domains (security, performance, accessibility, testing coverage, dependency freshness). Extensible -- users add domain-specific auditors via config.

**Key components:**
- Command: `/health-check` with optional domain filter
- Config: `health-auditors.json` mapping signal patterns to auditor definitions
- Hook: session-start health summary (optional, shows last health score)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Multi-Domain Health Check Audit | NEW | Signal-based conditional auditor orchestration with parallel execution | - | specializations/shared/multi-domain-health-audit.js |
| iOS App Store Submission Pipeline | NEW | Pre-submission audit and validation process for Apple App Store | - | specializations/mobile/ios-app-store-submission.js |
| Signal-Based Technology Detection | NEW | Codebase scanning to detect framework presence for conditional auditor selection | - | specializations/shared/signal-based-technology-detection.js |
| Parallel Auditor Orchestration | NEW | Concurrent domain-specific audit execution with deduplication and synthesis | - | specializations/shared/parallel-auditor-orchestration.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| iOS Development Skill Pack | NEW | Comprehensive iOS/macOS development with auditor agents, hooks, and Xcode integration | - | plugins/a5c/marketplace/plugins/ios-development-skill-pack/ |
| Codebase Health Dashboard | NEW | Generic health monitoring with auto-detection, parallel auditors, and unified reporting | - | plugins/a5c/marketplace/plugins/codebase-health-dashboard/ |

## Implicit Procedural Knowledge

- **Signal-based conditional execution:** Grep for framework imports/patterns before deciding which auditors to run. Prevents irrelevant noise.
- **Severity-based deduplication:** When multiple auditors flag the same file:line, keep the highest severity finding and merge context from all reporters.
- **Parallel auditor orchestration with file exclusion:** All auditors share a common exclusion list (test files, third-party code, build artifacts) to avoid false positives.
- **Hook-based guardrails:** PreToolUse hooks that validate code changes against domain rules (e.g., Swift 6 concurrency patterns) before they're applied. Catches issues at edit time, not audit time.
- **Version-aware skill content:** Skills reference specific API versions (iOS 26, Swift 6) and explicitly document deprecated patterns with migration paths. This prevents AI from generating outdated code.
