---
name: secrets-management
description: Secrets handling, environment variables, and vault integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Secrets Management Skill

Expert assistance for handling secrets securely.

## Capabilities

- Configure environment variables
- Integrate with vaults
- Handle secrets rotation
- Secure CI/CD secrets
- Audit secret access

## Best Practices

```typescript
// Never commit secrets
// Use environment variables
const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  apiKey: process.env.API_KEY,
};

// Validate required secrets
const required = ['DATABASE_URL', 'JWT_SECRET'];
required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
});
```

## Target Processes

- secrets-setup
- security-hardening
- ci-cd-security
