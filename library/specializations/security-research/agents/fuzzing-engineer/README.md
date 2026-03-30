# Fuzzing Engineer Agent

## Overview

The `fuzzing-engineer` agent embodies the expertise of a Senior Fuzzing Research Engineer with deep knowledge of coverage-guided fuzzing, harness development, crash analysis, and automated vulnerability discovery. It provides expert guidance on fuzzing campaigns, tool configuration, and vulnerability triage.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Fuzzing Research Engineer |
| **Experience** | 5+ years in fuzzing research |
| **Background** | OSS-Fuzz contributor, tool development |
| **Specializations** | AFL++, libFuzzer, harness engineering |
| **Philosophy** | "Fuzzing finds what humans miss" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Coverage-Guided** | AFL++, libFuzzer, honggfuzz |
| **Grammar-Based** | Nautilus, Dharma, structured fuzzing |
| **Protocol Fuzzing** | boofuzz, AFLNet, stateful fuzzing |
| **Harness Development** | Persistent mode, FuzzedDataProvider |
| **Crash Analysis** | Triage, deduplication, root cause |
| **Kernel Fuzzing** | syzkaller, kAFL, driver fuzzing |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(fuzzingEngineerTask, {
  agentName: 'fuzzing-engineer',
  prompt: {
    role: 'Fuzzing Research Engineer',
    task: 'Design and execute fuzzing campaign for libpng',
    context: {
      target: 'libpng',
      version: '1.6.40',
      codebase: '/path/to/libpng',
      existingTests: '/path/to/tests',
      timeframe: '14 days'
    },
    instructions: [
      'Design optimal harness for image parsing',
      'Configure AFL++ with sanitizers',
      'Create seed corpus from PNG samples',
      'Define fuzzing dictionary',
      'Plan crash triage workflow',
      'Provide coverage improvement strategy'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Design fuzzing campaign
/agent fuzzing-engineer design-campaign \
  --target libxml2 \
  --entry-point xmlReadMemory \
  --time-budget "7 days" \
  --cores 16

# Create harness
/agent fuzzing-engineer create-harness \
  --target libpng \
  --function png_read_image \
  --mode persistent \
  --sanitizers asan,ubsan

# Analyze crashes
/agent fuzzing-engineer triage-crashes \
  --crash-dir /output/crashes \
  --target ./fuzz_target \
  --dedupe-method stack-hash

# Optimize campaign
/agent fuzzing-engineer optimize-campaign \
  --stats /output/fuzzer_stats \
  --corpus /output/corpus \
  --coverage-report coverage.html
```

## Common Tasks

### 1. Fuzzing Campaign Design

```bash
/agent fuzzing-engineer design-campaign \
  --target "image parser" \
  --codebase /path/to/code \
  --entry-points "parse_jpeg,parse_png,parse_gif" \
  --fuzzer aflpp \
  --time-budget "14 days" \
  --cores 32 \
  --output campaign_plan.json
```

Output includes:
- Harness design for each entry point
- Compilation flags and sanitizers
- Seed corpus recommendations
- Dictionary content
- Parallel fuzzing configuration
- Coverage goals and milestones

### 2. Harness Development

```bash
/agent fuzzing-engineer develop-harness \
  --target libssl \
  --api "SSL_read,SSL_write" \
  --mode stateful \
  --framework libfuzzer \
  --output harness.cc
```

Provides:
- Complete harness source code
- State management approach
- Compilation instructions
- Testing methodology

### 3. Crash Analysis and Triage

```bash
/agent fuzzing-engineer analyze-crashes \
  --crash-dir /fuzzing/output/crashes \
  --target ./target_asan \
  --severity-assessment \
  --generate-pocs \
  --output triage_report.json
```

Provides:
- Unique crash identification
- Severity assessment
- Root cause analysis
- Minimal reproduction cases
- Security impact evaluation

### 4. Coverage Improvement

```bash
/agent fuzzing-engineer improve-coverage \
  --current-coverage 65% \
  --coverage-report lcov.info \
  --corpus /output/corpus \
  --target-areas "src/parser/*.c" \
  --recommendations
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `fuzzing-campaign.js` | Full campaign lifecycle |
| `security-tool-development.js` | Harness development |
| `vulnerability-research-workflow.js` | Automated discovery |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const fuzzingCampaignTask = defineTask({
  name: 'fuzzing-campaign',
  description: 'Execute comprehensive fuzzing campaign',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Fuzzing Campaign - ${inputs.targetName}`,
      agent: {
        name: 'fuzzing-engineer',
        prompt: {
          role: 'Fuzzing Research Engineer',
          task: 'Design and monitor fuzzing campaign',
          context: {
            target: inputs.targetName,
            version: inputs.targetVersion,
            codebase: inputs.codebasePath,
            entryPoints: inputs.entryPoints,
            resources: {
              cores: inputs.cores,
              timeframe: inputs.duration
            },
            existingCorpus: inputs.seedCorpus
          },
          instructions: [
            'Design harness for each entry point',
            'Configure fuzzer with optimal settings',
            'Create seed corpus and dictionary',
            'Plan parallel fuzzing strategy',
            'Define crash triage workflow',
            'Set coverage milestones'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['harnesses', 'configuration', 'corpus', 'milestones'],
          properties: {
            harnesses: { type: 'array' },
            configuration: { type: 'object' },
            corpus: { type: 'object' },
            milestones: { type: 'array' }
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

## Fuzzing Methodology

### Campaign Phases

| Phase | Activities |
|-------|------------|
| **Preparation** | Target analysis, harness development |
| **Corpus Creation** | Seed collection, minimization |
| **Configuration** | Fuzzer settings, sanitizers |
| **Execution** | Parallel fuzzing, monitoring |
| **Analysis** | Crash triage, root cause |
| **Reporting** | Findings, remediation |

### Tool Selection Matrix

| Scenario | Recommended Tool |
|----------|------------------|
| General binary | AFL++ |
| C++ library | libFuzzer |
| Network protocol | boofuzz, AFLNet |
| JavaScript engine | Fuzzilli |
| Kernel syscalls | syzkaller |
| Structured input | Nautilus |

## Knowledge Base

### Harness Patterns

| Pattern | Use Case |
|---------|----------|
| **Persistent Mode** | High-throughput parsing |
| **FuzzedDataProvider** | Structured inputs |
| **Stateful** | API sequences |
| **In-Memory** | File format parsing |
| **Socket Hook** | Network services |

### Common Issues

| Issue | Solution |
|-------|----------|
| Low coverage growth | Add dictionary, improve seeds |
| Crash storms | Enable deduplication |
| Slow execution | Use persistent mode |
| Memory issues | Tune sanitizer flags |
| State corruption | Add reset between runs |

## Interaction Guidelines

### What to Expect

- **Practical harnesses** with working code
- **Optimized configurations** for your target
- **Thorough triage** of discovered crashes
- **Actionable metrics** for campaign health

### Best Practices

1. Provide target source code and build system
2. Share existing test cases for seed corpus
3. Specify resource constraints (cores, time)
4. Include any format specifications
5. Note previous fuzzing efforts

## Related Resources

- [fuzzing-ops skill](../skills/fuzzing-ops/) - Fuzzing tools
- [static-analysis skill](../skills/static-analysis/) - Pre-fuzzing analysis
- [vulnerability-researcher agent](../agents/vulnerability-researcher/) - Vuln analysis

## References

- [AFL++ Documentation](https://aflplus.plus/)
- [libFuzzer Documentation](https://llvm.org/docs/LibFuzzer.html)
- [OSS-Fuzz](https://google.github.io/oss-fuzz/)
- [The Fuzzing Book](https://www.fuzzingbook.org/)
- [Google Fuzzing Repository](https://github.com/google/fuzzing)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-007
**Category:** Fuzzing
**Status:** Active
