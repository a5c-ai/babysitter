# RUP (Rational Unified Process)

**Iterative software development framework with four phases and use-case driven, architecture-centric approach**

## Overview

The Rational Unified Process (RUP) is a comprehensive iterative software development framework created by Rational Software (Grady Booch, Ivar Jacobson, James Rumbaugh) in the 1990s. RUP combines phases with workflows, emphasizing use-case driven development, architecture-centric design, and risk-driven iteration planning.

## Key Principles

1. **Iterative Development**: Software is built incrementally through iterations, not all at once
2. **Risk-Driven**: Risks drive the sequence of activities and iteration priorities
3. **Architecture-Centric**: Establish solid architecture early in Elaboration phase
4. **Use-Case Driven**: Use cases capture functional requirements and drive development
5. **Four Phases with Iterations**: Each phase contains multiple iterations
6. **Six Core Workflows**: Business Modeling, Requirements, Analysis & Design, Implementation, Testing, Deployment

## Four Phases

### 1. Inception Phase
**Milestone: Lifecycle Objective (LCO)**

**Purpose**: Define project scope, identify risks, create business case, and determine project viability.

**Activities**:
- Create Vision Document
- Develop Business Case with ROI analysis
- Build Initial Use Case Model (brief descriptions)
- Assess Project Risks
- Create Initial Project Plan

**Outputs**:
- Vision document defining scope and stakeholders
- Business case with financial justification
- Initial use case model with actors and high-level use cases
- Risk list with prioritized risks
- Initial project plan with phases and iterations

**Decision**: Is the project worth pursuing? Approve to continue to Elaboration.

### 2. Elaboration Phase
**Milestone: Lifecycle Architecture (LCA)**

**Purpose**: Detailed requirements, establish architecture baseline, mitigate risks, and plan Construction phase.

**Activities**:
- Refine Use Case Model to Detailed Level (full specifications with flows)
- Define Architecture Baseline (components, patterns, technology stack)
- Build Executable Architecture Prototype
- Mitigate High-Priority Risks
- Refine Project Plan for Construction

**Outputs**:
- Detailed use case specifications with scenarios
- Architecture baseline document with all views
- Executable architecture prototype validating key scenarios
- Risk mitigation report
- Refined project plan with detailed iteration assignments

**Decision**: Is the architecture stable enough for Construction? Approve to proceed.

### 3. Construction Phase
**Milestone: Initial Operational Capability (IOC)**

**Purpose**: Iteratively build the software in incremental builds, achieving beta release quality.

**Activities (per iteration)**:
- Plan Iteration (select use cases, define goals)
- Implement Iteration (analysis, design, implementation, unit testing)
- Integrate and Test (integration testing, system testing)
- Generate User Documentation
- Review Iteration (lessons learned, velocity tracking)

**Outputs**:
- Multiple incremental builds (beta releases)
- Implemented modules and features
- Integration and system test results
- User documentation
- Iteration reviews with lessons learned

**Decision**: Is the system operational enough for beta release? Approve to proceed to Transition.

### 4. Transition Phase
**Milestone: Product Release (PR)**

**Purpose**: Beta testing, production deployment, user training, system tuning, and warranty support.

**Activities**:
- Conduct Beta Testing with real users
- Finalize Product (address beta feedback)
- Deploy to Production
- Conduct User Training
- Tune System (performance optimization)
- Setup Warranty Support

**Outputs**:
- Beta test report with user feedback
- Production deployment report
- Trained users and support staff
- System tuning report with performance metrics
- Warranty support plan

**Decision**: Is the product ready for full release? Approve for production release.

## Six Core Workflows

These workflows run across all phases, with varying emphasis:

1. **Business Modeling**: Understand business context (heavy in Inception)
2. **Requirements**: Capture use cases (heavy in Inception and Elaboration)
3. **Analysis & Design**: Architecture and detailed design (heavy in Elaboration and Construction)
4. **Implementation**: Code the system (heavy in Construction)
5. **Test**: Verify implementation (heavy in Construction and Transition)
6. **Deployment**: Deliver to users (heavy in Transition)

