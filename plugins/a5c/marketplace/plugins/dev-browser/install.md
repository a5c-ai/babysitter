# Dev Browser -- Install Instructions

This plugin installs [dev-browser](https://github.com/SawyerHood/dev-browser) -- a sandboxed browser automation CLI for AI agents. Scripts run in a QuickJS WASM sandbox with no host access, supporting persistent named pages, full Playwright API, screenshots, and AI-optimized page snapshots.

---

## Step 1: Install dev-browser

```bash
npm install -g dev-browser
dev-browser install
```

The `install` command downloads Playwright and Chromium. On Windows, it also fetches the native executable.

Verify installation:

```bash
dev-browser --version
```

If the install fails (e.g., behind a corporate proxy or restricted network), ask the user to troubleshoot their npm/network config before continuing.

---

## Step 2: Install the Skill

Create the skill directory and write the skill file:

```bash
mkdir -p .a5c/skills/dev-browser
```

Write `.a5c/skills/dev-browser/SKILL.md`:

```markdown
---
name: dev-browser
description: Browser automation with persistent page state. Use when users ask to navigate websites, fill forms, take screenshots, extract web data, test web apps, or automate browser workflows. Trigger phrases include "go to [url]", "click on", "fill out the form", "take a screenshot", "scrape", "automate", "test the website", "log into", or any browser interaction request.
---

# Dev Browser

A CLI for controlling browsers with sandboxed JavaScript scripts.
Scripts run in a QuickJS WASM sandbox with no host filesystem or network access.

## Quick Start

Run `dev-browser --help` to get the full API reference and usage guide.

## Usage

Pass JavaScript to dev-browser via stdin. Scripts have access to a `browser` global.

### Headless (default -- no visible window)

```bash
dev-browser --headless <<'EOF'
const page = await browser.getPage("main");
await page.goto("https://example.com");
console.log(await page.title());
EOF
```

### Connect to running Chrome

Start Chrome with `--remote-debugging-port=9222`, then:

```bash
dev-browser --connect <<'EOF'
const tabs = await browser.listPages();
console.log(JSON.stringify(tabs, null, 2));
EOF
```

## API Reference

### Browser Control

| Method | Description |
|--------|-------------|
| `browser.getPage(name)` | Get or create a named persistent page |
| `browser.newPage()` | Create a temporary page (cleaned after script) |
| `browser.listPages()` | List open tabs: `[{id, url, title, name}]` |
| `browser.closePage(name)` | Close a named page |

### Page Methods (Playwright API)

Pages are full Playwright Page objects. Key methods:

- `page.goto(url)` -- navigate
- `page.click(selector)` -- click element
- `page.fill(selector, value)` -- fill input
- `page.locator(selector)` -- get element locator
- `page.evaluate(fn)` -- run JS in page context
- `page.screenshot()` -- capture screenshot buffer
- `page.snapshotForAI({track?, depth?, timeout?})` -- AI-optimized DOM snapshot returning `{full, incremental?}`

### File I/O (restricted to `~/.dev-browser/tmp/`)

| Function | Description |
|----------|-------------|
| `saveScreenshot(buf, name)` | Save screenshot, returns file path |
| `writeFile(name, data)` | Write data, returns file path |
| `readFile(name)` | Read file contents |

### Output

`console.log/warn/error/info` route to CLI stdout/stderr.

## Tips

- **Named pages persist** across scripts. Navigate once with `getPage("app")`, then interact in subsequent calls without re-navigating.
- **Prefer `--headless`** unless the user needs to see the browser or interact with it.
- **Use `--connect`** to attach to a running Chrome for debugging existing sessions.
- **Screenshots**: capture with `page.screenshot()`, save with `saveScreenshot(buf, "name.png")`, then reference the returned file path.
- **AI snapshots**: use `page.snapshotForAI()` to get a compact DOM representation optimized for LLM consumption instead of raw HTML.
```

---

## Step 3: Add Permission to Settings

Add the dev-browser Bash permission to the project's `.claude/settings.json` so the agent doesn't get blocked by approval prompts on every call. This is safe because dev-browser scripts run in a WASM sandbox with no host access.

Merge the following into `.claude/settings.json` (preserve existing permissions):

```json
{
  "permissions": {
    "allow": [
      "Bash(dev-browser *)"
    ]
  }
}
```

If `.claude/settings.json` already has an `allow` array, append `"Bash(dev-browser *)"` to it. Do not overwrite existing entries.

---

## Step 4: Add CLAUDE.md Integration

Append the following block to the project's `CLAUDE.md` (create if it doesn't exist):

```markdown
## Dev Browser

This project has [dev-browser](https://github.com/SawyerHood/dev-browser) installed for browser automation.

### When to use
- Navigating to URLs, taking screenshots, extracting page data
- Filling forms, clicking buttons, testing web UI
- Verifying frontend changes visually
- Scraping structured data from web pages

### Usage pattern
Pass JavaScript to `dev-browser` via stdin:

```bash
dev-browser --headless <<'EOF'
const page = await browser.getPage("main");
await page.goto("http://localhost:3000");
const screenshot = await page.screenshot();
const path = await saveScreenshot(screenshot, "app.png");
console.log(path);
EOF
```

### Key points
- Scripts run in a sandboxed WASM environment -- no host filesystem or network access
- Use `browser.getPage("name")` for persistent pages that survive across script calls
- Use `page.snapshotForAI()` for AI-optimized DOM snapshots instead of raw HTML
- Run `dev-browser --help` for the full API reference
```

---

## Step 5: Verify Installation

```bash
# 1. Check dev-browser is available
dev-browser --version

# 2. Run a quick headless test
dev-browser --headless <<'EOF'
const page = await browser.getPage("test");
await page.goto("https://example.com");
const title = await page.title();
console.log("Page title: " + title);
await browser.closePage("test");
EOF
```

If the test prints a page title, the installation is working. If it fails, check that Chromium was installed correctly (`dev-browser install`).

---

## Step 6: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name dev-browser --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

---

## Post-Installation Summary

```
Dev Browser Plugin -- Installation Complete

Binary:      dev-browser $(dev-browser --version 2>/dev/null || echo "not found")
Skill:       .a5c/skills/dev-browser/SKILL.md
Permission:  Bash(dev-browser *) added to .claude/settings.json
CLAUDE.md:   Dev Browser section appended

The agent can now automate browser interactions via dev-browser.
Named pages persist across script calls for multi-step workflows.
Run `dev-browser --help` for the full API reference.
```
