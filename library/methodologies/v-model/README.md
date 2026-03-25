# V-Model Methodology

**Creator**: Evolved from waterfall in the 1980s
**Year**: Classic verification/validation
**Category**: Verification & Validation / Testing
**Process ID**: `methodologies/v-model`

## Overview

The V-Model is an SDLC model where execution happens in a sequential V-shape. It's also known as the Verification and Validation model. The left side of the "V" represents decomposition of requirements and system specifications, while the right side represents integration and validation. Each development phase has a corresponding testing phase designed in parallel.

This methodology is particularly well-suited for:
- Safety-critical systems (aerospace, automotive, medical devices)
- Regulated industries requiring compliance documentation
- Projects requiring rigorous testing and traceability
- Systems where failures have high consequences

## Key Principles

1. **Verification and Validation**
   - **Verification**: "Are you building it right?" (process correctness)
   - **Validation**: "Are you building the right thing?" (product correctness)

2. **Testing Parallel to Development**: Test design happens during corresponding development phase

3. **V-Shape Mapping**: Each development phase maps to a testing phase
   - Requirements Analysis ↔ Acceptance Testing
   - System Design ↔ System Testing
   - Architectural Design ↔ Integration Testing
   - Module Design ↔ Unit Testing

4. **Early Test Planning**: Test cases designed before code is written

5. **High Discipline**: Rigorous documentation and phase completion criteria

6. **Traceability**: Complete bidirectional traceability from requirements to tests

## The V-Model Structure

```
LEFT SIDE                          RIGHT SIDE
(Decomposition)                    (Integration/Validation)

Requirements ───────────────────→ Acceptance
Analysis                          Testing
    ↓                                 ↑
System      ───────────────────→ System
Design                            Testing
    ↓                                 ↑
Architectural ─────────────────→ Integration
Design                            Testing
    ↓                                 ↑
Module      ───────────────────→ Unit
Design                            Testing
    ↓                                 ↑
         Implementation
         (Coding Phase)
```

## Process Flow

### Left Side: Decomposition & Test Design

#### 1. Requirements Analysis + Acceptance Test Design
- Gather and document functional requirements
- Identify non-functional requirements
- Define acceptance criteria
- Design acceptance test cases in parallel
- Create requirements-to-test traceability

**Outputs**:
- Requirements Specification
- Acceptance Test Plan
- Traceability seed

#### 2. System Design + System Test Design
- Define system architecture and components
- Specify interfaces and data flows
- Select technology stack
- Design system test cases in parallel
- Map design elements to tests

**Outputs**:
- System Design Document
- System Test Plan
- Architecture diagrams

#### 3. Architectural Design + Integration Test Design
- Break components into modules
- Define module interfaces
- Specify communication protocols
- Design integration test cases in parallel
- Create interface test specifications

**Outputs**:
- Architectural Design Document
- Integration Test Plan
- Module interface specifications

#### 4. Module Design + Unit Test Design
- Design classes, functions, and algorithms
- Specify internal data structures
- Define error handling strategies
- Design unit test cases in parallel
- Create detailed code specifications

**Outputs**:
- Module Design Specifications
- Unit Test Plans
- Code-level specifications

### Bottom: Implementation

#### 5. Implementation (Coding)
- Implement modules per design specifications
- Conduct code reviews
- Perform static analysis
- Ensure coding standards compliance
- Prepare for testing

**Outputs**:
- Source code
- Code review reports
- Static analysis results

### Right Side: Integration & Validation

#### 6. Unit Testing
- Test individual functions and classes
- Validate module design correctness
- Achieve target code coverage
- Fix defects and retest

**Validates**: Module Design

#### 7. Integration Testing
- Test module interactions
- Validate interface contracts
- Verify data flows
- Test error handling across boundaries

**Validates**: Architectural Design

#### 8. System Testing
- Test end-to-end system functionality
- Validate system-level requirements
- Test non-functional requirements
- Verify system integration

**Validates**: System Design

