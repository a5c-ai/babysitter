# Spiral Model

**Creator**: Barry Boehm (1986)
**Category**: Risk-Driven Iterative Development
**Best For**: Large, complex, high-risk projects with evolving requirements

## Overview

The Spiral Model is a risk-driven software development process model that combines elements of both iterative development and systematic aspects of the waterfall model. Development progresses through multiple spirals (iterations), with each spiral representing a complete development cycle containing four distinct phases.

The model's unique characteristic is its emphasis on risk analysis and reduction through prototyping at each iteration. The spiral metaphor represents two dimensions:
- **Radial dimension**: Cumulative cost (increases as you move outward)
- **Angular dimension**: Progress through phases (each complete rotation = one spiral)

## Four Phases Per Spiral

Each spiral iteration progresses through four quadrants:

### 1. Planning Phase
- **Objective**: Determine objectives, alternatives, and constraints
- **Activities**:
  - Define specific objectives for this spiral
  - Identify alternative approaches to achieve objectives
  - Evaluate alternatives based on cost, feasibility, and risk
  - Select the most appropriate alternative
  - Document constraints (technical, budget, schedule, regulatory)
  - Estimate resources and costs
- **Deliverables**: Objectives document, alternatives analysis, cost estimates

### 2. Risk Analysis Phase
- **Objective**: Identify and resolve risks through analysis and prototyping
- **Activities**:
  - Identify potential risks (technical, schedule, budget, quality)
  - Assess risk probability and impact
  - Prioritize risks by severity
  - Develop risk mitigation strategies
  - Build prototypes to address high-risk areas
  - Make Go/No-Go decision
- **Deliverables**: Risk register, prototypes, mitigation strategies, Go/No-Go decision

### 3. Engineering Phase
- **Objective**: Develop and test the product
- **Activities**:
  - Design system components
  - Implement selected alternative
  - Build and validate prototypes
  - Develop production code
  - Execute comprehensive testing (unit, integration, system)
  - Integrate with existing system
  - Create iteration deliverable
- **Deliverables**: Working system increment, test results, documentation

### 4. Evaluation Phase
- **Objective**: Customer evaluation and next iteration planning
- **Activities**:
  - Demonstrate deliverables to stakeholders
  - Gather customer feedback
  - Evaluate objective achievement
  - Review risk resolution status
  - Assess convergence criteria
  - Determine if project should continue
  - Plan next spiral or conclude project
- **Deliverables**: Evaluation report, stakeholder feedback, convergence assessment

## When to Use Spiral Model

### Ideal For:
- Large, complex projects (6 months to 2 years)
- High-risk projects with significant uncertainty
- Projects with evolving or unclear requirements
- Systems requiring high reliability and safety
- Projects where early risk identification is critical
- Organizations with mature risk management processes

### Not Ideal For:
- Small, low-risk projects (overhead too high)
- Projects with stable, well-understood requirements
- Projects with tight budget constraints (prototyping is expensive)
- Organizations lacking risk management expertise
- Projects requiring rapid delivery

## Key Advantages

1. **Risk-Driven**: Systematic risk identification and mitigation at each iteration
2. **Flexible**: Can incorporate waterfall, incremental, or evolutionary approaches
3. **Early Risk Detection**: Problems identified and addressed early
4. **Customer Involvement**: Regular evaluation and feedback
5. **Prototyping**: High-risk areas validated through throwaway or evolutionary prototypes
6. **Convergence**: Natural stopping point when risks are resolved
7. **Adaptable**: Can adjust approach based on what's learned

## Key Challenges

1. **Complexity**: Requires sophisticated risk analysis expertise
2. **Cost**: Prototyping and risk analysis add overhead
3. **Management Overhead**: More complex to manage than linear models
4. **Uncertain Timeline**: Number of spirals not always predictable
5. **Documentation**: Risk analysis requires thorough documentation
6. **Go/No-Go Decisions**: Requires courage to terminate if risks are too high

## Process Inputs

```json
{
  "projectName": "string (required)",
  "projectDescription": "string (required)",
  "maxSpirals": "number (default: 6)",
  "convergenceCriteria": "string (default: 'all-risks-resolved')",
  "stakeholders": "array of objects (optional)",
  "riskTolerance": "string: low|medium|high (default: 'medium')",
  "initialRisks": "string (optional)",
  "generateVisualizations": "boolean (default: true)"
}
```

