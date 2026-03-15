---
name: env-var-mapper
description: Generate environment variable to CLI argument mapping with prefix support, type conversion, and fallback chains for configuration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Environment Variable Mapper

Generate environment variable to CLI argument mapping for flexible configuration.

## Capabilities

- Generate env var to argument mapping logic
- Create prefix-based environment loading
- Set up type conversion for env vars
- Implement fallback chains (env -> config -> default)
- Configure .env file support
- Generate documentation for env vars

## Usage

Invoke this skill when you need to:
- Map environment variables to CLI arguments
- Create prefix-based config loading
- Implement configuration fallback chains
- Support .env files in CLI applications

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language (typescript, python, go) |
| prefix | string | No | Env var prefix (e.g., MYAPP_) |
| mappings | array | Yes | Environment variable mappings |
| dotenvSupport | boolean | No | Enable .env file support (default: true) |

### Mapping Structure

```json
{
  "mappings": [
    {
      "envVar": "PORT",
      "argument": "port",
      "type": "number",
      "default": 3000,
      "description": "Server port"
    },
    {
      "envVar": "DATABASE_URL",
      "argument": "database-url",
      "type": "string",
      "required": true,
      "sensitive": true
    },
    {
      "envVar": "DEBUG",
      "argument": "debug",
      "type": "boolean",
      "default": false
    }
  ]
}
```

## Generated Code Patterns

### TypeScript Mapper

```typescript
import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

const ENV_PREFIX = 'MYAPP_';

// Environment schema
const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  DEBUG: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Get prefixed env var
function getEnv(name: string): string | undefined {
  return process.env[`${ENV_PREFIX}${name}`] ?? process.env[name];
}

// Build env object with prefix support
function buildEnvObject(): Record<string, string | undefined> {
  return {
    PORT: getEnv('PORT'),
    DATABASE_URL: getEnv('DATABASE_URL'),
    DEBUG: getEnv('DEBUG'),
    LOG_LEVEL: getEnv('LOG_LEVEL'),
  };
}

// Parse and validate environment
export function loadEnvironment() {
  const env = buildEnvObject();
  return envSchema.parse(env);
}

// Map env vars to CLI arguments
export function envToArgs(): string[] {
  const env = loadEnvironment();
  const args: string[] = [];

  if (env.PORT !== 3000) {
    args.push('--port', String(env.PORT));
  }
  if (env.DATABASE_URL) {
    args.push('--database-url', env.DATABASE_URL);
  }
  if (env.DEBUG) {
    args.push('--debug');
  }
  if (env.LOG_LEVEL !== 'info') {
    args.push('--log-level', env.LOG_LEVEL);
  }

  return args;
}

// Generate documentation
export const ENV_DOCS = `
Environment Variables:

  ${ENV_PREFIX}PORT          Server port (default: 3000)
  ${ENV_PREFIX}DATABASE_URL  Database connection URL (required)
  ${ENV_PREFIX}DEBUG         Enable debug mode (default: false)
  ${ENV_PREFIX}LOG_LEVEL     Log level: debug|info|warn|error (default: info)
`;
```

### Python Mapper

```python
import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv()

ENV_PREFIX = 'MYAPP_'

@dataclass
class Environment:
    port: int = 3000
    database_url: str = ''
    debug: bool = False
    log_level: str = 'info'

def get_env(name: str) -> Optional[str]:
    """Get env var with prefix fallback."""
    return os.getenv(f'{ENV_PREFIX}{name}') or os.getenv(name)

def parse_bool(value: Optional[str]) -> bool:
    """Parse boolean from environment variable."""
    if value is None:
        return False
    return value.lower() in ('true', '1', 'yes', 'on')

def load_environment() -> Environment:
    """Load and validate environment variables."""
    env = Environment()

    if port := get_env('PORT'):
        env.port = int(port)

    if database_url := get_env('DATABASE_URL'):
        env.database_url = database_url
    else:
        raise ValueError('DATABASE_URL is required')

    env.debug = parse_bool(get_env('DEBUG'))

    if log_level := get_env('LOG_LEVEL'):
        if log_level not in ('debug', 'info', 'warn', 'error'):
            raise ValueError(f'Invalid LOG_LEVEL: {log_level}')
        env.log_level = log_level

    return env

def env_to_args() -> list[str]:
    """Convert environment to CLI arguments."""
    env = load_environment()
    args = []

    if env.port != 3000:
        args.extend(['--port', str(env.port)])
    if env.database_url:
        args.extend(['--database-url', env.database_url])
    if env.debug:
        args.append('--debug')
    if env.log_level != 'info':
        args.extend(['--log-level', env.log_level])

    return args

ENV_DOCS = f'''
Environment Variables:

  {ENV_PREFIX}PORT          Server port (default: 3000)
  {ENV_PREFIX}DATABASE_URL  Database connection URL (required)
  {ENV_PREFIX}DEBUG         Enable debug mode (default: false)
  {ENV_PREFIX}LOG_LEVEL     Log level: debug|info|warn|error (default: info)
'''
```

### Go Mapper

```go
package config

import (
    "fmt"
    "os"
    "strconv"
    "strings"

    "github.com/joho/godotenv"
)

const EnvPrefix = "MYAPP_"

type Environment struct {
    Port        int
    DatabaseURL string
    Debug       bool
    LogLevel    string
}

func init() {
    // Load .env file if present
    godotenv.Load()
}

func getEnv(name string) string {
    if val := os.Getenv(EnvPrefix + name); val != "" {
        return val
    }
    return os.Getenv(name)
}

func parseBool(value string) bool {
    lower := strings.ToLower(value)
    return lower == "true" || lower == "1" || lower == "yes" || lower == "on"
}

func LoadEnvironment() (*Environment, error) {
    env := &Environment{
        Port:     3000,
        Debug:    false,
        LogLevel: "info",
    }

    if port := getEnv("PORT"); port != "" {
        p, err := strconv.Atoi(port)
        if err != nil {
            return nil, fmt.Errorf("invalid PORT: %s", port)
        }
        env.Port = p
    }

    env.DatabaseURL = getEnv("DATABASE_URL")
    if env.DatabaseURL == "" {
        return nil, fmt.Errorf("DATABASE_URL is required")
    }

    env.Debug = parseBool(getEnv("DEBUG"))

    if logLevel := getEnv("LOG_LEVEL"); logLevel != "" {
        valid := []string{"debug", "info", "warn", "error"}
        found := false
        for _, v := range valid {
            if v == logLevel {
                found = true
                break
            }
        }
        if !found {
            return nil, fmt.Errorf("invalid LOG_LEVEL: %s", logLevel)
        }
        env.LogLevel = logLevel
    }

    return env, nil
}
```

## Workflow

1. **Define mappings** - Specify env vars and arguments
2. **Configure prefix** - Set application prefix
3. **Generate loader** - Create env loading code
4. **Add type conversion** - Handle type coercion
5. **Generate docs** - Create env var documentation
6. **Add validation** - Required and constraints

## Best Practices Applied

- Prefix support for namespacing
- Fallback from prefixed to non-prefixed
- Type-safe env var parsing
- Boolean string parsing
- .env file support
- Auto-generated documentation

## Target Processes

- argument-parser-setup
- configuration-management-system
- cli-application-bootstrap
