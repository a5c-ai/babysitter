---
name: prisma-orm
description: Prisma ORM schema design, migrations, relations, query optimization, and database integration patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Prisma ORM Skill

Expert assistance for Prisma ORM schema design, migrations, relations, query optimization, and database integration patterns.

## Capabilities

- Design Prisma schemas with proper relations
- Generate and manage database migrations
- Optimize queries for performance
- Implement type-safe database access
- Configure multi-database support
- Set up seeding and testing strategies

## Usage

Invoke this skill when you need to:
- Design database schemas with Prisma
- Set up migrations and database workflows
- Optimize database queries
- Implement complex relations
- Configure Prisma with Next.js or other frameworks

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| database | string | No | postgresql, mysql, sqlite, mongodb |
| models | array | No | List of models to create |
| relations | array | No | Model relationships |
| features | array | No | migrations, seeding, edge |

### Schema Configuration

```json
{
  "database": "postgresql",
  "models": [
    {
      "name": "User",
      "fields": [
        { "name": "email", "type": "String", "unique": true },
        { "name": "name", "type": "String", "optional": true },
        { "name": "posts", "type": "Post", "relation": "one-to-many" }
      ]
    },
    {
      "name": "Post",
      "fields": [
        { "name": "title", "type": "String" },
        { "name": "content", "type": "String", "optional": true },
        { "name": "author", "type": "User", "relation": "many-to-one" }
      ]
    }
  ]
}
```

## Output Structure

```
project/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   │   └── 20240101_init/
│   │       └── migration.sql
│   └── seed.ts                 # Seed script
├── lib/
│   └── db/
│       ├── prisma.ts           # Prisma client singleton
│       ├── queries/
│       │   ├── users.ts        # User queries
│       │   └── posts.ts        # Post queries
│       └── types.ts            # Extended types
└── package.json
```

## Generated Code Patterns

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  posts     Post[]
  comments  Comment[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Profile {
  id        String   @id @default(cuid())
  bio       String?
  avatar    String?
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String?
  published   Boolean   @default(false)
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  categories  Category[]
  comments    Comment[]
  tags        Tag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
  @@index([slug])
  @@map("posts")
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]

  @@map("categories")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]

  @@map("tags")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  createdAt DateTime @default(now())

  @@index([postId])
  @@index([authorId])
  @@map("comments")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Prisma Client Singleton

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### Query Functions

```typescript
// lib/db/queries/users.ts
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export type UserWithPosts = Prisma.UserGetPayload<{
  include: { posts: true; profile: true };
}>;

export async function getUserById(id: string): Promise<UserWithPosts | null> {
  return prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      profile: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({
    data,
    include: {
      profile: true,
    },
  });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

export async function getUsers(params: {
  skip?: number;
  take?: number;
  where?: Prisma.UserWhereInput;
  orderBy?: Prisma.UserOrderByWithRelationInput;
}) {
  const { skip = 0, take = 10, where, orderBy = { createdAt: 'desc' } } = params;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / take),
  };
}
```

### Post Queries with Relations

```typescript
// lib/db/queries/posts.ts
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export async function getPublishedPosts(params: {
  page?: number;
  limit?: number;
  categoryId?: string;
  authorId?: string;
  search?: string;
}) {
  const { page = 1, limit = 10, categoryId, authorId, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {
    published: true,
    ...(categoryId && {
      categories: { some: { id: categoryId } },
    }),
    ...(authorId && { authorId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        categories: true,
        tags: true,
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      categories: true,
      tags: true,
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true } },
          replies: {
            include: {
              author: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createPost(data: {
  title: string;
  content?: string;
  authorId: string;
  categoryIds?: string[];
  tagNames?: string[];
}) {
  const { title, content, authorId, categoryIds = [], tagNames = [] } = data;

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return prisma.post.create({
    data: {
      title,
      slug,
      content,
      authorId,
      categories: {
        connect: categoryIds.map((id) => ({ id })),
      },
      tags: {
        connectOrCreate: tagNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: {
      author: true,
      categories: true,
      tags: true,
    },
  });
}
```

### Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Technology' },
      update: {},
      create: { name: 'Technology' },
    }),
    prisma.category.upsert({
      where: { name: 'Design' },
      update: {},
      create: { name: 'Design' },
    }),
  ]);

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      profile: {
        create: {
          bio: 'System administrator',
        },
      },
    },
  });

  // Create sample posts
  await prisma.post.createMany({
    data: [
      {
        title: 'Getting Started with Prisma',
        slug: 'getting-started-with-prisma',
        content: 'Learn how to use Prisma ORM...',
        published: true,
        authorId: admin.id,
      },
      {
        title: 'Database Best Practices',
        slug: 'database-best-practices',
        content: 'Tips for designing efficient databases...',
        published: true,
        authorId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Migration Workflow

```bash
# Create initial migration
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Seed database
npx prisma db seed
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Query Optimization Patterns

### Select Only Needed Fields

```typescript
// Bad - fetches all fields
const user = await prisma.user.findUnique({ where: { id } });

// Good - fetches only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

### Batch Operations

```typescript
// Use transactions for multiple operations
const [user, posts] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.post.createMany({ data: postsData }),
]);

// Use interactive transactions for complex logic
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.post.create({
    data: { ...postData, authorId: user.id },
  });
});
```

### Pagination with Cursor

```typescript
async function getPaginatedPosts(cursor?: string) {
  return prisma.post.findMany({
    take: 10,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: 'desc' },
  });
}
```

## Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0"
  }
}
```

## Workflow

1. **Define schema** - Create models and relations
2. **Generate client** - Run prisma generate
3. **Create migrations** - Run prisma migrate dev
4. **Implement queries** - Type-safe database access
5. **Seed database** - Create initial data
6. **Optimize queries** - Select, batch, index

## Best Practices Applied

- Type-safe queries with Prisma Client
- Proper relation modeling
- Efficient pagination patterns
- Transaction support
- Cascade deletes where appropriate
- Indexed frequently queried fields

## References

- Prisma Documentation: https://www.prisma.io/docs
- Prisma MCP Server: https://www.prisma.io/mcp
- Prisma Examples: https://github.com/prisma/prisma-examples

## Target Processes

- database-schema-design
- migration-management
- query-optimization
- data-seeding
- database-testing