## RUP Iteration Planning

RUP is **risk-driven**: iterations address the highest risks first.

- **Inception**: 1-2 iterations (quick feasibility check)
- **Elaboration**: 2-3 iterations (establish architecture, mitigate risks)
- **Construction**: 3-5+ iterations (bulk of implementation)
- **Transition**: 1-2 iterations (deployment and stabilization)

Each iteration is a mini-project with its own plan, implementation, and review.

## Use-Case Driven Development

**Use cases are the foundation of RUP**:

1. **Capture requirements as use cases**: Actors interact with system to achieve goals
2. **Drive architecture**: Architecturally significant use cases shape the architecture
3. **Drive iteration planning**: Use cases assigned to iterations based on priority and risk
4. **Drive testing**: Test cases derive from use case scenarios
5. **Drive documentation**: User documentation organized around use cases

**Use Case Levels**:
- **Inception**: Brief descriptions (name, actors, brief description)
- **Elaboration**: Detailed specifications (main flow, alternate flows, exceptions)
- **Construction**: Use case realizations (design and implementation details)

## Architecture-Centric Approach

RUP emphasizes establishing a **solid architecture baseline** early:

1. **Elaboration Phase**: Define architecture baseline
2. **Executable Prototype**: Build working architecture prototype to validate design
3. **Four+1 Views**:
   - **Logical View**: Key abstractions (classes, packages)
   - **Process View**: Concurrency and synchronization
   - **Deployment View**: System topology and distribution
   - **Implementation View**: Code organization (layers, components)
   - **(+1) Use Case View**: Scenarios that tie views together

4. **Patterns and Frameworks**: Document design patterns and frameworks used

## Risk-Driven Iteration

**RUP is risk-driven**, not requirements-driven or schedule-driven:

1. **Assess Risks**: Identify technical, schedule, business, and organizational risks
2. **Prioritize by Exposure**: Risk Exposure = Probability × Impact
3. **Address High Risks First**: Elaboration focuses on mitigating highest risks
4. **Iterate Until Risks Manageable**: Continue iterations until risks are under control
5. **Plan Iterations Around Risks**: Assign high-risk use cases to early iterations

## Integration with Other Methodologies

RUP can be composed with other methodologies:

- **Use Cases from Impact Mapping or JTBD**: Use impact mapping to discover use cases
- **DDD for Architecture**: Apply Domain-Driven Design during Elaboration phase
- **TDD/ATDD within Iterations**: Use test-driven development within Construction iterations
- **BDD for Use Case Scenarios**: Use Gherkin scenarios for use case specifications
- **Agile Practices**: RUP iterations can use Scrum-like ceremonies (standups, retrospectives)

## When to Use RUP

**Best for**:
- Large, complex projects (6+ months)
- Projects where requirements are somewhat stable but not fully known upfront
- Projects with high technical risk requiring architecture validation
- Organizations wanting iterative development with more structure than Agile
- Regulated industries needing documentation (FDA, aerospace, defense)
- Projects where architecture must be solid before heavy implementation

**Not ideal for**:
- Very small projects (< 3 months)
- Projects with rapidly changing requirements (consider Scrum instead)
- Projects needing immediate delivery (RUP has longer setup with Inception/Elaboration)
- Teams without experience in iterative, architecture-centric development

## Comparison with Other Methodologies

