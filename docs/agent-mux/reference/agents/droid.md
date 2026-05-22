# Droid

Factory AI's enterprise-grade AI coding agent with terminal integration and sophisticated workflow automation.

## Overview

[Factory Droid](https://factory.ai) is a top-performing AI coding agent built by Factory AI that provides end-to-end development workflows, debugging, refactoring, and CI/CD integration. Droid scores 58.75% on terminal benchmarks and supports both interactive chat and headless automation modes.

## Installation

### NPM (Recommended)
```bash
npm install -g @factory/droid-cli
```

### Homebrew (macOS)
```bash
brew install factory/tap/droid
```

### curl (Universal)
```bash
curl -fsSL https://get.factory.ai/droid | bash
```

## Authentication

### Factory AI Account Setup
1. Sign up at [factory.ai/signup](https://factory.ai/signup)
2. Install Droid CLI (see Installation above)
3. Authenticate with Factory AI:
   ```bash
   droid auth login
   ```
4. Verify authentication:
   ```bash
   droid whoami
   ```

### Environment Variables
```bash
export DROID_API_KEY=your_factory_api_key
```

## Usage with agent-mux

### Basic Chat
```bash
amux run droid --prompt "Help me refactor this API endpoint"
```

### Resume Session
```bash
amux run droid --session-id abc123 --prompt "Continue with the optimization"
```

### Model Selection
```bash
amux run droid --model gpt-5-turbo --prompt "Generate a complete REST API"
amux run droid --model claude-sonnet --prompt "Review this code for security issues"
amux run droid --model gemini-flash --prompt "Create unit tests for this module"
```

### Auto-approve Tools (Yolo Mode)
```bash
amux run droid --tool-approval-mode yolo --prompt "Fix all linting errors in src/"
```

### Working Directory
```bash
amux run droid --cwd /path/to/project --prompt "Analyze the codebase structure"
```

## Supported Models

| Model ID | Alias | Context Window | Output Tokens | Input Price | Output Price |
|----------|-------|----------------|---------------|-------------|--------------|
| `gpt-5-turbo` | `gpt-5-turbo` | 256,000 | 16,384 | $2.00/1M | $8.00/1M |
| `claude-3-5-sonnet-20241022` | `claude-sonnet` | 200,000 | 8,192 | $3.00/1M | $15.00/1M |
| `gemini-2-flash` | `gemini-flash` | 1,000,000 | 8,192 | $0.075/1M | $0.30/1M |

Default model: `gpt-5-turbo`

## Capabilities

- **Multi-turn conversations** with session persistence
- **Tool calling** with parallel execution (up to 10 concurrent)
- **File operations** with comprehensive project analysis
- **Code generation** and refactoring with enterprise patterns
- **Debugging** and error analysis
- **CI/CD integration** via headless mode
- **MCP plugin support** for extensibility
- **Workflow automation** for complex development tasks
- **Interactive approval** or auto-approve (yolo) modes

## Sessions

Droid sessions are stored in:
```
~/.config/droid/sessions/
```

### Session Management
```bash
# List sessions
amux sessions droid

# Read session
amux sessions droid read <session-id>

# Resume session
amux run droid --session-id <session-id>

# Fork session
amux sessions droid fork <session-id> --name "feature-branch"
```

## MCP Plugins

Droid supports MCP (Model Context Protocol) servers for enhanced functionality:

```bash
# List available plugins
amux plugins list droid

# Install MCP server
amux plugins install droid <mcp-server>

# List installed plugins
amux plugins list droid --installed
```

## Configuration

Droid configuration is stored in:
```
~/.config/droid/config.json
```

### Project-specific Configuration
Create `.droid/config.json` in your project root:
```json
{
  "defaultModel": "claude-sonnet",
  "autoApprove": false,
  "maxParallelTasks": 5,
  "workflowPresets": {
    "code-review": {
      "systemPrompt": "Focus on security, performance, and maintainability",
      "model": "gpt-5-turbo"
    }
  }
}
```

## Enterprise Features

### Headless Mode
Perfect for CI/CD pipelines and automation:
```bash
# One-shot execution
droid exec --prompt "Run all tests and fix failures" --headless

# Via agent-mux
amux run droid --prompt "Generate deployment scripts" --headless
```

### Parallel Execution
Droid can handle multiple tasks simultaneously:
```bash
amux run droid --prompt "Optimize performance while fixing security issues"
```

### Workflow Automation
Create complex development workflows:
```bash
amux run droid --prompt "
1. Analyze the codebase for technical debt
2. Create refactoring plan
3. Implement high-priority improvements
4. Generate comprehensive tests
5. Update documentation
"
```

## Error Handling

Common error codes and solutions:

| Error Code | Description | Solution |
|------------|-------------|----------|
| `AUTH_FAILED` | Authentication required | Run `droid auth login` |
| `API_QUOTA_EXCEEDED` | Usage limits reached | Check billing at factory.ai |
| `INVALID_MODEL` | Model not available | Use supported model ID |
| `TOOL_EXECUTION_FAILED` | Tool call failed | Check file permissions and paths |

## Troubleshooting

### Authentication Issues
```bash
# Check authentication status
droid whoami

# Re-authenticate
droid auth logout
droid auth login
```

### Performance Issues
```bash
# Check system status
droid status

# Clear cache
droid cache clear
```

### Session Issues
```bash
# Verify session directory
ls ~/.config/droid/sessions/

# Check session file integrity
amux sessions droid read <session-id> --validate
```

## Best Practices

1. **Use specific models** for different tasks:
   - `gpt-5-turbo`: General coding and architecture
   - `claude-sonnet`: Code review and documentation
   - `gemini-flash`: Quick prototyping and testing

2. **Leverage headless mode** for automation:
   ```bash
   amux run droid --prompt "Daily code quality check" --headless
   ```

3. **Configure project-specific settings** in `.droid/config.json`

4. **Use auto-approve carefully** - only in trusted environments:
   ```bash
   amux run droid --tool-approval-mode yolo --prompt "Format all files"
   ```

5. **Monitor costs** with cost tracking:
   ```bash
   amux run droid --prompt "Complex refactoring task" | amux cost
   ```

## Links

- [Factory AI Website](https://factory.ai)
- [Droid Documentation](https://docs.factory.ai/droid)
- [Factory AI Blog](https://factory.ai/blog)
- [Terminal Benchmark Results](https://factory.ai/news/terminal-bench)
