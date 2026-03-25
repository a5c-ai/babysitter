# Feature-Driven Development (FDD)

**Creator**: Jeff De Luca and Peter Coad
**Year**: 1997
**Category**: Feature-Centric Agile / Progress Tracking
**Priority**: High

## Overview

Feature-Driven Development (FDD) is an agile methodology that organizes software development around building small, client-valued features in short, predictable cycles. Created during a massive Singapore banking project with 50+ developers, FDD combines the discipline needed for large-scale projects with agile responsiveness.

FDD is particularly well-suited for:
- **Large teams** (15-500+ developers)
- **Enterprise projects** requiring rigorous tracking
- **Client-facing applications** with clearly defined features
- **Projects requiring high visibility** of progress
- **Brownfield development** with existing codebases

## Key Principles

### Five-Step Process

1. **Develop Overall Model** - Domain walkthrough and object modeling
2. **Build Features List** - Feature decomposition in `<action> <result> <object>` format
3. **Plan by Feature** - Sequencing, Chief Programmer assignment, iteration scheduling
4. **Design by Feature** - Detailed design with sequence diagrams and design inspection
5. **Build by Feature** - Implementation, testing, code inspection, integration, promotion

### Core Characteristics

- **Parking Lot Diagrams**: Visual progress tracking with colored feature set boxes
- **Class Ownership**: Individual developers own classes (reduces merge conflicts)
- **Feature Teams**: Chief Programmer + 2-5 developers per team
- **Regular Builds**: 2-week iterations with working builds
- **Client-Valued Features**: Everything organized around delivering business value
- **Inspections**: Design and code inspections ensure quality

### Feature Format

FDD features follow a strict template:

```
<action> <result> <object>
```

**Examples**:
- Calculate total of sale
- Validate password of user
- Display history of account
- Generate report of transactions
- Update status of order

Features should be small enough to implement in 2 hours to 2 weeks.

## Usage

### Basic Usage

```javascript
import { babysit } from '@a5c-ai/babysitter-sdk';

const result = await babysit({
  process: 'methodologies/feature-driven-development',
  inputs: {
    projectName: 'E-Commerce Platform',
    domainDescription: 'Online retail system with shopping cart, payment, and order management',
    iterationWeeks: 2,
    teamSize: 12,
    chiefProgrammers: 3
  }
});
```

### With Predefined Features

```javascript
const result = await babysit({
  process: 'methodologies/feature-driven-development',
  inputs: {
    projectName: 'Banking System',
    domainDescription: 'Core banking with accounts, transactions, and reporting',
    features: [
      {
        id: 'f-001',
        title: 'Calculate interest of account',
        action: 'Calculate',
        result: 'interest',
        object: 'account',
        priority: 'high',
        estimatedDays: 3
      },
      {
        id: 'f-002',
        title: 'Validate balance of transaction',
        action: 'Validate',
        result: 'balance',
        object: 'transaction',
        priority: 'high',
        estimatedDays: 2
      }
    ],
    iterationWeeks: 2
  }
});
```

### Brownfield Project

```javascript
const result = await babysit({
  process: 'methodologies/feature-driven-development',
  inputs: {
    projectName: 'Legacy Modernization',
    domainDescription: 'Modernize order management system',
    existingCodebase: {
      structure: 'Monolithic Java application',
      mainPackages: ['com.company.orders', 'com.company.customers'],
      database: 'Oracle 11g',
      frameworks: ['Spring', 'Hibernate']
    },
    iterationWeeks: 2,
    teamSize: 8,
    chiefProgrammers: 2
  }
});
```

## Input Schema

```typescript
interface FDDInputs {
  // Required
  projectName: string;              // Project name
  domainDescription: string;        // High-level business domain description

  // Optional
  iterationWeeks?: number;          // Default: 2
  features?: Array<Feature>;        // Pre-defined features (will generate if not provided)
  existingCodebase?: Object;        // For brownfield projects
  teamSize?: number;                // Default: 6
  chiefProgrammers?: number;        // Default: 2
}

interface Feature {
  id: string;
  title: string;                    // In <action> <result> <object> format
  action: string;
  result: string;
  object: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDays: number;
  dependencies?: string[];          // IDs of dependent features
}
```

## Output Schema

