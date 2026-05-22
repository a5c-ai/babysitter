# MaTriXy/Skillachi

- **Archetype**: benchmark-evaluation-harness
- **Stars**: 1
- **Last pushed**: 2026 (recent)
- **License**: MIT (implied)
- **Discovered**: 2026-04-13
- **Skills found**: 0 (benchmark dataset, not skill collection)

## Summary
A comprehensive benchmark dataset for evaluating AI coding skills across 39 engineering roles. Contains 121 real-world coding assignments extracted from merged GitHub pull requests. Each benchmark task includes a base commit state, implementation request description, specific scoring criteria (5 per task), relevant skill identifiers, and references to original issues. Supports evaluation across seven domains with coverage ranging from 3-10 benchmarks per role (average quality: 7.6/10).

## Assessment
HIGH VALUE for validation methodology. The "base commit checkpoint" design enables reproducible testing by pinpointing exact repository states, distinguishing this from synthetic benchmarks. The framework provides multi-model scoring (Claude, Codex, Gemini evaluation), resume-safe distributed execution for 30-85 hour full runs, role-based task stratification, and automated leaderboard generation with GitHub Pages publishing. The augmented catalog contains ~4,700 skill definitions and skills marketplace metadata.

## Extraction Priority
- Medium
- Rationale: No extractable skills or processes, but the benchmark methodology and role-based evaluation framework could inform babysitter's own testing and validation processes. The reproducible testing pattern and multi-model evaluation approach are transferable.

## Processes
- **AI Agent Benchmark Framework**: Create reproducible benchmarks with base commit states, implementation requests, and scoring criteria for agent evaluation
- **Role-Based Task Stratification**: Organize evaluation tasks by engineering roles and domains for targeted capability assessment
- **Multi-Model Evaluation Process**: Coordinate evaluation across multiple AI models with automated scoring and leaderboard generation

## Plugin Ideas
None - this is a benchmarking framework, not a tool integration opportunity.

## Patterns
- Base commit checkpoint for reproducible state restoration
- Real-world task extraction from merged PRs
- Role taxonomy across 7 domains (39 distinct engineering roles)
- Multi-model scoring with resume-safe distributed execution
- Quality scoring (average 7.6/10) with explicit criteria

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| AI Agent Benchmark Framework | NEW | Reproducible benchmark creation with base commit states and scoring criteria | - | methodologies/ai-agent-benchmark-framework/ |
| Role-Based Task Stratification | NEW | Engineering role taxonomy and task organization for capability assessment | - | specializations/shared/role-based-task-stratification.js |
| Multi-Model Evaluation Process | NEW | Coordinated evaluation across multiple AI models with automated scoring | - | specializations/shared/multi-model-evaluation-process.js |
| Reproducible Testing Methodology | NEW | Base commit checkpoint pattern for consistent evaluation environments | - | specializations/shared/reproducible-testing-methodology.js |
| Quality Assessment Framework | NEW | Scoring criteria development and quality evaluation for benchmark tasks | - | specializations/shared/quality-assessment-framework.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Benchmark Runner Integration | NEW | External benchmark execution and scoring integration | - | plugins/a5c/marketplace/plugins/benchmark-runner-integration/ |