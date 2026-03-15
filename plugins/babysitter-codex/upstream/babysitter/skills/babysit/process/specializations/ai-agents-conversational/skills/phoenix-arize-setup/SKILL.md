---
name: phoenix-arize-setup
description: Arize Phoenix observability platform setup for LLM debugging and evaluation
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Phoenix Arize Setup Skill

## Capabilities

- Set up Phoenix local server
- Configure tracing instrumentation
- Design evaluation experiments
- Implement embedding visualizations
- Set up retrieval analysis
- Create custom evaluations with LLM-as-judge

## Target Processes

- llm-observability-monitoring
- agent-evaluation-framework

## Implementation Details

### Core Features

1. **Tracing**: OpenTelemetry-based LLM traces
2. **Evals**: LLM-as-judge evaluations
3. **Embeddings**: Visualization and drift detection
4. **Retrieval**: RAG quality analysis
5. **Datasets**: Experiment management

### Instrumentation

- OpenAI auto-instrumentation
- LangChain instrumentation
- LlamaIndex instrumentation
- Custom span creation

### Configuration Options

- Phoenix server setup
- Trace sampling
- Evaluation metrics
- Embedding models
- Export settings

### Best Practices

- Comprehensive instrumentation
- Regular evaluation runs
- Monitor embedding drift
- Analyze retrieval quality

### Dependencies

- arize-phoenix
- openinference-instrumentation-openai
