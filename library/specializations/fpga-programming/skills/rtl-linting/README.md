# RTL Linting Skill

## Overview

The RTL Linting skill provides expert capabilities for RTL code quality checking using Verible, SpyGlass, and vendor tools. It detects synthesis issues, coding violations, CDC problems, and enforces coding standards.

## Quick Start

### Prerequisites

1. Verible toolchain installed
2. RTL source files (Verilog/SystemVerilog)
3. Lint rules configuration

### Basic Usage

```javascript
// In a babysitter process
const lintResult = await ctx.task(runRTLLint, {
  sourceFiles: ['src/*.sv'],
  rulesConfig: '.verible.rules',
  outputFormat: 'json',
  failOnError: true
});

console.log(`Violations found: ${lintResult.summary.totalViolations}`);
console.log(`Errors: ${lintResult.summary.errors}`);
```

## Features

### Lint Engines

- **Verible**: Open-source SystemVerilog linter
- **SpyGlass**: Commercial CDC and lint tool
- **Vivado**: Built-in DRC and methodology checks
- **Quartus**: Intel synthesis warnings

### Check Categories

- **Synthesis**: Inferred latches, blocking assignments
- **CDC**: Clock domain crossing violations
- **Style**: Naming, formatting, comments
- **Best Practice**: Reset handling, parameterization

## Use Cases

### 1. Run Basic Lint Check

Quick lint analysis:

```javascript
const result = await ctx.task(lintFiles, {
  sourceFiles: ['src/module.sv'],
  rules: ['inferred-latch', 'blocking-in-ff', 'missing-reset']
});
```

### 2. Full Project Lint

Comprehensive project analysis:

```javascript
const result = await ctx.task(lintProject, {
  sourceDir: 'src/',
  includes: ['include/'],
  rulesConfig: '.verible.rules',
  waiverFile: 'waivers/lint_waivers.yaml',
  reportFormat: 'html'
});
```

### 3. CDC-Focused Lint

Check clock domain crossings:

```javascript
const result = await ctx.task(lintCDC, {
  sourceFiles: ['src/*.sv'],
  clockDomains: {
    'clk_a': ['src/domain_a/*.sv'],
    'clk_b': ['src/domain_b/*.sv']
  },
  cdcRules: [
    'multi-bit-cdc',
    'missing-synchronizer',
    'reconvergence'
  ]
});
```

### 4. Auto-Fix Violations

Automatically fix style issues:

```javascript
const result = await ctx.task(autoFixLint, {
  sourceFiles: ['src/*.sv'],
  fixRules: [
    'trailing-spaces',
    'no-tabs',
    'line-length',
    'posix-eof'
  ],
  dryRun: false
});
```

## Configuration

### Verible Rules File

```
# .verible.rules

# Style rules
+line-length=length:120
+no-trailing-spaces
+no-tabs
+posix-eof

# Code quality rules
+explicit-parameter-storage-type
+proper-parameter-type
+generate-label

# Disable rules
-endif-comment
-explicit-begin

# Rule with custom message
+module-filename=msg:"Module name must match filename"
```

### Waiver Configuration

```yaml
# waivers/lint_waivers.yaml
waivers:
  - rule: inferred-latch
    file: src/debug_latch.sv
    line: 25
    reason: "Intentional latch for edge capture"
    approved_by: tech_lead
    date: 2026-01-24
    expires: 2027-01-24

  - rule: multi-bit-cdc
    pattern: "*_gray_reg*"
    reason: "Gray-coded signals, safe CDC pattern"
    approved_by: cdc_expert
```

## Output Files

### Generated Artifacts

| File | Description |
|------|-------------|
| `reports/lint_summary.txt` | Human-readable summary |
| `reports/lint_details.json` | Machine-readable full report |
| `reports/lint_by_file.csv` | Per-file violation counts |
| `reports/lint_trends.png` | Historical trend chart |

### Sample Report

```json
{
  "timestamp": "2026-01-24T10:30:00Z",
  "summary": {
    "totalFiles": 25,
    "filesWithIssues": 8,
    "totalViolations": 42,
    "errors": 3,
    "warnings": 35,
    "info": 4,
    "waived": 5
  },
  "topIssues": [
    { "rule": "line-length", "count": 20 },
    { "rule": "trailing-spaces", "count": 10 },
    { "rule": "inferred-latch", "count": 3 }
  ]
}
```

## Integration

### CI/CD Integration

```yaml
# .github/workflows/lint.yml
name: RTL Lint
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Verible
        run: |
          wget https://github.com/chipsalliance/verible/releases/latest/download/verible-v0.0-linux.tar.gz
          tar xf verible-*.tar.gz
          echo "$(pwd)/verible-*/bin" >> $GITHUB_PATH

      - name: Run Lint
        run: |
          verible-verilog-lint --rules_config=.verible.rules src/*.sv

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: lint-report
          path: reports/
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run Verible lint on staged files
STAGED_SV=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(sv|v)$')

if [ -n "$STAGED_SV" ]; then
  verible-verilog-lint $STAGED_SV
  if [ $? -ne 0 ]; then
    echo "Lint errors found. Fix before committing."
    exit 1
  fi
fi
```

### Process Integration

The RTL Linting skill integrates with these processes:

- `verilog-systemverilog-design.js` - SV development
- `synthesis-optimization.js` - Pre-synthesis checks
- `cdc-design.js` - CDC verification
- `design-for-testability.js` - Testability checks

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| False positive | Too strict rule | Add waiver with reason |
| Missing file | Include path wrong | Check -I include paths |
| Parse error | Syntax issue | Fix syntax or update tool |
| Slow analysis | Large codebase | Run incremental lint |

### Validation Commands

```bash
# Check Verible version
verible-verilog-lint --version

# Test single file
verible-verilog-lint --rules=+all src/test.sv

# List available rules
verible-verilog-lint --help_rules

# Verify waiver file
cat waivers.yaml | python -c "import yaml,sys; yaml.safe_load(sys.stdin)"
```

## Best Practices

1. **Run early, run often** - Lint on every commit
2. **Fix errors first** - Block on errors in CI
3. **Track trends** - Monitor warning counts over time
4. **Document waivers** - Require justification for every waiver
5. **Review periodically** - Audit waivers quarterly

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Purpose |
|--------|---------|
| verible-mcp | SystemVerilog linting and formatting |
| MCP4EDA | Design rule checking |

## References

- [Verible Documentation](https://chipsalliance.github.io/verible/)
- [Verible GitHub](https://github.com/chipsalliance/verible)
- [Xilinx DRC Reference](https://docs.xilinx.com/r/en-US/ug906-vivado-design-analysis)
- [SpyGlass User Guide](https://www.synopsys.com/verification/static-and-formal-verification/spyglass.html)

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Verilog/SystemVerilog Design Process](../../verilog-systemverilog-design.js)
- [Synthesis Optimization Process](../../synthesis-optimization.js)
