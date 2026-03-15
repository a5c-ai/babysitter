---
name: code-sample-validator
description: Extract, validate, and test code samples in documentation. Verify syntax, execute samples, check outputs, validate imports, and ensure code samples are up-to-date with current APIs.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-008
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Code Sample Validation Skill

Extract, validate, and test code samples in documentation.

## Capabilities

- Extract code blocks from Markdown/MDX
- Syntax validation for multiple languages
- Execute and verify code sample output
- Snippet compilation testing
- Version compatibility checking
- Import/dependency verification
- Code formatting validation (prettier, black)
- Generate runnable code from documentation

## Usage

Invoke this skill when you need to:
- Validate code samples in documentation
- Test code examples execute correctly
- Check for outdated API usage
- Verify import statements
- Generate test files from documentation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| inputPath | string | Yes | Path to documentation file or directory |
| action | string | Yes | extract, validate, execute, format |
| languages | array | No | Filter by language (js, python, etc.) |
| outputDir | string | No | Directory for extracted runnable code |
| timeout | number | No | Execution timeout in seconds |
| config | object | No | Language-specific configuration |

### Input Example

```json
{
  "inputPath": "./docs",
  "action": "validate",
  "languages": ["javascript", "python"],
  "timeout": 30
}
```

## Output Structure

### Validation Report

```json
{
  "summary": {
    "total": 45,
    "passed": 42,
    "failed": 2,
    "skipped": 1
  },
  "files": [
    {
      "file": "docs/quickstart.md",
      "samples": [
        {
          "language": "javascript",
          "line": 15,
          "status": "passed",
          "syntaxValid": true,
          "executionResult": {
            "success": true,
            "output": "Hello, World!",
            "duration": 125
          }
        },
        {
          "language": "python",
          "line": 45,
          "status": "failed",
          "syntaxValid": true,
          "executionResult": {
            "success": false,
            "error": "ModuleNotFoundError: No module named 'requests'",
            "suggestion": "Add 'requests' to test dependencies"
          }
        }
      ]
    }
  ],
  "issues": [
    {
      "file": "docs/api/users.md",
      "line": 78,
      "language": "typescript",
      "issue": "Type error: Property 'user' does not exist on type 'Response'",
      "code": "const name = response.user.name;",
      "suggestion": "Update to use 'response.data.user.name'"
    }
  ]
}
```

## Code Extraction

### Markdown Code Block Patterns

````markdown
```javascript
// This block will be extracted and validated
const client = new Client({ apiKey: 'test' });
const result = await client.query('Hello');
console.log(result);
```

```python
# This block will be extracted and validated
from mypackage import Client

client = Client(api_key='test')
result = client.query('Hello')
print(result)
```

```bash skip-validation
# This block will be skipped due to directive
echo "Not validated"
```

```javascript title="example.js" runnable
// This block is marked as runnable
export function greet(name) {
  return `Hello, ${name}!`;
}
```
````

### Extraction Configuration

```json
{
  "extract": {
    "includeLanguages": ["javascript", "typescript", "python", "go"],
    "excludeLanguages": ["bash", "shell", "text"],
    "directives": {
      "skip": ["skip-validation", "no-test"],
      "runnable": ["runnable", "test"],
      "expectError": ["expect-error"]
    },
    "metaPatterns": {
      "title": "title=\"([^\"]+)\"",
      "filename": "filename=\"([^\"]+)\""
    }
  }
}
```

## Language-Specific Validation

### JavaScript/TypeScript

```javascript
// validator-config.js
module.exports = {
  javascript: {
    parser: 'babel',
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: 'module'
    },
    execute: {
      runtime: 'node',
      timeout: 10000,
      setup: `
        global.fetch = require('node-fetch');
        process.env.API_KEY = 'test-key';
      `
    },
    format: {
      tool: 'prettier',
      config: {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5'
      }
    }
  },
  typescript: {
    compiler: 'tsc',
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      strict: true
    },
    execute: {
      runtime: 'ts-node',
      timeout: 15000
    }
  }
};
```

### Python

```python
# validator_config.py
PYTHON_CONFIG = {
    'version': '3.11',
    'execute': {
        'timeout': 30,
        'setup': '''
import os
os.environ['API_KEY'] = 'test-key'
''',
        'virtualenv': '.venv'
    },
    'format': {
        'tool': 'black',
        'config': {
            'line_length': 88,
            'target_version': ['py311']
        }
    },
    'lint': {
        'tool': 'ruff',
        'rules': ['E', 'F', 'W']
    }
}
```

### Go