#### 9. Acceptance Testing
- Validate all requirements are met
- Conduct user acceptance testing
- Verify business objectives achieved
- Obtain customer sign-off

**Validates**: Requirements Analysis

### Final Phase: Traceability Matrix

#### 10. Traceability Matrix Generation
- Map requirements through design to implementation to tests
- Perform coverage analysis
- Identify gaps
- Generate compliance reports
- Document complete traceability

**Outputs**:
- Traceability Matrix
- Coverage Reports
- Compliance Documentation

## Usage

### Basic Example

```javascript
import { process } from './v-model.js';

const result = await process({
  projectRequirements: `
    Build a patient monitoring system that:
    - Monitors vital signs (heart rate, blood pressure, temperature)
    - Alerts medical staff when values exceed thresholds
    - Records all measurements with timestamps
    - Provides real-time dashboard
  `,
  safetyLevel: 'critical',
  traceabilityRequired: true,
  testingRigor: 'exhaustive'
}, ctx);

console.log(`Success: ${result.success}`);
console.log(`Requirements: ${result.requirements.total}`);
console.log(`Modules: ${result.moduleDesign.moduleCount}`);
console.log(`All Tests Passed: ${result.testResults.allPassed}`);
console.log(`Requirements Coverage: ${result.traceabilityMatrix.requirementsCoverage}%`);
```

### With Compliance Standards

```javascript
const result = await process({
  projectRequirements: `
    Automotive braking system controller:
    - Anti-lock braking system (ABS)
    - Electronic stability control (ESC)
    - Brake force distribution
    - Emergency brake assist
  `,
  safetyLevel: 'critical',
  traceabilityRequired: true,
  testingRigor: 'exhaustive',
  complianceStandards: ['ISO 26262', 'MISRA C'],
  existingArtifacts: {
    sensors: ['wheel_speed_sensor', 'brake_pressure_sensor'],
    actuators: ['brake_actuator']
  }
}, ctx);
```

### Standard Software Project

```javascript
const result = await process({
  projectRequirements: `
    E-commerce checkout system:
    - Shopping cart management
    - Payment processing
    - Order confirmation
    - Email notifications
  `,
  safetyLevel: 'standard',
  traceabilityRequired: true,
  testingRigor: 'thorough'
}, ctx);
```

### Inputs

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `projectRequirements` | string | ✅ Yes | - | Project requirements document or description |
| `safetyLevel` | string | No | 'standard' | Safety criticality: 'standard', 'high', or 'critical' |
| `traceabilityRequired` | boolean | No | true | Generate full traceability matrix |
| `testingRigor` | string | No | 'thorough' | Testing thoroughness: 'basic', 'thorough', or 'exhaustive' |
| `existingArtifacts` | object | No | null | Existing design or code to integrate |
| `complianceStandards` | array | No | [] | Standards to comply with (ISO 26262, DO-178C, etc.) |

### Outputs

```javascript
{
  success: true,
  durationMinutes: 180,
  safetyLevel: 'critical',
  testingRigor: 'exhaustive',
  requirements: {
    total: 25,
    functional: 18,
    nonFunctional: 7,
    details: { functionalRequirements: [...], nonFunctionalRequirements: [...] }
  },
  systemDesign: {
    componentCount: 5,
    interfaceCount: 8,
    details: { components: [...], interfaces: [...], dataFlows: [...] }
  },
  architecture: {
    moduleCount: 12,
    interfaceCount: 15,
    dataFlowCount: 20,
    details: { modules: [...], interfaces: [...], dataFlows: [...] }
  },
  moduleDesign: {
    moduleCount: 12,
    details: [...]
  },
  implementation: {
    modulesImplemented: 12,
    filesCreated: 45,
    codeReviewsPassed: true,
    staticAnalysisPassed: true,
    details: { modules: [...], codeReviewDetails: [...], staticAnalysisResults: {...} }
  },
  testResults: {
    unitTests: { totalCount: 150, passedCount: 150, passed: true, coverage: 95 },
    integrationTests: { totalCount: 45, passedCount: 45, passed: true },
    systemTests: { totalCount: 30, passedCount: 30, passed: true },
    acceptanceTests: { totalCount: 25, passedCount: 25, passed: true },
    allPassed: true,
    summary: { totalTests: 250, totalPassed: 250, allTestsPassed: true }
  },
  traceabilityMatrix: {
    requirementsCoverage: 100,
    designCoverage: 100,
    testCoverage: 95,
    implementationCoverage: 100,
    gaps: [],
    complianceStatus: 'compliant',
    requirementTraces: [...]
  },
  artifacts: {
    requirements: 'artifacts/v-model/requirements-specification.md',
    acceptanceTestPlan: 'artifacts/v-model/acceptance-test-plan.md',
    systemDesign: 'artifacts/v-model/system-design.md',
    // ... more artifacts
  }
}
```

