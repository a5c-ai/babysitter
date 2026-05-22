---
name: jwt
description: JWT implementation, token management, refresh patterns, and security.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:authentication-authorization, skill-area:backend-auth]
  roles: [role:backend-engineer, role:security-engineer]
  topics: [topic:jwt-handling, topic:secure-authentication-patterns]

---

# JWT Skill

Expert assistance for JWT authentication implementation.

## Capabilities

- Generate and verify tokens
- Implement refresh tokens
- Handle token storage
- Configure expiration
- Secure token handling

## Implementation

```typescript
import jwt from 'jsonwebtoken';

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
```

## Target Processes

- jwt-authentication
- auth-implementation
- api-security
