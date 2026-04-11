# Rate Limit Handler -- Install Instructions

Automatically retry Claude Code sessions when you hit Anthropic subscription rate limits. Uses [claude-auto-retry](https://github.com/cheapestinference/claude-auto-retry) to detect rate limit messages, parse reset times (timezone-aware), wait for the cooldown, and send a continuation message -- so you return to find your work completed.

**Requirements:** Node.js >= 18, tmux >= 2.1 (auto-installed if missing), bash or zsh shell.

## Step 1: Interview the User

Ask the user:

- What is the maximum number of retry attempts per rate-limit event? (default: `5`)
- How many seconds of extra margin after the reset time? (default: `60`)
- What message should be sent to Claude on retry? (default: `"Continue where you left off."`)
- Any custom regex patterns to detect rate limits beyond the built-in ones? (default: none)

## Step 2: Install the npm Package

```bash
npm i -g claude-auto-retry
```

## Step 3: Run the Installer

This injects a shell function into the user's rc files (.bashrc or .zshrc) and ensures tmux is available. If tmux is not installed, it auto-installs via the system package manager (apt, dnf, brew, pacman, or apk).

```bash
claude-auto-retry install
```

## Step 4: Create the Configuration File

Create `~/.claude-auto-retry.json` with the user's selections:

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

Adjust values based on the user's answers from Step 1. All fields are optional -- missing or invalid values fall back to safe defaults automatically.

## Step 5: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name rate-limit-handler --plugin-version 2.0.0 --project --json
```

## Step 6: Verify Setup

```bash
# 1. Check the tool is installed
claude-auto-retry version

# 2. Check config exists (optional -- tool works without it)
cat ~/.claude-auto-retry.json

# 3. Check status
claude-auto-retry status
```

## How It Works

1. The shell function wraps `claude` to launch sessions inside a tmux session.
2. A background monitor polls the terminal every 5 seconds for rate-limit patterns (e.g., "5-hour limit reached - resets 3pm").
3. When detected, it parses the timezone-aware reset time, waits until reset plus the configured margin.
4. It verifies Claude is still the foreground process, then sends the retry message via tmux keystroke injection.
5. This repeats up to `maxRetries` times per rate-limit event.

## Notes

- Unlike the previous hook-based approach, this tool works at the terminal level -- no Claude Code hooks are needed.
- The tool handles timezone parsing automatically, so reset times like "resets 3pm" are resolved correctly for the user's local timezone.
- Sessions launched outside the shell wrapper (e.g., from an IDE) are not monitored. Use the shell function for auto-retry.
- The fallback wait (`fallbackWaitHours`) is used when the reset time cannot be parsed from the rate limit message.
