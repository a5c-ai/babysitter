# dotnet/skills

- **Archetype**: domain-skill-pack
- **Stars**: 1,061
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-13
- **Source**: backlog-processing
- **Skills found**: 30+ (organized across 11 plugins: dotnet, dotnet-data, dotnet-diag, dotnet-msbuild, dotnet-nuget, dotnet-upgrade, dotnet-maui, dotnet-ai, dotnet-template-engine, dotnet-test, dotnet-aspnet)

## Summary
The .NET team's official skill collection for .NET development workflows. Contains 11 specialized plugins covering core .NET development, data access (EF), diagnostics, build systems (MSBuild), package management (NuGet), framework upgrades, MAUI development, AI/ML integration, template engine usage, testing, and ASP.NET Core development. Maintained by the .NET team with official dashboard at dotnet.github.io/skills/.

## Assessment
HIGH VALUE. This is an authoritative domain skill pack from the .NET team containing official best practices and workflows. Skills contain detailed procedural knowledge for complex .NET development tasks like P/Invoke debugging, MSBuild performance optimization, EF migration workflows, and framework upgrade processes. The diagnostic and upgrade skills encode substantial troubleshooting procedures that are directly extractable as specializations/dotnet/ processes.

## Extraction Priority
HIGH - Contains official .NET team processes that are directly transferable:
- P/Invoke debugging workflows -> specializations/dotnet/
- MSBuild performance optimization -> specializations/dotnet/
- EF migration and data access patterns -> specializations/dotnet/
- Framework upgrade procedures -> specializations/dotnet/
- Performance diagnostics -> specializations/shared/

## Skills Inventory

| Skill | Path | Domain | Transferable? | Notes |
|-------|------|--------|---------------|-------|
| dotnet-pinvoke | plugins/dotnet/skills/dotnet-pinvoke/ | .NET | Yes - process | P/Invoke debugging, memory lifetime, cross-platform patterns |
| csharp-scripts | plugins/dotnet/skills/csharp-scripts/ | .NET | Yes - pattern | C# scripting and automation workflows |
| dotnet-data | plugins/dotnet-data/ | .NET/Data | Yes - process | EF Core migrations, data access patterns |
| dotnet-diag | plugins/dotnet-diag/ | .NET | Yes - process | Performance investigation, debugging workflows |
| dotnet-msbuild | plugins/dotnet-msbuild/ | .NET/Build | Yes - process | Build optimization, failure diagnosis |
| dotnet-upgrade | plugins/dotnet-upgrade/ | .NET | Yes - process | Framework migration procedures |

## Processes
- **dotnet-pinvoke-debugging**: Systematic approach to debugging P/Invoke and native interop issues
  - Source: plugins/dotnet/skills/dotnet-pinvoke/SKILL.md (lines 15-40)
  - Placement: specializations/dotnet/
  - Inputs: P/Invoke signatures, crash dumps, access violations
  - Outputs: Corrected signatures, memory safety fixes, cross-platform compatibility
  - Complexity: complex
  - Notes: Covers DllImport vs LibraryImport, string marshalling, memory lifetime patterns

- **msbuild-performance-optimization**: Process for diagnosing and optimizing .NET build performance
  - Source: plugins/dotnet-msbuild/ plugin description
  - Placement: specializations/dotnet/
  - Inputs: Build logs, performance metrics, project files
  - Outputs: Optimized build configuration, performance recommendations
  - Complexity: moderate

- **dotnet-framework-upgrade**: Structured approach to upgrading .NET projects across framework versions
  - Source: plugins/dotnet-upgrade/ plugin description
  - Placement: specializations/dotnet/
  - Inputs: Existing project files, dependency graph, compatibility requirements
  - Outputs: Upgraded project, migration report, compatibility analysis
  - Complexity: complex

## Plugin Ideas
- **dotnet-framework-upgrade**: Plugin for systematic .NET framework upgrades
  - What install.md would do: Analyze current project, create upgrade plan, install upgrade processes, set up compatibility testing
  - Processes it would copy: dotnet-framework-upgrade, compatibility-analysis, dependency-migration
  - Configs/hooks it would create: Upgrade checklists, compatibility test suites, rollback procedures
  - Source evidence: dotnet-upgrade plugin with framework migration procedures

## Implicit Procedural Knowledge
- **P/Invoke Signature Validation**: Systematic process for ensuring P/Invoke signatures match native function definitions
  - Source: dotnet-pinvoke skill sections on type mapping, calling conventions, memory management
  - Placement: specializations/dotnet/
  - Why codify: Complex domain knowledge that requires specific steps for validation and debugging
  - Sketch: Header analysis -> Signature mapping -> Memory lifetime validation -> Cross-platform testing -> Error diagnosis

- **MSBuild Performance Investigation**: Process for diagnosing slow .NET builds and optimizing build pipelines
  - Source: dotnet-msbuild plugin description and diagnostic workflows
  - Placement: specializations/dotnet/
  - Why codify: Provides systematic approach to build performance that's reusable across .NET projects
  - Sketch: Build metrics collection -> Bottleneck identification -> Target analysis -> Optimization implementation -> Performance validation

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| .NET P/Invoke Debugging | NEW | Systematic P/Invoke and native interop debugging methodology | - | specializations/dotnet/pinvoke-debugging.js |
| MSBuild Performance Optimization | NEW | Build performance investigation and optimization workflow | - | specializations/dotnet/msbuild-performance-optimization.js |
| .NET Framework Upgrade | NEW | Structured .NET project framework migration process | - | specializations/dotnet/framework-upgrade.js |
| Entity Framework Migration Workflow | NEW | EF Core migrations and data access pattern management | - | specializations/dotnet/ef-migration-workflow.js |
| .NET Diagnostics Investigation | NEW | Performance and memory diagnostic procedures for .NET | - | specializations/dotnet/diagnostics-investigation.js |
| NuGet Package Management | NEW | Package dependency analysis and optimization workflows | - | specializations/dotnet/nuget-package-management.js |
| ASP.NET Core Development Process | NEW | ASP.NET Core application development and optimization patterns | - | specializations/dotnet/aspnet-core-development.js |
| MAUI Cross-Platform Development | NEW | Multi-platform application development with .NET MAUI | - | specializations/dotnet/maui-development.js |
| .NET AI/ML Integration | NEW | AI and ML integration patterns for .NET applications | - | specializations/dotnet/ai-ml-integration.js |
| C# Scripting Automation | NEW | C# scripting and automation workflow patterns | - | specializations/dotnet/csharp-scripting-automation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| .NET Framework Upgrade | NEW | Systematic .NET framework upgrade setup with processes and tooling | - | plugins/a5c/marketplace/plugins/dotnet-framework-upgrade/ |