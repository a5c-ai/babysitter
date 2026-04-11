---
name: mcp-app-verification
description: Comprehensive verification checklists for MCP Apps. Tests with basic-host reference, validates handler-before-connect, text fallback, resource URI linking, single-file bundling, host styling, CSP, and legacy pattern detection.
allowed-tools: Read, Bash, Glob, Grep
---

# mcp-app-verification

Run comprehensive verification checklists for MCP Apps covering correctness, compatibility, and migration completeness.

## Overview

MCP Apps have several critical invariants that must be verified before deployment. This skill provides systematic verification across multiple dimensions:

1. **Runtime verification**: App loads and functions in basic-host reference
2. **Pattern verification**: Critical code patterns are correct (handler-before-connect, text fallback)
3. **Build verification**: Single-file bundle is valid and complete
4. **Styling verification**: Host theming applies correctly
5. **CSP verification**: All origins declared, no silent failures
6. **Migration verification**: No remaining legacy patterns (OpenAI, old MIME types, snake_case)

## Capabilities

### basic-host Test Execution
- Build the MCP App
- Start the server
- Launch basic-host reference implementation against the server
- Verify app loads without console errors
- Verify handlers fire correctly

### Handler-Before-Connect Invariant
- Search source code for `app.connect()` call
- Verify ALL handlers (`ontoolinput`, `ontoolresult`, `onhostcontextchanged`, `onteardown`) are registered BEFORE connect
- Flag violations -- handlers registered after connect will silently not work

### Text Fallback Verification
- Search all tool handlers for `content` array in return value
- Verify each tool returns at least one `{ type: 'text', text: '...' }` entry
- Flag tools that only return `structuredContent` without text fallback

### Resource URI Link Integrity
- Extract all `resourceUri` values from `registerAppTool` calls
- Extract all URIs from `registerAppResource` calls
- Verify every tool `resourceUri` has a matching registered resource
- Flag orphaned resources (registered but not referenced)

### Single-File Bundle Verification
- Build the project
- Verify `dist/mcp-app.html` (or equivalent) exists
- Check the HTML file is self-contained (no external `<script src>`, `<link href>`, `<img src>` to relative paths)
- Verify `vite-plugin-singlefile` is in dev dependencies

### Host Styling Verification
- Search CSS for `var(--color-*`, `var(--font-*`, `var(--border-radius-*` patterns
- Verify fallback values are present: `var(--color-background-primary, #ffffff)` not just `var(--color-background-primary)`
- Check `onhostcontextchanged` handler exists and applies styling

### CSP Verification
- Build and search output for network origins
- Compare against CSP configuration in `registerAppResource`
- Flag origins present in code but missing from CSP
- Verify conditional origins match between runtime and CSP config

### Legacy Pattern Detection (Migration)
- Search for remaining OpenAI patterns: `window.openai.toolInput`, `window.openai.toolOutput`, `window.openai`
- Search for old metadata paths: `openai/`
- Search for old MIME types: `text/html+skybridge`
- Search for hardcoded MIME type: `text/html;profile=mcp-app` (should use `RESOURCE_MIME_TYPE`)
- Search for snake_case CSP: `_domains"` or `_domains:` (should be camelCase)

## Usage

### Full Verification Workflow

```bash
# Step 1: Build the project
npm run build

# Step 2: Verify single-file bundle
ls -la dist/mcp-app.html
# Should be a single file with all assets inlined

# Step 3: Check for external references in bundle
grep -E '<script src="|<link.*href="|<img src="(?!data:)' dist/mcp-app.html
# Should return NOTHING (all assets inlined)

# Step 4: Start server
npm run serve &
SERVER_PID=$!

# Step 5: Test with basic-host
cd /tmp/mcp-ext-apps/examples/basic-host
SERVERS='["http://localhost:3001/mcp"]' npm run start
# Verify: app loads, handlers fire, styling applies

# Step 6: Stop server
kill $SERVER_PID
```

### Pattern Verification Commands

