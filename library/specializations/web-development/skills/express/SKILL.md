---
name: express
description: Express.js middleware patterns, routing, error handling, security, and production best practices.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Express Skill

Expert assistance for building Node.js APIs with Express.js.

## Capabilities

- Configure Express applications with middleware
- Implement RESTful routing patterns
- Handle errors with custom middleware
- Apply security best practices
- Set up validation and parsing
- Configure production deployments

## Usage

Invoke this skill when you need to:
- Build REST APIs with Express
- Implement middleware pipelines
- Handle errors gracefully
- Add authentication/authorization
- Set up API documentation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| routePath | string | Yes | Route path prefix |
| methods | array | Yes | HTTP methods |
| middleware | array | No | Middleware to apply |
| validation | boolean | No | Add validation |

## Patterns

### Application Setup

```typescript
// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { errorHandler, notFoundHandler } from './middleware/error';
import { usersRouter } from './routes/users';
import { authRouter } from './routes/auth';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Compression and logging
  app.use(compression());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
```

### Router with Controllers

```typescript
// src/routes/users.ts
import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const router = Router();
const controller = new UsersController();

router.get('/', authenticate, controller.findAll);
router.get('/:id', authenticate, controller.findById);
router.post('/', authenticate, authorize('admin'), validate(createUserSchema), controller.create);
router.put('/:id', authenticate, validate(updateUserSchema), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.delete);

export { router as usersRouter };

// src/controllers/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';

export class UsersController {
  private service = new UsersService();

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const users = await this.service.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
      });
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.update(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
```

### Middleware Patterns

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}
```

### Async Handler Wrapper

```typescript
// src/utils/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
router.get('/', asyncHandler(async (req, res) => {
  const users = await usersService.findAll();
  res.json(users);
}));
```

## Best Practices

- Use middleware for cross-cutting concerns
- Implement proper error handling
- Validate all inputs
- Apply security middleware (helmet, cors, rate limit)
- Structure code with controllers and services

## Target Processes

- nodejs-api-development
- rest-api-development
- mern-stack-development
- backend-architecture
