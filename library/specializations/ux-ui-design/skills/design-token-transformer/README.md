# Design Token Transformer Skill

## Overview

The `design-token-transformer` skill transforms design tokens across multiple formats and platforms. It supports W3C Design Token Community Group format, handles token aliases and references, and generates platform-specific output for web (CSS, SCSS, JS), iOS (Swift), and Android (XML, Kotlin).

## Quick Start

### Prerequisites

1. **Node.js** - Version 18 or higher
2. **Design Token Source** - JSON or YAML token files
3. **Optional: Style Dictionary** - For advanced transformations

### Installation

The skill is included in the babysitter-sdk. Install optional dependencies:

```bash
# Style Dictionary for advanced transformations
npm install style-dictionary

# Token validation
npm install design-token-validator
```

## Usage

### Basic Operations

```bash
# Transform tokens to CSS
/skill design-token-transformer transform \
  --input tokens.json \
  --output-format css \
  --output tokens.css

# Transform to multiple formats
/skill design-token-transformer transform \
  --input tokens.json \
  --output-format css,scss,ts \
  --output-dir ./dist/tokens

# Generate documentation
/skill design-token-transformer docs \
  --input tokens.json \
  --output tokens.md
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(designTokenTransformerTask, {
  operation: 'transform',
  inputPath: 'design-tokens/tokens.json',
  outputFormats: ['css', 'scss', 'ts', 'swift', 'android'],
  options: {
    prefix: 'ds',
    colorFormat: 'hex',
    generateDocs: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Format Parsing** | W3C DTCG, Style Dictionary, custom JSON |
| **Web Output** | CSS, SCSS, Less, JS, TypeScript |
| **Mobile Output** | iOS Swift, Android XML/Kotlin |
| **Alias Resolution** | Handle token references and inheritance |
| **Theming** | Generate theme variants (light/dark) |
| **Documentation** | Auto-generate token docs |

## Examples

### Example 1: Basic CSS Transformation

Input (`tokens.json`):
```json
{
  "color": {
    "primary": {
      "$value": "#2196F3",
      "$type": "color"
    }
  },
  "spacing": {
    "sm": {
      "$value": "8px",
      "$type": "dimension"
    }
  }
}
```

Command:
```bash
/skill design-token-transformer transform \
  --input tokens.json \
  --output-format css
```

Output (`tokens.css`):
```css
:root {
  --color-primary: #2196F3;
  --spacing-sm: 8px;
}
```

### Example 2: Multi-Platform Output

```bash
# Generate tokens for all platforms
/skill design-token-transformer transform \
  --input tokens.json \
  --output-format css,scss,ts,swift,android \
  --output-dir ./dist/tokens \
  --prefix ds
```

Output files:
- `dist/tokens/tokens.css` - CSS custom properties
- `dist/tokens/tokens.scss` - SCSS variables
- `dist/tokens/tokens.ts` - TypeScript module
- `dist/tokens/DesignTokens.swift` - Swift constants
- `dist/tokens/colors.xml` - Android colors
- `dist/tokens/dimens.xml` - Android dimensions

### Example 3: Theme Generation

```bash
# Generate light and dark themes
/skill design-token-transformer transform \
  --input tokens.json \
  --themes light,dark \
  --output-format css \
  --output themes.css
```

Output:
```css
:root, [data-theme="light"] {
  --color-background: #FFFFFF;
  --color-text: #212121;
  --color-primary: #2196F3;
}

[data-theme="dark"] {
  --color-background: #121212;
  --color-text: #FFFFFF;
  --color-primary: #64B5F6;
}
```

### Example 4: Style Dictionary Integration

```javascript
// style-dictionary.config.js
const styleDictionary = require('style-dictionary');

const config = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables'
      }]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [{
        destination: 'tokens.js',
        format: 'javascript/es6'
      }]
    }
  }
};

// Build tokens
/skill design-token-transformer style-dictionary-build \
  --config style-dictionary.config.js
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TOKEN_PREFIX` | Prefix for generated tokens | `''` |
| `TOKEN_COLOR_FORMAT` | Color output format (hex/rgb/hsl) | `hex` |
| `TOKEN_OUTPUT_DIR` | Default output directory | `./dist` |

### Skill Configuration

```yaml
# .babysitter/skills/design-token-transformer.yaml
design-token-transformer:
  inputFormat: w3c-dtcg
  outputFormats:
    - css
    - scss
    - ts
  options:
    prefix: ds
    colorFormat: hex
    cssSelector: ':root'
    scssMapName: $tokens
    generateTypes: true
    documentation:
      enabled: true
      format: markdown
  themes:
    - light
    - dark
```

## Process Integration

### Processes Using This Skill

1. **component-library.js** - Token consumption in components
2. **design-system.js** - Design system token management
3. **responsive-design.js** - Responsive token scaling

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const transformTokensTask = defineTask({
  name: 'transform-tokens',
  description: 'Transform design tokens to platform formats',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Transform Design Tokens',
      skill: {
        name: 'design-token-transformer',
        context: {
          operation: 'transform',
          inputPath: inputs.tokenFile,
          outputFormats: inputs.formats || ['css', 'ts'],
          options: {
            prefix: inputs.prefix || '',
            generateDocs: true
          }
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

## Supported Token Types

| Token Type | CSS Output | TypeScript Output |
|------------|------------|-------------------|
| `color` | `#2196F3` | `'#2196F3'` |
| `dimension` | `16px` | `'16px'` |
| `fontFamily` | `'Inter', sans-serif` | `"'Inter', sans-serif"` |
| `fontWeight` | `700` | `700` |
| `number` | `1.5` | `1.5` |
| `shadow` | `0 4px 6px rgba(...)` | Object structure |
| `transition` | `all 200ms ease` | Object structure |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Circular reference detected` | Check token aliases for loops |
| `Unresolved alias` | Ensure referenced token exists |
| `Invalid token type` | Verify type matches value format |
| `Platform-specific error` | Check platform naming conventions |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
TOKEN_DEBUG=true /skill design-token-transformer transform \
  --input tokens.json \
  --output-format css
```

## Related Skills

- **figma-api** - Extract tokens from Figma
- **lighthouse** - Validate token usage in production
- **component-inventory** - Audit token usage across components

## References

- [W3C Design Tokens Spec](https://www.w3.org/community/design-tokens/)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [Design Tokens Community Group](https://www.designtokens.org/)
- [Tokens Studio](https://tokens.studio/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-UX-003
**Category:** Design Systems
**Status:** Active
