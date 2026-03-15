---
name: unity-ceedling-test
description: Embedded unit testing with Unity framework and CMock
category: Testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Unity/Ceedling Test Skill

## Overview

This skill provides embedded unit testing capabilities using the Unity test framework, CMock mock generation, and Ceedling build system for comprehensive off-target and on-target testing.

## Capabilities

### Unity Test Framework
- Test case generation
- Assertion macro usage
- Test fixture setup/teardown
- Test group organization
- Parameterized tests
- Custom assertions

### CMock Mock Generation
- Automatic mock generation from headers
- HAL/driver mocking strategies
- Callback mocking
- Argument capture and validation
- Return value configuration
- Call count verification

### Ceedling Build System
- Project configuration (project.yml)
- Test runner generation
- Coverage integration
- Compiler configuration
- Plugin management
- CI/CD integration

### Hardware Abstraction Mocking
- Register mock strategies
- DMA mock patterns
- Interrupt mock handling
- Timing mock approaches
- State machine mocking

### Test Coverage
- gcov integration
- lcov report generation
- Branch coverage analysis
- MC/DC coverage (for safety)
- Coverage threshold enforcement

### Off-Target Testing
- Host compilation setup
- Platform abstraction
- Stub implementation
- Double buffering for DMA
- Fake timer implementations

## Target Processes

- `embedded-unit-testing.js` - Unit test implementation
- `device-driver-development.js` - Driver testing
- `bsp-development.js` - BSP unit testing

## Dependencies

- Unity test framework
- CMock mock generator
- Ceedling build system (optional)
- gcov/lcov for coverage

## Usage Context

This skill is invoked when tasks require:
- Unit test development
- Mock generation for drivers
- Test coverage analysis
- Off-target testing setup
- TDD for embedded

## Project Structure

```
project/
  src/
    driver.c
    driver.h
  test/
    test_driver.c
    support/
      test_helper.c
  build/
    test/
    artifacts/
  project.yml
```

## Configuration Example (project.yml)

```yaml
:project:
  :build_root: build/
  :test_file_prefix: test_
  :use_exceptions: FALSE

:paths:
  :test:
    - test/**
  :source:
    - src/**
  :include:
    - inc/**

:cmock:
  :mock_prefix: mock_
  :when_no_prototypes: :warn
  :enforce_strict_ordering: TRUE
  :plugins:
    - :ignore
    - :callback
    - :return_thru_ptr

:plugins:
  :enabled:
    - gcov
    - xml_tests_report
```

## Test Example

```c
#include "unity.h"
#include "driver.h"
#include "mock_hal_spi.h"

void setUp(void) {
    driver_init();
}

void tearDown(void) {
    driver_deinit();
}

void test_driver_sends_correct_command(void) {
    uint8_t expected[] = {0x01, 0x02, 0x03};

    HAL_SPI_Transmit_ExpectWithArrayAndReturn(
        SPI1, expected, 3, 3, 100, HAL_OK);

    TEST_ASSERT_EQUAL(DRIVER_OK, driver_send_command(0x01));
}
```
