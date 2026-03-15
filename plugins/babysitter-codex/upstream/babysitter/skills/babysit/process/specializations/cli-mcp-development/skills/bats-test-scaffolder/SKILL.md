---
name: bats-test-scaffolder
description: Generate BATS test structure and fixtures for shell script testing with setup/teardown, assertions, and mocking.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# BATS Test Scaffolder

Generate BATS test structure for shell script testing.

## Capabilities

- Generate BATS test files
- Create setup and teardown fixtures
- Implement custom assertions
- Set up mocking helpers
- Configure test isolation
- Generate test helpers

## Usage

Invoke this skill when you need to:
- Set up BATS testing for shell scripts
- Create test fixtures and helpers
- Implement mock functions
- Generate test cases

## Generated Test Structure

```
tests/
├── bats/
│   └── bats-*.bash        # BATS submodules
├── test_helper/
│   ├── common-setup.bash  # Common setup
│   └── mocks.bash         # Mock helpers
├── fixtures/
│   ├── input.txt          # Test fixtures
│   └── expected.txt
└── *.bats                  # Test files
```

## Test File Template

```bash
#!/usr/bin/env bats

# Load test helpers
load 'test_helper/common-setup'

# Setup runs before each test
setup() {
    common_setup
    # Test-specific setup
    export TEST_DIR="$(mktemp -d)"
}

# Teardown runs after each test
teardown() {
    # Cleanup
    rm -rf "${TEST_DIR}"
}

@test "script displays help with --help" {
    run ./script.sh --help

    assert_success
    assert_output --partial "Usage:"
}

@test "script fails without required argument" {
    run ./script.sh

    assert_failure
    assert_output --partial "Missing required argument"
}

@test "script processes input file" {
    cp fixtures/input.txt "${TEST_DIR}/"

    run ./script.sh "${TEST_DIR}/input.txt"

    assert_success
    assert_output --partial "Processing complete"
}

@test "script creates output file" {
    run ./script.sh -o "${TEST_DIR}/output.txt" fixtures/input.txt

    assert_success
    assert_file_exists "${TEST_DIR}/output.txt"
}

@test "script handles special characters in filename" {
    local special_file="${TEST_DIR}/file with spaces.txt"
    echo "test" > "${special_file}"

    run ./script.sh "${special_file}"

    assert_success
}
```

## Test Helper (test_helper/common-setup.bash)

```bash
#!/usr/bin/env bash

# Load BATS support libraries
load 'bats/bats-support/load'
load 'bats/bats-assert/load'
load 'bats/bats-file/load'

# Common setup for all tests
common_setup() {
    # Get the containing directory
    PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." && pwd)"

    # Add scripts to PATH
    PATH="${PROJECT_ROOT}/bin:${PATH}"

    # Set up test temp directory
    TEST_TEMP_DIR="$(mktemp -d)"
}

# Common teardown
common_teardown() {
    rm -rf "${TEST_TEMP_DIR}"
}

# Custom assertion: check exit code
assert_exit_code() {
    local expected="$1"
    if [[ "${status}" -ne "${expected}" ]]; then
        echo "Expected exit code ${expected}, got ${status}" >&2
        return 1
    fi
}

# Mock a command
mock_command() {
    local cmd="$1"
    local response="$2"

    eval "${cmd}() { echo '${response}'; }"
    export -f "${cmd}"
}
```

## Target Processes

- shell-script-development
- cli-unit-integration-testing
- cross-platform-cli-compatibility
