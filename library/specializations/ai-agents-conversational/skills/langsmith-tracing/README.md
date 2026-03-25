# LangSmith Tracing Skill

## Overview

The `langsmith-tracing` skill provides comprehensive observability and debugging capabilities for LLM applications built with LangChain and LangGraph frameworks. It enables teams to capture, analyze, and debug agent execution traces through LangSmith's managed observability platform.

## Key Features

- **Automatic Trace Collection**: Capture all LLM calls, chain executions, and agent actions
- **Nested Trace Visualization**: View hierarchical execution flows with Run Tree model
- **Performance Metrics**: Track latency, token usage, and cost metrics
- **Debug Capabilities**: Fetch and analyze traces for troubleshooting
- **Evaluation Support**: Enable human-in-the-loop evaluation workflows

## Prerequisites

1. **LangSmith Account**: Sign up at [smith.langchain.com](https://smith.langchain.com)
2. **API Key**: Generate an API key from your LangSmith dashboard
3. **Python Environment**: Python 3.8+ with langchain and langsmith packages

## Installation

```bash
pip install langchain langsmith
```

## Quick Start

### 1. Environment Configuration

```bash
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=lsv2_pt_...your_key...
export LANGCHAIN_PROJECT=my-agent-project
```

### 2. Basic Integration

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# Tracing is automatic when env vars are set
llm = ChatOpenAI(model="gpt-4")
prompt = ChatPromptTemplate.from_template("Tell me about {topic}")
chain = prompt | llm

# All invocations are traced
result = chain.invoke({"topic": "AI agents"})
```

### 3. Custom Function Tracing

```python
from langsmith import traceable

@traceable(name="data_processing")
def process_data(data: dict) -> dict:
    # Your processing logic
    return processed_data

@traceable(name="agent_decision")
def make_decision(context: str) -> str:
    # Decision logic
    return decision
```

## Use Cases

### Agent Debugging

When an agent produces unexpected results, use LangSmith traces to:
1. Identify which step failed or produced incorrect output
2. Examine the inputs/outputs at each execution stage
3. Compare successful vs failed runs
4. Analyze token usage and latency bottlenecks

### Performance Optimization

Monitor and optimize agent performance by:
1. Tracking latency metrics across runs
2. Identifying expensive LLM calls
3. Measuring token consumption
4. Finding opportunities for caching or batching

### Quality Assurance

Support QA workflows through:
1. Capturing test run traces for review
2. Enabling human evaluation of agent outputs
3. Building regression test datasets from traces
4. Comparing agent behavior across versions

## Integration with Babysitter Processes

This skill integrates with the following processes:

| Process | Integration Point |
|---------|------------------|
| llm-observability-monitoring | Primary tracing backend |
| agent-evaluation-framework | Trace capture for evaluation |
| react-agent-implementation | Debug ReAct loops |
| conversation-quality-testing | Capture conversation traces |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| projectName | string | required | LangSmith project identifier |
| apiKeyEnvVar | string | LANGCHAIN_API_KEY | Environment variable for API key |
| samplingRate | number | 1.0 | Trace sampling rate (0.0-1.0) |
| enableDebug | boolean | false | Enable verbose debug logging |
| tags | array | [] | Tags to attach to all traces |

## Troubleshooting

### Traces Not Appearing

1. Verify `LANGCHAIN_TRACING_V2=true` is set
2. Check API key is valid and has correct permissions
3. Ensure project name matches LangSmith dashboard
4. Check network connectivity to LangSmith servers

### Missing Nested Traces

1. Ensure all functions use `@traceable` decorator
2. Verify parent context is passed correctly
3. Check for async/await issues in trace propagation

### High Latency Impact

1. Reduce sampling rate for high-volume applications
2. Use async tracing where available
3. Consider batching trace uploads

## Security Considerations

- Store API keys in secure environment variables, never in code
- Be mindful of PII in trace data
- Configure data retention policies in LangSmith
- Use project-level access controls for sensitive traces

## References

- [LangSmith Documentation](https://docs.langchain.com/langsmith)
- [LangChain Tracing Guide](https://python.langchain.com/docs/guides/debugging)
- [LangSmith Fetch Skill](https://github.com/ComposioHQ/awesome-claude-skills/tree/master/langsmith-fetch)

## Related Resources

- [Langfuse](https://langfuse.com) - Open source alternative
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) - Additional observability
- [OpenTelemetry](https://opentelemetry.io) - Standard instrumentation
