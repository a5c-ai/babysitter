# Status Line Plugin — Configuration

The status line plugin displays `run:<runId>` when the current Claude Code session is associated with a babysitter run. Configuration options are minimal by design.

## 1. Change Output Format

Edit `~/.claude/statusline-command.sh` and modify the `printf` line at the bottom of the script.

| Format | printf Line | Example Output |
|--------|-------------|----------------|
| Short (default) | `printf 'run:%s' "$run_id"` | `run:abc123` |
| Verbose | `printf 'babysitter run: %s' "$run_id"` | `babysitter run: abc123` |
| Minimal | `printf '%s' "$run_id"` | `abc123` |

## 2. Add Additional State Fields

The session state files (`.md` with YAML frontmatter) may contain other fields beyond `run_id`. To display additional information, add more `grep` extractions in the script after the `run_id` extraction block.

For example, to also show process ID:

```bash
process_id=$(grep -m1 '^process_id:' "$session_file" 2>/dev/null | sed 's/^process_id:[[:space:]]*//' | tr -d '[:space:]')
```

Then update the `printf` to include it:

```bash
if [ -n "$process_id" ]; then
  printf 'run:%s [%s]' "$run_id" "$process_id"
else
  printf 'run:%s' "$run_id"
fi
```

## 3. Add Custom State Directories

If your babysitter state files are stored in a non-standard location, add entries to the `state_dirs` array in the script:

```bash
state_dirs+=("/path/to/custom/state")
```

## 4. Disable Without Uninstalling

To temporarily disable the status line, edit `~/.claude/settings.json` and remove or comment out the `statusLine` key. The script remains on disk and can be re-enabled by restoring the configuration from the install instructions.

## 5. Verify Current Configuration

Check which script is configured:

```bash
jq '.statusLine' ~/.claude/settings.json
```

Test the script manually:

```bash
echo '{"session_id":"your-session-id","workspace":{"current_dir":"'$(pwd)'"}}' | bash ~/.claude/statusline-command.sh
```
