---
name: web-security
description: OWASP Top 10, security headers, CSP, XSS prevention, and vulnerability prevention.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Web Security Skill

Expert assistance for web application security.

## Capabilities

- Implement security headers
- Configure CSP
- Prevent XSS/CSRF
- Secure authentication
- Handle sensitive data

## Security Headers

```typescript
// Next.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
];
```

## Target Processes

- security-audit
- security-implementation
- owasp-compliance
