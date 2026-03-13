---
name: docker-test-environments
description: Docker-based test environment management for isolated, reproducible test execution. Create Docker Compose environments, manage test containers, configure service dependencies, and integrate with CI/CD pipelines.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: environment-management
  backlog-id: SK-020
---

# docker-test-environments

You are **docker-test-environments** - a specialized skill for Docker-based test environment management, providing isolated, reproducible test execution capabilities.

## Overview

This skill enables AI-powered test environment management including:
- Creating Docker Compose test environments
- Managing Testcontainers for integration tests
- Configuring service dependencies and health checks
- Database seeding and test data management
- Network isolation for test environments
- Environment cleanup automation
- CI/CD Docker integration patterns

## Prerequisites

- Docker Engine installed and running
- Docker Compose v2 installed
- Sufficient system resources for containers
- Optional: Testcontainers library for language-specific integration

## Capabilities

### 1. Docker Compose Test Environment

Create isolated test environments with Docker Compose:

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgres://test:test@db:5432/testdb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - test-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=testdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test -d testdb"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - ./test-data/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - test-network

  redis:
    image: redis:7-alpine
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
```

### 2. Environment Lifecycle Commands

```bash
# Start test environment
docker compose -f docker-compose.test.yml up -d

# Wait for services to be healthy
docker compose -f docker-compose.test.yml up -d --wait

# Run tests against environment
docker compose -f docker-compose.test.yml exec app npm test

# View logs
docker compose -f docker-compose.test.yml logs -f

# Stop and cleanup
docker compose -f docker-compose.test.yml down -v --remove-orphans
```

### 3. Testcontainers Integration

Use Testcontainers for programmatic container management:

```javascript
// JavaScript/TypeScript with Testcontainers
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';

describe('Integration Tests', () => {
  let postgresContainer;
  let redisContainer;

  beforeAll(async () => {
    // Start PostgreSQL
    postgresContainer = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testdb')
      .withUsername('test')
      .withPassword('test')
      .start();

    // Start Redis
    redisContainer = await new RedisContainer('redis:7')
      .start();

    // Set environment variables
    process.env.DATABASE_URL = postgresContainer.getConnectionUri();
    process.env.REDIS_URL = redisContainer.getConnectionUrl();
  }, 60000);

  afterAll(async () => {
    await postgresContainer?.stop();
    await redisContainer?.stop();
  });

  it('should connect to database', async () => {
    // Test implementation
  });
});
```

```python
# Python with Testcontainers
import pytest
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer

@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:15") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def redis_container():
    with RedisContainer("redis:7") as redis:
        yield redis

def test_database_connection(postgres_container):
    connection_url = postgres_container.get_connection_url()
    # Test implementation
```

### 4. Health Check Patterns

Configure robust health checks:

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  elasticsearch:
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -q 'green\\|yellow'"]
      interval: 10s
      timeout: 10s
      retries: 10
      start_period: 60s

  kafka:
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9092 --list"]
      interval: 10s
      timeout: 10s
      retries: 5
```

### 5. Database Seeding

Seed test data automatically:

```bash
# SQL initialization
cat > test-data/init.sql << 'EOF'
-- Create test schema
CREATE SCHEMA IF NOT EXISTS test;

-- Create tables
CREATE TABLE test.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO test.users (email, name) VALUES
  ('test1@example.com', 'Test User 1'),
  ('test2@example.com', 'Test User 2');
EOF
```

```yaml
# Mount initialization scripts
services:
  db:
    volumes:
      - ./test-data/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./test-data/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
```

### 6. Network Isolation

Configure isolated test networks:

```yaml
# Multiple isolated test environments
networks:
  test-network-a:
    driver: bridge
    internal: true
  test-network-b:
    driver: bridge
    internal: true
  external-network:
    driver: bridge

services:
  app-a:
    networks:
      - test-network-a
      - external-network

  app-b:
    networks:
      - test-network-b
      - external-network

  # Shared service
  mock-server:
    networks:
      - external-network
```