## Process Outputs

```json
{
  "success": true,
  "spirals": [/* Array of spiral results */],
  "spiralCount": 4,
  "converged": true,
  "risks": {
    "totalIdentified": 25,
    "resolved": 23,
    "unresolved": 2
  },
  "prototypes": {
    "total": 8,
    "list": [/* Prototype details */]
  },
  "deliverables": {
    "finalSystem": {/* System state */},
    "components": 15,
    "testsPassed": 342
  },
  "cost": {
    "total": 850000,
    "breakdown": [/* Cost per spiral */]
  },
  "spiralDiagram": {/* SVG visualization */}
}
```

## Usage Example

```javascript
import { process } from './spiral-model.js';

const inputs = {
  projectName: "Enterprise Risk Management System",
  projectDescription: "Complex system for managing enterprise-wide risks with real-time monitoring, predictive analytics, and regulatory compliance.",
  maxSpirals: 6,
  convergenceCriteria: "all-risks-resolved",
  riskTolerance: "medium",
  stakeholders: [
    { name: "Jane Doe", role: "CTO", department: "Technology" },
    { name: "John Smith", role: "Risk Officer", department: "Risk" }
  ],
  generateVisualizations: true
};

const result = await process(inputs, ctx);
```

## Convergence Criteria

The process stops when convergence is achieved. Common criteria:

1. **All Risks Resolved**: All critical and high risks mitigated
2. **Objectives Met**: All primary objectives achieved
3. **Stakeholder Satisfaction**: Customer satisfaction threshold reached
4. **No Critical Issues**: System operational with no blocking issues
5. **Budget Exhausted**: Maximum budget or spirals reached
6. **Time Constraint**: Project deadline approaching

## Visualizations

The process generates:

1. **Spiral Diagram**: Shows radial (cost) and angular (phase) progression through spirals
2. **Risk Heatmap**: Displays risk severity across spirals and categories
3. **Cost Trend**: Cumulative cost growth across spirals
4. **Risk Trend**: Risk identification and resolution over time

## Integration with Other Methodologies

The Spiral Model is highly flexible and can integrate with:

- **Waterfall**: Use waterfall approach within engineering phase
- **ATDD/TDD**: Apply test-driven development during engineering
- **Hypothesis-Driven**: Use hypothesis testing for risk analysis
- **Prototyping**: Core element of risk analysis phase
- **Agile**: Can use agile practices within spirals

## Best Practices

1. **Risk Management**: Invest heavily in risk identification and analysis
2. **Prototyping Strategy**: Use throwaway prototypes for validation, evolutionary for low-risk features
3. **Stakeholder Engagement**: Involve customers at every evaluation phase
4. **Go/No-Go Discipline**: Be willing to terminate if risks are unacceptable
5. **Documentation**: Maintain comprehensive risk register and decision logs
6. **Cost Tracking**: Monitor cumulative cost closely (radial dimension)
7. **Convergence Monitoring**: Regularly assess convergence criteria
8. **Adaptive Planning**: Adjust objectives and approach based on learnings

## Artifacts Generated

- `spiral-<N>/phase-1-planning/` - Planning documents, objectives, alternatives
- `spiral-<N>/phase-2-risk-analysis/` - Risk register, prototypes, mitigation strategies
- `spiral-<N>/phase-3-engineering/` - Components, test results, deliverables
- `spiral-<N>/phase-4-evaluation/` - Evaluation reports, feedback, convergence assessment
- `spiral-diagram.svg` - Visual representation of spiral progression
- `risk-heatmap.svg` - Risk severity across spirals
- `project-summary.md` - Final project summary and metrics

## References

- [Boehm, B. W. (1986). "A Spiral Model of Software Development and Enhancement"](https://www.cse.msu.edu/~cse435/Homework/HW3/boehm.pdf)
- [Spiral Model - Wikipedia](https://en.wikipedia.org/wiki/Spiral_model)
- [GeeksforGeeks: Spiral Model](https://www.geeksforgeeks.org/software-engineering-spiral-model/)

## Process ID

```
methodologies/spiral-model
```

Use with Babysitter SDK:

```bash
babysitter run:create \
  --process-id methodologies/spiral-model \
  --entry spiral-model.js#process \
  --inputs inputs.json
```
