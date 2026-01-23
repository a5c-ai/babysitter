# Event Storming

> Workshop-based domain modeling using events, commands, and aggregates

## Overview

Event Storming is a workshop-based method created by Alberto Brandolini for rapidly exploring complex business domains. It uses sticky notes and a timeline to collaboratively model domain events, commands, aggregates, and bounded contexts, bringing domain experts and developers together to build a shared understanding.

**Key Philosophy**: Start chaotic, organize later. Focus on what happens (events), not how it happens.

## Methodology Origin

- **Creator**: Alberto Brandolini
- **Year**: 2013
- **Foundation**: Collaborative domain modeling through visual workshops
- **Core Principle**: Domain events first, then add structure incrementally

## Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        EVENT STORMING                        │
└─────────────────────────────────────────────────────────────┘

1. BIG PICTURE STORMING (Chaotic Exploration)
   │
   ├─ Dump all domain events (orange sticky notes)
   ├─ Sort chronologically (timeline left to right)
   ├─ Identify actors (yellow) and external systems (pink)
   ├─ Mark hot spots - conflicts, questions (red)
   └─ Group related events into clusters

2. PROCESS MODELING (Add Structure)
   │
   ├─ Add commands that trigger events (blue)
   ├─ Add policies: "When event X, then command Y" (purple)
   ├─ Add read models for queries (green)
   └─ Detail key process flows

3. SOFTWARE DESIGN (Define Boundaries)
   │
   ├─ Identify aggregates - consistency boundaries (lilac)
   ├─ Define bounded contexts - logical boundaries
   ├─ Map command handlers
   └─ Map event handlers

4. CONTEXT MAPPING (Relationships)
   │
   ├─ Map relationships between bounded contexts
   ├─ Apply DDD strategic patterns
   │   ├─ Shared Kernel
   │   ├─ Customer-Supplier
   │   ├─ Anti-Corruption Layer
   │   └─ Open Host Service
   └─ Define integration mechanisms (events, APIs)

5. VISUALIZATION (Documentation)
   │
   ├─ Event timeline diagrams
   ├─ Process flow diagrams
   ├─ Aggregate diagrams
   ├─ Context map diagrams
   └─ Domain model summary
```

## Color Coding

Event Storming uses color-coded sticky notes to represent different elements:

| Color | Element | Format | Example |
|-------|---------|--------|---------|
| **Orange** | Domain Events | Past tense | "Order Placed", "Payment Processed" |
| **Blue** | Commands | Imperative | "Place Order", "Process Payment" |
| **Yellow** | Actors/Users | Noun | "Customer", "Admin", "System" |
| **Pink** | External Systems | Noun | "Payment Gateway", "Email Service" |
| **Purple** | Policies | When/Then | "When Order Placed, then Notify Customer" |
| **Green** | Read Models | Noun | "Order History", "Inventory View" |
| **Red** | Hot Spots | Issue | "Unclear ownership", "Performance risk" |
| **Lilac** | Aggregates | Noun | "Order", "Customer", "Product" |

## Three Levels of Event Storming

### 1. Big Picture Event Storming
**Goal**: Understand the entire domain
**Duration**: 4-8 hours
**Participants**: Domain experts, developers, stakeholders
**Output**: Complete timeline of domain events

### 2. Process Level Event Storming
**Goal**: Detail specific processes
**Duration**: 2-4 hours per process
**Participants**: Process owners, developers
**Output**: Detailed process flows with commands and policies

### 3. Software Design Event Storming
**Goal**: Design aggregates and bounded contexts
**Duration**: 2-4 hours
**Participants**: Developers, architects
**Output**: Software architecture with aggregates and contexts

## Usage

### Basic Usage (Full Session)

```javascript
import { run } from '@a5c-ai/babysitter-sdk';

