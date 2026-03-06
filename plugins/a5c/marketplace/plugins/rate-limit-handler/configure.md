# Rate Limit Handler — Configuration

## 1. Adjust Backoff Strategy

Edit `.claude/rate-limit-handler/config.json` to change the strategy:

```json
{
  "strategy": "exponential-jitter",
  "initialDelay": 5,
  "maxDelay": 120,
  "maxRetries": 10,
  "enableLog": true
}
```

### Available strategies:

| Strategy | Behavior | Best for |
|----------|----------|----------|
| `exponential-jitter` | Delay doubles each retry + random jitter | Shared API keys, team usage |
| `linear` | Delay increases by `initialDelay` each retry | Predictable wait times |
| `fixed` | Constant delay between retries | Simple, consistent behavior |

## 2. Tune Timing Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `initialDelay` | `5` | Base delay in seconds for first retry |
| `maxDelay` | `120` | Maximum delay cap in seconds (prevents excessive waits) |
| `maxRetries` | `10` | Retries before giving up and reporting error to Claude |
| `enableLog` | `true` | Write retry attempts to `retry.log` |

### Recommended settings by use case:

**Solo developer, dedicated API key:**
```json
{ "strategy": "exponential-jitter", "initialDelay": 3, "maxDelay": 60, "maxRetries": 5 }
```

**Team with shared API key:**
```json
{ "strategy": "exponential-jitter", "initialDelay": 10, "maxDelay": 300, "maxRetries": 15 }
```

**CI/CD pipeline (time-sensitive):**
```json
{ "strategy": "fixed", "initialDelay": 10, "maxDelay": 30, "maxRetries": 3 }
```

## 3. Customize Rate Limit Detection Patterns

Edit the `rateLimitPatterns` array in `config.json` to add or remove patterns that trigger the handler:

```json
{
  "rateLimitPatterns": [
    "rate limit",
    "rate_limit",
    "429",
    "too many requests",
    "quota exceeded",
    "overloaded",
    "capacity",
    "throttle"
  ]
}
```

If using the patterns in hooks, also update the grep pattern in `.claude/settings.json` hooks to match.

## 4. View Retry Log

```bash
cat .claude/rate-limit-handler/retry.log
```

To see recent entries:
```bash
tail -20 .claude/rate-limit-handler/retry.log
```

## 5. Reset Retry State

If the handler is in a high-backoff state and you want to reset:

```bash
bash .claude/rate-limit-handler/scripts/reset-state.sh
```

Or manually:
```bash
echo '{"retryCount": 0, "lastRetryAt": "", "totalWaited": 0}' > .claude/rate-limit-handler/state.json
```

## 6. Disable/Enable Logging

Set `enableLog` to `false` in `config.json` to stop writing to the retry log:

```json
{ "enableLog": false }
```

To clear the existing log:
```bash
> .claude/rate-limit-handler/retry.log
```

## 7. Temporarily Disable the Handler

To temporarily disable without uninstalling, comment out or remove the hook entries from `.claude/settings.json`. Re-add them to re-enable (see install.md Step 8 for the hook configuration).
