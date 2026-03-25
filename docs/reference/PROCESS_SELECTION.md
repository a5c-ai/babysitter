# Babysitter Process Selection Guide

A comprehensive guide to help you choose the right process/methodology for your project needs.

---

## Quick Decision Tree

Use this text-based flowchart to quickly identify the best methodology for your needs:

```
                              START HERE
                                  |
                                  v
                    +-------------------------+
                    | Do you have existing    |
                    | codebase to work with?  |
                    +-------------------------+
                         |              |
                        YES            NO
                         |              |
                         v              v
         +---------------+        +----------------+
         | Brownfield    |        | Greenfield     |
         | Project       |        | (New Project)  |
         +---------------+        +----------------+
              |                         |
              v                         v
    +------------------+      +--------------------+
    | Need governance/ |      | What's your main   |
    | compliance?      |      | priority?          |
    +------------------+      +--------------------+
         |       |                     |
        YES     NO               +-----+-----+-----+
         |       |               |     |     |     |
         v       v               v     v     v     v
    +--------+ +--------+    Speed  Quality Gov  Team
    |Spec-Kit| |  GSD   |      |      |      |    |
    |Brown-  | |Codebase|      v      v      v    v
    |field   | |Mapping |   Ralph/  TDD   Spec- Scrum/
    +--------+ +--------+   Devin  QC     Kit   Agile
                                               Kanban

    Legend:
    - Spec-Kit Brownfield: Governance + existing code
    - GSD Codebase Mapping: Systematic brownfield analysis
    - Ralph/Devin: Quick iterations, autonomous coding
    - TDD QC: Test-driven development with quality gates
    - Spec-Kit: Full governance, enterprise requirements
    - Scrum/Agile/Kanban: Team coordination, sprints, flow
```

---

## Quick Reference Table

| Methodology | Best For | Complexity | Human Gates | Key Artifacts |
|-------------|----------|------------|-------------|---------------|
| **GSD** | Complete products, systematic development | Medium | Vision, Plans, UAT | PROJECT.md, ROADMAP.md |
| **Spec-Kit** | Enterprise, governance-heavy projects | High | Every phase | Constitution, Spec, Plan, Tasks |
| **TDD Quality Convergence** | Technical features, test-first | Medium | Plan, Iterations, Final | Tests, Implementation |
| **Devin** | Full features, autonomous coding | Medium | Plan, Debug, Deploy | Plan, Code, Tests |
| **Ralph** | Quick iterations, persistent tasks | Low | Optional per iteration | Iteration results |
| **Agile/Scrum** | Sprint-based teams, stakeholder collaboration | Medium-High | Sprint ceremonies | Backlog, Burndown, Retros |
| **Kanban** | Continuous delivery, flow optimization | Low-Medium | Replenishment | Board, CFD, Metrics |
| **BDD** | Stakeholder collaboration, living documentation | Medium | Discovery, Review | Gherkin specs, Tests |
| **DDD** | Complex domains, microservices | High | Phase reviews | Context maps, Aggregates |
| **Example Mapping** | Feature discovery, requirement clarity | Low | Workshop | Rules, Examples, Questions |
| **ATDD/TDD** | Technical correctness, refactoring | Medium | Test design | Acceptance tests, Unit tests |

---

## Use Case Examples

### "I want to build a new project from scratch"
**Recommended: GSD (Get Shit Done)**

GSD provides systematic project development with:
- Vision capture and research
- Phased milestone planning
- Parallel task execution
- UAT and verification loops

```bash
babysitter run:create \
  --process-id gsd/new-project \
  --entry gsd/new-project.js#process \
  --inputs '{"projectName": "My New App"}'
```

**Also consider:** Spec-Kit if you need formal governance, or Devin for autonomous feature development.

---

### "I want test-driven development with quality gates"
**Recommended: TDD Quality Convergence**

TDD Quality Convergence provides:
- Agent-based planning with TDD principles
- Red-Green-Refactor cycle
- Iterative quality scoring (0-100)
- Parallel quality checks (coverage, lint, types, security)
- Convergence until target quality reached

```bash
babysitter run:create \
  --process-id babysitter/tdd-quality-convergence \
  --entry tdd-quality-convergence.js#process \
  --inputs '{"feature": "User Authentication", "targetQuality": 90}'
```

**Also consider:** ATDD/TDD for simpler test-first workflows, or BDD for stakeholder collaboration.

---

### "I have governance requirements and need formal specifications"
**Recommended: Spec-Kit**

Spec-Kit provides:
- Constitution with governance principles
- Executable specifications
- Quality checklists ("unit tests for English")
- Full audit trail

```bash
babysitter run:create \
  --process-id methodologies/spec-driven-development \
  --entry spec-driven-development.js#process \
  --inputs '{"projectName": "Enterprise System", "developmentPhase": "greenfield"}'
```

