---
name: embedded-docs
description: Embedded firmware documentation generation and maintenance using Doxygen and related tools. Expert skill for API documentation, hardware interface documentation, memory maps, and integration with documentation systems.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch
---

# Embedded Documentation Skill

Expert skill for embedded firmware documentation generation and maintenance. Provides Doxygen comment generation, API documentation structure, hardware interface documentation, and integration with documentation systems.

## Overview

The Embedded Documentation skill enables comprehensive documentation for embedded firmware projects:
- Doxygen comment generation and maintenance
- API documentation structure and organization
- Hardware interface documentation
- Memory map documentation
- Call graph and dependency visualization
- Version changelog management
- Register documentation formatting
- Integration with Sphinx/MkDocs

## Capabilities

### 1. Doxygen Comment Generation

Generate Doxygen-compatible documentation comments:

```c
/**
 * @file uart_driver.h
 * @brief UART peripheral driver for STM32F4 series
 * @author Firmware Team
 * @version 1.2.0
 * @date 2026-01-24
 *
 * @details
 * This driver provides a hardware abstraction layer for UART peripherals.
 * It supports:
 * - Polling, interrupt, and DMA transfer modes
 * - Hardware flow control (RTS/CTS)
 * - Configurable baud rates up to 10.5 Mbps
 * - Error detection and handling
 *
 * @note Thread-safe when used with RTOS mutual exclusion
 *
 * @par Example Usage:
 * @code
 * uart_config_t config = {
 *     .baudrate = 115200,
 *     .parity = UART_PARITY_NONE,
 *     .stop_bits = UART_STOP_1
 * };
 * uart_init(UART1, &config);
 * uart_transmit(UART1, data, len, 100);
 * @endcode
 *
 * @copyright (c) 2026 Company Name. All rights reserved.
 */
```

### 2. Function Documentation

Document functions with complete parameter and return information:

```c
/**
 * @brief Initialize UART peripheral with specified configuration
 *
 * Configures the UART hardware with the specified settings and prepares
 * it for data transmission and reception. Must be called before any
 * other UART operations.
 *
 * @param[in]  uart    UART peripheral instance (UART1, UART2, etc.)
 * @param[in]  config  Pointer to configuration structure
 *
 * @return Status code indicating success or failure
 * @retval UART_OK           Initialization successful
 * @retval UART_ERR_INVALID  Invalid parameter (NULL pointer or invalid instance)
 * @retval UART_ERR_BUSY     Peripheral is busy or already initialized
 * @retval UART_ERR_CLOCK    Clock configuration failed
 *
 * @pre  System clocks must be configured before calling this function
 * @post UART peripheral is ready for data transfer
 *
 * @note This function enables the peripheral clock automatically
 * @warning Do not call from interrupt context
 *
 * @see uart_deinit()
 * @see uart_config_t
 *
 * @par Thread Safety:
 * This function is NOT thread-safe. Use mutex protection when
 * calling from multiple threads.
 *
 * @par Example:
 * @code
 * uart_status_t status = uart_init(UART1, &config);
 * if (status != UART_OK) {
 *     handle_error(status);
 * }
 * @endcode
 */
uart_status_t uart_init(uart_instance_t uart, const uart_config_t *config);
```

### 3. Hardware Register Documentation

Document hardware register definitions:

```c
/**
 * @defgroup UART_Registers UART Register Definitions
 * @brief Memory-mapped register definitions for UART peripheral
 * @{
 */

/**
 * @brief UART Control Register 1 (CR1)
 *
 * @verbatim
 * Bit Field   | Name    | R/W | Reset | Description
 * ------------|---------|-----|-------|---------------------------
 * [31:16]     | -       | -   | 0     | Reserved
 * [15]        | OVER8   | RW  | 0     | Oversampling mode (0=16x, 1=8x)
 * [14]        | -       | -   | 0     | Reserved
 * [13]        | UE      | RW  | 0     | UART enable
 * [12]        | M       | RW  | 0     | Word length (0=8bit, 1=9bit)
 * [11]        | WAKE    | RW  | 0     | Wakeup method
 * [10]        | PCE     | RW  | 0     | Parity control enable
 * [9]         | PS      | RW  | 0     | Parity selection (0=even, 1=odd)
 * [8]         | PEIE    | RW  | 0     | PE interrupt enable
 * [7]         | TXEIE   | RW  | 0     | TXE interrupt enable
 * [6]         | TCIE    | RW  | 0     | TC interrupt enable
 * [5]         | RXNEIE  | RW  | 0     | RXNE interrupt enable
 * [4]         | IDLEIE  | RW  | 0     | IDLE interrupt enable
 * [3]         | TE      | RW  | 0     | Transmitter enable
 * [2]         | RE      | RW  | 0     | Receiver enable
 * [1]         | RWU     | RW  | 0     | Receiver wakeup
 * [0]         | SBK     | RW  | 0     | Send break
 * @endverbatim
 */
#define UART_CR1_OVER8_Pos    (15U)
#define UART_CR1_OVER8_Msk    (0x1UL << UART_CR1_OVER8_Pos)
#define UART_CR1_OVER8        UART_CR1_OVER8_Msk

/** @} */ /* End of UART_Registers group */
```

