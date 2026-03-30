# Domain-Driven Design (DDD) Methodology

**Creator**: Eric Evans
**Year**: 2003
**Category**: Strategic Design / Tactical Design / Architecture

## Overview

Domain-Driven Design is an approach for building complex software systems that places the business domain at the center of development. It provides both strategic patterns for organizing large systems and tactical patterns for modeling domain logic.

This process implements Eric Evans' DDD methodology through the Babysitter SDK orchestration framework, providing agent-driven strategic and tactical design workflows.

## Key Concepts

### Strategic Design (Problem Space)

Strategic design focuses on understanding and organizing the business domain:

- **Ubiquitous Language**: Shared vocabulary between domain experts and developers
- **Bounded Contexts**: Specific areas where a model/language is consistently used
- **Context Mapping**: Define relationships between bounded contexts
- **Subdomains**: Classify as Core (key differentiator), Supporting (necessary but not core), or Generic (off-the-shelf)

### Tactical Design (Solution Space)

Tactical design provides patterns for implementing the domain model:

- **Entities**: Objects with unique identity (e.g., Customer, Order)
- **Value Objects**: Immutable values without identity (e.g., Money, Address)
- **Aggregates**: Clusters of entities/value objects treated as a unit
- **Repositories**: Abstract persistence of aggregates
- **Domain Services**: Operations that don't belong to entities
- **Domain Events**: Significant occurrences in the domain
- **Factories**: Complex object creation

## Process Workflow

The DDD process follows a four-phase workflow:

### Phase 1: Strategic Design

1. **Identify Subdomains** - Classify business domain into Core, Supporting, and Generic subdomains
2. **Define Bounded Contexts** - Establish clear boundaries where models are consistent
3. **Create Context Map** - Map relationships and integration patterns between contexts
4. **Build Ubiquitous Language** (Initial) - Create shared vocabulary glossary

### Phase 2: Tactical Design

For each bounded context:

1. **Identify Entities and Value Objects** - Model objects with and without identity
2. **Define Aggregates** - Group entities/VOs into consistency boundaries
3. **Design Repositories** - Abstract persistence for aggregate roots
4. **Identify Domain Services** - Operations that don't belong to entities

### Phase 3: Domain Event Modeling

1. **Identify Domain Events** - Significant occurrences in the domain
2. **Model Event Handlers** - Design handlers and eventual consistency patterns

### Phase 4: Refinement & Implementation

1. **Refine Ubiquitous Language** - Update vocabulary based on tactical design
2. **Validate Language Consistency** - Ensure consistent usage across artifacts
3. **Generate Implementation Plans** - Module structure, APIs, integration patterns
4. **Validate Domain Model** - Final quality check

## Usage

### Full DDD Workflow

```javascript
import { orchestrate } from '@a5c-ai/babysitter-sdk';

const result = await orchestrate({
  process: 'methodologies/domain-driven-design',
  inputs: {
    projectName: 'E-Commerce Platform',
    domainDescription: 'Online marketplace connecting buyers and sellers...',
    complexity: 'complex',
    phase: 'full'
  }
});
```

### Strategic Design Only

```javascript
const result = await orchestrate({
  process: 'methodologies/domain-driven-design',
  inputs: {
    projectName: 'E-Commerce Platform',
    domainDescription: 'Online marketplace...',
    phase: 'strategic'
  }
});
```

### Tactical Design (with existing strategic design)

```javascript
const result = await orchestrate({
  process: 'methodologies/domain-driven-design',
  inputs: {
    projectName: 'E-Commerce Platform',
    phase: 'tactical',
    existingDomainModel: './artifacts/ddd/strategic-design.json'
  }
});
```

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Name of the project/domain |
| `domainDescription` | string | No | '' | High-level description of the business domain |
| `complexity` | string | No | 'moderate' | Domain complexity: 'simple', 'moderate', 'complex' |
| `phase` | string | No | 'full' | Starting phase: 'strategic', 'tactical', 'full' |
| `existingDomainModel` | string | No | null | Path to existing domain model (for refinement) |
| `generateImplementation` | boolean | No | true | Generate implementation plans |

## Output Artifacts

The process generates comprehensive DDD artifacts:

### Strategic Design
- `artifacts/ddd/SUBDOMAINS.md` - Subdomain classification and analysis
- `artifacts/ddd/BOUNDED_CONTEXTS.md` - Bounded context definitions
- `artifacts/ddd/CONTEXT_MAP.md` - Context map with integration patterns
- `artifacts/ddd/context-relationships.json` - Machine-readable relationships

### Tactical Design
- `artifacts/ddd/TACTICAL_DESIGN.md` - Complete tactical design
- `artifacts/ddd/domain-model.json` - Entities, VOs, Aggregates, Services
- `artifacts/ddd/aggregates.md` - Detailed aggregate designs

### Domain Events
- `artifacts/ddd/DOMAIN_EVENTS.md` - Domain event catalog
- `artifacts/ddd/event-flow.json` - Event flow diagram
- `artifacts/ddd/event-handlers.md` - Event handler specifications

### Language & Implementation
- `artifacts/ddd/UBIQUITOUS_LANGUAGE.md` - Glossary of domain terms
- `artifacts/ddd/IMPLEMENTATION_PLAN.md` - Implementation guidelines
- `artifacts/ddd/module-structure.json` - Module and package structure
- `artifacts/ddd/api-boundaries.md` - API and boundary definitions

