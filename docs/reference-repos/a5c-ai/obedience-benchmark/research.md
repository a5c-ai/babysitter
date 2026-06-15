# a5c-ai/obedience-benchmark

- **Archetype**: claude-plugin-benchmark
- **Stars**: 1
- **Last pushed**: 2026-03-10
- **License**: (Not specified)
- **Discovered**: 2026-04-13
- **Skills found**: Multiple (process fidelity benchmarking skills)

## Summary
Claude Code plugin that measures whether AI agents follow prescribed workflows rather than just producing correct outputs. Evaluates across 7 dimensions: completeness, ordering, conditionality, parallelism, granularity, aggregation, and error handling. Features task catalog management, process definition using babysitter SDK, execution runners (local subprocess or Docker container modes), LLM-as-Judge scoring, and markdown report generation with dimension breakdowns.

## Assessment
EXTREMELY HIGH VALUE for babysitter validation. This benchmark directly addresses a critical gap in agent evaluation by focusing on process fidelity rather than just output correctness. The 7-dimension evaluation framework, babysitter SDK integration for process definition, and LLM-as-Judge scoring provide sophisticated methodologies for validating babysitter process compliance. The decoupling of "obedience" from "correctness" as orthogonal capabilities is essential for deployment trust.

## Extraction Priority
- Very High
- Rationale: This benchmark framework is specifically designed for babysitter process validation and could become an essential component of babysitter's quality assurance. The process fidelity evaluation and 7-dimension scoring framework are directly applicable to babysitter process improvement and validation workflows.

## Processes
- **Process Fidelity Benchmarking**: Evaluate agent adherence to prescribed workflows across 7 dimensions
- **LLM-as-Judge Process Scoring**: Analyze execution logs against process specifications for compliance assessment
- **Multi-Dimensional Process Evaluation**: Assess completeness, ordering, conditionality, parallelism, granularity, aggregation, error handling
- **Process Definition Validation**: Author and validate prescribed workflows using babysitter SDK patterns
- **Execution Environment Management**: Local subprocess and Docker container modes for isolated agent testing

## Plugin Ideas
- **Obedience Benchmark Integration**: Direct integration with obedience-benchmark for continuous process validation

## Patterns
- Process fidelity vs output correctness as orthogonal evaluation dimensions
- 7-dimension evaluation framework for workflow compliance
- LLM-as-Judge scoring methodology
- Babysitter SDK integration for process definition
- Multi-mode execution environments (local, Docker)
- Task catalog with domain/complexity filtering
- Markdown scorecard generation with dimension breakdowns

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Process Fidelity Benchmarking | NEW | Evaluate agent adherence to prescribed workflows across multiple dimensions | - | methodologies/process-fidelity-benchmarking/ |
| LLM-as-Judge Process Scoring | NEW | Analyze execution logs against process specifications for compliance | - | specializations/shared/llm-as-judge-process-scoring.js |
| Multi-Dimensional Process Evaluation | NEW | 7-dimension assessment framework for workflow compliance | - | specializations/shared/multi-dimensional-process-evaluation.js |
| Process Definition Validation | UPGRADE | Enhanced process validation using babysitter SDK patterns | library/tasks/ | specializations/shared/process-definition-validation.js |
| Execution Environment Management | NEW | Multi-mode execution environments for isolated process testing | - | specializations/shared/execution-environment-management.js |
| Task Catalog Management | NEW | Organize and filter benchmark tasks by domain and complexity | - | specializations/shared/task-catalog-management.js |
| Compliance Dimension Scoring | NEW | Systematic scoring across completeness, ordering, conditionality, etc. | - | specializations/shared/compliance-dimension-scoring.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Obedience Benchmark Integration | NEW | Direct integration with obedience-benchmark for continuous process validation | - | plugins/a5c/marketplace/blueprints/obedience-benchmark-integration/ |