const result = await run('methodologies/event-storming', {
  projectName: 'e-commerce-platform',
  domainDescription: 'Online retail platform with orders, payments, and shipping',
  sessionType: 'full' // Default: all phases
});
```

### Big Picture Only

```javascript
const result = await run('methodologies/event-storming', {
  projectName: 'e-commerce-platform',
  domainDescription: 'Online retail platform',
  sessionType: 'big-picture' // Only phase 1
});
```

### Process Level Only

```javascript
const result = await run('methodologies/event-storming', {
  projectName: 'order-fulfillment',
  domainDescription: 'Order processing and fulfillment',
  sessionType: 'process-level' // Phases 1-2
});
```

### Refine Existing Model

```javascript
const result = await run('methodologies/event-storming', {
  projectName: 'e-commerce-platform',
  domainDescription: 'Refined domain model',
  existingModel: previousResult, // Refine previous session
  sessionType: 'full'
});
```

### Skip Visualization

```javascript
const result = await run('methodologies/event-storming', {
  projectName: 'e-commerce-platform',
  domainDescription: 'Online retail platform',
  skipVisualization: true // Skip diagram generation
});
```

## Inputs

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Name of the project/domain being modeled |
| `domainDescription` | string | No | '' | High-level description of the domain |
| `sessionType` | string | No | 'full' | Session type: 'big-picture', 'process-level', or 'full' |
| `existingModel` | object | No | null | Existing model to refine |
| `skipVisualization` | boolean | No | false | Skip diagram generation |

## Outputs

### Full Session Output

```typescript
{
  success: boolean;
  projectName: string;
  sessionType: 'full' | 'big-picture' | 'process-level';

  bigPicture: {
    events: Array<{
      name: string;              // "Order Placed"
      description: string;
      position: number;          // Timeline position
      triggers: string[];        // What caused this
      consequences: string[];    // What happens next
    }>;
    actors: Array<{
      name: string;              // "Customer"
      role: string;
      interactions: string[];
    }>;
    externalSystems: Array<{
      name: string;              // "Payment Gateway"
      purpose: string;
      interactions: string[];
    }>;
    hotSpots: Array<{
      location: string;          // Where in timeline
      issue: string;             // What's unclear
      type: 'conflict' | 'question' | 'complexity' | 'risk';
    }>;
    eventClusters: Array<{
      name: string;
      events: string[];
      description: string;
    }>;
  };

  processModels: {
    processes: Array<{
      name: string;
      description: string;
      trigger: string;
      steps: Array<{
        type: 'command' | 'event' | 'policy' | 'read-model';
        name: string;
        description: string;
        actor: string;
      }>;
    }>;
    commands: Array<{
      name: string;              // "Place Order"
      description: string;
      actor: string;
      triggersEvents: string[];
      requiredData: string[];
    }>;
    policies: Array<{
      name: string;
      trigger: string;           // Event that triggers
      action: string;            // Command executed
      condition: string;
    }>;
    readModels: Array<{
      name: string;
      purpose: string;
      sourceEvents: string[];
      consumers: string[];
    }>;
  };

  softwareDesign: {
    aggregates: Array<{
      name: string;              // "Order"
      description: string;
      events: string[];          // Events this aggregate produces
      commands: string[];        // Commands it handles
      invariants: string[];      // Business rules
      lifecycle: {
        creation: string;        // "Order Created"
        updates: string[];       // "Order Updated"
        termination: string;     // "Order Completed"
      };
    }>;
    boundedContexts: Array<{
      name: string;              // "Order Management"
      description: string;
      aggregates: string[];
      ubiquitousLanguage: Array<{
        term: string;
        definition: string;
      }>;
      responsibilities: string[];
    }>;
    commandHandlers: Array<{
      command: string;
      aggregate: string;
      validations: string[];
      producedEvents: string[];
    }>;
    eventHandlers: Array<{
      event: string;
      handler: string;
      action: string;
      targetAggregate: string;
    }>;
  };

  contextMap: {
    relationships: Array<{
      upstreamContext: string;
      downstreamContext: string;
      pattern: 'shared-kernel' | 'customer-supplier' | 'conformist' |
               'anti-corruption-layer' | 'open-host-service' |
               'published-language' | 'partnership' | 'separate-ways';
      description: string;
      integrationMechanism: 'events' | 'api' | 'shared-db' | 'message-queue' | 'none';
      dataFlow: string;
      considerations: string[];
    }>;
    integrationPoints: Array<{
      name: string;
      contexts: string[];
      mechanism: string;
      events: string[];
      apis: string[];
    }>;
    recommendations: Array<{
      context: string;
      recommendation: string;
      rationale: string;
    }>;
  };

  visualizations: {
    eventTimelineDiagram: string;        // Mermaid code
    processFlowDiagrams: Array<{
      processName: string;
      diagram: string;                   // Mermaid code
    }>;
    aggregateDiagrams: Array<{
      aggregateName: string;
      diagram: string;                   // Mermaid code
    }>;
    contextMapDiagram: string;           // Mermaid code
    domainModelSummary: string;          // Markdown summary
    implementationRecommendations: Array<{
      area: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };

  artifacts: {
    bigPicture: string;                  // Markdown file path
    timeline: string;                    // JSON file path
    processModels: string;
    processes: string;
    softwareDesign: string;
    aggregates: string;
    boundedContexts: string;
    contextMap: string;
    contextRelationships: string;
    visualizations: string;
  };
}
```

## Key Principles

### 1. Events First
- Start with domain events (what happens)
- Events are facts (past tense, immutable)
- Events drive the model, not data structures
- Focus on behavior, not state

### 2. Collaborative Discovery
- Bring domain experts and developers together
- Shared language emerges from the session
- Visual format levels the playing field
- Questions and conflicts are valuable (mark as hot spots)

### 3. Timeline Organization
- Left to right temporal flow
- Chronological order matters
- Parallel events can occur
- Focus on "what" before "how"

### 4. Incremental Structure
- Phase 1: Chaotic exploration (no order needed)
- Phase 2: Add structure (commands, policies)
- Phase 3: Design boundaries (aggregates, contexts)
- Each phase builds on the previous

### 5. Hot Spot Driven
- Mark unclear areas with red sticky notes
- Hot spots indicate:
  - Conflicts in understanding
  - Missing information
  - Complex business rules
  - Risk areas
- Address hot spots before implementation

### 6. Aggregates as Consistency Boundaries
- Aggregate = cluster of related events
- Consistency boundary (all or nothing)
- Single responsibility
- Owns its data and business rules

### 7. Bounded Contexts
- Logical boundaries around models
- Each context has own ubiquitous language
- Contexts can evolve independently
- Integration through well-defined contracts

## Integration Points

### Compose with Domain-Driven Design

Event Storming is a tactical tool within DDD:

```javascript
// 1. Event Storm to discover domain
const eventStormResult = await run('methodologies/event-storming', {
  projectName: 'e-commerce',
  sessionType: 'full'
});

// 2. Use bounded contexts to organize implementation
const contexts = eventStormResult.softwareDesign.boundedContexts;
// Implement each context as a separate service/module

// 3. Use aggregates to design entities
const aggregates = eventStormResult.softwareDesign.aggregates;
// Each aggregate becomes a class/module with events and commands
```

### Compose with Spec-Driven Development

Use Event Storming to inform specifications:

```javascript
// 1. Event Storm to understand domain
const eventStormResult = await run('methodologies/event-storming', {
  projectName: 'order-processing',
  sessionType: 'full'
});

// 2. Convert to specifications
const specs = await run('methodologies/spec-driven-development', {
  projectName: 'order-processing',
  initialRequirements: `
    Bounded Contexts: ${eventStormResult.softwareDesign.boundedContexts.map(c => c.name).join(', ')}
    Aggregates: ${eventStormResult.softwareDesign.aggregates.map(a => a.name).join(', ')}
    Key Events: ${eventStormResult.bigPicture.events.slice(0, 10).map(e => e.name).join(', ')}
  `
});
```

### Compose with BDD

Event Storming events become BDD scenarios:

```javascript
// Event Storm discovers: "Order Placed" → "Payment Processed" → "Order Shipped"

// BDD Scenario:
// Given a customer with valid payment method
// When they place an order
// Then the order should be created
// And payment should be processed
// And shipping should be initiated
```

## Workshop Facilitation Tips

### Before the Session
- ✅ Invite right participants (domain experts + developers)
- ✅ Prepare large wall space or virtual board
- ✅ Stock sticky notes (if physical)
- ✅ Set expectations: "start messy, organize later"
- ✅ Time box: 4-8 hours for big picture

### During the Session
- ✅ Start with chaotic exploration (no judgment)
- ✅ Use past tense for events
- ✅ Encourage everyone to add sticky notes
- ✅ Mark hot spots immediately (don't ignore)
- ✅ Focus on "what" not "how"
- ✅ Iterate: add, remove, reorganize
- ✅ Take photos of the board frequently

### After the Session
- ✅ Digitize the model
- ✅ Address hot spots in follow-up sessions
- ✅ Share artifacts with team
- ✅ Use model to drive implementation
- ✅ Update model as understanding evolves

## Common Pitfalls

1. **Jumping to Solutions Too Early**
   - ❌ Starting with "how" before "what"
   - ✅ Focus on events first, design later

2. **Not Involving Domain Experts**
   - ❌ Developers only session
   - ✅ Domain experts are essential

3. **Perfect Organization From Start**
   - ❌ Trying to organize while exploring
   - ✅ Start chaotic, organize later

4. **Ignoring Hot Spots**
   - ❌ Skipping over unclear areas
   - ✅ Mark and address hot spots

5. **Too Much Detail Too Soon**
   - ❌ Modeling data structures in big picture phase
   - ✅ High-level events first, details in process phase

6. **Analysis Paralysis**
   - ❌ Debating every detail
   - ✅ Move fast, iterate, mark hot spots

## Real-World Examples

### Example 1: E-Commerce Platform
**Domain**: Online retail with orders, payments, shipping
**Key Events**: Product Viewed → Cart Updated → Order Placed → Payment Processed → Order Shipped → Delivery Confirmed
**Aggregates**: Order, Cart, Payment, Shipment
**Bounded Contexts**: Sales, Payment, Fulfillment, Inventory

### Example 2: Banking System
**Domain**: Account management and transactions
**Key Events**: Account Opened → Deposit Made → Withdrawal Requested → Transaction Approved → Balance Updated
**Aggregates**: Account, Transaction, Customer
**Bounded Contexts**: Account Management, Transaction Processing, Fraud Detection

### Example 3: Healthcare Platform
**Domain**: Patient appointments and records
**Key Events**: Appointment Scheduled → Patient Checked In → Diagnosis Recorded → Prescription Issued → Payment Processed
**Aggregates**: Appointment, Patient, Prescription
**Bounded Contexts**: Scheduling, Medical Records, Billing

## References

### Books
- [Introducing EventStorming](https://leanpub.com/introducing_eventstorming) by Alberto Brandolini
- [Domain-Driven Design](https://domainlanguage.com/ddd/) by Eric Evans
- [Implementing Domain-Driven Design](https://vaughnvernon.com/) by Vaughn Vernon

### Online Resources
- [EventStorming.com](https://www.eventstorming.com/) - Official website
- [Awesome EventStorming](https://github.com/mariuszgil/awesome-eventstorming) - Community resources
- [Alberto Brandolini's Blog](https://ziobrando.blogspot.com/)

### Tools
- **Physical**: Sticky notes, large wall, markers
- **Digital**: Miro, Mural, FigJam, Lucidspark
- **Specialized**: EventStorming tools, DDD tools

## Tasks

This methodology defines the following tasks (all inline):

1. **big-picture-storming** - Discover all domain events, actors, and external systems
2. **process-modeling** - Model key processes with commands, policies, and read models
3. **software-design** - Identify aggregates, bounded contexts, and handlers
4. **context-mapping** - Map relationships between bounded contexts using DDD patterns
5. **visualization** - Generate diagrams and documentation

All tasks use agent-based execution with structured output schemas.

## License

Part of the Babysitter SDK Methodologies collection.

---

**Remember**: The goal is shared understanding. The sticky notes are a means to facilitate conversation, not the end product. The real value is the knowledge transfer between domain experts and developers.
