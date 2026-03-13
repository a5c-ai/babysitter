---
name: netlify
description: Netlify deployment, functions, forms, and edge handlers.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Netlify Skill

Expert assistance for deploying to Netlify.

## Capabilities

- Configure Netlify deployments
- Create Netlify Functions
- Handle form submissions
- Set up edge handlers
- Configure redirects

## Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
```

## Target Processes

- netlify-deployment
- serverless-functions
- jamstack-deployment
