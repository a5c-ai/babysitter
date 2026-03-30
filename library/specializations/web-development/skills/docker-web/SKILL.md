---
name: docker-web
description: Docker containerization for web apps, multi-stage builds, and optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Docker Web Skill

Expert assistance for containerizing web applications.

## Capabilities

- Create multi-stage Dockerfiles
- Optimize image size
- Configure for production
- Handle Node.js apps
- Set up docker-compose

## Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

## Target Processes

- containerization
- production-deployment
- ci-cd-setup
