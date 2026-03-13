# Waterfall Methodology

> Sequential SDLC methodology with distinct phases: Requirements → Design → Implementation → Testing → Deployment → Maintenance

**Creator**: Winston W. Royce (1970)
**Category**: Sequential SDLC
**Process ID**: `methodologies/waterfall`

## Overview

The Waterfall model is a linear and sequential approach to software development where progress flows steadily downward (like a waterfall) through distinct phases. Each phase must be completed and formally approved before the next phase begins.

This implementation provides a complete Waterfall SDLC process for the Babysitter SDK orchestration framework, with:
- Six sequential phases with formal phase gates
- Comprehensive documentation at each stage
- Optional V-Model integration for testing traceability
- Support for regulatory compliance requirements
- Formal approvals and sign-offs throughout

### Key Characteristics

- **Sequential Phases**: No phase overlap - one phase completes before next begins
- **Document-Driven**: Heavy documentation requirements at each phase
- **Phase Gates**: Formal approval required before proceeding to next phase
- **Requirements Fixed Early**: All requirements defined and frozen upfront
- **No Backtracking**: Expensive to return to previous phases
- **Well-Suited For**: Stable requirements, regulatory environments, clear specifications, fixed-price contracts

### Six Sequential Phases

1. **Requirements Gathering** - Comprehensive requirements analysis and documentation (SRS)
2. **System Design** - Architecture and detailed design specifications (SDD)
3. **Implementation** - Sequential module-by-module coding with reviews
4. **Testing** - Integration, system, performance, security, and UAT
5. **Deployment** - Production release with verification and rollback planning
6. **Maintenance** - Support procedures, updates, and end-of-life planning

## Usage

### Basic Usage

```bash
# Using Babysitter SDK CLI
babysitter run:create \
  --process-id methodologies/waterfall \
  --entry plugins/babysitter/skills/babysit/process/methodologies/waterfall/waterfall.js#process \
  --inputs inputs.json \
  --run-id my-waterfall-project

# Orchestrate the run
babysitter run:iterate .a5c/runs/my-waterfall-project
```

### Input Schema

**Required Fields**:
- `projectName` (string): Name of the project/system
- `projectDescription` (string): High-level description of what needs to be built

**Optional Fields**:
- `stakeholders` (array): List of project stakeholders with roles
- `requirementsSource` (string): Source of requirements (default: "stakeholder-interviews")
- `testingStrategy` (string): Testing approach (default: "comprehensive")
- `deploymentTarget` (string): Target deployment environment (default: "production")
- `includeVModel` (boolean): Use V-Model for testing traceability (default: true)
- `regulatoryCompliance` (string): Compliance requirements (e.g., "FDA", "ISO-9001", "HIPAA")

### Input Example

```json
{
  "projectName": "Enterprise Customer Management System",
  "projectDescription": "Comprehensive system for managing customer relationships, orders, and support tickets with reporting capabilities",
  "stakeholders": [
    { "name": "John Smith", "role": "Product Owner", "department": "Business" },
    { "name": "Jane Doe", "role": "Technical Lead", "department": "Engineering" },
    { "name": "Mike Johnson", "role": "QA Manager", "department": "Quality" }
  ],
  "requirementsSource": "stakeholder-interviews",
  "testingStrategy": "comprehensive",
  "deploymentTarget": "production",
  "includeVModel": true,
  "regulatoryCompliance": "ISO-9001"
}
```

### Output Schema

The process returns:

```json
{
  "success": true,
  "projectName": "string",
  "phase1Requirements": { /* Full requirements data */ },
  "phase2Design": { /* Complete design artifacts */ },
  "phase3Implementation": { /* Implementation details */ },
  "phase4Testing": { /* All test results */ },
  "phase5Deployment": { /* Deployment status */ },
  "phase6Maintenance": { /* Maintenance plan */ },
  "projectMetrics": { /* Comprehensive metrics */ },
  "summary": {
    "phasesCompleted": 6,
    "totalRequirements": 150,
    "componentsDesigned": 25,
    "modulesImplemented": 80,
    "linesOfCode": 45000,
    "totalTestsExecuted": 1500,
    "testPassRate": "98.5%",
    "deploymentStatus": "deployed",
    "productionReady": true,
    "maintenancePlanActive": true
  },
  "artifacts": { /* All artifact paths */ }
}
```

## Phase Details

### Phase 1: Requirements Gathering and Analysis

