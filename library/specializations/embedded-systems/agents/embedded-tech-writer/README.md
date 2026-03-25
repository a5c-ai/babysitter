# Technical Documentation Agent (Embedded)

## Overview

The Technical Documentation Agent provides specialized guidance for creating high-quality embedded systems documentation. With deep expertise in API documentation, hardware interfaces, and firmware documentation standards, this agent helps create clear, comprehensive, and maintainable documentation.

## Quick Start

### Basic Consultation

```javascript
// In a babysitter process
const docPlan = await ctx.task(documentationConsult, {
  context: {
    project: 'Sensor driver library',
    files: ['sensor.h', 'sensor.c', 'config.h'],
    audience: 'application developers'
  },
  questions: [
    'What documentation structure should I use?',
    'How should I document the API?',
    'What examples should I include?'
  ]
});
```

## Expertise Areas

### API Documentation

- **Doxygen comments**: Function, parameter, return documentation
- **Code examples**: Working, tested usage examples
- **Error handling**: Error codes and recovery guidance
- **Threading notes**: Thread-safety and reentrancy

### Hardware Documentation

- **Interface specs**: Pin configurations, timing diagrams
- **Register maps**: Bit-field descriptions, access types
- **Memory maps**: Address spaces, region attributes
- **Protocols**: Command formats, state machines

### User Documentation

- **Integration guides**: Step-by-step setup instructions
- **Troubleshooting**: Common issues and solutions
- **Migration guides**: Version upgrade procedures
- **Release notes**: Changes, fixes, known issues

## Use Cases

### 1. Generate API Documentation

Create comprehensive API documentation:

```javascript
const result = await ctx.task(generateAPIDocs, {
  module: 'gpio_driver',
  headerFile: 'gpio_driver.h',
  sourceFile: 'gpio_driver.c',
  options: {
    includeExamples: true,
    documentPrivate: false,
    generateDiagrams: true
  }
});

// Output includes:
// - Doxygen comments for all functions
// - Usage examples
// - Architecture diagrams
// - Cross-references
```

### 2. Document Hardware Interface

Create hardware interface documentation:

```javascript
const result = await ctx.task(documentInterface, {
  interface: 'SPI',
  peripheral: 'Flash memory',
  requirements: {
    timingDiagram: true,
    protocolFormat: true,
    exampleTransactions: true
  }
});
```

### 3. Create Integration Guide

Generate step-by-step integration guide:

```javascript
const result = await ctx.task(createIntegrationGuide, {
  component: 'Temperature sensor',
  interface: 'I2C',
  targetAudience: 'firmware developers',
  sections: [
    'hardware_setup',
    'software_initialization',
    'data_reading',
    'error_handling',
    'troubleshooting'
  ]
});
```

### 4. Document Memory Map

Create memory map documentation:

```javascript
const result = await ctx.task(documentMemoryMap, {
  mcu: 'STM32F407',
  sections: [
    'flash_layout',
    'ram_regions',
    'peripheral_addresses',
    'linker_script_alignment'
  ]
});
```

## Interaction Patterns

### Documentation Request

```json
{
  "agent": "embedded-tech-writer",
  "prompt": {
    "role": "Senior Technical Writer",
    "task": "Create comprehensive driver documentation",
    "context": {
      "module": "uart_driver",
      "audience": "firmware developers",
      "format": "doxygen"
    },
    "instructions": [
      "Document all public API functions",
      "Add initialization and usage examples",
      "Include error handling guidance",
      "Create quick start section"
    ]
  }
}
```

### Response Format

```json
{
  "documentation": {
    "format": "doxygen",
    "files": ["uart_driver.h"],
    "coverage": {
      "functions": 0.95,
      "parameters": 0.98
    }
  },
  "generatedContent": {
    "fileHeader": "...",
    "functionDocs": [...],
    "examples": [...],
    "quickStart": "..."
  },
  "recommendations": [
    "Add state diagram for UART modes",
    "Include interrupt configuration example"
  ]
}
```

## Documentation Templates

### Function Documentation

```c
/**
 * @brief Configure UART peripheral for communication
 *
 * Initializes the UART hardware with the specified settings.
 * Must be called before any other UART operations.
 *
 * @param[in]  uart    UART instance (UART1, UART2, etc.)
 * @param[in]  config  Configuration parameters
 *
 * @return Status code
 * @retval UART_OK       Success
 * @retval UART_ERR_BUSY Already initialized
 *
 * @pre  Clocks must be enabled
 * @post UART is ready for data transfer
 *
 * @par Example
 * @code
 * uart_config_t cfg = { .baudrate = 115200 };
 * uart_init(UART1, &cfg);
 * @endcode
 */
```

### Register Documentation

```markdown
# REGISTER_NAME (OFFSET)

**Address**: BASE + OFFSET
**Reset**: 0x00000000
**Access**: Read/Write

| Bits | Field | Access | Description |
|------|-------|--------|-------------|
| 31:8 | RESERVED | - | Reserved |
| 7:4 | FIELD_A | RW | Description |
| 3:0 | FIELD_B | RO | Description |
```

## Documentation Standards

### Style Guidelines

| Element | Standard |
|---------|----------|
| Brief | Imperative verb (Configure, Initialize, Read) |
| Parameters | Clear type and purpose |
| Returns | What value represents |
| Examples | Compilable, tested code |

### Organization

| Level | Content |
|-------|---------|
| Module | Overview, architecture, dependencies |
| File | Purpose, includes, usage |
| Function | Parameters, returns, examples |
| Macro/Type | Definition, usage, constraints |

## Best Practices

### Writing
- Use active voice
- Be concise but complete
- Include working examples
- Document edge cases

### Maintenance
- Update with code changes
- Review documentation in PR
- Track coverage metrics
- Version documentation with code

### Accessibility
- Use consistent terminology
- Define acronyms on first use
- Include diagrams where helpful
- Support multiple skill levels

## Integration

### Process Integration

The Technical Documentation Agent integrates with:

- `firmware-api-documentation.js` - Documentation workflow
- `hw-sw-interface-specification.js` - Interface specs
- `version-control-config-management.js` - Release docs

### Skill Integration

Works with:
- `embedded-docs` - Documentation generation skill

## Tools

| Tool | Purpose |
|------|---------|
| Doxygen | API documentation |
| Sphinx | Multi-format output |
| PlantUML | Diagrams |
| Vale | Style linting |

## References

- [Doxygen Manual](https://www.doxygen.nl/manual/)
- Google Developer Documentation Style Guide
- Linux Kernel Documentation Guidelines
- Write the Docs Best Practices

## See Also

- [AGENT.md](./AGENT.md) - Full agent definition
- [Embedded Docs Skill](../../skills/embedded-docs/)
- [Firmware API Documentation Process](../../firmware-api-documentation.js)