**Variants:**
- `spec-kit-constitution.js` - Governance principles only
- `spec-kit-quality-checklist.js` - Quality validation
- `spec-kit-brownfield.js` - Adding to existing systems

---

### "I want quick iterations with minimal ceremony"
**Recommended: Ralph or Devin**

**Ralph** - Simple persistent loop:
- Execute task until DONE signal
- Minimal overhead
- Good for autonomous completion

```bash
babysitter run:create \
  --process-id methodologies/ralph \
  --entry ralph.js#process \
  --inputs '{"task": "Implement login feature", "maxIterations": 10}'
```

**Devin** - Plan-Code-Debug-Deploy:
- More structured than Ralph
- Includes quality scoring
- Deployment phase

```bash
babysitter run:create \
  --process-id methodologies/devin \
  --entry devin.js#process \
  --inputs '{"feature": "Shopping Cart", "targetQuality": 85}'
```

---

### "I need to coordinate a team with sprints"
**Recommended: Scrum or Agile**

Scrum/Agile provides:
- Product backlog management
- Sprint planning and execution
- Daily scrums, reviews, retrospectives
- Velocity tracking

```bash
babysitter run:create \
  --process-id methodologies/scrum \
  --entry scrum/scrum.js#process \
  --inputs '{"projectName": "Team Project", "sprintDuration": 2, "sprintCount": 6}'
```

**Also consider:** Kanban for continuous flow without fixed sprints.

---

### "I want continuous delivery without fixed iterations"
**Recommended: Kanban**

Kanban provides:
- Visual workflow management
- WIP limits and flow optimization
- Service classes for prioritization
- Continuous improvement

```bash
babysitter run:create \
  --process-id methodologies/kanban \
  --entry kanban/kanban.js#process \
  --inputs '{"projectName": "DevOps Pipeline", "cycles": 10}'
```

---

### "I want stakeholders involved in defining behavior"
**Recommended: BDD (Specification by Example)**

BDD provides:
- Discovery workshops with stakeholders
- Given-When-Then scenarios
- Living documentation
- Executable specifications

```bash
babysitter run:create \
  --process-id methodologies/bdd-specification-by-example \
  --entry bdd-specification-by-example/bdd-process.js#process \
  --inputs '{"projectName": "E-commerce", "feature": "Checkout process"}'
```

---

### "I'm building a complex domain with microservices"
**Recommended: Domain-Driven Design (DDD)**

DDD provides:
- Strategic design (subdomains, bounded contexts)
- Tactical design (entities, aggregates, services)
- Ubiquitous language
- Context mapping

```bash
babysitter run:create \
  --process-id methodologies/domain-driven-design \
  --entry domain-driven-design/domain-driven-design.js#process \
  --inputs '{"projectName": "E-Commerce Platform", "complexity": "complex"}'
```

---

### "I need to add features to an existing codebase"
**Recommended: Spec-Kit Brownfield or GSD Codebase Mapping**

**Spec-Kit Brownfield:**
- Analyzes existing patterns
- Infers or validates constitution
- Plans integration carefully

```bash
babysitter run:create \
  --process-id methodologies/spec-kit-brownfield \
  --entry spec-kit-brownfield.js#process \
  --inputs '{"featureName": "2FA", "existingCodebase": "./src"}'
```

**GSD Codebase Mapping:**
- Architecture understanding
- Pattern identification
- Integration planning

```bash
babysitter run:create \
  --process-id gsd/map-codebase \
  --entry gsd/map-codebase.js#process \
  --inputs '{"projectPath": "./src"}'
```

---

## Methodology Descriptions

### Core Methodologies

#### GSD (Get Shit Done)
Systematic project development preventing context degradation through:
- **Discuss Phase**: Capture implementation preferences
- **Plan Phase**: Research-informed task planning with verification
- **Execute Phase**: Parallel task execution with atomic commits
- **Verify Phase**: UAT and automated diagnosis

**Documentation:** [gsd/README.md](skills/babysit/process/gsd/README.md)

---

#### Spec-Kit (Spec-Driven Development)
Executable specifications that drive implementation:
- **Constitution**: Governance principles and standards
- **Specification**: User stories with acceptance criteria
- **Plan**: Technical architecture and stack
- **Tasks**: Ordered, actionable implementation tasks
- **Quality Checklists**: "Unit tests for English"

**Documentation:** [SPEC-KIT.md](skills/babysit/process/SPEC-KIT.md)

---

#### TDD Quality Convergence
Test-driven development with iterative quality improvement:
- Agent-based planning with TDD principles
- Quality scoring across multiple dimensions
- Convergence loop until target quality reached
- Parallel quality checks

**Documentation:** [tdd-quality-convergence.md](skills/babysit/process/tdd-quality-convergence.md)

---