```bash
# Handler-before-connect check
# Find app.connect() and verify handlers are above it
grep -n 'app\.connect\|\.ontoolinput\|\.ontoolresult\|\.onhostcontextchanged\|\.onteardown' src/main.ts

# Text fallback check
# Every tool handler should return content array
grep -A5 'return {' src/server.ts | grep -c 'content:'

# Resource URI linking
grep 'resourceUri' src/server.ts
grep "registerAppResource" src/server.ts

# RESOURCE_MIME_TYPE usage (not hardcoded)
grep 'RESOURCE_MIME_TYPE' src/server.ts
grep "text/html;profile" src/server.ts  # Should NOT match

# CSS variable fallbacks
grep -c 'var(--.*,' src/global.css  # Count with fallbacks
grep 'var(--' src/global.css | grep -v ','  # Flag missing fallbacks
```

### Migration Verification (OpenAI -> MCP)

```bash
# Server-side legacy patterns
grep -rn 'openai/' src/        # Old metadata paths
grep -rn 'text/html+skybridge' src/  # Old MIME type
grep -rn "text/html;profile=mcp-app" src/  # Hardcoded (use RESOURCE_MIME_TYPE)
grep -rn '_domains"' src/      # Snake_case CSP
grep -rn "_domains:" src/      # Snake_case CSP

# Client-side legacy patterns
grep -rn 'window\.openai\.toolInput' src/
grep -rn 'window\.openai\.toolOutput' src/
grep -rn 'window\.openai' src/

# All should return ZERO matches
```

### Automated Verification Script

```bash
#!/bin/bash
# mcp-app-verify.sh - Comprehensive MCP App verification

ERRORS=0

echo "=== MCP App Verification ==="

# 1. Build
echo "[1/8] Building..."
npm run build 2>&1 || { echo "FAIL: Build failed"; ERRORS=$((ERRORS+1)); }

# 2. Single-file bundle
echo "[2/8] Checking single-file bundle..."
if [ ! -f dist/mcp-app.html ]; then
  echo "FAIL: dist/mcp-app.html not found"
  ERRORS=$((ERRORS+1))
fi

# 3. No external references
echo "[3/8] Checking for external references..."
EXT_REFS=$(grep -cE 'src="(?!data:)[^"]+"|href="(?!data:)[^"]+\.css"' dist/mcp-app.html 2>/dev/null || echo "0")
if [ "$EXT_REFS" -gt 0 ]; then
  echo "WARN: Found $EXT_REFS potential external references"
fi

# 4. Handler-before-connect
echo "[4/8] Checking handler-before-connect..."
CONNECT_LINE=$(grep -n 'app\.connect()' src/main.ts* 2>/dev/null | head -1 | cut -d: -f2)
if [ -n "$CONNECT_LINE" ]; then
  LATE_HANDLERS=$(grep -n '\.on\(toolinput\|toolresult\|hostcontextchanged\|teardown\)' src/main.ts* 2>/dev/null | awk -F: -v cl="$CONNECT_LINE" '$2 > cl')
  if [ -n "$LATE_HANDLERS" ]; then
    echo "FAIL: Handlers registered after app.connect()"
    ERRORS=$((ERRORS+1))
  fi
fi

# 5. Text fallback
echo "[5/8] Checking text fallback..."
# (manual review needed for complex cases)

# 6. RESOURCE_MIME_TYPE
echo "[6/8] Checking RESOURCE_MIME_TYPE usage..."
HARDCODED=$(grep -rn "text/html;profile=mcp-app" src/ 2>/dev/null | wc -l)
if [ "$HARDCODED" -gt 0 ]; then
  echo "FAIL: Hardcoded MIME type found (use RESOURCE_MIME_TYPE)"
  ERRORS=$((ERRORS+1))
fi

# 7. CSS fallbacks
echo "[7/8] Checking CSS variable fallbacks..."
NO_FALLBACK=$(grep 'var(--' src/*.css 2>/dev/null | grep -v ',' | wc -l)
if [ "$NO_FALLBACK" -gt 0 ]; then
  echo "WARN: $NO_FALLBACK CSS variables without fallback values"
fi

# 8. Legacy patterns (migration)
echo "[8/8] Checking for legacy patterns..."
LEGACY=$(grep -rn 'window\.openai\|text/html+skybridge\|_domains"' src/ 2>/dev/null | wc -l)
if [ "$LEGACY" -gt 0 ]; then
  echo "FAIL: $LEGACY legacy patterns found"
  ERRORS=$((ERRORS+1))
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "PASS: All verification checks passed"
else
  echo "FAIL: $ERRORS verification errors found"
fi
exit $ERRORS
```

