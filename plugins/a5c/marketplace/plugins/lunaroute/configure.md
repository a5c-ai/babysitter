# LunaRoute Configuration Instructions

Configure LunaRoute for optimal performance with your AI coding harness.

## Server Configuration

Edit the main configuration file at:
`<project-root>/.lunaroute/config/lunaroute-config.json`

Example configuration:
```
{
  "proxy_port": 8081,
  "dashboard_port": 8082,
  "enable_pii_protection": true,
  "enable_session_recording": true,
  "model_routes": {
    "sonnet": "claude-3-5-sonnet-20241022",
    "opus": "claude-3-opus-20240229",
    "haiku": "claude-3-haiku-20240307",
    "gpt-4o": "gpt-4o-2024-11-20"
  }
}
```

## Harness Configuration

### Claude Code
Edit ~/.claude/settings.json:
```
{
  "anthropic_api_base_url": "http://localhost:8081/v1"
}
```

### Cursor
Edit ~/.cursor/settings.json:
```
{
  "anthropic_api_base_url": "http://localhost:8081/v1",
  "openai_api_base_url": "http://localhost:8081/v1"
}
```

### Generic Harness
Configure these endpoints:
- Anthropic API: http://localhost:8081/v1
- OpenAI API: http://localhost:8081/v1

## Route Commands

Use these commands in your AI harness:
- #!sonnet - Switch to Claude 3.5 Sonnet
- #!opus - Switch to Claude 3 Opus
- #!haiku - Switch to Claude 3 Haiku
- #!gpt-4o - Switch to GPT-4o
- #!clear - Remove active route

## Restart Server

After configuration changes:
```bash
kill $(cat <project-root>/.lunaroute/lunaroute-server.pid)
cd <project-root>/.lunaroute/server/lunaroute
CONFIG_FILE="../../config/lunaroute-config.json" ./target/release/lunaroute-server &
echo $! > <project-root>/.lunaroute/lunaroute-server.pid
```

## Dashboard Access

Open browser to: http://localhost:8082

## Configuration Options

- proxy_port: Port for the proxy server (default: 8081)
- dashboard_port: Port for the dashboard (default: 8082)
- enable_pii_protection: Auto-detect and redact sensitive data
- enable_session_recording: Record all interactions
- model_routes: Mapping of route commands to models

## Troubleshooting

1. Validate JSON syntax: `jq '.' config.json`
2. Check port availability: `lsof -i :8081`
3. Verify harness config has proxy URLs
4. Test with simple prompt after configuration

Configuration complete!