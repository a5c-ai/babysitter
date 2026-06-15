# huggingface/agents-course

- **Archetype**: methodology-repo
- **Stars**: 27,795
- **Last pushed**: 2026-04-09
- **License**: Apache-2.0
- **Discovered**: 2026-04-13
- **Source**: backlog-processing
- **Skills found**: 0 (educational course, no SKILL.md files)

## Summary
Hugging Face's official agents course providing structured curriculum for learning AI agent development. Contains 4 main units covering agent basics, frameworks (smolagents, LangGraph, LlamaIndex), agentic RAG use cases, and final project with evaluation. Course includes hands-on exercises, bonus units on fine-tuning and observability, and multilingual support (7 languages). Designed as a comprehensive learning path from basics to production-ready agent development.

## Assessment
MEDIUM-HIGH VALUE. This is an authoritative educational methodology from Hugging Face for agent development. The curriculum structure provides a systematic approach to agent learning that could be adapted as an onboarding process. The framework comparison methodology (smolagents vs LangGraph vs LlamaIndex) contains evaluation criteria that are transferable. The evaluation and observability sections encode procedural knowledge for agent testing that's directly extractable as shared processes.

## Extraction Priority
MEDIUM - Contains educational methodology and evaluation processes that are transferable:
- Agent framework evaluation methodology -> specializations/shared/
- Agent development learning progression -> methodologies/
- Agentic RAG implementation patterns -> specializations/shared/
- Agent evaluation and observability processes -> specializations/shared/

## Processes
- **agent-framework-evaluation**: Systematic comparison methodology for evaluating agent frameworks
  - Source: Unit 2 introduction and framework comparison sections
  - Placement: specializations/shared/
  - Inputs: Framework specifications, use case requirements, capability matrix
  - Outputs: Framework recommendation, trade-off analysis, implementation guide
  - Complexity: moderate
  - Notes: Covers smolagents, LangGraph, LlamaIndex evaluation criteria

- **agent-development-progression**: Structured learning path for agent development skills
  - Source: Course curriculum structure and unit progression
  - Placement: methodologies/agent-development/
  - Inputs: Developer skill level, project requirements, learning objectives
  - Outputs: Learning plan, milestone checkpoints, practical exercises
  - Complexity: simple
  - Notes: 4-unit progression from basics to production deployment

- **agentic-rag-implementation**: Process for implementing agentic RAG systems
  - Source: Unit 3 agentic RAG content
  - Placement: specializations/shared/
  - Inputs: Data sources, query patterns, retrieval requirements
  - Outputs: RAG architecture, implementation code, evaluation metrics
  - Complexity: complex

## Plugin Ideas
- **agent-development-curriculum**: Educational plugin for systematic agent learning
  - What install.md would do: Create learning plan, install framework examples, set up practice environments, configure evaluation tools
  - Processes it would copy: agent-development-progression, agent-framework-evaluation
  - Configs/hooks it would create: Practice project templates, evaluation checklists, framework comparison matrices
  - Source evidence: 4-unit structured curriculum with hands-on exercises and final project

- **agent-evaluation-suite**: Plugin for comprehensive agent testing and observability
  - What install.md would do: Install evaluation frameworks, configure observability tools, set up benchmarking pipelines
  - Processes it would copy: agent-evaluation-process, observability-setup
  - Configs/hooks it would create: Evaluation pipelines, monitoring dashboards, performance benchmarks
  - Source evidence: Bonus Unit 2 on observability and evaluation + Unit 4 final project evaluation

## Implicit Procedural Knowledge
- **Framework Selection Methodology**: Systematic process for choosing appropriate agent framework based on use case
  - Source: Unit 2 framework comparisons and selection criteria
  - Placement: specializations/shared/
  - Why codify: Provides reusable decision framework for framework selection across projects
  - Sketch: Requirements analysis -> Capability mapping -> Framework comparison -> Trade-off evaluation -> Selection justification

- **Agent Evaluation Process**: Comprehensive methodology for testing and validating agent performance
  - Source: Unit 4 final project evaluation and bonus unit 2 observability content
  - Placement: specializations/shared/
  - Why codify: Systematic approach to agent validation that's applicable across different agent types
  - Sketch: Evaluation criteria definition -> Benchmark setup -> Performance measurement -> Observability implementation -> Results analysis

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Agent Framework Evaluation | UPGRADE | Enhanced framework comparison methodology | library/specializations/ai-agents-conversational/ | specializations/shared/agent-framework-evaluation.js |
| Agent Development Progression | NEW | Structured learning path for agent development | - | methodologies/agent-development/ |
| Agentic RAG Implementation | UPGRADE | Enhanced RAG system implementation | library/specializations/ai-agents-conversational/ | specializations/shared/agentic-rag-implementation.js |
| Framework Selection Methodology | NEW | Systematic framework choice process | - | specializations/shared/framework-selection.js |
| Agent Evaluation Process | UPGRADE | Enhanced agent validation methodology | library/specializations/ai-agents-conversational/ | specializations/shared/agent-evaluation-process.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Agent Development Curriculum | NEW | Educational plugin for systematic agent learning | - | plugins/a5c/marketplace/blueprints/agent-development-curriculum/ |
| Agent Evaluation Suite | NEW | Comprehensive agent testing and observability | - | plugins/a5c/marketplace/blueprints/agent-evaluation-suite/ |