### Validation
- `artifacts/ddd/DDD_SUMMARY.md` - Complete DDD model summary
- `artifacts/ddd/LANGUAGE_ISSUES.md` - Language consistency report

## Return Value

```javascript
{
  success: boolean,
  projectName: string,
  complexity: string,
  phase: string,
  strategicDesign: {
    subdomains: { ... },
    boundedContexts: { ... },
    contextMap: { ... }
  },
  tacticalDesign: {
    contexts: [ ... ]
  },
  ubiquitousLanguage: { ... },
  domainEvents: {
    events: [ ... ],
    handlers: [ ... ],
    eventualConsistency: [ ... ]
  },
  implementation: {
    plans: [ ... ]
  },
  validation: { ... },
  artifacts: { ... },
  metadata: { ... }
}
```

## Integration with Other Methodologies

### With Event Storming
Use Event Storming to discover domain events, then feed into DDD for strategic and tactical design.

### With Spec-Driven Development
DDD provides the domain model, Spec-Kit provides the implementation execution plan.

### With BDD/Specification by Example
Use ubiquitous language in Gherkin scenarios to ensure specifications match domain language.

### With Microservices Architecture
Bounded contexts naturally map to microservice boundaries.

## Context Mapping Patterns

The process identifies and documents these integration patterns:

- **Shared Kernel**: Two contexts share a subset of the model
- **Customer/Supplier**: Downstream depends on upstream
- **Conformist**: Downstream conforms to upstream model
- **Anti-Corruption Layer**: Downstream protects itself from upstream changes
- **Open Host Service**: Upstream provides well-defined service interface
- **Published Language**: Shared language for integration (events, APIs)
- **Separate Ways**: No integration needed
- **Partnership**: Teams work together on integration

## Best Practices

### Strategic Design
1. Start with subdomain identification - understand what's core vs supporting
2. Invest heavily in core domains, less in supporting, use off-the-shelf for generic
3. Define bounded contexts around team boundaries (Conway's Law)
4. Be explicit about context relationships and integration patterns
5. Keep ubiquitous language glossaries updated

### Tactical Design
1. Keep aggregates small - large aggregates cause performance and maintenance issues
2. Use ID references between aggregates, not object references
3. Make value objects immutable
4. One repository per aggregate root
5. Domain events for cross-aggregate consistency
6. Avoid anemic domain models - put behavior with data

### Ubiquitous Language
1. Use domain expert language, not technical jargon
2. If you can't explain it in domain terms, you don't understand it yet
3. Update code immediately when language changes
4. Use same terms in code, docs, conversations, and specs
5. Different terms in different contexts is OK - that's why we have bounded contexts

### Implementation
1. Model contexts as separate modules/services
2. Use anti-corruption layers when integrating with legacy systems
3. Event-driven communication for loose coupling
4. CQRS for complex read models
5. Test domain logic in isolation from infrastructure

## Example: E-Commerce Platform

### Subdomains Identified
- **Core**: Product Catalog, Order Management, Pricing
- **Supporting**: Shipping, Notifications, Customer Support
- **Generic**: Authentication, Payment Processing (Stripe)

### Bounded Contexts
- **Catalog Context**: Product information, categories, search
- **Sales Context**: Shopping cart, orders, checkout
- **Fulfillment Context**: Inventory, shipping, delivery
- **Customer Context**: User profiles, preferences, history

### Context Map
- Catalog → Sales: Open Host Service (product API)
- Sales → Fulfillment: Customer/Supplier (order fulfillment)
- Sales → Payment Gateway: Anti-Corruption Layer (protect from Stripe changes)

### Key Aggregates
- **Product** (Catalog): ProductId, Name, Price, Inventory
- **Order** (Sales): OrderId, LineItems, Total, Status
- **Shipment** (Fulfillment): ShipmentId, OrderId, TrackingNumber

### Domain Events
- `ProductAddedToCatalog`
- `OrderPlaced`
- `OrderShipped`
- `PaymentProcessed`

## References

### Books
- **Domain-Driven Design** by Eric Evans (2003) - The original blue book
- **Implementing Domain-Driven Design** by Vaughn Vernon (2013) - Practical implementation guide
- **Learning Domain-Driven Design** by Vlad Khononov (2021) - Modern approach

### Online Resources
- [Domain Language (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [DDD Community](https://github.com/ddd-crew)
- [Microsoft's DDD for Microservices](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd)
- [Martin Fowler's DDD](https://martinfowler.com/tags/domain%20driven%20design.html)

### Tools
- [Context Mapper](https://contextmapper.org/) - DSL for context mapping
- [Event Storming](https://www.eventstorming.com/) - Collaborative domain discovery
- [Miro DDD Templates](https://miro.com/templates/domain-driven-design/)

## License

Part of the Babysitter SDK Methodology Collection.

## Contributing

To enhance this methodology:
1. Add new task definitions in `tasks/` directory
2. Create example scenarios in `examples/` directory
3. Update this README with new patterns and practices
4. Submit pull request with detailed description

---

**Version**: 1.0.0
**Last Updated**: 2026-01-23
**Methodology**: Domain-Driven Design
**Framework**: Babysitter SDK
