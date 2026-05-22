---
name: vercel
description: Vercel deployment, edge functions, environment configuration, and preview deployments.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:deployment-infrastructure-management]
  roles: [role:frontend-engineer, role:fullstack-engineer]
  topics: [topic:continuous-deployment, topic:serverless-architecture]

---

# Vercel Skill

Expert assistance for deploying to Vercel.

## Capabilities

- Configure Vercel projects
- Set up Edge Functions
- Manage environment variables
- Configure preview deployments
- Optimize for Edge

## Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

## Target Processes

- vercel-deployment
- edge-functions
- nextjs-deployment