## Safety Levels

### Standard
- Regular software projects
- Standard testing practices
- Basic traceability
- Code reviews and static analysis

### High
- Business-critical applications
- Enhanced testing rigor
- Detailed traceability
- Multiple code review rounds
- Comprehensive static analysis

### Critical
- Safety-critical systems (medical, automotive, aerospace)
- Exhaustive testing at all levels
- Complete bidirectional traceability
- Formal code reviews and inspections
- Advanced static analysis and verification
- Compliance documentation
- Independent verification and validation (IV&V)

## Testing Rigor Levels

### Basic
- Core functionality testing
- Happy path scenarios
- Basic edge case coverage
- Minimum acceptable coverage

### Thorough (Default)
- Comprehensive functionality testing
- Happy path + edge cases
- Error handling validation
- Good coverage (80%+)
- Integration and system testing

### Exhaustive
- All possible scenarios
- Boundary value analysis
- Equivalence partitioning
- Statement and branch coverage (95%+)
- Mutation testing
- Security and performance testing

## Breakpoints

The V-Model process includes breakpoints for human review at critical phases:

1. **Requirements & Acceptance Test Design Review**: Review requirements and acceptance test plan before system design
2. **System Design & Test Review**: Review system architecture and system test plan
3. **Architecture & Integration Test Review**: Review detailed architecture and integration test plan
4. **Module Design & Unit Test Review**: Review module specifications and unit test plans
5. **Implementation Review**: Review code, code reviews, and static analysis before testing
6. **Test Results Review**: Review all test results before traceability generation
7. **Traceability Matrix Review**: Final review of complete traceability and coverage

## Integration Points

### Compatible Methodologies

1. **TDD/ATDD**
   - V-Model provides the test design framework
   - TDD/ATDD provides the test implementation approach
   - Unit and acceptance test designs from V-Model feed into TDD cycles

2. **BDD/Specification by Example**
   - Requirements phase can use Example Mapping
   - Acceptance tests can be written in Gherkin
   - Combine V-Model structure with BDD collaboration

3. **Domain-Driven Design**
   - Use DDD for system and architectural design phases
   - Bounded contexts map to system components
   - Ubiquitous language in requirements

4. **Waterfall**
   - V-Model is essentially waterfall with parallel test design
   - Use for sequential, phase-gated projects
   - Enhanced with verification and validation

5. **Agile (Adapted)**
   - Apply V-Model within sprints for feature development
   - Maintain traceability in agile context
   - Use for regulated agile projects

## When to Use V-Model

### Ideal For

✅ Safety-critical systems requiring validation
✅ Regulated industries (medical, aerospace, automotive)
✅ Projects requiring complete traceability
✅ Fixed requirements with low change likelihood
✅ Projects with clear scope and specifications
✅ Compliance-driven development
✅ Systems where testing costs are lower than failure costs

### Not Ideal For

❌ Rapidly changing requirements
❌ Early-stage startups with uncertain product direction
❌ Highly innovative projects requiring experimentation
❌ Projects with tight time-to-market constraints
❌ Small projects where V-Model overhead isn't justified