### 4. Memory Map Documentation

Document memory layout and regions:

```c
/**
 * @defgroup Memory_Map Memory Map
 * @brief System memory map documentation
 *
 * @verbatim
 * Memory Map Overview (STM32F407VG)
 * =================================
 *
 * Address Range          | Size    | Region          | Description
 * -----------------------|---------|-----------------|------------------
 * 0x00000000-0x07FFFFFF  | 128 MB  | Aliased         | Boot memory alias
 * 0x08000000-0x080FFFFF  | 1 MB    | Flash           | Main flash memory
 * 0x10000000-0x1000FFFF  | 64 KB   | CCMRAM          | Core-coupled RAM
 * 0x1FFF0000-0x1FFF7A0F  | 30 KB   | System Memory   | Bootloader ROM
 * 0x1FFFC000-0x1FFFC007  | 8 B     | OTP             | Option bytes
 * 0x20000000-0x2001FFFF  | 128 KB  | SRAM            | Main SRAM
 * 0x40000000-0x400FFFFF  | 1 MB    | APB1            | APB1 peripherals
 * 0x40010000-0x4001FFFF  | 64 KB   | APB2            | APB2 peripherals
 * 0x40020000-0x4007FFFF  | 384 KB  | AHB1            | AHB1 peripherals
 * 0x50000000-0x5003FFFF  | 256 KB  | AHB2            | AHB2 peripherals
 * 0xE0000000-0xE00FFFFF  | 1 MB    | Cortex-M4       | System control
 *
 * Flash Memory Layout
 * ===================
 *
 * Sector | Address     | Size   | Usage
 * -------|-------------|--------|------------------
 * 0      | 0x08000000  | 16 KB  | Bootloader
 * 1      | 0x08004000  | 16 KB  | Bootloader
 * 2      | 0x08008000  | 16 KB  | Application (start)
 * 3      | 0x0800C000  | 16 KB  | Application
 * 4      | 0x08010000  | 64 KB  | Application
 * 5-11   | 0x08020000  | 896 KB | Application/Data
 *
 * @endverbatim
 */
```

### 5. API Documentation Structure

Organize documentation with module grouping:

```c
/**
 * @mainpage Firmware API Reference
 *
 * @section intro Introduction
 * This documentation describes the firmware API for the XYZ product.
 *
 * @section modules Module Overview
 * - @ref HAL_Module "Hardware Abstraction Layer"
 * - @ref Driver_Module "Device Drivers"
 * - @ref App_Module "Application Layer"
 * - @ref Utils_Module "Utility Functions"
 *
 * @section getting_started Getting Started
 * See @ref quick_start for initialization examples.
 *
 * @section architecture Architecture
 * @image html architecture.png "Firmware Architecture"
 */

/**
 * @defgroup HAL_Module Hardware Abstraction Layer
 * @brief Low-level hardware interface modules
 * @{
 */

/**
 * @defgroup HAL_GPIO GPIO Driver
 * @brief General Purpose Input/Output driver
 */

/**
 * @defgroup HAL_UART UART Driver
 * @brief Universal Asynchronous Receiver/Transmitter driver
 */

/** @} */ /* End of HAL_Module */
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `firmware-api-documentation.js` | Primary documentation generation |
| `hw-sw-interface-specification.js` | Interface documentation |
| `version-control-config-management.js` | Release documentation |

## Workflow

### 1. Analyze Codebase

```bash
# Find undocumented functions
grep -rn "^[a-z_]*\s\+[a-z_]*(" src/ | grep -v "/\*\*"

