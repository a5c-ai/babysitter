---
name: jwt
description: JWT implementation, token management, refresh patterns, and security.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
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
