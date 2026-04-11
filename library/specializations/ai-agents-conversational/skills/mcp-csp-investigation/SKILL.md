---
name: mcp-csp-investigation
description: Comprehensive Content Security Policy audit for MCP Apps in sandboxed iframes. Discovers all network origins, traces them to source, and generates CSP configuration for registerAppResource.
allowed-tools: Read, Bash, Glob, Grep
---

# mcp-csp-investigation

Perform exhaustive Content Security Policy audits for MCP Apps running in sandboxed iframes where all network requests fail SILENTLY without proper CSP declarations.

## Overview

MCP Apps run in sandboxed iframes with no same-origin server. This means:
- **ALL network requests fail silently** without CSP -- no errors, no warnings, just silent failure
- Every external origin (CDN, API, font, image, WebSocket) must be declared in CSP
- CSP is configured in the `contents[]` return from the `registerAppResource` read callback
- Missing even ONE origin causes that resource to silently not load

This skill provides a systematic methodology for discovering every network origin an app uses, tracing each to its source, and generating the correct CSP configuration.

## Capabilities

### Build Output Analysis
- Build the application and capture all output files (HTML, CSS, JS, assets)
- Search every file for network origin references
- Identify fetch/XHR targets, script sources, link hrefs, image sources, font URLs, iframe sources, WebSocket endpoints

### Origin Tracing
- Trace each discovered origin to its source in the codebase
- Classify as: hardcoded constant, environment variable, or conditional logic
- Document whether origin is universal, dev-only, or prod-only
- Check third-party libraries for hidden network requests (analytics, telemetry, CDN fallbacks)

### CSP Domain Categorization
- **resourceDomains**: Scripts, stylesheets, images, fonts (maps to `script-src`, `style-src`, `img-src`, `font-src`)
- **connectDomains**: fetch/XHR targets, WebSocket endpoints (maps to `connect-src`)
- **frameDomains**: Nested iframes (maps to `frame-src`)

### CSP Configuration Generation
- Generate the CSP object for `registerAppResource` read callback
- Handle environment-specific origins with proper conditional logic
- Verify conditional origins have matching runtime URL and CSP entry

## Usage

### Step 1: Build the Application

```bash
# Build to produce final output files
npm run build

# Identify all output files
find dist/ -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \)
```

### Step 2: Search for ALL Network Origins

```bash
# Search for URL patterns in build output
grep -rEoh 'https?://[a-zA-Z0-9._-]+[a-zA-Z0-9._/-]*' dist/ | sort -u

# Search for protocol-relative URLs
grep -rEoh '//[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}' dist/ | sort -u

# Search for fetch/XHR patterns in source
grep -rn 'fetch\|XMLHttpRequest\|axios\|\.get\(\|\.post\(' src/

# Search for WebSocket connections
grep -rn 'new WebSocket\|wss://\|ws://' src/

# Search for dynamic imports and lazy loading
grep -rn 'import(\|require(\|loadScript' src/
```

### Step 3: Trace Each Origin to Source

For each discovered origin, determine:

| Origin | Source Type | Environment | Category |
|--------|-----------|-------------|----------|
| `https://cdn.example.com` | Hardcoded constant | Universal | resourceDomains |
| `https://api.example.com` | Environment variable (`API_URL`) | Conditional | connectDomains |
| `https://fonts.googleapis.com` | Third-party library | Universal | resourceDomains |
| `wss://realtime.example.com` | Conditional (feature flag) | Prod-only | connectDomains |

### Step 4: Check Third-Party Libraries

```bash
# Check node_modules for hidden network requests
grep -rn 'fetch\|XMLHttpRequest\|beacon\|sendBeacon' node_modules/<lib>/dist/ 2>/dev/null

# Common hidden request sources:
# - Analytics (Google Analytics, Segment, Mixpanel)
# - Error tracking (Sentry, Bugsnag, Datadog)
# - Font loading (Google Fonts, Adobe Fonts)
# - CDN fallbacks (jQuery CDN, unpkg)
# - Map tiles (Mapbox, Google Maps, Leaflet)
```

### Step 5: Generate CSP Configuration

The CSP object goes in the `contents[]` return from `registerAppResource`:

