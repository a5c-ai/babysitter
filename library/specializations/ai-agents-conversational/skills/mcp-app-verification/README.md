# MCP App Verification Skill

## Overview

The `mcp-app-verification` skill provides comprehensive verification checklists for MCP Apps. It validates critical invariants (handler-before-connect, text fallback, resource URI linking), build correctness (single-file bundling), styling integration, CSP configuration, and migration completeness.

## Key Features

- **basic-host Testing**: Launch the SDK's reference host to test your app end-to-end
- **Pattern Verification**: Automated checks for handler-before-connect, text fallback, RESOURCE_MIME_TYPE
- **Build Validation**: Verify single-file bundle is self-contained
- **Styling Checks**: CSS variable fallback presence and theme handler registration
- **CSP Audit**: Compare declared CSP domains against actual network origins
- **Migration Scanning**: Detect remaining legacy patterns (OpenAI, old MIME types, snake_case)

## Prerequisites

1. SDK reference code cloned at `/tmp/mcp-ext-apps/`
2. Application build toolchain working
3. grep/ripgrep available for pattern searching

## Quick Start

### Build and Verify

```bash
# Build
npm run build

# Check single-file bundle
ls dist/mcp-app.html

# Check handler-before-connect
grep -n 'app\.connect\|\.ontoolinput\|\.ontoolresult' src/main.ts

# Test with basic-host
npm run serve &
cd /tmp/mcp-ext-apps/examples/basic-host
SERVERS='["http://localhost:3001/mcp"]' npm run start
```

### Migration Check

```bash
# Search for legacy patterns (should all return zero)
grep -rn 'window\.openai' src/
grep -rn 'text/html+skybridge' src/
grep -rn '_domains"' src/
```

## Verification Dimensions

| Dimension | What It Checks |
|-----------|---------------|
| Runtime | App loads in basic-host, handlers fire, no console errors |
| Patterns | Handler-before-connect, text fallback, RESOURCE_MIME_TYPE |
| Build | Single-file bundle exists and is self-contained |
| Styling | CSS variable fallbacks, onhostcontextchanged handler |
| CSP | All origins declared, correct placement, conditional matching |
| Migration | Zero legacy patterns remaining |

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| create-mcp-app.js | Phases 7-8: Implementation review and verification |
| add-app-to-mcp-server.js | Phase 7: Backward compatibility verification |
| convert-web-app-to-mcp.js | Phase 8: Dual-mode verification |
| migrate-openai-app-to-mcp.js | Phases 7-8: Before-finishing checklist and verification |

## References

- [MCP Apps Testing Guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/testing-mcp-apps.md)
- [basic-host Reference](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host)

## Related Resources

- mcp-tool-resource-pattern - What this skill verifies on the server side
- mcp-host-styling-integration - What this skill verifies on the client side
- mcp-csp-investigation - Deeper CSP auditing beyond verification
