---
name: langsmith-tracing
description: LangSmith tracing and debugging setup for LLM applications. Configure observability, capture traces, and enable debugging for LangChain/LangGraph agents.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch
---

# langsmith-tracing

Configure LangSmith observability and tracing for LLM applications built with LangChain and LangGraph frameworks.

## Overview

LangSmith is the managed observability suite by LangChain that provides:
- Dashboards and alerting for LLM applications
- Human-in-the-loop evaluation capabilities
- Deep LangChain/LangGraph integration
- Run Tree model for nested traces
- MCP connectivity to Claude, VSCode

## Capabilities

### Core Tracing Setup
- Initialize LangSmith client and API configuration
- Configure project/workspace settings
- Set up trace collection and sampling
- Enable debug logging for agent execution

### Integration Patterns
- LangChain chain tracing with automatic instrumentation
- LangGraph workflow state tracking
- Custom span creation for non-LangChain code
- Parent-child trace relationships

### Debugging Features
- Fetch execution traces for analysis
- Query run history and metadata
- Export traces for offline analysis
- Compare runs across different versions

## Usage

### Environment Setup

```bash
# Set required environment variables
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=<your-api-key>
export LANGCHAIN_PROJECT=<project-name>
```

### Python Integration

```python
from langsmith import Client, traceable
from langchain.callbacks.tracers import LangChainTracer

# Initialize client
client = Client()

# Use @traceable decorator for custom functions
@traceable(name="custom_operation")
def my_function(input_data):
    # Your logic here
    return result

# Initialize tracer for LangChain
tracer = LangChainTracer(project_name="my-project")

# Use with LangChain chains
chain.invoke(input, config={"callbacks": [tracer]})
```

### Trace Retrieval

```python
# Fetch traces from LangSmith
runs = client.list_runs(
    project_name="my-project",
    start_time=datetime.now() - timedelta(hours=24),
    execution_order=1,  # Root runs only
    error=False,  # Successful runs only
)

for run in runs:
    print(f"Run ID: {run.id}")
    print(f"Latency: {run.latency_p99}")
    print(f"Tokens: {run.total_tokens}")
```

## Task Definition

When used in a babysitter process, this skill produces:

```javascript
const langsmithTracingTask = defineTask({
  name: 'langsmith-tracing-setup',
  description: 'Configure LangSmith tracing for the application',

  inputs: {
    projectName: { type: 'string', required: true },
    apiKeyEnvVar: { type: 'string', default: 'LANGCHAIN_API_KEY' },
    samplingRate: { type: 'number', default: 1.0 },
    enableDebug: { type: 'boolean', default: false }
  },

  outputs: {
    configured: { type: 'boolean' },
    projectUrl: { type: 'string' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure LangSmith tracing for ${inputs.projectName}`,
      skill: {
        name: 'langsmith-tracing',
        context: {
          projectName: inputs.projectName,
          apiKeyEnvVar: inputs.apiKeyEnvVar,
          samplingRate: inputs.samplingRate,
          enableDebug: inputs.enableDebug,
          instructions: [
            'Verify LangSmith API credentials are available',
            'Create or validate project configuration',
            'Set up tracing instrumentation in codebase',
            'Configure sampling rate and debug settings',
            'Verify traces are being captured correctly'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Applicable Processes

- llm-observability-monitoring
- agent-evaluation-framework
- react-agent-implementation
- conversation-quality-testing
- regression-testing-agent

## External Dependencies

- LangSmith account and API key
- LangChain Python library
- langsmith Python package

## References

- [LangSmith Documentation](https://docs.langchain.com/langsmith/observability)
- [LangSmith Fetch Skill](https://github.com/ComposioHQ/awesome-claude-skills/tree/master/langsmith-fetch)
- [Langfuse Integration](https://langfuse.com)
- [Comet Opik MCP](https://github.com/comet-ml/opik-mcp)

## Related Skills

- SK-OBS-002 langfuse-integration
- SK-OBS-003 phoenix-arize-setup
- SK-OBS-004 opentelemetry-llm

## Related Agents

- AG-OPS-004 observability-engineer
- AG-SAF-004 agent-evaluator