```typescript
interface FDDOutput {
  success: boolean;
  projectName: string;

  // Step 1: Domain Model
  domainModel: {
    classes: Array<{
      name: string;
      responsibilities: string;
      attributes: string[];
      methods: string[];
      stereotype: string;
    }>;
    relationships: Array<{
      from: string;
      to: string;
      type: string;
      description: string;
    }>;
    modelDiagram: string;
  };

  // Step 2: Features List
  featuresList: {
    featureSets: Array<{
      id: string;
      name: string;
      description: string;
      features: Feature[];
    }>;
    totalFeatures: number;
    parkingLotLayout: string;
  };

  // Step 3: Plan
  plan: {
    iterations: Array<{
      number: number;
      features: Feature[];
      chiefProgrammerAssignments: Array<{
        chiefProgrammer: string;
        features: string[];
        classOwners: string[];
      }>;
    }>;
    classOwnership: Record<string, string>;
    schedule: {
      totalWeeks: number;
      iterationCount: number;
      startDate: string;
      estimatedEndDate: string;
    };
  };

  // Steps 4 & 5: Iterations
  iterations: Array<{
    iterationNumber: number;
    features: Feature[];
    results: Array<{
      chiefProgrammer: string;
      features: Array<{
        feature: Feature;
        design: DesignResult;
        build: BuildResult;
      }>;
    }>;
    parkingLot: ParkingLotResult;
    metrics: {
      totalFeatures: number;
      completedFeatures: number;
      completionRate: number;
    };
  }>;

  // Final Parking Lot
  parkingLot: {
    svgContent: string;
    completionPercentage: number;
    featureSetStatus: Array<{
      name: string;
      completed: number;
      total: number;
      percentage: number;
      color: string;
    }>;
  };

  // Metrics
  metrics: {
    totalFeatures: number;
    completedFeatures: number;
    completionRate: number;
    totalIterations: number;
    averageFeaturesPerIteration: number;
    featureSetCompletion: Array<{
      name: string;
      total: number;
      completed: number;
      percentage: number;
    }>;
  };
}
```

## Process Workflow

### Step 1: Develop Overall Model

**Duration**: 1-3 days for medium projects

- Domain walkthrough with business experts
- Study existing requirements and documentation
- Identify major domain objects and entities
- Define classes with responsibilities, attributes, and methods
- Map relationships (associations, inheritance, composition)
- Create UML class diagrams
- Identify bounded contexts

**Artifacts**:
- `artifacts/fdd/domain-model.md` - Human-readable model
- `artifacts/fdd/domain-model.json` - Machine-readable structure

### Step 2: Build Features List

**Duration**: 1-2 days

- Identify major feature sets (functional areas)
- Decompose into individual features using `<action> <result> <object>` format
- Prioritize features by business value
- Identify dependencies
- Organize into parking lot structure
- Map features to domain classes

**Artifacts**:
- `artifacts/fdd/features-list.md` - Organized feature list
- `artifacts/fdd/features-list.json` - Structured feature data

### Step 3: Plan by Feature

**Duration**: 1 day

- Sequence features based on dependencies
- Assign features to Chief Programmers
- Identify class owners (individual ownership)
- Organize into 2-week iterations
- Balance workload across teams
- Generate initial parking lot diagram

**Artifacts**:
- `artifacts/fdd/feature-plan.md` - Detailed plan
- `artifacts/fdd/feature-plan.json` - Plan data
- `artifacts/fdd/parking-lot-initial.svg` - Initial progress visualization

### Step 4: Design by Feature

**Duration**: 1 day or less per feature

For each feature:
- Refine domain model
- Create sequence diagrams
- Design class methods and interfaces
- Identify algorithms and patterns
- Perform design inspection (peer review)
- Document design decisions

**Artifacts**:
- `artifacts/fdd/designs/{feature-id}-design.md` - Design documentation per feature

### Step 5: Build by Feature

**Duration**: 2 hours to 2 weeks per feature

For each feature:
- Implement code following design
- Respect class ownership
- Write unit tests
- Perform code inspection
- Run all tests
- Integrate with main build
- Promote to build (mark complete)

**Artifacts**:
- `artifacts/fdd/builds/{feature-id}-build.md` - Build report per feature

### Parking Lot Diagram

Generated at each iteration showing:
- Feature sets as colored boxes
- Completion percentage per set
- Overall project progress

**Color Coding**:
- 🟢 **Green** (100%): Complete
- 🟡 **Yellow** (50-99%): In progress (majority done)
- 🔴 **Red** (1-49%): In progress (early stage)
- ⚪ **Gray** (0%): Not started

## Examples

See the `examples/` directory for:
- `e-commerce.json` - E-commerce platform with shopping cart
- `banking.json` - Core banking system
- `healthcare.json` - Patient management system
- `brownfield.json` - Legacy modernization project

## Integration with Other Methodologies

### FDD + Spec-Kit

Use Spec-Kit's constitution and specification phases, then apply FDD for implementation:

```javascript
// 1. Run Spec-Kit for requirements
const specResult = await babysit({
  process: 'methodologies/spec-driven-development',
  inputs: { projectName: 'Banking System', /* ... */ }
});

// 2. Use FDD for feature-driven implementation
const fddResult = await babysit({
  process: 'methodologies/feature-driven-development',
  inputs: {
    projectName: 'Banking System',
    domainDescription: specResult.specification.summary,
    features: convertUserStoriesToFeatures(specResult.specification.userStories)
  }
});
```

### FDD + DDD

Use Domain-Driven Design for "Develop Overall Model" phase:

```javascript
// Deep domain modeling with DDD, then FDD for delivery
const dddModel = await babysit({
  process: 'methodologies/domain-driven-design',
  inputs: { /* ... */ }
});

const fddResult = await babysit({
  process: 'methodologies/feature-driven-development',
  inputs: {
    projectName: 'Complex Domain',
    domainDescription: dddModel.description,
    // Use DDD model as input
  }
});
```

### FDD + Agile

