---
name: protocol-fuzzer
description: Expert skill for protocol fuzzing, vulnerability discovery, and security testing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Protocol Fuzzer Skill

Expert skill for protocol fuzzing, vulnerability discovery, and security testing of network protocols.

## Capabilities

- **Fuzzer Configuration**: Configure AFL++, libFuzzer, boofuzz, and Peach Fuzzer
- **Mutation Strategy Design**: Generate effective mutation strategies for different protocols
- **Coverage Analysis**: Analyze code coverage and crash reports
- **Grammar Definition**: Create protocol grammar definitions for structured fuzzing
- **Vulnerability Detection**: Detect crash patterns, memory corruption, and security vulnerabilities
- **Test Case Generation**: Generate reproducible test cases from fuzzing results
- **Crash Triage**: Analyze and deduplicate crash reports
- **Security Reporting**: Generate security vulnerability reports

## Tools and Dependencies

- `AFL++` - American Fuzzy Lop Plus Plus
- `libFuzzer` - LLVM-based in-process fuzzer
- `boofuzz` - Network protocol fuzzer (Sulley successor)
- `Peach Fuzzer` - Smart fuzzing framework
- `radamsa` - General-purpose fuzzer
- `honggfuzz` - Security-oriented fuzzer

## Target Processes

- protocol-fuzzer.js
- binary-protocol-parser.js
- network-testing-framework.js

## Usage Examples

### Boofuzz Protocol Fuzzing
```python
from boofuzz import *

session = Session(target=Target(connection=TCPSocketConnection("127.0.0.1", 8080)))
s_initialize("HTTP Request")
s_string("GET", fuzzable=False)
s_delim(" ", fuzzable=False)
s_string("/", name="path")
s_static("\r\n\r\n")
session.connect(s_get("HTTP Request"))
session.fuzz()
```

### AFL++ Instrumented Fuzzing
```bash
afl-fuzz -i input_corpus -o findings -M main -- ./target @@
afl-cov -d findings --coverage-cmd "./target AFL_FILE" --code-dir src/
```

### Crash Analysis
```bash
afl-analyze -i crash_file -- ./target @@
```

## Quality Gates

- Coverage threshold achieved
- No critical vulnerabilities found
- All crashes triaged
- Reproducible test cases generated
- Security report completed
