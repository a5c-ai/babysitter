---
name: test-data-generation
description: Synthetic test data generation and management using Faker.js and similar tools. Generate realistic test data, create data factories, implement database seeding, and manage test data anonymization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: test-data-management
  backlog-id: SK-015
---

# test-data-generation

You are **test-data-generation** - a specialized skill for synthetic test data generation and management, providing capabilities for creating realistic, reproducible test data.

## Overview

This skill enables AI-powered test data management including:
- Generating realistic test data with Faker.js
- Creating data factories and builders
- Database seeding scripts
- Test data anonymization and masking
- Generating boundary value test data
- Configuring data cleanup strategies
- Creating deterministic test data with seeds
- Integration with ORM factories (Fishery, Factory Bot)

## Prerequisites

- Node.js or Python environment
- Faker library installed (@faker-js/faker or faker-python)
- Database access for seeding operations
- Optional: ORM (Prisma, Sequelize, SQLAlchemy) for factory integration

## Capabilities

### 1. Basic Data Generation

Generate realistic test data with Faker.js:

```javascript
import { faker } from '@faker-js/faker';

// Generate user data
const generateUser = () => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: faker.location.country()
  },
  company: faker.company.name(),
  jobTitle: faker.person.jobTitle(),
  avatar: faker.image.avatar(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent()
});

// Generate multiple users
const users = faker.helpers.multiple(generateUser, { count: 100 });
```

### 2. Data Factory Pattern

Create reusable data factories:

```javascript
import { faker } from '@faker-js/faker';

// User Factory
class UserFactory {
  static defaults = {
    id: () => faker.string.uuid(),
    email: () => faker.internet.email(),
    firstName: () => faker.person.firstName(),
    lastName: () => faker.person.lastName(),
    role: () => 'user',
    isActive: () => true,
    createdAt: () => faker.date.past()
  };

  static create(overrides = {}) {
    const defaults = Object.fromEntries(
      Object.entries(this.defaults).map(([key, fn]) => [key, fn()])
    );
    return { ...defaults, ...overrides };
  }

  static createMany(count, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  // Trait methods
  static admin(overrides = {}) {
    return this.create({ role: 'admin', ...overrides });
  }

  static inactive(overrides = {}) {
    return this.create({ isActive: false, ...overrides });
  }
}

// Usage
const user = UserFactory.create();
const admin = UserFactory.admin({ firstName: 'Admin' });
const users = UserFactory.createMany(50);
```

### 3. Fishery Factory (TypeScript)

Using Fishery for typed factories:

```typescript
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  profile: Profile;
}

interface Profile {
  bio: string;
  avatar: string;
}

const profileFactory = Factory.define<Profile>(() => ({
  bio: faker.person.bio(),
  avatar: faker.image.avatar()
}));

const userFactory = Factory.define<User>(({ associations, sequence }) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  role: 'user',
  profile: associations.profile || profileFactory.build()
}));

// Usage
const user = userFactory.build();
const admin = userFactory.build({ role: 'admin' });
const usersWithProfiles = userFactory.buildList(10, {}, {
  associations: { profile: profileFactory.build() }
});
```

### 4. Database Seeding

Seed databases with test data:

```javascript
// seed.js - Database seeding script
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seed() {
  // Set seed for reproducibility
  faker.seed(12345);

  // Clear existing data
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await Promise.all(
    Array.from({ length: 50 }, () =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          password: faker.internet.password()
        }
      })
    )
  );

  // Create products
  const products = await Promise.all(
    Array.from({ length: 100 }, () =>
      prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price()),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          inStock: faker.datatype.boolean()
        }
      })
    )
  );

  // Create orders
  for (const user of users) {
    const orderCount = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < orderCount; i++) {
      await prisma.order.create({
        data: {
          userId: user.id,
          status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
          total: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
          items: {
            create: faker.helpers.arrayElements(products, { min: 1, max: 5 }).map(p => ({
              productId: p.id,
              quantity: faker.number.int({ min: 1, max: 3 }),
              price: p.price
            }))
          }
        }
      });
    }
  }

  console.log('Seeding complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 5. Boundary Value Generation

Generate edge case test data:

```javascript
import { faker } from '@faker-js/faker';

const boundaryValues = {
  // String boundaries
  strings: {
    empty: '',
    singleChar: 'a',
    maxLength: 'a'.repeat(255),
    unicode: '日本語テスト',
    emoji: '🎉🚀💡',
    specialChars: '<script>alert("xss")</script>',
    sqlInjection: "'; DROP TABLE users; --",
    whitespace: '   spaces   ',
    newlines: 'line1\nline2\rline3'
  },

  // Number boundaries
  numbers: {
    zero: 0,
    negative: -1,
    maxInt: Number.MAX_SAFE_INTEGER,
    minInt: Number.MIN_SAFE_INTEGER,
    decimal: 0.1 + 0.2, // Famous floating point issue
    infinity: Infinity,
    nan: NaN
  },

  // Date boundaries
  dates: {
    epochStart: new Date(0),
    farPast: new Date('1900-01-01'),
    farFuture: new Date('2100-12-31'),
    leapYear: new Date('2024-02-29'),
    endOfMonth: new Date('2024-01-31'),
    timezoneEdge: new Date('2024-03-10T02:30:00') // DST transition
  },

  // Array boundaries
  arrays: {
    empty: [],
    single: [1],
    large: Array.from({ length: 10000 }, (_, i) => i)
  }
};