#### Devin Style
Autonomous software engineering workflow:
- **Plan**: Architecture and implementation strategy
- **Code**: Feature implementation
- **Debug**: Iterative test-fix cycles
- **Deploy**: Production deployment

---

#### Ralph Loop
Simple, persistent iteration loop:
- Execute task repeatedly until DONE signal
- Minimal ceremony and overhead
- Good for autonomous task completion

---

### Agile Methodologies

#### Scrum
Iterative framework with defined roles and ceremonies:
- Sprint-based timeboxed iterations
- Product Owner, Scrum Master, Development Team
- Sprint Planning, Daily Scrum, Review, Retrospective
- Velocity tracking and burndown charts

---

#### Kanban
Continuous flow management:
- Visual workflow with WIP limits
- Pull-based system
- Service classes (Expedite, Standard, Fixed Date, Intangible)
- Cycle time and throughput metrics

---

#### Agile (General)
Sprint-based iterative development with:
- Product backlog management
- Sprint cycles with planning and review
- Continuous improvement through retrospectives

---

### Specification & Design Methodologies

#### BDD (Specification by Example)
Collaborative approach capturing requirements as concrete examples:
- Discovery workshops with stakeholders
- Gherkin scenarios (Given-When-Then)
- Living documentation
- Executable specifications

**Documentation:** [bdd-specification-by-example/README.md](skills/babysit/process/methodologies/bdd-specification-by-example/README.md)

---

#### Domain-Driven Design (DDD)
Strategic and tactical design for complex domains:
- Subdomain classification (Core, Supporting, Generic)
- Bounded contexts and context mapping
- Entities, Value Objects, Aggregates
- Domain events and services

**Documentation:** [domain-driven-design/README.md](skills/babysit/process/methodologies/domain-driven-design/README.md)

---

#### Example Mapping
Collaborative requirement discovery:
- Stories, Rules, Examples, Questions
- Workshop-based discovery
- Foundation for BDD scenarios

**Documentation:** [example-mapping/README.md](skills/babysit/process/methodologies/example-mapping/README.md)

---

### Other Methodologies

| Methodology | Description |
|-------------|-------------|
| **ATDD/TDD** | Acceptance test-driven development with unit test cycles |
| **Feature-Driven Development** | Feature-centric development with two-week cycles |
| **Hypothesis-Driven Development** | Experiment-based validation of product assumptions |
| **Jobs To Be Done** | Customer-centric feature prioritization |
| **Impact Mapping** | Goal-oriented delivery planning |
| **Shape Up** | 6-week appetite-based development cycles |
| **Extreme Programming (XP)** | Technical excellence through pair programming, CI, etc. |

---

## Comparison Matrix

### By Project Phase

| Phase | Best Methodologies |
|-------|-------------------|
| **Discovery/Research** | Example Mapping, BDD Discovery, GSD Discuss |
| **Architecture** | DDD, Spec-Kit Constitution, GSD New Project |
| **Planning** | Scrum Sprint Planning, Spec-Kit, GSD Plan Phase |
| **Implementation** | TDD QC, Devin, Ralph, Kanban |
| **Testing** | BDD, ATDD/TDD, TDD Quality Convergence |
| **Deployment** | Devin, Kanban, Scrum Release |

### By Team Size

| Team Size | Recommended |
|-----------|-------------|
| **Solo developer** | Ralph, Devin, GSD |
| **Small team (2-5)** | Kanban, GSD, Spec-Kit |
| **Medium team (5-9)** | Scrum, Agile, BDD |
| **Large team (10+)** | Scrum, DDD (bounded contexts), Spec-Kit |

### By Certainty Level

| Requirements Certainty | Recommended |
|------------------------|-------------|
| **High certainty** | TDD QC, Spec-Kit, Devin |
| **Medium certainty** | Scrum, GSD, BDD |
| **Low certainty** | Kanban, Ralph, Hypothesis-Driven |
| **Unknown** | Example Mapping, BDD Discovery, GSD Discuss |

### By Quality Focus

| Quality Priority | Recommended |
|------------------|-------------|
| **Maximum quality** | TDD Quality Convergence, Spec-Kit |
| **Balanced** | GSD, Scrum, BDD |
| **Speed over quality** | Ralph, Devin |
| **Compliance required** | Spec-Kit, BDD (living docs) |

---

## Domain-Specific Process Selector

Choose based on your domain specialization:

### Software Development

| Domain | Recommended Process | Reason |
|--------|-------------------|--------|
| **Web Development** | GSD, Devin, BDD | Rapid iteration, stakeholder demos |
| **Mobile Development** | Scrum, BDD | Sprint-based, platform testing |
| **Desktop Development** | GSD, TDD QC | Quality focus, fewer deployments |
| **Game Development** | Kanban, GSD | Continuous flow, creative iteration |
| **Embedded Systems** | Spec-Kit, TDD QC | Safety-critical, formal specs |