FDD naturally integrates with Scrum:
- FDD iterations = Sprints
- Chief Programmers = Senior developers
- Feature sets = Epics
- Features = User stories

## Best Practices

### 1. Keep Features Small

Features should be completable in 2 hours to 2 weeks. If larger, decompose further.

**Good**:
- Calculate total of sale
- Validate email of user

**Too Large**:
- Build complete checkout system
- Implement entire authentication

### 2. Respect Class Ownership

Each class should have a single owner (developer). This:
- Reduces merge conflicts
- Improves code quality (single responsible person)
- Enables expertise development

### 3. Regular Builds

Integrate and build every day or even more frequently. This:
- Catches integration issues early
- Maintains working software
- Enables continuous progress tracking

### 4. Use Parking Lot for Communication

The parking lot diagram is your primary communication tool:
- Share with stakeholders daily
- Use in stand-ups
- Display prominently
- Update in real-time

### 5. Chief Programmer Role

Chief Programmers should:
- Be senior developers with domain expertise
- Lead design by feature sessions
- Conduct code inspections
- Coordinate with class owners
- Report progress

### 6. Inspections Are Critical

Both design and code inspections:
- Catch defects early
- Share knowledge across team
- Maintain code quality
- Should be brief (30-60 minutes)

## Parking Lot Diagram

The parking lot is FDD's signature artifact:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  User Mgmt      │  │  Shopping Cart  │  │  Payment        │
│                 │  │                 │  │                 │
│      85%        │  │      45%        │  │      100%       │
│                 │  │                 │  │                 │
│  17/20 features │  │  9/20 features  │  │  15/15 features │
└─────────────────┘  └─────────────────┘  └─────────────────┘
    🟡 Yellow           🔴 Red               🟢 Green

┌─────────────────┐  ┌─────────────────┐
│  Reporting      │  │  Admin Panel    │
│                 │  │                 │
│      0%         │  │      12%        │
│                 │  │                 │
│  0/25 features  │  │  3/25 features  │
└─────────────────┘  └─────────────────┘
    ⚪ Gray              🔴 Red
```

## Comparison with Other Methodologies

| Aspect | FDD | Scrum | XP | Waterfall |
|--------|-----|-------|-----|-----------|
| **Team Size** | 15-500+ | 3-9 | 2-12 | Any |
| **Iteration** | 2 weeks | 1-4 weeks | 1-2 weeks | Months |
| **Progress Tracking** | Parking Lot | Burndown | Story Board | Gantt |
| **Planning** | Feature-based | Sprint-based | Story-based | Phase-based |
| **Code Ownership** | Individual | Collective | Collective | Individual |
| **Documentation** | Moderate | Light | Minimal | Heavy |
| **Best For** | Large teams | Small teams | Technical excellence | Fixed requirements |

## References

### Official Resources
- [Feature Driven Development Official Site](http://www.featuredrivendevelopment.com/)
- [FDD Parking Lot Diagrams](http://www.featuredrivendevelopment.com/node/1037)
- [FDD Processes](http://www.featuredrivendevelopment.com/node/574)

### Articles & Guides
- [Monday.com FDD Guide 2026](https://monday.com/blog/rnd/feature-driven-development-fdd/)
- [Wikipedia: Feature-Driven Development](https://en.wikipedia.org/wiki/Feature-driven_development)
- [A Practical Guide to FDD](http://www.nebulon.com/fdd/)

### Books
- **"Java Modeling in Color with UML"** by Peter Coad et al. - FDD foundations
- **"A Practical Guide to Feature-Driven Development"** by Stephen Palmer and John Felsing

### Academic Papers
- De Luca, J. & Coad, P. (1999). "Java Modeling in Color with UML"
- Palmer, S. R., & Felsing, J. M. (2002). "A Practical Guide to Feature-Driven Development"

## Troubleshooting

### Features Too Large

**Problem**: Features taking weeks to complete

**Solution**:
- Decompose into smaller features
- Aim for 2-hour to 2-week range
- Use sub-features if needed
- Example: "Process payment" → "Validate payment info", "Charge credit card", "Generate receipt"

### Parking Lot Not Updating

**Problem**: Parking lot shows no progress

**Solution**:
- Ensure features are marked "promoted" after build
- Check integration process
- Verify parking lot task is running
- Review feature completion criteria

### Merge Conflicts

**Problem**: Constant merge conflicts

**Solution**:
- Review class ownership assignments
- Ensure one owner per class
- Consider refactoring to reduce class coupling
- Use feature branches with frequent integration

### Design Inspections Slow

**Problem**: Design reviews taking too long

**Solution**:
- Limit to 30-60 minutes
- Focus on critical design decisions
- Use checklists
- Include only key team members

## License

This methodology implementation is part of the Babysitter SDK and follows the same license terms.

## Contributing

To improve this FDD implementation:
1. Review the backlog in `methodologies/backlog.md`
2. Propose enhancements via issues
3. Submit pull requests with improvements
4. Share real-world usage experiences

---

**Implementation Status**: ✅ Implemented
**Last Updated**: 2026-01-23
**Version**: 1.0.0