```go
// validator_config.go
package main

var GoConfig = Config{
    Version: "1.21",
    Execute: ExecuteConfig{
        Timeout: 30,
        Build:   true,
        Run:     true,
    },
    Format: FormatConfig{
        Tool: "gofmt",
    },
    Lint: LintConfig{
        Tool:  "golangci-lint",
        Rules: []string{"govet", "errcheck", "staticcheck"},
    },
}
```

## Test Generation

### Generate Test Files

```javascript
// Generated from docs/quickstart.md

const { Client } = require('@example/sdk');

describe('Documentation Code Samples', () => {
  describe('quickstart.md', () => {
    test('Line 15: Basic client usage', async () => {
      const client = new Client({ apiKey: 'test' });
      const result = await client.query('Hello');
      expect(result).toBeDefined();
    });

    test('Line 45: Error handling', async () => {
      const client = new Client({ apiKey: 'invalid' });
      await expect(client.query('Hello')).rejects.toThrow('Invalid API key');
    });
  });
});
```

### Test Configuration

```json
{
  "testGeneration": {
    "framework": "jest",
    "outputDir": "tests/docs",
    "filePattern": "{docfile}.test.js",
    "imports": [
      "const { Client } = require('@example/sdk');",
      "const { mockServer } = require('./mocks');"
    ],
    "beforeAll": "await mockServer.start();",
    "afterAll": "await mockServer.stop();",
    "assertions": {
      "outputMatch": true,
      "noThrow": true,
      "typeCheck": true
    }
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate Documentation

on:
  push:
    paths:
      - 'docs/**/*.md'
  pull_request:
    paths:
      - 'docs/**/*.md'

jobs:
  validate-code-samples:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          npm ci
          pip install -r requirements-docs.txt

      - name: Validate code samples
        run: |
          node scripts/validate-docs.js \
            --input docs/ \
            --languages javascript,python \
            --report validation-report.json

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: validation-report
          path: validation-report.json

      - name: Check for failures
        run: |
          if jq '.summary.failed > 0' validation-report.json | grep -q true; then
            echo "Code sample validation failed"
            jq '.issues' validation-report.json
            exit 1
          fi
```

## Formatting Validation

### Prettier Check

```javascript
const prettier = require('prettier');

async function validateFormatting(code, language) {
  const options = {
    parser: getParser(language),
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
  };

  try {
    const formatted = await prettier.format(code, options);
    const isFormatted = code === formatted;

    return {
      valid: isFormatted,
      formatted: formatted,
      diff: isFormatted ? null : generateDiff(code, formatted),
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}
```

### Black Check (Python)

```python
import black
import difflib

def validate_formatting(code: str) -> dict:
    try:
        mode = black.Mode(
            target_versions={black.TargetVersion.PY311},
            line_length=88,
        )
        formatted = black.format_str(code, mode=mode)
        is_formatted = code == formatted

        return {
            'valid': is_formatted,
            'formatted': formatted,
            'diff': None if is_formatted else list(
                difflib.unified_diff(
                    code.splitlines(),
                    formatted.splitlines(),
                    lineterm=''
                )
            )
        }
    except black.InvalidInput as e:
        return {
            'valid': False,
            'error': str(e)
        }
```

## Workflow

1. **Extract samples** - Parse Markdown for code blocks
2. **Filter** - Apply language and directive filters
3. **Validate syntax** - Check for syntax errors
4. **Check imports** - Verify dependencies exist
5. **Execute** - Run samples in sandbox
6. **Verify output** - Check expected results
7. **Check formatting** - Validate code style
8. **Report** - Generate validation report

## Dependencies

```json
{
  "devDependencies": {
    "@babel/parser": "^7.23.0",
    "prettier": "^3.0.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "gray-matter": "^4.0.0"
  }
}
```

## CLI Commands

```bash
# Validate all samples
node scripts/validate-docs.js --input docs/

# Extract and save runnable code
node scripts/validate-docs.js --input docs/ --action extract --output tests/samples/

# Generate test files
node scripts/validate-docs.js --input docs/ --action generate-tests --output tests/docs/

# Check formatting only
node scripts/validate-docs.js --input docs/ --action format-check
```

## Best Practices Applied

- Mark non-runnable samples with directives
- Include expected output for verification
- Use consistent formatting across samples
- Pin dependency versions in samples
- Test samples in CI/CD pipeline
- Generate runnable tests from docs

## References

- Prettier: https://prettier.io/
- Black: https://black.readthedocs.io/
- MDX: https://mdxjs.com/
- Jest: https://jestjs.io/

## Target Processes

- docs-testing.js
- api-reference-docs.js
- sdk-doc-generation.js
- interactive-tutorials.js
