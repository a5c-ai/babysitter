# LunaRoute Babysitter Plugin

A comprehensive babysitter marketplace plugin for installing and configuring [LunaRoute](https://github.com/erans/lunaroute) - a local proxy server that provides complete visibility into AI coding assistant interactions.

## What is LunaRoute?

LunaRoute is a local proxy server built in Rust that sits between AI coding assistants and LLM providers, offering:

- **Complete Visibility**: Zero-overhead passthrough with full interaction recording
- **Session Analytics**: Token tracking, cost analysis, and performance metrics
- **PII Protection**: Automatic detection and redaction of sensitive data
- **Model Routing**: Mid-session model switching with simple commands
- **Multi-Harness Support**: Works with Claude Code, Cursor, VS Code, Codex CLI, and more

## Features

### 🎯 **Universal Harness Compatibility**
- Claude Code, Cursor, VS Code + Continue, Codex CLI
- Generic configuration instructions for any AI harness
- Preserves existing API keys and authentication

### 🚀 **Mid-Session Model Routing**
- `#!sonnet` - Switch to Claude 3.5 Sonnet
- `#!opus` - Switch to Claude 3 Opus
- `#!haiku` - Switch to Claude 3 Haiku
- `#!gpt-4o` - Switch to GPT-4o
- `#!clear` - Remove active route

### 📊 **Real-Time Dashboard**
- Web interface at `http://localhost:8082`
- Session browser and conversation history
- Token usage analytics and cost tracking
- Performance metrics and response times

### 🔒 **Privacy & Security**
- Automatic PII detection (emails, phone numbers, SSNs)
- Configurable redaction patterns
- Local storage only - no data leaves your machine
- Complete audit trail of all interactions

## Quick Start

### Installation

1. **Install via Babysitter Plugin System**:
   ```bash
   babysitter plugin:install --plugin-name lunaroute --marketplace-name a5c --project
   ```

2. **Follow Installation Instructions**:
   - The plugin provides step-by-step instructions for your specific setup
   - Automatically detects your AI harness and configures proxy settings
   - Builds LunaRoute server from source with all dependencies

3. **Start Using**:
   - Your AI harness will automatically route through LunaRoute
   - Access the dashboard at `http://localhost:8082`
   - Try route commands like `#!sonnet What is LunaRoute?`

### Configuration

The plugin supports extensive configuration options:

- **Ports**: Customize proxy (8081) and dashboard (8082) ports
- **Model Routes**: Add custom model mappings
- **PII Protection**: Configure redaction patterns
- **Session Recording**: Control interaction logging
- **Environment Settings**: Separate configs for dev/staging/prod

See `configure.md` for detailed configuration instructions.

## File Structure

```
lunaroute/
├── install.md          # Complete installation guide
├── uninstall.md        # Clean removal instructions  
├── configure.md        # Configuration reference
├── package.json        # Plugin metadata
└── README.md          # This file
```

## Harness-Specific Setup

### Claude Code
Automatically configures `~/.claude/settings.json` with proxy endpoints.

### Cursor
Sets up both Anthropic and OpenAI proxy URLs in `~/.cursor/settings.json`.

### VS Code + Continue
Provides model configurations for the Continue extension.

### Generic Harness
Universal instructions for any AI coding assistant.

## Route Commands

LunaRoute enables mid-session model switching:

```bash
# Basic model switching
#!sonnet
#!gpt-4o

# Inline commands  
#!opus Explain this complex algorithm
#!haiku Write a quick summary

# Clear routing
#!clear
```

Route commands persist for the session and can be used for:
- **Cost Optimization**: Use Haiku for simple tasks, Opus for complex analysis
- **Comparative Analysis**: Get different perspectives from different models
- **Model-Specific Tasks**: Leverage each model's strengths

## Dashboard Features

Access the web dashboard at `http://localhost:8082`:

### Session Browser
- View all recorded interactions
- Search and filter conversations
- Export session data

### Analytics
- Token usage by model and time period
- Cost tracking and budget analysis  
- Response time and throughput metrics

### PII Detection
- Review automatically redacted content
- Configure custom redaction patterns
- Audit data privacy compliance

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 8081/8082 are available
2. **Build Failures**: Verify Rust toolchain installation
3. **Harness Not Detecting**: Check proxy URL configuration
4. **Route Commands Not Working**: Verify harness hook setup

### Getting Help

- Check the troubleshooting sections in `install.md` and `configure.md`  
- Visit the [LunaRoute repository](https://github.com/erans/lunaroute)
- Review the babysitter plugin documentation

## Advanced Usage

### Custom Model Routes
Add new models to your configuration:
```json
{
  "model_routes": {
    "custom": "gpt-4o-mini",
    "coding": "claude-3-5-sonnet-20241022"
  }
}
```

### Environment-Specific Configs
- **Development**: Full logging and debugging
- **Production**: Minimal logging, no session recording
- **Team**: Shared dashboard, PII protection enabled

### Integration Patterns
- **CI/CD Monitoring**: Track model usage in automated workflows
- **Cost Management**: Set up usage alerts and budgets
- **Quality Assurance**: Compare model outputs for testing

## Plugin Architecture

This babysitter plugin provides:

### Generic Instructions
- Works with any AI harness through standard proxy configuration
- No harness-specific dependencies or integrations required
- Preserves existing authentication and API key setup

### Automated Setup
- Detects installed AI harnesses automatically
- Creates backup configurations before modification
- Provides rollback instructions for safe removal

### Cross-Platform Support
- Windows, macOS, and Linux compatible
- Handles platform-specific configuration paths
- Rust build system manages dependencies

## Contributing

This plugin replicates the functionality of the [lunaroute-cc-plugin](https://github.com/erans/lunaroute-cc-plugin) but provides generic, harness-agnostic instructions suitable for the babysitter marketplace.

To contribute:
1. Test with different AI harnesses
2. Improve installation instructions
3. Add support for new route commands
4. Submit feedback via babysitter contrib system

---

**Ready to get complete visibility into your AI coding sessions?**

Install the LunaRoute plugin and start monitoring your LLM interactions today!