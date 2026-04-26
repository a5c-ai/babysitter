# Amp

Sourcegraph's agentic coding assistant with multi-model support and specialized subagents for advanced code understanding.

## Overview

[Sourcegraph Amp](https://sourcegraph.com/amp) is an intelligent coding agent that combines multiple AI models with specialized subagents to deliver superior code understanding and generation. Features include the Oracle multi-model routing system, Librarian code search capabilities, and deep integration with Sourcegraph's code intelligence platform.

## Installation

### NPM (Recommended)
```bash
npm install -g @sourcegraph/amp-cli
```

### curl (Universal)
```bash
curl -fsSL https://get.sourcegraph.com/amp | bash
```

### Binary Download
Download from [GitHub Releases](https://github.com/sourcegraph/amp/releases) for your platform.

## Authentication

### Sourcegraph Account Setup
1. Sign up at [sourcegraph.com/sign-up](https://sourcegraph.com/sign-up)
2. Install Amp CLI (see Installation above)
3. Generate an access token:
   ```bash
   open https://sourcegraph.com/users/settings/tokens
   ```
4. Authenticate with Sourcegraph:
   ```bash
   amp auth login
   ```
5. Verify authentication:
   ```bash
   amp --version
   ```

### Environment Variables
```bash
export SOURCEGRAPH_ACCESS_TOKEN=your_sourcegraph_token
```

## Usage with agent-mux

### Basic Chat
```bash
amux run amp --prompt "Explain this codebase architecture"
```

### Resume Session
```bash
amux run amp --session-id def456 --prompt "Continue the code review"
```

### Model Selection
```bash
# Oracle multi-model routing (default)
amux run amp --model oracle --prompt "Optimize this algorithm"

# Specific model selection
amux run amp --model claude-sonnet --prompt "Review for security vulnerabilities"
amux run amp --model gpt-4o --prompt "Generate comprehensive tests"
amux run amp --model gemini-pro --prompt "Refactor for better maintainability"
```

### Auto-approve Tools (Yolo Mode)
```bash
amux run amp --tool-approval-mode yolo --prompt "Fix all ESLint warnings"
```

### Working Directory
```bash
amux run amp --cwd /path/to/project --prompt "Analyze code complexity"
```

## Supported Models

| Model ID | Alias | Context Window | Output Tokens | Input Price | Output Price |
|----------|-------|----------------|---------------|-------------|--------------|
| `amp-oracle` | `oracle` | 200,000 | 8,192 | Dynamic | Dynamic |
| `claude-3-5-sonnet-20241022` | `claude-sonnet` | 200,000 | 8,192 | $3.00/1M | $15.00/1M |
| `gpt-4o` | `gpt-4o` | 128,000 | 4,096 | $5.00/1M | $15.00/1M |
| `gemini-1.5-pro` | `gemini-pro` | 2,000,000 | 8,192 | $1.25/1M | $5.00/1M |

Default model: `amp-oracle` (multi-model routing)

## Capabilities

- **Oracle Multi-Model Routing** - Automatically selects the best model for each task
- **Specialized Subagents** - Librarian for code search, Oracle for complex reasoning
- **Multi-turn conversations** with session persistence
- **Tool calling** with parallel execution (up to 8 concurrent)
- **Code understanding** with Sourcegraph's code intelligence
- **File operations** with comprehensive project analysis
- **Interactive approval** or auto-approve (yolo) modes
- **MCP plugin support** for extensibility
- **VS Code integration** for enhanced development workflow

## Subagents

### Oracle
Multi-model routing system that automatically selects the best AI model for each task:
```bash
amux run amp --model oracle --prompt "Complex architectural decision"
```

### Librarian
Code search and analysis specialist powered by Sourcegraph's code graph:
```bash
amux run amp --prompt "Find all implementations of the authentication interface"
```

## Sessions

Amp sessions are stored in:
```
~/.config/amp/sessions/
```

### Session Management
```bash
# List sessions
amux sessions amp

# Read session
amux sessions amp read <session-id>

# Resume session
amux run amp --session-id <session-id>

# Fork session
amux sessions amp fork <session-id> --name "experimental-branch"
```

## MCP Plugins

Amp supports MCP (Model Context Protocol) servers for enhanced functionality:

```bash
# List available plugins
amux plugins list amp

# Install MCP server
amux plugins install amp <mcp-server>

# List installed plugins
amux plugins list amp --installed
```

## Configuration

Amp configuration is stored in:
```
~/.config/amp/config.json
```

### Project-specific Configuration
Create `.amp/config.json` in your project root:
```json
{
  "defaultModel": "oracle",
  "autoApprove": false,
  "maxParallelTasks": 6,
  "subagentPreferences": {
    "enableOracle": true,
    "enableLibrarian": true
  },
  "sourcegraphEndpoint": "https://sourcegraph.company.com"
}
```

## Advanced Features

### Multi-Model Routing
The Oracle system automatically routes queries to the most appropriate model:
```bash
# Let Oracle decide the best model for your task
amux run amp --model oracle --prompt "
1. Analyze performance bottlenecks
2. Suggest optimization strategies  
3. Implement the most impactful fix
"
```

### Code Intelligence Integration
Leverage Sourcegraph's code graph for deep understanding:
```bash
amux run amp --prompt "
Find all callers of the deprecated API endpoint
and suggest migration strategies for each usage
"
```

### Parallel Subagent Execution
Amp can run multiple specialized agents simultaneously:
```bash
amux run amp --prompt "
Simultaneously:
- Search for security vulnerabilities (Librarian)
- Optimize performance (Oracle routing)
- Generate comprehensive tests
"
```

### Custom Sourcegraph Instance
For enterprise users with private Sourcegraph instances:
```bash
# Configure in .amp/config.json
{
  "sourcegraphEndpoint": "https://sourcegraph.company.com",
  "defaultModel": "oracle"
}
```

## Error Handling

Common error codes and solutions:

| Error Code | Description | Solution |
|------------|-------------|----------|
| `SOURCEGRAPH_AUTH_FAILED` | Authentication required | Run `amp auth login` |
| `INVALID_ACCESS_TOKEN` | Token expired/invalid | Generate new token at sourcegraph.com |
| `MODEL_NOT_AVAILABLE` | Model not accessible | Check subscription and model permissions |
| `SUBAGENT_TIMEOUT` | Subagent execution timeout | Increase timeout or simplify query |

## Troubleshooting

### Authentication Issues
```bash
# Check authentication status
amp auth status

# Re-authenticate
amp auth logout
amp auth login
```

### Model Access Issues
```bash
# Check available models
amp models list

# Test specific model
amp chat --model claude-sonnet --prompt "test"
```

### Subagent Issues
```bash
# Check subagent status
amp subagents status

# Reset subagent cache
amp subagents reset
```

### Session Issues
```bash
# Verify session directory
ls ~/.config/amp/sessions/

# Check session file integrity
amux sessions amp read <session-id> --validate
```

## Best Practices

1. **Use Oracle routing** for complex, multi-step tasks:
   ```bash
   amux run amp --model oracle --prompt "Full-stack feature implementation"
   ```

2. **Leverage Librarian** for code discovery:
   ```bash
   amux run amp --prompt "Find all error handling patterns in the codebase"
   ```

3. **Configure project-specific settings** in `.amp/config.json`

4. **Use auto-approve carefully** - only in trusted environments:
   ```bash
   amux run amp --tool-approval-mode yolo --prompt "Format and lint all files"
   ```

5. **Monitor costs** with cost tracking:
   ```bash
   amux run amp --prompt "Complex refactoring task" | amux cost
   ```

6. **Combine models strategically**:
   - `oracle`: Complex reasoning and multi-step tasks
   - `claude-sonnet`: Code review and documentation
   - `gpt-4o`: General coding and API integration
   - `gemini-pro`: Large file analysis and pattern recognition

## VS Code Integration

Amp integrates seamlessly with VS Code:

1. Install the Sourcegraph VS Code extension
2. Configure Amp in your workspace settings
3. Use Amp directly from VS Code command palette

## Links

- [Sourcegraph Website](https://sourcegraph.com)
- [Amp Documentation](https://docs.sourcegraph.com/amp)
- [Sourcegraph Blog](https://sourcegraph.com/blog)
- [Oracle Model Routing](https://sourcegraph.com/blog/oracle-routing)
- [Code Intelligence Platform](https://sourcegraph.com/code-intelligence)