## Verification Checklist (Summary)

### Core Invariants
- [ ] App builds without errors
- [ ] `dist/mcp-app.html` exists and is self-contained single file
- [ ] `vite-plugin-singlefile` in devDependencies
- [ ] ALL handlers registered BEFORE `app.connect()`
- [ ] Every tool returns `content[]` with text fallback
- [ ] Every tool's `resourceUri` matches a registered resource
- [ ] `RESOURCE_MIME_TYPE` used (not hardcoded string)

### Styling
- [ ] CSS variables use `var(--name, fallback)` pattern
- [ ] `onhostcontextchanged` handler registered
- [ ] App looks correct with host styling (test in basic-host)
- [ ] App looks correct without host styling (standalone fallbacks)

### CSP (if applicable)
- [ ] All network origins discovered in build output
- [ ] All origins declared in `resourceDomains` / `connectDomains` / `frameDomains`
- [ ] CSP in correct location: `contents[]` of `registerAppResource` read callback
- [ ] Conditional origins: config controls both runtime URL and CSP entry

### Migration (if applicable)
- [ ] Zero `window.openai` references
- [ ] Zero `text/html+skybridge` references
- [ ] Zero `openai/` metadata paths
- [ ] Zero snake_case CSP properties (`_domains`)
- [ ] Zero hardcoded `text/html;profile=mcp-app` (use `RESOURCE_MIME_TYPE`)

### Runtime
- [ ] App loads in basic-host without console errors
- [ ] `ontoolinput` fires with tool arguments
- [ ] `ontoolresult` fires with tool result
- [ ] Host styling (theme, fonts, colors) applies correctly
- [ ] Teardown handler fires on app close

## Task Definition

```javascript
const mcpAppVerificationTask = defineTask({
  name: 'mcp-app-verification',
  description: 'Run comprehensive MCP App verification',

  inputs: {
    projectDir: { type: 'string', required: true },
    isMigration: { type: 'boolean', default: false },
    migrationSource: { type: 'string', default: '' },
    checkCsp: { type: 'boolean', default: true }
  },

  outputs: {
    passed: { type: 'boolean' },
    errors: { type: 'array' },
    warnings: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Verify MCP App: ${inputs.projectDir}`,
      skill: {
        name: 'mcp-app-verification',
        context: {
          projectDir: inputs.projectDir,
          isMigration: inputs.isMigration,
          migrationSource: inputs.migrationSource,
          checkCsp: inputs.checkCsp,
          instructions: [
            'Build the application',
            'Verify single-file bundle integrity',
            'Check handler-before-connect invariant',
            'Verify text fallback in all tools',
            'Validate resource URI linking',
            'Check CSS variable fallbacks',
            inputs.checkCsp ? 'Verify CSP completeness' : null,
            inputs.isMigration ? 'Search for legacy patterns' : null,
            'Test with basic-host reference'
          ].filter(Boolean)
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Applicable Processes

- create-mcp-app.js
- add-app-to-mcp-server.js
- convert-web-app-to-mcp.js
- migrate-openai-app-to-mcp.js

## External Dependencies

- basic-host reference implementation (from SDK repo clone)
- Build toolchain for the target application
- grep/ripgrep for pattern searching

## References

- [MCP Apps Testing Guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/testing-mcp-apps.md)
- [MCP Apps SDK - basic-host Example](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host)
- [MCP Apps Patterns](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/patterns.md)

## Related Skills

- mcp-tool-resource-pattern
- mcp-host-styling-integration
- mcp-csp-investigation
- single-file-bundling
- mcp-app-scaffolding

## Related Agents

- mcp-app-architect
- mcp-ui-developer
- csp-security-auditor