| Aspect | RUP | Waterfall | Scrum | XP |
|--------|-----|-----------|-------|-----|
| **Approach** | Iterative, phase-based | Sequential | Iterative, time-boxed | Iterative, practice-based |
| **Requirements** | Use-case driven | Fixed upfront | Evolving backlog | Stories, continuous |
| **Architecture** | Architecture-centric | Designed upfront | Emergent | Emergent |
| **Risk Management** | Risk-driven | Phase gates | Sprint-based | Continuous refactoring |
| **Documentation** | Comprehensive | Heavy | Lightweight | Minimal |
| **Phases** | 4 phases with iterations | 6 sequential phases | Continuous sprints | Continuous iterations |
| **Best for** | Large, complex projects | Stable requirements | Flexible requirements | Rapid change, XP practices |

## Usage

```javascript
import { process } from './methodologies/rup/rup.js';

const inputs = {
  projectName: 'Enterprise CRM System',
  projectVision: 'Modern CRM system to manage customer relationships, sales pipeline, and support tickets with advanced analytics and mobile access',
  iterationsPerPhase: {
    inception: 1,      // Quick feasibility
    elaboration: 2,    // Architecture and risk mitigation
    construction: 4,   // Bulk implementation
    transition: 1      // Deployment and training
  },
  teamSize: 12,
  useCaseSource: 'stakeholder-workshops',
  architectureStyle: 'layered'
};

const result = await process(inputs, ctx);
```

## Inputs

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Name of the project/system |
| `projectVision` | string | Yes | - | High-level vision and goals |
| `iterationsPerPhase` | object | No | `{inception:1, elaboration:2, construction:4, transition:1}` | Number of iterations per phase |
| `teamSize` | number | No | 10 | Development team size |
| `useCaseSource` | string | No | 'stakeholder-workshops' | Source for use cases |
| `architectureStyle` | string | No | 'layered' | Preferred architecture style |
| `predefinedUseCases` | array | No | null | Pre-defined use cases (optional) |
| `predefinedRisks` | array | No | null | Pre-defined risks (optional) |

## Outputs

```javascript
{
  success: true,
  projectName: 'Enterprise CRM System',
  projectVision: '...',
  phases: {
    inception: {
      visionDocument: { ... },
      businessCase: { roi: 2.5, paybackPeriod: '18 months' },
      useCaseModel: { totalUseCases: 42 },
      riskAssessment: { highRisks: 5, mediumRisks: 12 },
      projectPlan: { totalIterations: 8 }
    },
    elaboration: {
      detailedUseCases: { totalDetailedUseCases: 42, totalScenarios: 128 },
      architecture: { components: [...], architectureStyle: 'layered' },
      prototype: { validatedScenarios: 15 },
      riskMitigation: { mitigatedRisks: 5 },
      refinedPlan: { ... }
    },
    construction: {
      iterations: [...],
      implementation: { modules: 48, linesOfCode: 125000 },
      integration: { testsPassed: 980, totalTests: 1000 },
      documentation: { userGuides: 12 }
    },
    transition: {
      betaTesting: { betaUsers: 25, defectsFixed: 18 },
      deployment: { status: 'deployed', productionUrl: '...' },
      training: { usersTrained: 150 },
      tuning: { performanceImprovements: {...} },
      warranty: { warrantyPeriod: '12 months' }
    }
  },
  useCaseModel: { ... },
  architecture: { ... },
  projectMetrics: {
    totalIterations: 8,
    totalUseCases: 42,
    totalModules: 48,
    totalLinesOfCode: 125000,
    testPassRate: '98.0%',
    betaUsers: 25,
    usersTrained: 150
  },
  artifacts: {
    inception: 'artifacts/rup/phase-1-inception/',
    elaboration: 'artifacts/rup/phase-2-elaboration/',
    construction: 'artifacts/rup/phase-3-construction/',
    transition: 'artifacts/rup/phase-4-transition/'
  }
}
```

## Artifacts Generated

### Phase 1: Inception
- `vision-document.md`: Project vision, scope, stakeholders, success criteria
- `business-case.md`: Economic justification, ROI, NPV, payback period
- `use-case-model.md`: Initial use case model with actors and brief descriptions
- `use-case-diagram.md`: Visual representation of actors and use cases
- `risk-list.md`: Identified risks with assessments and mitigation strategies
- `project-plan.md`: Initial project plan with phases, iterations, and milestones

