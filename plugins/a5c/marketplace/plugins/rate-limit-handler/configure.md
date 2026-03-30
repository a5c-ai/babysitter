# Rate Limit Handler -- Configuration

## 1. Adjust Backoff Parameters

Edit `.claude/rate-limit-handler/config.json`:

```json
{
  "minCooldown": 30,
  "maxCooldown": 300,
  "multiplier": 2,
  "enableLog": true,
  "rateLimitPatterns": [...]
}
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minCooldown` | `30` | Initial cooldown in seconds after first rate limit |
| `maxCooldown` | `300` | Maximum cooldown cap in seconds |
| `multiplier` | `2` | Cooldown multiplier per consecutive rate limit (exponential backoff) |
| `enableLog` | `true` | Write rate limit events to `rate-limits.log` |

### Recommended settings by use case:

**Solo developer, dedicated API key:**
```json
{ "minCooldown": 15, "maxCooldown": 120, "multiplier": 2 }
```

**Team with shared API key:**
```json
{ "minCooldown": 30, "maxCooldown": 600, "multiplier": 2 }
```

**CI/CD pipeline (time-sensitive):**
```json
{ "minCooldown": 10, "maxCooldown": 60, "multiplier": 1.5 }
```

## 2. Customize Rate Limit Detection Patterns

The `rateLimitPatterns` array controls which `PostToolUseFailure` error strings trigger the handler. Each pattern is matched case-insensitively via `grep -iE`:

```json
{
  "rateLimitPatterns": [
    "rate.limit",
    "rate_limit",
    "429",
    "too many requests",
    "quota exceeded",
    "overloaded",
    "throttle",
    "capacity"
  ]
}
```

Add patterns for custom APIs that return rate limit errors with different messages.

Note: `StopFailure` hook matches on the structured `error` enum field (`"rate_limit"`), not these patterns.

## 3. View Rate Limit Log

```bash
cat .claude/rate-limit-handler/rate-limits.log
```

Recent entries:
```bash
tail -20 .claude/rate-limit-handler/rate-limits.log
```

## 4. View Current State

```bash
cat .claude/rate-limit-handler/state.json
```

Fields:
- `consecutive` -- number of consecutive rate limits without full recovery
- `lastCooldown` -- last calculated cooldown in seconds
- `lastEventAt` -- timestamp of last rate limit
- `resumeAfter` -- recommended resume time
- `lastHook` -- which hook triggered (`PostToolUseFailure` or `StopFailure`)
- `lastTool` -- tool that was rate-limited (if applicable)

## 5. Reset Rate Limit State

If the handler is in a high-backoff state and you want to reset:

```bash
echo '{"consecutive": 0, "lastCooldown": 0}' > .claude/rate-limit-handler/state.json
```

## 6. Disable/Enable Logging

Set `enableLog` to `false` in `config.json`:

```json
{ "enableLog": false }
```

Clear existing log:
```bash
> .claude/rate-limit-handler/rate-limits.log
```

## 7. Temporarily Disable the Handler

Remove the hook entries from `.claude/settings.json`. Re-add them to re-enable (see install.md Step 11).

## 8. Understanding the Hook Architecture

| Hook | Fires when | Can influence Claude? | What it does |
|------|-----------|----------------------|--------------|
| `PostToolUseFailure` | Any tool call fails | Yes -- `additionalContext` injected into Claude's context | Detects rate limit patterns, tracks state, tells Claude to back off |
| `StopFailure` | Anthropic API returns 429 | No -- output is **ignored** | Logs event and updates state for next session |
| `SessionStart` | New session begins | Yes -- stdout added to Claude's context | Warns Claude about recent rate limits |
| `PostToolUse` | Any tool call succeeds | No (just resets internal state) | Decrements consecutive counter for gradual recovery |
