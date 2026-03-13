# NestJS Skill

Enterprise Node.js framework with Angular-inspired architecture, dependency injection, and TypeScript.

## Overview

This skill provides expertise in NestJS, a progressive Node.js framework for building efficient, reliable, and scalable server-side applications.

## When to Use

- Enterprise API development
- Microservices architecture
- GraphQL APIs
- WebSocket applications
- Teams familiar with Angular

## Quick Start

```typescript
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| Modules | Feature encapsulation |
| Controllers | Request handling |
| Providers | Injectable services |
| Guards | Authorization |
| Pipes | Validation/transformation |

## Architecture

```
src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── auth/
│   └── guards/
└── common/
    └── interceptors/
```

## Integration

Works with prisma-skill for database and graphql-skill for GraphQL APIs.
