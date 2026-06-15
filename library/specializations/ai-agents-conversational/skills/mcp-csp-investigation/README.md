# MCP CSP Investigation Skill

## Overview

The `mcp-csp-investigation` skill performs comprehensive Content Security Policy audits for MCP Apps running in sandboxed iframes. This is critical because ALL network requests fail **silently** in sandboxed iframes without proper CSP declarations -- no errors, no warnings, just silent failure.

## Key Features

- **Build Output Analysis**: Discovers every network origin in compiled HTML/CSS/JS
- **Origin Tracing**: Traces each origin to its source (constant, env var, conditional)
- **Third-Party Detection**: Finds hidden network requests in dependencies
- **CSP Generation**: Produces categorized domain lists (resource, connect, frame)
- **Environment Annotation**: Tags origins as universal, dev-only, or prod-only

## Prerequisites

1. **Build toolchain**: Ability to build the target application
2. **grep/ripgrep**: For searching build output
3. **Understanding of CSP**: Basic knowledge of Content Security Policy

## Quick Start

### 1. Build the Application

```bash
npm run build
```

### 2. Search for Network Origins

```bash
grep -rEoh 'https?://[a-zA-Z0-9._-]+' dist/ | sort -u
```

### 3. Categorize and Configure

Place CSP in `contents[]` of `registerAppResource` read callback:

```typescript
contents: [{
  uri: 'app:///my-app',
  mimeType: RESOURCE_MIME_TYPE,
  text: bundledHtml,
  resourceDomains: ['https://cdn.example.com'],
  connectDomains: ['https://api.example.com'],
  frameDomains: [],
}]
```

## Why This Matters

MCP Apps run in sandboxed iframes with `sandbox="allow-scripts"`. There is no same-origin server. If you load a font from Google Fonts, fetch data from an API, or use a CDN for a library -- **all of these will silently fail** unless declared in CSP. The app will appear broken with no indication of why.

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| convert-web-app-to-mcp.js | Phase 3: CSP investigation (critical security step) |
| migrate-openai-app-to-mcp.js | Phase 2: CSP investigation for existing OpenAI app |

## References

- [MCP Apps CSP/CORS Guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/csp-cors.md)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Related Resources

- mcp-app-verification - Validates CSP correctness post-configuration
- csp-security-auditor agent - Automated CSP auditing