## Advantages

- ✅ Early test planning reduces defects
- ✅ Complete traceability ensures nothing is missed
- ✅ Clear phase boundaries and deliverables
- ✅ Excellent for compliance and auditing
- ✅ Defects caught early through parallel test design
- ✅ High quality through rigorous verification and validation
- ✅ Well-documented process

## Disadvantages

- ❌ Rigid and inflexible to changes
- ❌ High overhead and documentation burden
- ❌ Long time before working software
- ❌ Testing happens late (despite test design being early)
- ❌ Difficult to handle unclear or evolving requirements
- ❌ Not suitable for small or agile projects

## Best Practices

### Do's
- ✅ Design tests in parallel with development phases
- ✅ Maintain bidirectional traceability throughout
- ✅ Conduct thorough reviews at each phase gate
- ✅ Use formal inspection techniques for critical systems
- ✅ Document everything comprehensively
- ✅ Involve test engineers from requirements phase
- ✅ Use automated traceability tools

### Don'ts
- ❌ Don't skip test design phases
- ❌ Don't allow requirements changes without impact analysis
- ❌ Don't proceed to next phase with unresolved issues
- ❌ Don't skip traceability updates
- ❌ Don't compromise on testing rigor for schedule pressure
- ❌ Don't forget backward traceability (tests → requirements)

## Example Artifacts

### Requirements Specification
```markdown
# Requirements Specification

## Functional Requirements

### FR-001: User Authentication
**Priority**: Critical
**Description**: System shall authenticate users via username and password
**Acceptance Criteria**:
- Valid credentials grant access
- Invalid credentials are rejected with error message
- Account locks after 3 failed attempts

**Traceability**:
- Acceptance Tests: AT-001, AT-002, AT-003
- System Design: Component-Auth
```

### Traceability Matrix
```markdown
# Traceability Matrix

| Req ID | System Design | Architecture | Implementation | Unit Tests | Integration Tests | System Tests | Acceptance Tests | Status |
|--------|--------------|--------------|----------------|-----------|------------------|-------------|-----------------|--------|
| FR-001 | Comp-Auth | Mod-Login | auth/login.js | UT-001, UT-002 | IT-005 | ST-010 | AT-001 | ✅ Complete |
| FR-002 | Comp-Auth | Mod-Session | auth/session.js | UT-003, UT-004 | IT-006 | ST-011 | AT-002 | ✅ Complete |
```

## Compliance Standards Support

The V-Model implementation supports various compliance standards:

### ISO 26262 (Automotive)
- ASIL-level safety requirements
- Hardware-software interface specifications
- Safety validation testing
- Complete traceability documentation

### DO-178C (Aviation)
- Software level determination
- Requirements-based testing
- Structural coverage analysis
- Verification and validation activities

### IEC 62304 (Medical Devices)
- Software safety classification
- Risk management integration
- Verification and validation documentation
- Traceability matrix

### MISRA (Automotive/Embedded)
- Coding standards compliance
- Static analysis integration
- Code review requirements

## References

### Original Sources
- [V-Model on Wikipedia](https://en.wikipedia.org/wiki/V-model)
- [SDLC V-Model Tutorial](https://www.tutorialspoint.com/sdlc/sdlc_v_model.htm)
- [TeachingAgile: V-Model](https://teachingagile.com/sdlc/models/v-model/)

### Standards and Compliance
- [ISO 26262 Road Vehicles Functional Safety](https://www.iso.org/standard/68383.html)
- [DO-178C Software Considerations in Airborne Systems](https://www.rtca.org/content/publications)
- [IEC 62304 Medical Device Software](https://www.iso.org/standard/38421.html)

### Related Reading
- "Software Testing" by Ron Patton
- "Systems Engineering Fundamentals" by Defense Acquisition University
- "Verification and Validation in Scientific Computing" by Oberkampf & Roy

## License

This methodology implementation is part of the Babysitter SDK orchestration framework.

The V-Model is a public domain software development process model.
