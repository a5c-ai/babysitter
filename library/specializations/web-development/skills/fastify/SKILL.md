---
name: fastify
description: Fastify plugins, hooks, validation, serialization, and performance optimization patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Fastify Skill

Expert assistance for building high-performance APIs with Fastify.

## Capabilities

- Configure Fastify with plugins
- Implement hooks for lifecycle management
- Set up JSON Schema validation
- Optimize serialization for performance
- Build type-safe APIs with TypeScript
- Create reusable plugins

## Usage

Invoke this skill when you need to:
- Build high-performance APIs
- Implement schema validation
- Create custom plugins
- Optimize JSON serialization
- TypeScript integration

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| routePrefix | string | Yes | Route prefix |
| validation | boolean | No | Add JSON Schema validation |
| plugins | array | No | Plugins to use |

## Patterns

### Application Setup

```typescript
// src/app.ts
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { usersRoutes } from './routes/users';
import { authRoutes } from './routes/auth';
import { errorHandler } from './plugins/error-handler';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
    },
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Security plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'API Documentation',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Custom plugins
  await app.register(errorHandler);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  return app;
}
```

### Routes with Schema Validation

```typescript
// src/routes/users.ts
import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { UsersService } from '../services/users.service';

const UserSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  role: Type.Union([Type.Literal('user'), Type.Literal('admin')]),
  createdAt: Type.String({ format: 'date-time' }),
});

const CreateUserSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  role: Type.Optional(Type.Union([Type.Literal('user'), Type.Literal('admin')])),
});

const UpdateUserSchema = Type.Partial(CreateUserSchema);

const PaginationSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
  search: Type.Optional(Type.String()),
});

type User = Static<typeof UserSchema>;
type CreateUser = Static<typeof CreateUserSchema>;
type UpdateUser = Static<typeof UpdateUserSchema>;
type Pagination = Static<typeof PaginationSchema>;

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new UsersService();

  fastify.get<{ Querystring: Pagination }>('/', {
    schema: {
      tags: ['users'],
      querystring: PaginationSchema,
      response: {
        200: Type.Object({
          data: Type.Array(UserSchema),
          meta: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number(),
          }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request) => {
    return service.findAll(request.query);
  });

  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
      tags: ['users'],
      params: Type.Object({ id: Type.String() }),
      response: { 200: UserSchema },
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await service.findById(request.params.id);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return user;
  });

  fastify.post<{ Body: CreateUser }>('/', {
    schema: {
      tags: ['users'],
      body: CreateUserSchema,
      response: { 201: UserSchema },
    },
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
  }, async (request, reply) => {
    const user = await service.create(request.body);
    return reply.status(201).send(user);
  });

  fastify.put<{ Params: { id: string }; Body: UpdateUser }>('/:id', {
    schema: {
      tags: ['users'],
      params: Type.Object({ id: Type.String() }),
      body: UpdateUserSchema,
      response: { 200: UserSchema },
    },
    preHandler: [fastify.authenticate],
  }, async (request) => {
    return service.update(request.params.id, request.body);
  });

  fastify.delete<{ Params: { id: string } }>('/:id', {
    schema: {
      tags: ['users'],
      params: Type.Object({ id: Type.String() }),
    },
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
  }, async (request, reply) => {
    await service.delete(request.params.id);
    return reply.status(204).send();
  });
};
```

### Hooks and Plugins

```typescript
// src/plugins/auth.ts
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    authorize: (roles: string[]) => (request: FastifyRequest) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; role: string };
    user: { id: string; email: string; role: string };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    await request.jwtVerify();
  });

  fastify.decorate('authorize', (roles: string[]) => {
    return async (request: FastifyRequest) => {
      await request.jwtVerify();
      if (!roles.includes(request.user.role)) {
        throw fastify.httpErrors.forbidden('Insufficient permissions');
      }
    };
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});

// src/plugins/error-handler.ts
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const errorHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: error.validation,
      });
    }

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : error.message;

    return reply.status(statusCode).send({ error: message });
  });
};

export default fp(errorHandler, {
  name: 'error-handler',
});
```

### Custom Hooks

```typescript
// Lifecycle hooks
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime;
  request.log.info({ duration }, 'Request completed');
});

fastify.addHook('onSend', async (request, reply, payload) => {
  // Modify response before sending
  return payload;
});
```

## Best Practices

- Use JSON Schema for validation
- Leverage TypeBox for TypeScript schemas
- Create reusable plugins with fastify-plugin
- Use hooks for cross-cutting concerns
- Enable schema serialization for performance

## Target Processes

- high-performance-api
- nodejs-microservices
- api-development
- backend-optimization
