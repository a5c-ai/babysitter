---
name: csp
description: Content Security Policy configuration, nonces, and reporting.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CSP Skill

Expert assistance for Content Security Policy implementation.

## Capabilities

- Configure CSP headers
- Implement nonces
- Set up reporting
- Handle inline scripts
- Configure strict CSP

## CSP Configuration

```typescript
// Next.js middleware
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
  style-src 'self' 'nonce-${nonce}';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  report-uri /api/csp-report;
`;
```

## Target Processes

- security-hardening
- csp-implementation
- xss-prevention