### Data & AI

| Domain | Recommended Process | Reason |
|--------|-------------------|--------|
| **Data Engineering** | Kanban, GSD | Pipeline management, continuous flow |
| **Data Science/ML** | Hypothesis-Driven, GSD | Experimental, iterative |
| **AI Agents** | TDD QC, BDD | Behavior validation, quality gates |

### Operations & Infrastructure

| Domain | Recommended Process | Reason |
|--------|-------------------|--------|
| **DevOps/SRE** | Kanban | Continuous flow, incident response |
| **Security/Compliance** | Spec-Kit | Governance, audit trails |
| **Platform Engineering** | DDD, Spec-Kit | Complex domains, service boundaries |

### Product & Design

| Domain | Recommended Process | Reason |
|--------|-------------------|--------|
| **Product Management** | Impact Mapping, JTBD | Goal-oriented, customer-centric |
| **UX/UI Design** | BDD, Example Mapping | Stakeholder collaboration |
| **Technical Documentation** | GSD, Spec-Kit | Systematic, quality gates |

### Scientific & Engineering

| Domain | Recommended Process | Reason |
|--------|-------------------|--------|
| **Scientific Discovery** | Hypothesis-Driven | Experimental validation |
| **Engineering (Aerospace, Automotive, etc.)** | Spec-Kit, TDD QC | Safety-critical, compliance |
| **Algorithms/Optimization** | TDD QC | Correctness verification |

---

## Combining Methodologies

Many projects benefit from combining approaches:

### Spec-Kit + TDD
```javascript
// 1. Use Spec-Kit for requirements and planning
const spec = await runProcess('methodologies/spec-driven-development', { ... });

// 2. Use TDD QC for implementation
for (const task of spec.tasks) {
  await runProcess('babysitter/tdd-quality-convergence', {
    feature: task.title,
    targetQuality: 85
  });
}
```

### DDD + BDD
```javascript
// 1. Use DDD for strategic design
const design = await runProcess('methodologies/domain-driven-design', { ... });

// 2. Use BDD for each bounded context
for (const context of design.boundedContexts) {
  await runProcess('methodologies/bdd-specification-by-example', {
    feature: context.name
  });
}
```

### GSD + Kanban
```javascript
// 1. Use GSD for project initialization
const project = await runProcess('gsd/new-project', { ... });

// 2. Use Kanban for ongoing delivery
await runProcess('methodologies/kanban', {
  initialBacklog: project.roadmap.tasks
});
```

---

## Documentation Links

### Core Documentation
- [Process README](skills/babysit/process/README.md) - Overview of all methodologies
- [GSD README](skills/babysit/process/gsd/README.md) - Get Shit Done workflows
- [GSD Quick Start](skills/babysit/process/gsd/QUICK_START.md) - GSD quick reference
- [SPEC-KIT](skills/babysit/process/SPEC-KIT.md) - Spec-driven development
- [TDD Quality Convergence](skills/babysit/process/tdd-quality-convergence.md) - Test-driven with quality gates

### Methodology Documentation
- [BDD/Specification by Example](skills/babysit/process/methodologies/bdd-specification-by-example/README.md)
- [Domain-Driven Design](skills/babysit/process/methodologies/domain-driven-design/README.md)
- [Example Mapping](skills/babysit/process/methodologies/example-mapping/README.md)
- [Kanban](skills/babysit/process/methodologies/kanban/README.md)
- [Feature-Driven Development](skills/babysit/process/methodologies/feature-driven-development/README.md)
- [Hypothesis-Driven Development](skills/babysit/process/methodologies/hypothesis-driven-development/README.md)
- [ATDD/TDD](skills/babysit/process/methodologies/atdd-tdd/README.md)
- [Jobs To Be Done](skills/babysit/process/methodologies/jobs-to-be-done/README.md)

### Domain Specializations
- [Technical Documentation](skills/babysit/process/specializations/technical-documentation/README.md)
- [Data Science/ML](skills/babysit/process/specializations/data-science-ml/README.md)
- [DevOps/SRE](skills/babysit/process/specializations/devops-sre-platform/README.md)
- [Security/Compliance](skills/babysit/process/specializations/security-compliance/README.md)
- [QA/Testing](skills/babysit/process/specializations/qa-testing-automation/README.md)
- [Software Architecture](skills/babysit/process/specializations/software-architecture/README.md)

---

## Getting Started

1. **Identify your project type** using the decision tree above
2. **Review the quick reference table** to understand methodology trade-offs
3. **Read the detailed documentation** for your chosen methodology
4. **Start with examples** in the `examples/` directories
5. **Iterate and combine** methodologies as your project evolves

---

**Version:** 1.0.0
**Last Updated:** 2026-02-03
**Plugin:** babysitter
