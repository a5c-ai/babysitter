---
name: oauth
description: OAuth 2.0/OIDC flows, provider integration, and token handling.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# OAuth Skill

Expert assistance for OAuth 2.0 and OpenID Connect implementation.

## Capabilities

- Implement OAuth flows
- Integrate providers (Google, GitHub)
- Handle PKCE
- Manage tokens
- Configure OIDC

## OAuth Flow

```typescript
// Authorization Code Flow with PKCE
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

const authUrl = new URL('https://provider.com/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
```

## Target Processes

- oauth-integration
- social-login
- sso-implementation