// Generate boundary test cases
function generateBoundaryTestCases(schema) {
  const testCases = [];

  for (const [field, config] of Object.entries(schema)) {
    if (config.type === 'string') {
      testCases.push(
        { [field]: '', expected: config.required ? 'error' : 'success' },
        { [field]: 'a'.repeat(config.maxLength + 1), expected: 'error' },
        { [field]: 'a'.repeat(config.maxLength), expected: 'success' }
      );
    }
    if (config.type === 'number') {
      testCases.push(
        { [field]: config.min - 1, expected: 'error' },
        { [field]: config.min, expected: 'success' },
        { [field]: config.max, expected: 'success' },
        { [field]: config.max + 1, expected: 'error' }
      );
    }
  }

  return testCases;
}
```

### 6. Data Anonymization

Anonymize production data for testing:

```javascript
import { faker } from '@faker-js/faker';
import crypto from 'crypto';

const anonymize = {
  // Consistent anonymization (same input = same output)
  email: (email) => {
    const hash = crypto.createHash('md5').update(email).digest('hex').slice(0, 8);
    return `user_${hash}@example.com`;
  },

  // Full replacement
  name: () => faker.person.fullName(),

  // Partial masking
  phone: (phone) => phone.replace(/\d(?=\d{4})/g, '*'),

  // Format preservation
  creditCard: (cc) => {
    const last4 = cc.slice(-4);
    return `****-****-****-${last4}`;
  },

  // Consistent fake data
  ssn: (ssn) => {
    faker.seed(crypto.createHash('md5').update(ssn).digest('hex'));
    return faker.string.numeric('###-##-####');
  },

  // Address anonymization
  address: () => ({
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode()
  })
};

// Anonymize dataset
function anonymizeDataset(records) {
  return records.map(record => ({
    ...record,
    email: anonymize.email(record.email),
    name: anonymize.name(),
    phone: anonymize.phone(record.phone),
    creditCard: record.creditCard ? anonymize.creditCard(record.creditCard) : null,
    address: anonymize.address()
  }));
}
```

### 7. Multi-Locale Support

Generate data in different locales:

```javascript
import { faker, Faker } from '@faker-js/faker';
import { de, fr, ja, es } from '@faker-js/faker';

// German locale
const fakerDE = new Faker({ locale: [de] });
const germanUser = {
  name: fakerDE.person.fullName(),
  address: fakerDE.location.streetAddress(),
  city: fakerDE.location.city()
};

// Japanese locale
const fakerJA = new Faker({ locale: [ja] });
const japaneseUser = {
  name: fakerJA.person.fullName(),
  address: fakerJA.location.streetAddress(),
  city: fakerJA.location.city()
};

// Generate test data for multiple locales
const locales = { de, fr, ja, es };
function generateMultiLocaleData(count = 10) {
  return Object.entries(locales).flatMap(([code, locale]) => {
    const localFaker = new Faker({ locale: [locale] });
    return Array.from({ length: count }, () => ({
      locale: code,
      name: localFaker.person.fullName(),
      email: localFaker.internet.email(),
      phone: localFaker.phone.number(),
      address: localFaker.location.streetAddress()
    }));
  });
}
```

### 8. Deterministic Data with Seeds

Create reproducible test data:

```javascript
import { faker } from '@faker-js/faker';

// Set global seed for reproducibility
faker.seed(12345);

// Generate same data every time
const user1 = faker.person.fullName(); // Always same name
const user2 = faker.person.fullName(); // Always same name

// Reset seed for new sequence
faker.seed(12345);
const user1Again = faker.person.fullName(); // Same as user1

// Environment-based seeding
const testSeed = process.env.TEST_SEED || Date.now();
faker.seed(testSeed);
console.log(`Using seed: ${testSeed}`);
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| funsjanssen/faker-mcp | Faker.js MCP Server | [GitHub](https://github.com/funsjanssen/faker-mcp) |

## Best Practices

1. **Use seeds** - Enable reproducible test data
2. **Factories over inline** - Use factory patterns for maintainability
3. **Realistic but safe** - Data should look real but not match real people
4. **Boundary coverage** - Include edge cases in test data
5. **Cleanup** - Implement data cleanup strategies
6. **Performance** - Generate data in batches for large datasets
7. **Validation** - Validate generated data matches expected schema

## Process Integration

This skill integrates with the following processes:
- `test-data-management.js` - All phases of test data handling
- `e2e-test-suite.js` - E2E test data setup
- `api-testing.js` - API test data generation
- `environment-management.js` - Environment data seeding

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "generate",
  "dataType": "users",
  "count": 100,
  "seed": 12345,
  "locale": "en",
  "schema": {
    "id": "uuid",
    "email": "email",
    "name": "fullName"
  },
  "outputFile": "./test-data/users.json",
  "statistics": {
    "generated": 100,
    "uniqueEmails": 100,
    "executionTime": "45ms"
  }
}
```

## Error Handling

- Validate schema before generation
- Handle large dataset memory constraints
- Provide seed information for debugging
- Log generation failures with context
- Support partial data generation recovery

## Constraints

- Never use real personal data as seeds
- Ensure generated emails don't match real domains
- Avoid generating data that could pass as real credentials
- Respect data privacy regulations (GDPR, etc.)
- Document seed values for test reproducibility
