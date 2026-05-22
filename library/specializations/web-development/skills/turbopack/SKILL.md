---
name: turbopack
description: Turbopack configuration and Next.js integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:asset-pipeline, skill-area:web-performance]
  roles: [role:frontend-engineer]
  topics: [topic:developer-experience]

---

# Turbopack Skill

Expert assistance for Turbopack configuration with Next.js.

## Capabilities

- Configure Turbopack
- Optimize for Next.js
- Handle custom configuration
- Debug build issues

## Usage

```bash
next dev --turbo
```

```javascript
// next.config.js
module.exports = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};
```

## Target Processes

- nextjs-development
- build-optimization