```typescript
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps';

registerAppResource(server, {
  uri: 'app:///my-app',
  name: 'My App',
  mimeType: RESOURCE_MIME_TYPE,
  async read() {
    return {
      contents: [{
        uri: 'app:///my-app',
        mimeType: RESOURCE_MIME_TYPE,
        text: bundledHtml,
        // CSP configuration goes HERE, in contents[]
        resourceDomains: [
          'https://cdn.example.com',
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
        ],
        connectDomains: [
          'https://api.example.com',
          ...(process.env.NODE_ENV === 'development'
            ? ['http://localhost:3000']
            : []),
        ],
        frameDomains: [],
      }],
    };
  },
});
```

### Step 6: Verify Conditional Origins

For every origin that depends on configuration or environment:

```typescript
// WRONG: Runtime URL uses config but CSP doesn't include it
const apiUrl = process.env.API_URL || 'https://api.example.com';
fetch(apiUrl); // Works for default, fails for custom API_URL

// RIGHT: Same config controls both runtime URL and CSP entry
const apiUrl = process.env.API_URL || 'https://api.example.com';
// In registerAppResource:
connectDomains: [apiUrl], // CSP matches runtime URL
```

## Common Pitfalls

1. **Silent failures**: Missing CSP origin = resource silently doesn't load. No console error, no network error.
2. **CSP in wrong location**: CSP goes in `contents[]` from `registerAppResource` read callback, NOT in `_meta` on the tool.
3. **Forgetting localhost**: Even `http://localhost:3000` needs CSP in dev mode.
4. **Third-party surprises**: Libraries like Google Maps, Sentry, or analytics SDKs make network requests you may not be aware of.
5. **Conditional origins not in CSP**: If `API_URL` can be customized, the CSP must include whatever value it resolves to.
6. **Snake_case CSP properties**: Use camelCase (`resourceDomains`, `connectDomains`, `frameDomains`), NOT snake_case.

## Verification Checklist

- [ ] Application built and all output files identified
- [ ] Every network origin in build output discovered
- [ ] Each origin traced to source (constant / env var / conditional)
- [ ] Third-party libraries checked for hidden requests
- [ ] Origins categorized (resourceDomains / connectDomains / frameDomains)
- [ ] Environment annotations applied (universal / dev-only / prod-only)
- [ ] CSP configuration placed in `contents[]` of `registerAppResource` read callback
- [ ] Conditional origins verified: config controls both runtime URL and CSP entry
- [ ] camelCase property names used (not snake_case)

## Task Definition

```javascript
const mcpCspInvestigationTask = defineTask({
  name: 'mcp-csp-investigation',
  description: 'Perform CSP audit for MCP App in sandboxed iframe',

  inputs: {
    projectDir: { type: 'string', required: true },
    buildCommand: { type: 'string', default: 'npm run build' },
    outputDir: { type: 'string', default: 'dist' }
  },

  outputs: {
    resourceDomains: { type: 'array' },
    connectDomains: { type: 'array' },
    frameDomains: { type: 'array' },
    conditionalOrigins: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `CSP investigation for ${inputs.projectDir}`,
      skill: {
        name: 'mcp-csp-investigation',
        context: {
          projectDir: inputs.projectDir,
          buildCommand: inputs.buildCommand,
          outputDir: inputs.outputDir,
          instructions: [
            'Build the application',
            'Search all output for network origins',
            'Trace each origin to source',
            'Check third-party libraries for hidden requests',
            'Categorize domains (resource, connect, frame)',
            'Generate CSP configuration for registerAppResource',
            'Verify conditional origins have matching CSP entries'
          ]
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

- convert-web-app-to-mcp.js
- migrate-openai-app-to-mcp.js

## External Dependencies

- Build toolchain for the target application
- grep/ripgrep for origin discovery
- Access to third-party library source code or documentation

## References

- [MCP Apps CSP/CORS Guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/csp-cors.md)
- [MCP Apps Testing Guide](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/testing-mcp-apps.md)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MCP Apps Patterns - CSP Section](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/patterns.md)

## Related Skills

- mcp-app-verification
- mcp-tool-resource-pattern
- single-file-bundling

## Related Agents

- csp-security-auditor
- mcp-app-architect