### 7. CI/CD Integration

```yaml
# GitHub Actions example
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Start test environment
        run: |
          docker compose -f docker-compose.test.yml up -d --wait
          docker compose -f docker-compose.test.yml ps

      - name: Run tests
        run: |
          docker compose -f docker-compose.test.yml exec -T app npm test

      - name: Collect logs on failure
        if: failure()
        run: |
          docker compose -f docker-compose.test.yml logs > test-logs.txt

      - name: Upload logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-logs
          path: test-logs.txt

      - name: Cleanup
        if: always()
        run: |
          docker compose -f docker-compose.test.yml down -v --remove-orphans
```

## Common Service Templates

### PostgreSQL

```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    POSTGRES_DB: testdb
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U test"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### MySQL

```yaml
mysql:
  image: mysql:8
  environment:
    MYSQL_ROOT_PASSWORD: root
    MYSQL_DATABASE: testdb
    MYSQL_USER: test
    MYSQL_PASSWORD: test
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### MongoDB

```yaml
mongo:
  image: mongo:6
  environment:
    MONGO_INITDB_ROOT_USERNAME: test
    MONGO_INITDB_ROOT_PASSWORD: test
  healthcheck:
    test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
    interval: 10s
    timeout: 10s
    retries: 5
```

### Redis

```yaml
redis:
  image: redis:7-alpine
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### Elasticsearch

```yaml
elasticsearch:
  image: elasticsearch:8.11.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
    - ES_JAVA_OPTS=-Xms512m -Xmx512m
  healthcheck:
    test: ["CMD-SHELL", "curl -s http://localhost:9200 | grep -q 'cluster_name'"]
    interval: 10s
    timeout: 10s
    retries: 10
```

### Kafka

```yaml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
  depends_on:
    - zookeeper
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| QuantGeekDev/docker-mcp | Docker container management | [GitHub](https://github.com/QuantGeekDev/docker-mcp) |
| Docker MCP Toolkit | Official Docker MCP | [Docker Blog](https://www.docker.com/blog/connect-mcp-servers-to-claude-desktop-with-mcp-toolkit/) |
| Docker Hub MCP | Docker Hub integration | [Docker](https://www.docker.com/blog/introducing-docker-hub-mcp-server/) |

## Best Practices

1. **Use specific image tags** - Avoid `latest` for reproducibility
2. **Health checks** - Always configure health checks for dependencies
3. **Resource limits** - Set memory/CPU limits for containers
4. **Cleanup** - Always cleanup volumes with `-v` flag
5. **Wait for ready** - Use `--wait` or health checks before tests
6. **Isolation** - Use dedicated networks for test environments
7. **Ephemeral data** - Never mount production data volumes

## Process Integration

This skill integrates with the following processes:
- `environment-management.js` - All phases of environment setup
- `test-data-management.js` - Data seeding and cleanup
- `automation-framework.js` - Test framework environment setup
- `continuous-testing.js` - CI/CD environment management

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "start-environment",
  "composeFile": "docker-compose.test.yml",
  "status": "running",
  "services": {
    "app": { "status": "running", "health": "healthy" },
    "db": { "status": "running", "health": "healthy" },
    "redis": { "status": "running", "health": "healthy" }
  },
  "network": "test-network",
  "connectionStrings": {
    "database": "postgres://test:test@localhost:5432/testdb",
    "redis": "redis://localhost:6379"
  }
}
```

## Error Handling

- Check Docker daemon connectivity
- Verify image availability before starting
- Handle container startup failures gracefully
- Provide diagnostic logs on failure
- Implement retry logic for flaky containers

## Constraints

- Do not expose production data in test environments
- Limit resource consumption to prevent system issues
- Always cleanup environments after tests
- Use appropriate isolation for parallel tests
- Respect port allocation to avoid conflicts
