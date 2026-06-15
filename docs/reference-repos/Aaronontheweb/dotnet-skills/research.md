# Aaronontheweb/dotnet-skills

- **Archetype**: domain-skill-pack
- **Stars**: 784
- **Last pushed**: 2026-04-10
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 34

## Summary
Comprehensive .NET developer skills from Aaron Stannard (Akka.NET creator/maintainer). 34 skills covering Akka.NET patterns (best practices, hosting, management, testing, Aspire integration), C# design (API design, coding standards, concurrency, type design/performance), ASP.NET/Aspire ecosystem (configuration, integration testing, service defaults, Mailpit, DevCert trust), Entity Framework Core, testing patterns (snapshot testing, Testcontainers, Playwright+Blazor, Verify email snapshots), tooling (ILSpy decompile, package management, serialization), and meta-skills (marketplace-publishing, project-structure, skills-index-snippets, slopwatch, CRAP analysis). The akka-best-practices skill is notably deep with patterns for EventStream vs DistributedPubSub, supervision strategies, work distribution, and cluster/local abstractions.

## Assessment
HIGH VALUE for domain specialization. This is the most authoritative .NET skills collection in the reference set -- authored by the creator of Akka.NET with deep expertise in distributed systems, actor patterns, and .NET ecosystem. The Akka.NET skills encode expert knowledge that is genuinely difficult to find elsewhere: cluster vs local abstractions for testability, actor-scoped CancellationToken patterns, and the critical distinction between EventStream (local-only) and DistributedPubSub (multi-node). The C# skills cover modern patterns (concurrency, type design for performance) that are applicable across all .NET projects. The testing skills (Testcontainers, Playwright+Blazor, snapshot testing) represent well-defined procedural workflows. Transferable to specializations/engineering/dotnet.

## Extraction Priority
- High
- Rationale: Authoritative source (Akka.NET creator), 34 deeply procedural skills, covers a major technology ecosystem (.NET) not yet represented in babysitter's process library. The distributed systems patterns (actor model, cluster abstractions) are genuinely expert-level knowledge. The breadth (Akka, Aspire, EF Core, testing, tooling) provides comprehensive .NET coverage.

## Processes
- **Akka.NET Actor Design Process**: Analyze communication needs -> choose EventStream (local) vs DistributedPubSub (multi-node) -> implement supervision strategy -> design work distribution -> abstract cluster/local for testability. A multi-decision architecture process.
- **.NET Testing Pipeline**: Choose testing strategy (snapshot/integration/E2E) -> configure Testcontainers for infrastructure -> implement Playwright for Blazor UI tests -> set up Verify for email snapshot testing. A comprehensive test infrastructure setup process.
- **Aspire Service Configuration**: Configure service defaults -> set up integration testing -> integrate external services (Mailpit, etc.) -> trust DevCert for local HTTPS. An infrastructure setup workflow.
- **C# Code Quality Process**: Apply coding standards -> analyze type design for performance -> implement concurrency patterns -> run CRAP analysis (Change Risk Anti-Pattern). A code quality methodology with quantitative metrics.
- **CRAP Analysis**: Cyclomatic complexity + code coverage metric for identifying risky code. A quantitative quality assessment extractable as a shared methodology.

## Patterns
- **Local vs distributed abstraction**: GenericChildPerEntityParent and IPubSubMediator abstractions that work identically in single-node and cluster modes. Enables testability without cluster infrastructure.
- **Invocable: false metadata**: Skills marked `invocable: false` serve as reference documentation rather than interactive skills. A useful distinction for knowledge bases vs. workflows.
- **Reference file architecture**: Per-skill reference files (work-distribution-patterns.md, cluster-local-abstractions.md, async-cancellation-patterns.md) linked from main SKILL.md. Modular knowledge organization.
- **Critical mistake highlighting**: "BAD" code examples with explicit explanation of why they fail (e.g., EventStream is local-only, subscribers on server 2 won't receive events). Negative examples with distributed-systems failure modes.
- **Framework creator authority**: Skills authored by the framework creator carry implicit authority. The Akka.NET skills can make definitive statements about intended usage patterns.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Akka.NET Actor Design Process | NEW | Multi-decision architecture for actor systems with supervision and distribution | - | specializations/dotnet/akka-net-actor-design.js |
| .NET Testing Pipeline | NEW | Comprehensive test infrastructure with Testcontainers and Playwright | - | specializations/dotnet/dotnet-testing-pipeline.js |
| Aspire Service Configuration | NEW | Aspire infrastructure setup with service defaults and integration | - | specializations/dotnet/aspire-service-configuration.js |
| C# Code Quality Process | NEW | Code standards with type design performance and concurrency patterns | - | specializations/dotnet/csharp-code-quality.js |
| CRAP Analysis | NEW | Cyclomatic complexity + coverage metric for identifying risky code | - | specializations/shared/crap-analysis.js |
| Actor Model Distribution Patterns | NEW | EventStream vs DistributedPubSub decision framework for actor systems | - | specializations/dotnet/actor-model-distribution-patterns.js |
| .NET Snapshot Testing | NEW | Verify-based snapshot testing for .NET applications | - | specializations/dotnet/dotnet-snapshot-testing.js |
| Blazor Playwright Testing | NEW | E2E testing for Blazor applications using Playwright | - | specializations/dotnet/blazor-playwright-testing.js |
| Testcontainers Infrastructure | NEW | Container-based integration testing setup for .NET | - | specializations/dotnet/testcontainers-infrastructure.js |
| Actor Supervision Strategy Design | NEW | Fault tolerance and supervision patterns for actor systems | - | specializations/dotnet/actor-supervision-strategy.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| CRAP Analysis Integration | NEW | Code quality analysis setup with coverage tooling and complexity metrics | - | plugins/a5c/marketplace/blueprints/crap-analysis-integration/ |
| Testcontainers Setup | NEW | Container infrastructure setup for .NET integration testing | - | plugins/a5c/marketplace/blueprints/testcontainers-setup/ |