**Deliverables**:
- Software Requirements Specification (SRS)
- Functional requirements list
- Non-functional requirements list
- Use case diagrams and descriptions
- Requirements traceability matrix
- Stakeholder sign-offs

**Phase Gate**: Requirements Review and Approval
- All stakeholders review and approve SRS
- Requirements are complete, unambiguous, and verifiable
- Scope boundaries are clearly defined

### Phase 2: System and Software Design

**Deliverables**:
- Software Design Document (SDD)
- High-level architecture diagram
- Component design specifications
- Database schema with ER diagrams
- Interface specifications (APIs, UI)
- Security architecture
- Technology stack definition

**Phase Gate**: Design Review and Approval
- Technical leads review and approve design
- Design fully addresses all requirements
- Feasibility confirmed

### Phase 3: Implementation (Coding)

**Deliverables**:
- Implemented code for all modules
- Unit tests for each module
- Code review reports
- Implementation documentation
- Code metrics report

**Phase Gate**: Code Review and Unit Test Approval
- All code reviewed and approved
- Unit tests passing with adequate coverage
- Code meets coding standards

### Phase 4: Testing Phase

**Deliverables**:
- Master test plan
- Integration test report
- System test report
- Performance test report
- Security test report
- UAT report with sign-offs
- Defect logs

**Phase Gate**: Testing Sign-off
- All critical defects resolved
- Test pass rates meet targets
- UAT approved by stakeholders
- System ready for production

### Phase 5: Deployment

**Deliverables**:
- Deployment plan
- Deployment execution report
- Post-deployment verification results
- Rollback plan
- Release notes
- Production environment documentation

**Phase Gate**: Production Release Approval
- Deployment successful
- Verification tests passing
- System operational in production
- Rollback tested and ready

### Phase 6: Maintenance Planning

**Deliverables**:
- Maintenance plan
- Support procedures with SLA
- Bug tracking process
- Update/patch management procedures
- Training materials
- Backup and recovery procedures
- End-of-life plan

**Phase Gate**: Maintenance Plan Approval & Project Closure
- Support procedures in place
- Training completed
- Handoff to maintenance team complete

## V-Model Integration

When `includeVModel: true`, the process implements V-Model testing traceability:

```
Requirements ←→ User Acceptance Testing (UAT)
Design       ←→ System Testing
Architecture ←→ Integration Testing
Modules      ←→ Unit Testing
```

Each test level validates its corresponding development level, ensuring complete traceability from requirements to tests.

## Best Practices

### When to Use Waterfall

**Good Fit**:
- Requirements are clear, documented, and stable
- Technology is well-understood and mature
- Project has fixed scope and budget
- Regulatory compliance requires extensive documentation
- Large, complex systems with many dependencies
- Long-term projects (6+ months)

**Poor Fit**:
- Requirements are unclear or likely to change
- Rapid prototyping or MVP needed
- Innovative or experimental projects
- Small projects with tight timelines
- User feedback needed during development

### Success Factors

1. **Complete Requirements**: Invest heavily in Phase 1 to get requirements right
2. **Stakeholder Engagement**: Maintain stakeholder involvement throughout, especially at phase gates
3. **Documentation**: Keep all documentation up-to-date and accessible
4. **Phase Gate Discipline**: Don't skip or rush phase gate approvals
5. **Risk Management**: Identify and mitigate risks early, especially in design
6. **Quality Focus**: Address quality issues in each phase, don't defer to later
7. **Communication**: Maintain clear communication channels across all teams

### Common Pitfalls

- **Insufficient Requirements**: Rushing Phase 1 leads to costly changes later
- **Phase Overlap**: Allowing phases to overlap defeats the waterfall structure
- **Late Testing**: Waiting until Phase 4 to find defects is expensive
- **Scope Creep**: Changes after Phase 1 approval are extremely costly
- **Lack of Stakeholder Buy-in**: Missing sign-offs causes issues later
- **Over-documentation**: Balance documentation with actual value

## Integration with Other Methodologies

The Waterfall process can be composed with other methodologies:

### Waterfall + Domain-Driven Design (DDD)

Use DDD practices during the design phase for complex domain modeling:

```javascript
// Phase 2 can delegate to DDD process
const designResult = await ctx.task(dddDesignTask, {
  requirements: requirementsResult,
  bounded contexts: true
});
```

### Waterfall + V-Model

Enable comprehensive test planning aligned with development phases:

```json
{
  "includeVModel": true
}
```

