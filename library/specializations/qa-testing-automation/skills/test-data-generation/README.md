# Test Data Generation Skill

## Overview

The `test-data-generation` skill provides synthetic test data generation and management using Faker.js and similar tools. It enables AI-powered test data creation including realistic data generation, data factories, database seeding, and test data anonymization.

## Quick Start

### Prerequisites

1. **Node.js** - v18 or later
2. **Faker Library** - @faker-js/faker

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install Faker.js:

```bash
# JavaScript/TypeScript
npm install @faker-js/faker

# For factory patterns
npm install fishery

# Python
pip install faker
```

## Usage

### Basic Operations

```bash
# Generate user data
/skill test-data-generation users --count 100 --output users.json

# Generate with specific seed
/skill test-data-generation users --count 50 --seed 12345

# Generate boundary test data
/skill test-data-generation boundary-values --schema user.schema.json

# Anonymize dataset
/skill test-data-generation anonymize --input production.json --output test-data.json
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(testDataTask, {
  operation: 'generate',
  dataType: 'users',
  count: 100,
  seed: 12345,
  outputPath: './test-data/users.json'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Realistic Data** | Generate realistic-looking test data |
| **Data Factories** | Create reusable data factory patterns |
| **Database Seeding** | Seed databases with test data |
| **Anonymization** | Anonymize production data for testing |
| **Boundary Values** | Generate edge case test data |
| **Multi-Locale** | Support for multiple languages/regions |
| **Deterministic** | Reproducible data with seed values |

## Examples

### Example 1: Generate Users

```javascript
import { faker } from '@faker-js/faker';

// Set seed for reproducibility
faker.seed(12345);

// Generate user data
const users = Array.from({ length: 100 }, () => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  phone: faker.phone.number(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.country()
  },
  createdAt: faker.date.past()
}));

console.log(JSON.stringify(users, null, 2));
```

### Example 2: Data Factory Pattern

```javascript
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

// Define typed factory
const userFactory = Factory.define(({ sequence }) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'user',
  isActive: true
}));

// Usage
const user = userFactory.build();
const admin = userFactory.build({ role: 'admin' });
const users = userFactory.buildList(50);
```

### Example 3: Database Seeding

```javascript
// seed.js
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seed() {
  faker.seed(12345);

  // Clear and seed
  await prisma.user.deleteMany();

  const users = await Promise.all(
    Array.from({ length: 100 }, () =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName()
        }
      })
    )
  );

  console.log(`Created ${users.length} users`);
}

seed().finally(() => prisma.$disconnect());
```

### Example 4: Anonymize Production Data

```javascript
import { faker } from '@faker-js/faker';
import crypto from 'crypto';

function anonymizeUser(user) {
  // Consistent anonymization
  const hash = crypto.createHash('md5').update(user.email).digest('hex');
  faker.seed(parseInt(hash.slice(0, 8), 16));

  return {
    ...user,
    email: `user_${hash.slice(0, 8)}@example.com`,
    name: faker.person.fullName(),
    phone: user.phone.replace(/\d(?=\d{4})/g, '*'),
    ssn: null // Remove sensitive data
  };
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FAKER_SEED` | Global seed for reproducibility | Random |
| `FAKER_LOCALE` | Default locale | `en` |
| `TEST_DATA_DIR` | Output directory | `./test-data` |

### Skill Configuration

```yaml
# .babysitter/skills/test-data-generation.yaml
test-data-generation:
  defaultSeed: 12345
  defaultLocale: en
  outputFormat: json
  batchSize: 1000
  schemas:
    users: ./schemas/user.json
    products: ./schemas/product.json
```

## Process Integration

### Processes Using This Skill

1. **test-data-management.js** - All phases of test data handling
2. **e2e-test-suite.js** - E2E test data setup
3. **api-testing.js** - API test data generation
4. **environment-management.js** - Environment data seeding

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const generateTestDataTask = defineTask({
  name: 'generate-test-data',
  description: 'Generate test data for testing',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate ${inputs.count} ${inputs.dataType}`,
      skill: {
        name: 'test-data-generation',
        context: {
          operation: 'generate',
          dataType: inputs.dataType,
          count: inputs.count,
          seed: inputs.seed || 12345,
          outputPath: inputs.outputPath
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### funsjanssen/faker-mcp

MCP server for generating fake/mock data using Faker.js.

**Features:**
- Basic data generation (person, company)
- Structured datasets with referential integrity
- Custom patterns (regex, enum, format, range)
- Multi-locale support
- Reproducible seed-based generation
- High performance (1000+ records/second)

**GitHub:** https://github.com/funsjanssen/faker-mcp

## Data Types Reference

### Available Generators

| Category | Examples |
|----------|----------|
| **Person** | firstName, lastName, fullName, gender, jobTitle |
| **Internet** | email, username, password, url, ip |
| **Location** | streetAddress, city, state, country, zipCode |
| **Company** | name, catchPhrase, bs |
| **Commerce** | productName, price, department |
| **Date** | past, future, recent, birthdate |
| **Finance** | creditCard, iban, bic, amount |
| **Phone** | number, imei |
| **Lorem** | word, sentence, paragraph |
| **Image** | avatar, imageUrl |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Non-deterministic data` | Set faker.seed() before generation |
| `Memory issues` | Generate in batches, stream to file |
| `Locale not found` | Install locale package |
| `Schema mismatch` | Validate schema before generation |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
DEBUG=faker /skill test-data-generation users --count 100
```

## Related Skills

- **docker-test-environments** - Set up test environments
- **api-testing** - Test APIs with generated data
- **playwright-e2e** - E2E tests with test data

## References

- [Faker.js Documentation](https://fakerjs.dev/)
- [Fishery Documentation](https://github.com/thoughtbot/fishery)
- [Test Data Best Practices](https://martinfowler.com/bliki/TestDataBuilder.html)
- [funsjanssen/faker-mcp](https://github.com/funsjanssen/faker-mcp)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-015
**Category:** Test Data Management
**Status:** Active
