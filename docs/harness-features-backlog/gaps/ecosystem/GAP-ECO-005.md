# GAP-ECO-005: Plugin Validation and Diagnostics

| Field | Value |
|-------|-------|
| Category | ecosystem |
| Priority | Medium |
| Effort | S |
| Status | Missing |

## Description
Validate plugin manifests, check component loading, and provide clear diagnostics
when plugins fail.

## CC Implementation
- `validatePlugin.ts` -- comprehensive manifest validation
- `ValidatePlugin.tsx` -- validation UI with detailed results
- `PluginErrors.tsx` -- structured error display per error type
- `pluginStartupCheck.ts` -- boot-time validation
- 12+ discriminated error types (path-not-found, git-auth-failed, manifest-parse-error,
  mcp-config-invalid, hook-load-failed, etc.)
- `PluginOptionsDialog.tsx` -- plugin configuration UI

## Current State
Babysitter's `readPluginPackage` reads manifests but validation is minimal.
No structured error types. No diagnostic UI. Plugin load failures produce
generic errors.

## Target State
Structured plugin error types with actionable messages. A `plugin:validate`
command that checks manifest, components, dependencies, and compatibility.
Clear error messages explaining what went wrong and how to fix it.

## Dependencies
- [GAP-ECO-001](GAP-ECO-001.md) -- needs to validate CC plugin format too

## Key Files
| Component | Path |
|-----------|------|
| CC validator | `src/utils/plugins/validatePlugin.ts` |
| CC errors | `src/commands/plugin/PluginErrors.tsx` |

## Recommendation
Phase 4 (M6). Start with structured error types matching CC's taxonomy. Then add
`plugin:validate` command.
