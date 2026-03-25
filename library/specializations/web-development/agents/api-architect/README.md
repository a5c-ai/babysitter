# API Architect Agent

Expert in API design decisions, REST vs GraphQL selection, versioning strategies, documentation standards, and API security patterns.

## Overview

The API Architect agent provides guidance on designing robust, scalable APIs. It ensures APIs follow best practices for design, documentation, security, and performance.

## When to Use

- Designing new API endpoints
- Choosing between REST, GraphQL, or tRPC
- Creating API documentation
- Implementing API security
- Planning API versioning strategies
- Reviewing existing API designs

## Expertise Areas

### API Design

The agent provides guidance on:
- RESTful resource modeling
- GraphQL schema design
- Endpoint naming conventions
- HTTP method and status code usage

### Documentation

Expertise in:
- OpenAPI/Swagger specification
- API reference documentation
- Example request/response pairs
- Error code documentation

### Security

Focus on:
- Authentication patterns (JWT, OAuth)
- Authorization (RBAC, ABAC)
- Rate limiting
- Input validation

## Interaction Examples

### REST API Review

**Input:**
```
I have these endpoints:
POST /api/getUser
POST /api/createUser
POST /api/updateUser
POST /api/deleteUser

How should I improve them?
```

**Agent Response:**
```
API Design Recommendations:

Current Issues:
1. Using POST for all operations (should vary by action)
2. Verb-based naming (should be resource-based)
3. Action in URL (should be indicated by HTTP method)

Recommended Design:
GET    /api/users/:id    # Get single user
GET    /api/users        # List users
POST   /api/users        # Create user
PUT    /api/users/:id    # Replace user
PATCH  /api/users/:id    # Partial update
DELETE /api/users/:id    # Delete user

Benefits:
- Follows REST conventions
- HTTP methods indicate action
- Cacheable GET requests
- Consistent resource modeling
```

### GraphQL vs REST Decision

**Input:**
```
Should we use GraphQL or REST for our application?
We have a mobile app and web app that share the same backend.
```

**Agent Response:**
```
API Technology Recommendation:

For your use case (multiple clients), consider:

GraphQL Advantages:
- Clients fetch exactly what they need
- Single endpoint, multiple queries
- Strong typing with schema
- Great for complex, nested data

REST Advantages:
- Simpler to implement and cache
- Better HTTP semantics
- Easier rate limiting
- More tooling available

Recommendation: GraphQL

Rationale:
1. Mobile vs Web have different data needs
2. Single API serves both efficiently
3. Reduced over-fetching saves bandwidth
4. Schema acts as documentation

Implementation:
- Use Apollo Server or Yoga
- Implement DataLoader for N+1 prevention
- Set up persisted queries for mobile
- Add rate limiting per operation

Alternative: tRPC (if both clients are TypeScript)
- End-to-end type safety
- Simpler than GraphQL
- Great DX for TypeScript teams
```

### Security Review

**Input:**
```
Review this API authentication:
- User sends username/password
- Server returns JWT token
- Token never expires
- Token stored in localStorage
```

**Agent Response:**
```
Security Assessment: Critical Issues

Issues Found:
1. No token expiration (Critical)
   - Stolen tokens work forever
   Fix: Set exp claim (15min - 1hr)

2. localStorage storage (High)
   - Vulnerable to XSS attacks
   Fix: Use httpOnly cookies

3. No refresh token (Medium)
   - Users must re-login frequently
   Fix: Implement refresh token flow

Recommended Implementation:
1. Short-lived access tokens (15min)
2. Long-lived refresh tokens (7-30 days)
3. HttpOnly, Secure, SameSite cookies
4. Token rotation on refresh
5. Revocation capability (blacklist)

Token Flow:
Login → Access + Refresh tokens
  ↓
Use access token for API calls
  ↓
Access expired → Use refresh token
  ↓
Get new access + refresh tokens
  ↓
Refresh expired → Re-login

Security Headers:
Access-Control-Allow-Credentials: true
Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict
```

## Design Patterns

### Resource Modeling

```
/users                    # Collection
/users/:id                # Single resource
/users/:id/posts          # Sub-collection
/users/:id/posts/:postId  # Nested resource
```

### Filtering and Sorting

```
GET /posts?status=published&author_id=123
GET /posts?sort=-created_at,title
GET /posts?fields=id,title,excerpt
```

### Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid format" }
    ]
  }
}
```

## Integration

The API Architect agent integrates with:

| Process | Role |
|---------|------|
| api-design-specification | Primary design guidance |
| rest-api-development | REST implementation |
| graphql-api-development | GraphQL schemas |
| api-documentation | OpenAPI specs |

## References

- [REST API Design](https://restfulapi.net/)
- [OpenAPI Specification](https://spec.openapis.org/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [tRPC Documentation](https://trpc.io/docs)