### Waterfall within Agile Portfolio

Use Waterfall for specific regulatory or infrastructure projects within an otherwise agile portfolio.

## Artifacts Generated

All artifacts are organized under `artifacts/waterfall/`:

```
artifacts/waterfall/
├── phase-1-requirements/
│   ├── srs.md                      # Software Requirements Specification
│   ├── requirements.json           # Structured requirements data
│   ├── use-cases.md               # Use case documentation
│   ├── traceability-matrix.md     # Requirements traceability
│   └── stakeholder-signoffs.md    # Sign-off documentation
├── phase-2-design/
│   ├── sdd.md                     # Software Design Document
│   ├── architecture-diagram.md    # Architecture visualization
│   ├── database-schema.md         # Database design
│   ├── component-diagram.md       # Component breakdown
│   ├── interface-specifications.json
│   └── data-flow-diagrams.md
├── phase-3-implementation/
│   ├── implementation-report.md
│   ├── modules.json
│   ├── code-review-summary.md
│   ├── unit-test-report.md
│   └── code-metrics.json
├── phase-4-testing/
│   ├── test-plan.md
│   ├── integration-test-report.md
│   ├── system-test-report.md
│   ├── performance-test-report.md
│   ├── security-test-report.md
│   ├── uat-report.md
│   ├── defect-log.json
│   └── requirements-coverage.md
├── phase-5-deployment/
│   ├── deployment-plan.md
│   ├── deployment-report.md
│   ├── verification-results.md
│   ├── rollback-plan.md
│   ├── release-notes.md
│   └── environment-configuration.json
├── phase-6-maintenance/
│   ├── maintenance-plan.md
│   ├── support-procedures.md
│   ├── sla.md
│   ├── bug-tracking-workflow.md
│   ├── training-materials.md
│   ├── backup-recovery-procedures.md
│   └── eol-plan.md
├── project-summary.md
├── project-metrics.json
├── lessons-learned.md
└── final-documentation-index.md
```

## Examples

See the `examples/` directory for complete input samples:
- `enterprise-system.json` - Large enterprise application
- `medical-device-software.json` - FDA-regulated medical software
- `financial-system.json` - Banking system with compliance
- `government-project.json` - Government contract project
- `infrastructure-upgrade.json` - Infrastructure modernization
- `data-migration-project.json` - Legacy system migration

## Regulatory Compliance

The Waterfall methodology is particularly well-suited for regulated industries:

### FDA (Medical Devices)
- Complete requirements traceability
- Design verification and validation
- Comprehensive test documentation
- Change control procedures

### ISO 9001
- Quality management system requirements
- Document control
- Management review
- Continuous improvement

### HIPAA (Healthcare)
- Security requirements in design
- Access control implementation
- Audit trail requirements
- Privacy by design

Set `regulatoryCompliance` to enable compliance-specific documentation.

## Comparison with Agile

| Aspect | Waterfall | Agile |
|--------|-----------|-------|
| **Requirements** | All defined upfront | Evolve over time |
| **Flexibility** | Low - changes expensive | High - change expected |
| **Documentation** | Extensive | Lightweight |
| **Feedback** | End of project | Every iteration |
| **Risk** | High upfront | Distributed |
| **Best For** | Stable requirements | Evolving requirements |
| **Timeline** | Months to years | Weeks to months |

## References

### Original Paper
- Winston W. Royce (1970). "Managing the Development of Large Software Systems"

### Standards
- IEEE 12207: Software Life Cycle Processes
- IEEE 1016: Software Design Descriptions
- IEEE 829: Software Test Documentation
- ISO/IEC 12207: Systems and software engineering

### Books
- "Software Engineering: A Practitioner's Approach" by Roger Pressman
- "Software Engineering" by Ian Sommerville
- "Managing the Software Process" by Watts Humphrey

### Online Resources
- [Waterfall Model - Wikipedia](https://en.wikipedia.org/wiki/Waterfall_model)
- [SDLC Waterfall Model - TutorialsPoint](https://www.tutorialspoint.com/sdlc/sdlc_waterfall_model.htm)
- [Waterfall Methodology - GeeksforGeeks](https://www.geeksforgeeks.org/software-engineering-waterfall-model/)

## License

Part of the Babysitter SDK orchestration framework.

## Support

For issues or questions:
- GitHub Issues: [babysitter repository]
- Documentation: See SDK documentation
- Examples: Check the `examples/` directory