### Phase 2: Elaboration
- `detailed-use-cases.md`: Full use case specifications with flows and scenarios
- `use-case-realizations.md`: Design-level view of use case implementations
- `architecture-baseline.md`: Architecture baseline document
- `architecture-views.md`: Four+1 architectural views
- `architecture-prototype.md`: Executable prototype description
- `prototype-validation.md`: Validation results for key scenarios
- `risk-mitigation.md`: Risk mitigation actions and results
- `refined-project-plan.md`: Updated project plan for Construction

### Phase 3: Construction
For each iteration:
- `iteration-{N}/plan.md`: Iteration plan with goals and tasks
- `iteration-{N}/implementation-report.md`: Implementation progress and results
- `iteration-{N}/integration-test-report.md`: Integration test results
- `iteration-{N}/user-documentation.md`: User guides and tutorials
- `iteration-{N}/review.md`: Iteration review and lessons learned

### Phase 4: Transition
- `beta-test-report.md`: Beta testing results and user feedback
- `beta-feedback.json`: Structured beta user feedback data
- `finalization-report.md`: Final product changes before production
- `deployment-report.md`: Production deployment details
- `training-report.md`: User training results
- `training-materials.md`: Training curriculum and materials
- `system-tuning.md`: Performance tuning activities and results
- `warranty-plan.md`: Warranty support plan
- `support-procedures.md`: Ongoing support procedures

### Project-Level
- `project-summary.md`: Overall project summary and outcomes
- `project-metrics.json`: Comprehensive project metrics
- `lessons-learned.md`: Lessons learned across all phases
- `final-documentation-index.md`: Index of all project documentation

## Best Practices

1. **Start with Clear Vision**: Ensure vision document has stakeholder buy-in
2. **Risk-Driven Planning**: Address highest risks in Elaboration, not Construction
3. **Architecture First**: Don't skip Elaboration - establish architecture before heavy coding
4. **Validate with Prototype**: Build executable prototype in Elaboration to validate architecture
5. **Detailed Use Cases**: Invest time in Elaboration to detail use cases thoroughly
6. **Incremental Builds**: Construction iterations should produce working increments
7. **Early Beta Testing**: Get beta users involved early in Transition
8. **Continuous Risk Management**: Update risk list throughout all phases
9. **Stakeholder Involvement**: Involve stakeholders at phase milestones for approval
10. **Documentation Balance**: Document architecture and use cases well, but avoid over-documentation

## Common Pitfalls

1. **Skipping Elaboration**: Going straight from Inception to Construction without establishing architecture (leads to rework)
2. **Waterfall-like RUP**: Treating phases as sequential waterfall phases instead of iterative
3. **Over-documentation**: Creating too much documentation that doesn't add value
4. **Ignoring Risks**: Not addressing high-priority risks in Elaboration phase
5. **Weak Architecture**: Not investing enough in architecture baseline
6. **Scope Creep**: Allowing scope changes without going through iteration planning
7. **Skipping Phase Milestones**: Not getting stakeholder approval at phase boundaries
8. **Throwaway Prototype**: Building prototype in Elaboration and discarding it (should be evolutionary)

## References

- [RUP on Wikipedia](https://en.wikipedia.org/wiki/Rational_unified_process)
- [GeeksforGeeks: RUP Phases](https://www.geeksforgeeks.org/software-engineering/rup-and-its-phases/)
- [ToolsHero: RUP Method](https://www.toolshero.com/information-technology/rational-unified-process-rup/)
- Rational Unified Process: An Introduction (3rd Edition) by Philippe Kruchten
- The Rational Unified Process Made Easy by Per Kroll and Philippe Kruchten

## License

Part of the Babysitter SDK orchestration framework.
