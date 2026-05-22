# Rate Limit Handler -- Configuration

## 1. Adjust Settings

Edit `~/.claude-auto-retry.json`:

```json
{
  "maxRetries": 5,
  "pollIntervalSeconds": 5,
  "marginSeconds": 60,
  "fallbackWaitHours": 5,
  "retryMessage": "Continue where you left off.",
  "customPatterns": []
}
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxRetries` | `5` | Maximum retry attempts per rate-limit event |
| `pollIntervalSeconds` | `5` | How often (seconds) the monitor checks the terminal for rate limit messages |
| `marginSeconds` | `60` | Extra seconds to wait after the parsed reset time before retrying |
| `fallbackWaitHours` | `5` | Default wait hours if the reset time cannot be parsed |
| `retryMessage` | `"Continue where you left off."` | Message sent to Claude when retrying after a rate limit |
| `customPatterns` | `[]` | Additional regex patterns to detect rate limit messages beyond built-in ones |

All fields are optional. Missing or invalid values fall back to safe defaults automatically.

### Recommended settings by use case:

**Default (conservative):**
```json
{ "maxRetries": 5, "marginSeconds": 60, "pollIntervalSeconds": 5 }
```

**Aggressive retry (minimize downtime):**
```json
{ "maxRetries": 10, "marginSeconds": 30, "pollIntervalSeconds": 3 }
```

**CI/CD or unattended (long tolerance):**
```json
{ "maxRetries": 20, "marginSeconds": 120, "fallbackWaitHours": 8 }
```

## 2. Custom Rate Limit Patterns

Add regex patterns to `customPatterns` to detect rate limit messages from custom or updated Claude responses:

```json
{
  "customPatterns": [
    "usage cap reached",
    "try again in \\d+ minutes"
  ]
}
```

Built-in patterns already cover standard Anthropic rate limit messages. Custom patterns are checked in addition to the defaults.

## 3. Check Status

```bash
claude-auto-retry status
```

Shows whether the monitor is active, recent detections, and current configuration.

## 4. View Logs

```bash
# Tail today's log file in real-time
claude-auto-retry logs
```

Logs include timestamps, detected rate limit messages, parsed reset times, wait durations, and retry attempts.

## 5. Custom Retry Message

Set `retryMessage` to control what Claude sees when the session resumes:

```json
{ "retryMessage": "Continue with the implementation. Pick up where you left off." }
```

## 6. Temporarily Disable

To stop auto-retry without uninstalling, launch Claude directly instead of through the shell wrapper:

```bash
# This bypasses the tmux wrapper
command claude
```

Or set `maxRetries` to `0`:

```json
{ "maxRetries": 0 }
```