# Count documented vs undocumented
find src/ -name "*.h" -exec grep -l "@brief" {} \; | wc -l
find src/ -name "*.h" | wc -l
```

### 2. Generate Documentation Comments

The skill generates documentation comments for:
- Header files (module overview, includes, defines)
- Function declarations (params, returns, examples)
- Data structures (fields, usage)
- Enumerations (values, descriptions)
- Macros (purpose, usage)

### 3. Configure Doxygen

```ini
# Doxyfile configuration highlights
PROJECT_NAME           = "Firmware API"
PROJECT_NUMBER         = 1.2.0
OUTPUT_DIRECTORY       = docs/api
GENERATE_HTML          = YES
GENERATE_LATEX         = NO
EXTRACT_ALL            = NO
EXTRACT_PRIVATE        = NO
EXTRACT_STATIC         = YES
INPUT                  = src include
FILE_PATTERNS          = *.c *.h
RECURSIVE              = YES
EXCLUDE                = src/third_party
HAVE_DOT               = YES
CALL_GRAPH             = YES
CALLER_GRAPH           = YES
```

### 4. Generate Output

```bash
# Generate HTML documentation
doxygen Doxyfile

# Generate PDF (requires LaTeX)
cd docs/api/latex && make pdf

# Serve locally for review
python -m http.server 8000 -d docs/api/html
```

## Output Schema

```json
{
  "documentation": {
    "type": "doxygen",
    "format": "html",
    "outputDir": "docs/api"
  },
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
    }
  },
  "warnings": [
    "src/legacy.c:45: Missing @return documentation",
    "include/config.h:12: Undocumented macro CONFIG_MAX_SIZE"
  ],
  "artifacts": [
    "docs/api/html/index.html",
    "docs/api/Doxyfile",
    "docs/memory-map.md",
    "docs/register-reference.md"
  ]
}
```

## Documentation Templates

### Header File Template

```c
/**
 * @file module_name.h
 * @brief Brief module description
 * @author Author Name
 * @version X.Y.Z
 * @date YYYY-MM-DD
 *
 * @details
 * Detailed description of the module purpose and functionality.
 *
 * @par Dependencies:
 * - dependency1.h
 * - dependency2.h
 *
 * @par Example:
 * @code
 * // Usage example
 * @endcode
 */

#ifndef MODULE_NAME_H
#define MODULE_NAME_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes */
/* Defines */
/* Types */
/* Function Prototypes */

#ifdef __cplusplus
}
#endif

#endif /* MODULE_NAME_H */
```

### Driver Function Template

```c
/**
 * @brief Brief description (imperative mood)
 *
 * Detailed description explaining what the function does,
 * when to use it, and any important considerations.
 *
 * @param[in]     param1  Description of input parameter
 * @param[out]    param2  Description of output parameter
 * @param[in,out] param3  Description of input/output parameter
 *
 * @return Description of return value
 * @retval VALUE1  Meaning of VALUE1
 * @retval VALUE2  Meaning of VALUE2
 *
 * @pre  Preconditions that must be met
 * @post Postconditions after successful execution
 *
 * @note Additional notes for users
 * @warning Warnings about potential issues
 *
 * @see Related functions or documentation
 */
```

## Best Practices

### Comment Style
- Use brief descriptions starting with verb (Initialize, Configure, Get)
- Document all public API functions completely
- Include @param for every parameter
- Include @return and @retval for return values
- Add @pre/@post for state requirements

### Organization
- Group related functions with @defgroup
- Use @ingroup to add items to groups
- Create a @mainpage for navigation
- Link related items with @see and @ref

### Maintenance
- Update version numbers in @version tags
- Keep @date current with last modification
- Review and update documentation during code review
- Run Doxygen in CI to catch warnings

## Integration with Documentation Systems

### Sphinx Integration

```rst
.. doxygenfile:: uart_driver.h
   :project: firmware

.. doxygenfunction:: uart_init
   :project: firmware
```

### MkDocs Integration

```yaml
# mkdocs.yml
plugins:
  - mkdoxy:
      projects:
        firmware:
          src-dirs: src include
          full-doc: True
```

## References

- Doxygen Manual: https://www.doxygen.nl/manual/
- MISRA C Documentation Guidelines
- Embedded Artistry Documentation Standards
- Linux Kernel Documentation Guidelines

## See Also

- `firmware-api-documentation.js` - Documentation generation process
- `hw-sw-interface-specification.js` - Interface specification process
- AG-012: Technical Documentation Agent
