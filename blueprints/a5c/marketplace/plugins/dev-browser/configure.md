# Dev Browser -- Configure Instructions

## Configuration Options

| Setting | Location | Description |
|---------|----------|-------------|
| Headless mode | CLI flag `--headless` | Run without visible browser window (default for agent use) |
| Connect mode | CLI flag `--connect` | Attach to running Chrome with remote debugging |
| Bash permission | `.claude/settings.json` | Pre-approve dev-browser commands |
| Skill content | `.a5c/skills/dev-browser/SKILL.md` | Skill instructions and API reference |

---

## Switching to Connect Mode

To attach to an existing Chrome instance instead of launching Chromium, start Chrome with remote debugging:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222
```

Then use `--connect` instead of `--headless` in scripts. Update the CLAUDE.md section to mention `--connect` as the default mode if the user prefers this workflow.

---

## Customizing the Skill

Edit `.a5c/skills/dev-browser/SKILL.md` to add project-specific instructions. For example:

- Add common URLs the agent should use (e.g., `http://localhost:3000` for the dev server)
- Add login credentials or test account details for automated testing
- Add project-specific selectors or page patterns
- Remove sections not relevant to the project

---

## Updating dev-browser

```bash
npm update -g dev-browser
dev-browser install  # re-install Chromium if needed
```

---

## Troubleshooting

- **Chromium not found**: Run `dev-browser install` to re-download
- **Permission denied on Linux**: Chromium may need `--no-sandbox` flag; check the dev-browser docs
- **Slow startup**: First run downloads Chromium; subsequent runs reuse the cached binary
- **Port conflict with `--connect`**: Ensure only one Chrome instance uses port 9222
