# Embedded Documentation Skill

## Overview

The Embedded Documentation skill provides expert capabilities for generating and maintaining firmware documentation using Doxygen and related tools. It handles API documentation, hardware interface documentation, memory maps, and integration with various documentation systems.

## Quick Start

### Prerequisites

1. Doxygen installed (`doxygen --version`)
2. Graphviz for call graphs (optional but recommended)
3. Source code with headers to document

### Basic Usage

```javascript
// In a babysitter process
const docResult = await ctx.task(generateDocumentation, {
  sourceDir: 'src',
  includeDir: 'include',
  outputDir: 'docs/api',
  format: 'html',
  options: {
    callGraphs: true,
    privateMembers: false
  }
});

console.log(`Documentation coverage: ${docResult.coverage.functions.coverage * 100}%`);
console.log(`Warnings: ${docResult.warnings.length}`);
```

## Features

### Documentation Generation

- **Doxygen comment generation**: Create properly formatted documentation comments
- **API reference**: Generate complete API documentation
- **Call graphs**: Visualize function call relationships
- **Memory maps**: Document memory layout

### Coverage Analysis

- **Function documentation**: Track documented vs undocumented functions
- **Parameter documentation**: Ensure all parameters are documented
- **Warning detection**: Identify documentation gaps

### Output Formats

- **HTML**: Interactive web-based documentation
- **PDF**: Printable documentation via LaTeX
- **XML**: Machine-readable for further processing
- **Man pages**: Unix manual page format

## Use Cases

### 1. Generate API Documentation

Generate complete API reference documentation:

```javascript
const result = await ctx.task(generateAPIDocumentation, {
  project: {
    name: 'Firmware API',
    version: '1.2.0',
    description: 'STM32 firmware API reference'
  },
  source: {
    input: ['src', 'include'],
    patterns: ['*.c', '*.h'],
    exclude: ['third_party', 'test']
  },
  output: {
    directory: 'docs/api',
    formats: ['html']
  }
});
```

### 2. Document Undocumented Code

Add documentation comments to existing code:

```javascript
const result = await ctx.task(documentCode, {
  file: 'src/uart_driver.h',
  style: 'doxygen',
  options: {
    briefStyle: 'imperative',
    includeExamples: true,
    documentPrivate: false
  }
});
```

### 3. Generate Memory Map Documentation

Create memory map documentation:

```javascript
const result = await ctx.task(documentMemoryMap, {
  mcu: 'STM32F407VG',
  linkerScript: 'linker/application.ld',
  outputFormat: 'markdown'
});
```

### 4. Hardware Register Documentation

Document hardware registers:

```javascript
const result = await ctx.task(documentRegisters, {
  peripheral: 'UART',
  svdFile: 'STM32F407.svd',
  outputFormat: 'doxygen'
});
```

## Configuration

### Doxygen Configuration

```json
{
  "project": {
    "name": "Firmware API",
    "version": "1.2.0",
    "brief": "Embedded firmware API reference"
  },
  "input": {
    "directories": ["src", "include"],
    "patterns": ["*.c", "*.h"],
    "recursive": true,
    "exclude": ["third_party"]
  },
  "output": {
    "directory": "docs/api",
    "html": true,
    "latex": false,
    "xml": false
  },
  "extraction": {
    "all": false,
    "private": false,
    "static": true,
    "localClasses": true
  },
  "diagrams": {
    "enabled": true,
    "callGraphs": true,
    "callerGraphs": true,
    "classGraphs": false
  }
}
```

### Documentation Style

```json
{
  "style": {
    "commentStyle": "javadoc",
    "briefEndsAtDot": true,
    "alwaysDetailedSec": false,
    "repeatBrief": true
  },
  "formatting": {
    "tabSize": 4,
    "maxLineLength": 80,
    "paramAlignment": true
  }
}
```

## Output Format

### Coverage Report

```json
{
  "coverage": {
    "files": {
      "total": 45,
      "documented": 42,
      "coverage": 0.933
    },
    "functions": {
      "total": 156,
      "documented": 148,
      "coverage": 0.949
    },
    "parameters": {
      "total": 312,
      "documented": 298,
      "coverage": 0.955
    },
    "returnValues": {
      "total": 145,
      "documented": 140,
      "coverage": 0.966
    }
  },
  "undocumented": [
    {
      "file": "src/legacy.c",
      "line": 45,
      "type": "function",
      "name": "legacy_init"
    }
  ]
}
```

## Integration

### CI/CD Integration

```yaml
# GitHub Actions example
documentation:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Install Doxygen
      run: sudo apt-get install -y doxygen graphviz
    - name: Generate Documentation
      run: doxygen Doxyfile
    - name: Check Warnings
      run: |
        if grep -q "warning:" docs/doxygen.log; then
          echo "Documentation warnings found!"
          exit 1
        fi
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs/api/html
```

### Process Integration

The Embedded Documentation skill integrates with:

- `firmware-api-documentation.js` - Full documentation workflow
- `hw-sw-interface-specification.js` - Interface documentation
- `version-control-config-management.js` - Release docs

### Agent Integration

Works with:
- `embedded-tech-writer` - Expert technical writing guidance

## Templates

### Function Documentation

```c
/**
 * @brief [Brief description - imperative verb]
 *
 * [Detailed description]
 *
 * @param[in]  name  Description
 * @param[out] name  Description
 *
 * @return Description
 * @retval VALUE  Meaning
 *
 * @pre  Precondition
 * @post Postcondition
 *
 * @note Note text
 * @warning Warning text
 *
 * @see related_function
 */
```

### File Header

```c
/**
 * @file filename.h
 * @brief Brief file description
 * @author Author Name
 * @version X.Y.Z
 * @date YYYY-MM-DD
 *
 * @details
 * Detailed description of the file contents and purpose.
 *
 * @copyright (c) YYYY Company. All rights reserved.
 */
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Missing call graphs | Graphviz not installed | Install graphviz package |
| Encoding errors | Non-UTF8 source files | Set INPUT_ENCODING in Doxyfile |
| Missing documentation | Extraction settings | Check EXTRACT_* settings |
| Broken links | Missing @ref targets | Verify target names exist |

### Verification Checklist

- [ ] Doxygen installed and in PATH
- [ ] Graphviz installed (for graphs)
- [ ] Input directories correct
- [ ] File patterns match source files
- [ ] Exclude patterns for third-party code

## Best Practices

1. **Document public API first** - Focus on headers and public functions
2. **Use consistent style** - Follow project conventions
3. **Include examples** - Code examples improve understanding
4. **Keep it updated** - Update docs with code changes
5. **Run in CI** - Catch documentation issues early

## References

- [Doxygen Manual](https://www.doxygen.nl/manual/)
- [Graphviz Documentation](https://graphviz.org/documentation/)
- Embedded Artistry Documentation Guide
- Linux Kernel Documentation Style

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Firmware API Documentation Process](../../firmware-api-documentation.js)
- [Technical Documentation Agent](../../agents/embedded-tech-writer/)
