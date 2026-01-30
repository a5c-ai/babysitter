# Security Audit Report - Process Library Catalog

**Date:** January 26, 2026
**Auditor:** Security Engineer
**Scope:** packages/catalog (from the babysitter monorepo)
**Version:** 0.1.0

---

## Executive Summary

This security audit examines the Process Library Catalog application, a Next.js 16 application using React 19 with a SQLite database (better-sqlite3). The application serves as a catalog browser for process definitions, agents, and skills.

**Overall Risk Level:** MEDIUM

| Category | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 4 |
| Low | 5 |
| **Total** | **11** |

---

## Table of Contents

1. [XSS Vulnerabilities](#1-xss-vulnerabilities)
2. [SQL/NoSQL Injection Risks](#2-sqlnosql-injection-risks)
3. [Authentication and Authorization](#3-authentication-and-authorization)
4. [Sensitive Data Exposure](#4-sensitive-data-exposure)
5. [Input Validation](#5-input-validation)
6. [CSRF Vulnerabilities](#6-csrf-vulnerabilities)
7. [Dependency Security](#7-dependency-security)
8. [Hardcoded Secrets](#8-hardcoded-secrets)
9. [Error Handling and Information Leakage](#9-error-handling-and-information-leakage)
10. [API Security](#10-api-security)
11. [Cookie Security](#11-cookie-security)
12. [Additional Findings](#12-additional-findings)

---

## 1. XSS Vulnerabilities

### 1.1 CRITICAL: Use of dangerouslySetInnerHTML

**Severity:** HIGH
**File:** `src/app/search/page.tsx:903-909`
**Status:** Vulnerable

**Description:**
The search results page uses `dangerouslySetInnerHTML` to render search highlight snippets:

```tsx
<span
  dangerouslySetInnerHTML={{
    __html: result.highlights.content.replace(
      /<mark>/g,
      '<mark style="background-color: rgba(201, 169, 97, 0.35); color: #4A3728; padding: 1px 3px; border-radius: 2px;">'
    ),
  }}
/>
```

**Risk:**
The `highlights.content` field originates from the SQLite FTS5 `snippet()` function which adds `<mark>` tags around matched terms. While the snippet function itself adds these tags, the original content stored in the database could contain malicious HTML/JavaScript that would be executed.

**Attack Vector:**
1. A malicious markdown file is indexed containing `<script>alert('XSS')</script>`
2. User searches for a term that matches content in that file
3. The FTS5 snippet function returns the malicious content with `<mark>` tags
4. The content is rendered via `dangerouslySetInnerHTML`
5. Malicious script executes in the user's browser

**Recommendation:**
- Sanitize the content before rendering using a library like DOMPurify
- Use a safer approach: parse the snippet and use React components for highlighting
- Alternatively, escape HTML entities before the FTS5 indexing

```tsx
import DOMPurify from 'dompurify';

// Before rendering
const sanitizedContent = DOMPurify.sanitize(result.highlights.content, {
  ALLOWED_TAGS: ['mark'],
  ALLOWED_ATTR: ['style']
});
```

### 1.2 Markdown Rendering Security

**Severity:** LOW
**File:** `src/components/markdown/MarkdownRenderer.tsx`
**Status:** Mitigated

**Description:**
The application uses `react-markdown` with `rehype-highlight` for rendering markdown content. React-markdown escapes HTML by default, which mitigates basic XSS.

**Current Protection:**
- `react-markdown` does not use `dangerouslySetInnerHTML` internally for content
- Custom components are used for links, images, and code blocks
- External links properly use `rel="noopener noreferrer"` (Line 124)

**Remaining Risk:**
- The `rehype-highlight` plugin processes code blocks; ensure no custom plugins are added that could bypass escaping
- URLs in links and images should be validated (see LinkHandler.tsx)

---

## 2. SQL/NoSQL Injection Risks

### 2.1 SQL Queries Use Parameterized Statements

**Severity:** LOW (Informational)
**Status:** Well Protected

**Description:**
The codebase correctly uses parameterized queries throughout:

**Good Practices Found:**

`src/lib/db/queries.ts`:
```typescript
// FTS5 search with parameterized query
const sql = `
  SELECT ... FROM catalog_search
  WHERE catalog_search MATCH ?
    AND item_type IN (${typeFilter})
  ORDER BY rank
  LIMIT ?
`;
const rows = this.db.getDb().prepare(sql).all(query, ...types, limit);
```

`src/app/api/agents/[slug]/route.ts`:
```typescript
// Parameterized lookup
const row = rawDb.prepare(sql).get(slug);
```

### 2.2 Potential SQL Injection via Dynamic Column Names

**Severity:** MEDIUM
**File:** `src/lib/db/queries.ts:51-54, 107-109`
**Status:** Vulnerable

**Description:**
The QueryBuilder class accepts field names directly without validation:

```typescript
select(...columns: string[]): this {
  this.selectColumns = columns;  // Not validated
  return this;
}

orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
  this.orderByClause.push(`${field} ${direction.toUpperCase()}`);  // Not validated
  return this;
}
```

**Risk:**
If user-controlled input reaches these methods, SQL injection is possible:

```typescript
// Malicious input could be:
builder.orderBy("name; DROP TABLE agents; --", "asc");
```

**Current Mitigation:**
These methods are currently only called with hardcoded values within the codebase, so the practical risk is low.

**Recommendation:**
Add field name validation with an allowlist:

```typescript
private validateFieldName(field: string, allowedFields: string[]): void {
  if (!allowedFields.includes(field)) {
    throw new Error(`Invalid field name: ${field}`);
  }
}
```

---

## 3. Authentication and Authorization

### 3.1 No Authentication Implemented

**Severity:** HIGH
**Status:** By Design (but risky)

**Description:**
The application has no authentication or authorization mechanism:
- All API endpoints are publicly accessible
- The `/api/reindex` endpoint can trigger database rebuilds without authentication
- No user sessions or access control

**Files Affected:**
- All files in `src/app/api/`

**Risk:**
- `/api/reindex` can be called repeatedly, causing DoS through resource exhaustion
- No protection against unauthorized data access (though data appears to be non-sensitive)

**Recommendation:**
For production deployment:
1. Add authentication middleware using NextAuth.js or similar
2. Implement API key authentication for programmatic access
3. Add rate limiting to all endpoints
4. Restrict `/api/reindex` to authorized administrators only

```typescript
// Example middleware for API protection
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (request.nextUrl.pathname.startsWith('/api/reindex')) {
    if (!apiKey || apiKey !== process.env.REINDEX_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}
```

---

## 4. Sensitive Data Exposure

### 4.1 Environment File Committed (Potential Issue)

**Severity:** MEDIUM
**File:** `.env.local` (found in git status as untracked but present)
**Status:** At Risk

**Description:**
The `.env.local` file exists and contains configuration. While `.gitignore` includes `.env.local`, the git status shows it as present in the working directory.

**Current Contents (`.env.local`):**
```
NEXT_PUBLIC_APP_NAME="Process Library Catalog"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_PATH="./data/catalog.db"
PROCESS_LIBRARY_PATH="../babysitter/skills/babysit/process"
```

**Risk:**
- Currently contains no secrets, but developers might add API keys later
- The `.env.example` mentions `GITHUB_TOKEN` and `OPENAI_API_KEY` as optional

**Recommendation:**
- Ensure `.env.local` is never committed
- Use a secrets management system for production
- Add pre-commit hooks to prevent accidental commits

### 4.2 File Path Exposure in API Responses

**Severity:** LOW
**Files:** `src/app/api/agents/[slug]/route.ts`, `src/app/api/skills/[slug]/route.ts`
**Status:** Information Disclosure

**Description:**
API responses include full file paths:

```typescript
const agent: AgentDetail = {
  // ...
  filePath: row.file_path,  // Full server file path exposed
  directory: row.directory,
  // ...
};
```

**Risk:**
Exposes server directory structure which aids reconnaissance for attackers.

**Recommendation:**
Consider omitting or sanitizing file paths in API responses:

```typescript
filePath: path.relative(process.cwd(), row.file_path),
```

---

## 5. Input Validation

### 5.1 Query Parameter Validation

**Severity:** LOW
**File:** `src/lib/api/utils.ts`
**Status:** Partially Implemented

**Description:**
The application has basic input validation:

**Good:**
- `parseIntParam` safely parses integers with defaults
- `validateSlug` checks for empty/missing values
- `validateId` ensures positive integers
- Limit values are capped at `MAX_LIMIT = 100`

**Missing:**
- No maximum length validation for search queries
- No character validation for slugs (could allow special characters)
- No validation of sort field names against allowlist

**Recommendation:**
Add comprehensive validation:

```typescript
export function validateSearchQuery(query: string): ValidationResult {
  if (query.length > 500) {
    return { valid: false, error: 'Query too long (max 500 chars)' };
  }
  // Additional sanitization
  return { valid: true, query: query.trim() };
}

export function validateSlug(slug: string): ValidationResult {
  const slugRegex = /^[a-zA-Z0-9_-]+$/;
  if (!slugRegex.test(slug)) {
    return { valid: false, error: 'Invalid slug format' };
  }
  return { valid: true, slug };
}
```

### 5.2 FTS5 Query Input

**Severity:** MEDIUM
**File:** `src/lib/db/queries.ts:510-532`
**Status:** Potential Issue

**Description:**
User search queries are passed directly to SQLite FTS5:

```typescript
search(query: string, options?: { limit?: number; types?: CatalogEntryType[] }): SearchResult[] {
  // ...
  const rows = this.db.getDb().prepare(sql).all(query, ...types, limit);
}
```

**Risk:**
FTS5 has its own query syntax. Malicious queries could:
- Cause query errors or unexpected behavior
- Potentially exploit FTS5-specific vulnerabilities
- Use special operators like `NOT`, `OR`, `NEAR`, `*` unexpectedly

**Recommendation:**
Escape or sanitize FTS5 query syntax:

```typescript
function sanitizeFts5Query(query: string): string {
  // Escape special FTS5 characters
  return query
    .replace(/"/g, '""')
    .split(/\s+/)
    .map(term => `"${term}"`)
    .join(' ');
}
```

---

## 6. CSRF Vulnerabilities

### 6.1 No CSRF Protection for State-Changing Operations

**Severity:** MEDIUM
**File:** `src/app/api/reindex/route.ts`
**Status:** Vulnerable

**Description:**
The `/api/reindex` endpoint accepts both GET and POST requests without CSRF tokens:

```typescript
// POST endpoint - no CSRF protection
export async function POST(request: NextRequest) {
  // Triggers database rebuild...
}

// GET endpoint - even easier to exploit
export async function GET(request: NextRequest) {
  // Also triggers database rebuild!
}
```

**Risk:**
An attacker could craft a malicious page that triggers reindexing:

```html
<!-- Malicious page -->
<img src="https://your-catalog.com/api/reindex?force=true" />
```

**Recommendation:**
1. Remove GET support for state-changing operations
2. Add CSRF protection for POST endpoints
3. Implement authentication before CSRF becomes critical

```typescript
// Remove GET handler or make it read-only
export async function GET(request: NextRequest) {
  // Return status only, no mutations
  const db = initializeDatabase();
  const stats = db.getStats();
  return createSuccessResponse({ status: 'ready', lastIndexed: stats.lastIndexedAt });
}
```

---

## 7. Dependency Security

### 7.1 Dependency Analysis

**File:** `package.json`
**Status:** Review Recommended

**Dependencies Reviewed:**

| Package | Version | Risk Assessment |
|---------|---------|-----------------|
| next | 16.1.4 | Latest stable - Good |
| react | 19.2.3 | Latest stable - Good |
| better-sqlite3 | ^11.0.0 | Native module - review changelog |
| react-markdown | ^9.0.1 | Security-conscious library - Good |
| gray-matter | ^4.0.3 | Potential YAML parsing issues |
| rehype-highlight | ^7.0.0 | Check for XSS in highlighting |

**Concerns:**

1. **gray-matter (^4.0.3):** Used for YAML frontmatter parsing. YAML parsing has historically had security issues. Verify:
   - No code execution via `!!js/function` tags
   - Safe handling of large/nested YAML

2. **better-sqlite3:** Native module that requires compilation. Keep updated for security patches.

**Recommendation:**
```bash
# Run security audit
npm audit

# Keep dependencies updated
npm update

# Use lockfile integrity
npm ci  # Instead of npm install in CI/CD
```

### 7.2 Missing Security Headers

**Severity:** LOW
**File:** `next.config.ts`
**Status:** Not Configured

**Description:**
The Next.js configuration doesn't include security headers:

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { ... },
  // Missing: headers configuration
};
```

**Recommendation:**
Add security headers:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        },
      ],
    },
  ];
}
```

---

## 8. Hardcoded Secrets

### 8.1 No Hardcoded Secrets Found

**Severity:** None
**Status:** Clean

**Description:**
Grep analysis found no hardcoded:
- API keys
- Passwords
- Tokens
- Private keys

**Files Checked:**
- All source files in `src/`
- Configuration files
- Environment examples

---

## 9. Error Handling and Information Leakage

### 9.1 Error Messages Expose Internal Details

**Severity:** MEDIUM
**File:** `src/lib/api/utils.ts:154-158`
**Status:** Information Disclosure

**Description:**
Internal error handler exposes error messages to clients:

```typescript
export function internalErrorResponse(error: unknown): NextResponse<ApiResponse<never>> {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  console.error('Internal server error:', error);
  return createErrorResponse('INTERNAL_ERROR', message, 500);  // Exposes message
}
```

**Risk:**
Error messages may contain sensitive information:
- Database errors with table/column names
- File system paths
- Internal implementation details

**Recommendation:**
```typescript
export function internalErrorResponse(error: unknown): NextResponse<ApiResponse<never>> {
  // Log full error server-side
  console.error('Internal server error:', error);

  // Return generic message to client
  const isDev = process.env.NODE_ENV === 'development';
  const clientMessage = isDev
    ? (error instanceof Error ? error.message : 'An unexpected error occurred')
    : 'An internal error occurred. Please try again later.';

  return createErrorResponse('INTERNAL_ERROR', clientMessage, 500);
}
```

### 9.2 ErrorBoundary Development Mode Exposure

**Severity:** LOW
**File:** `src/components/ErrorBoundary.tsx:153-161`
**Status:** Controlled

**Description:**
The ErrorBoundary shows component stack traces in development:

```typescript
const isDev = process.env.NODE_ENV === "development";
// ...
{isDev && errorInfo?.componentStack && (
  <pre className="...">{errorInfo.componentStack}</pre>
)}
```

**Status:** This is appropriately gated behind development mode check.

---

## 10. API Security

### 10.1 No Rate Limiting

**Severity:** HIGH
**Files:** All API routes in `src/app/api/`
**Status:** Missing

**Description:**
No rate limiting is implemented on any API endpoint:
- Search endpoint can be abused for enumeration
- Reindex endpoint can cause DoS
- Bulk operations have no throttling

**Recommendation:**
Implement rate limiting using middleware:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return NextResponse.next();
}
```

### 10.2 Missing CORS Configuration

**Severity:** LOW
**File:** `next.config.ts`
**Status:** Using Defaults

**Description:**
No explicit CORS configuration. Next.js API routes allow same-origin by default.

**Recommendation:**
If cross-origin access is needed, configure explicitly:

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ];
}
```

---

## 11. Cookie Security

### 11.1 No Cookie Usage Found

**Severity:** None
**Status:** Not Applicable

**Description:**
The application does not use cookies for state management. Search results confirmed no cookie-related code.

**Note:** If authentication is added later, ensure cookies have:
- `httpOnly: true`
- `secure: true` (production)
- `sameSite: 'strict'`

---

## 12. Additional Findings

### 12.1 External Link Security

**Severity:** LOW
**File:** `src/components/markdown/LinkHandler.tsx:121-124`
**Status:** Properly Handled

**Description:**
External links correctly use security attributes:

```typescript
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"  // Prevents tabnapping
  // ...
>
```

### 12.2 Image Handling

**Severity:** LOW
**File:** `next.config.ts:9-18`
**Status:** Properly Configured

**Description:**
Image remote patterns are restricted to known hosts:

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "github.com" },
    { protocol: "https", hostname: "avatars.githubusercontent.com" },
  ],
},
```

### 12.3 Database File Permissions

**Severity:** LOW
**File:** `src/lib/db/client.ts`
**Status:** Relies on OS Defaults

**Description:**
The database file is created with default permissions. On multi-user systems, this could expose data.

**Recommendation:**
Set explicit file permissions:

```typescript
import * as fs from 'fs';

// After creating database
fs.chmodSync(this.dbPath, 0o600);  // Owner read/write only
```

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. **Fix XSS in Search Highlights**
   - Sanitize `dangerouslySetInnerHTML` content with DOMPurify
   - Consider using React components instead

2. **Add Authentication to Reindex Endpoint**
   - Implement API key or session-based authentication
   - Remove GET method for state-changing operations

3. **Implement Rate Limiting**
   - Add rate limiting middleware for all API endpoints
   - Consider using Upstash or similar service

### Short-term Actions (Medium Priority)

4. **Improve Input Validation**
   - Validate search query length
   - Sanitize FTS5 query syntax
   - Add slug format validation

5. **Reduce Information Exposure**
   - Make error messages generic in production
   - Consider removing file paths from API responses

6. **Add Security Headers**
   - Configure CSP, X-Frame-Options, etc.
   - Add headers via Next.js config

### Long-term Actions (Low Priority)

7. **Security Audit Dependencies**
   - Run `npm audit` regularly
   - Set up Dependabot or similar

8. **Consider Content Security Policy**
   - Strict CSP for production
   - Remove `unsafe-inline` where possible

9. **Add Security Testing**
   - Add OWASP ZAP to CI/CD
   - Include security-focused unit tests

---

## Compliance Notes

### OWASP Top 10 2021 Assessment

| Category | Status |
|----------|--------|
| A01:2021 - Broken Access Control | HIGH RISK - No authentication |
| A02:2021 - Cryptographic Failures | N/A - No sensitive data handling |
| A03:2021 - Injection | LOW RISK - Parameterized queries used |
| A04:2021 - Insecure Design | MEDIUM - Missing security controls |
| A05:2021 - Security Misconfiguration | MEDIUM - Missing headers |
| A06:2021 - Vulnerable Components | LOW - Review dependencies |
| A07:2021 - Auth Failures | HIGH - No auth implemented |
| A08:2021 - Data Integrity Failures | LOW - Limited state changes |
| A09:2021 - Security Logging | LOW - Basic console logging |
| A10:2021 - SSRF | N/A - No external requests |

---

## Conclusion

The Process Library Catalog application has a moderate security posture appropriate for a development/internal tool. The most significant risks are:

1. **XSS via dangerouslySetInnerHTML** - Requires immediate attention
2. **No authentication** - Critical for production deployment
3. **No rate limiting** - Opens the application to abuse

For production deployment, implementing authentication and rate limiting should be prioritized. The XSS vulnerability should be fixed regardless of deployment environment.

The codebase demonstrates good security practices in areas like SQL injection prevention (parameterized queries) and external link handling. With the recommended improvements, the application can achieve a strong security posture.
