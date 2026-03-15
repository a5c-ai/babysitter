# Babysitter Process Methodologies

This directory contains process workflows and methodologies for the Babysitter SDK orchestration framework.

## Quick Links

- **[GSD Workflows](gsd/README.md)** - Get Shit Done methodology adapted for Babysitter SDK
- **[Spec-Kit Workflows](SPEC-KIT.md)** - GitHub Spec-Kit inspired spec-driven development
- **[TDD Quality Convergence](tdd-quality-convergence.md)** - Test-driven development with quality gates

## Available Methodologies

### Spec-Driven Development (Spec-Kit)

**Based on:** [GitHub Spec-Kit](https://github.com/github/spec-kit)

Executable specifications that drive implementation through systematic phases:

1. **[spec-driven-development.js](methodologies/spec-driven-development.js)** - Complete 5-step workflow
   - Constitution → Specification → Plan → Tasks → Implementation
   - Full quality gates and validation

2. **[spec-kit-constitution.js](methodologies/spec-kit-constitution.js)** - Standalone constitution
   - Establish governance principles
   - Code quality, UX, performance, security standards

3. **[spec-kit-quality-checklist.js](methodologies/spec-kit-quality-checklist.js)** - Quality validation
   - "Unit tests for English"
   - Custom checklists per artifact type

4. **[spec-kit-brownfield.js](methodologies/spec-kit-brownfield.js)** - Brownfield development
   - Add features to existing systems
   - Integration analysis and risk validation

**Examples:** [examples/spec-kit-examples.json](examples/spec-kit-examples.json)

---

### Get Shit Done (GSD)

**Based on:** [get-shit-done](https://github.com/glittercowboy/get-shit-done)

Systematic project development preventing context degradation:

1. **[gsd/new-project.js](gsd/new-project.js)** - Project initialization
2. **[gsd/discuss-phase.js](gsd/discuss-phase.js)** - Phase discussion
3. **[gsd/plan-phase.js](gsd/plan-phase.js)** - Planning with verification
4. **[gsd/execute-phase.js](gsd/execute-phase.js)** - Parallel execution
5. **[gsd/verify-work.js](gsd/verify-work.js)** - UAT and fixes
6. **[gsd/audit-milestone.js](gsd/audit-milestone.js)** - Milestone audit
7. **[gsd/map-codebase.js](gsd/map-codebase.js)** - Codebase analysis
8. **[gsd/iterative-convergence.js](gsd/iterative-convergence.js)** - Quality convergence

**Documentation:** [gsd/README.md](gsd/README.md)

---

### Other Methodologies

Located in [methodologies/](methodologies/):

- **[devin.js](methodologies/devin.js)** - Plan → Code → Debug → Deploy
- **[ralph.js](methodologies/ralph.js)** - Simple persistent iteration loop
- **[plan-and-execute.js](methodologies/plan-and-execute.js)** - Detailed planning then execution
- **[agile.js](methodologies/agile.js)** - Sprint-based iterative development
- **[bottom-up.js](methodologies/bottom-up.js)** - Component-first development
- **[top-down.js](methodologies/top-down.js)** - Architecture-first development
- **[evolutionary.js](methodologies/evolutionary.js)** - Incremental evolution
- **[graph-of-thoughts.js](methodologies/graph-of-thoughts.js)** - Multi-path reasoning
- **[adversarial-spec-debates.js](methodologies/adversarial-spec-debates.js)** - Adversarial validation
- **[consensus-and-voting-mechanisms.js](methodologies/consensus-and-voting-mechanisms.js)** - Multi-agent consensus
- **[state-machine-orchestration.js](methodologies/state-machine-orchestration.js)** - State-based workflows
- **[self-assessment.js](methodologies/self-assessment.js)** - Self-validation loops
- **[build-realtime-remediation.js](methodologies/build-realtime-remediation.js)** - Real-time error fixing
- **[base44.js](methodologies/base44.js)** - Base44 methodology

---

## Usage

### Run a Process

```bash
babysitter run:create \
  --process-id methodologies/spec-driven-development \
  --entry plugins/babysitter/skills/babysit/process/methodologies/spec-driven-development.js#process \
  --inputs inputs.json
```

### Using Examples

```bash
# Use example inputs directly
babysitter run:create \
  --process-id methodologies/spec-kit-constitution \
  --entry plugins/babysitter/skills/babysit/process/methodologies/spec-kit-constitution.js#process \
  --inputs examples/spec-kit-examples.json#constitutionOnly.inputs
```

### Compose Processes

```javascript
import { process as specDriven } from './methodologies/spec-driven-development.js';
import { process as gsdNewProject } from './gsd/new-project.js';

export async function process(inputs, ctx) {
  // Combine methodologies
  const vision = await gsdNewProject(inputs, ctx);
  const implementation = await specDriven({
    ...inputs,
    constitution: vision.constitution,
    requirements: vision.requirements
  }, ctx);

  return { vision, implementation };
}
```

---

## Comparison Matrix

| Methodology | Best For | Quality Gates | Artifacts | Human Approval |
|-------------|----------|---------------|-----------|----------------|
| **Spec-Kit** | Enterprise, governance-heavy | Constitution, checklists | Constitution, Spec, Plan, Tasks | Every phase |
| **GSD** | Complete products | UAT, verification loops | PROJECT.md, ROADMAP.md, Plans | Vision, Plans, UAT |
| **TDD** | Technical features | Test suite | Tests, Implementation | Test design |
| **Devin** | Full features | Debug loops, quality scoring | Plan, Code, Tests | Plan, Deployment |
| **Agile** | Sprint-based teams | Sprint review, retrospective | User stories, Sprint artifacts | Sprint planning |

---

## Contributing

When adding new methodologies:

1. Place in `methodologies/` directory
2. Follow naming convention: `methodology-name.js`
3. Use `defineTask` from `@a5c-ai/babysitter-sdk`
4. Include JSDoc with `@process`, `@description`, `@inputs`, `@outputs`
5. Add examples to `examples/` directory
6. Update this README

---

## Documentation

- **[SPEC-KIT.md](SPEC-KIT.md)** - Complete Spec-Kit documentation
- **[gsd/README.md](gsd/README.md)** - GSD workflows documentation
- **[gsd/QUICK_START.md](gsd/QUICK_START.md)** - GSD quick reference
- **[gsd/SUMMARY.md](gsd/SUMMARY.md)** - GSD implementation details
- **[tdd-quality-convergence.md](tdd-quality-convergence.md)** - TDD with convergence

---

## Examples Directory

- **[spec-kit-examples.json](examples/spec-kit-examples.json)** - 8 Spec-Kit examples
- **[gsd/examples/](gsd/examples/)** - GSD workflow examples
- **[tdd-quality-convergence-example.json](examples/tdd-quality-convergence-example.json)** - TDD example

---

## License

See repository root LICENSE file.
