# ctx — Configuration Guide

## Configuration File

The primary configuration is at `~/.ctx/src/config.json`. Edit this file to adjust ctx behavior.

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `resolver.maxSkills` | `15` | Maximum skills recommended per session |
| `resolver.intentBoost` | `5` | Score boost per intent signal match (max 15 total) |
| `resolver.stalePenalty` | `-8` | Score penalty for skills unused in recent sessions |
| `resolver.alwaysAvailable` | `["skill-router", "file-reading"]` | Meta-skills always included regardless of scoring |
| `monitoring.unmatchedThreshold` | `3` | Flag unmatched signals after this many occurrences |
| `monitoring.manifestStaleMins` | `60` | Minutes before manifests are considered stale |
| `usage.retainDays` | `5` | Days to retain usage log entries |
| `usage.staleSessions` | `30` | Sessions of inactivity before a skill is flagged stale |
| `transform.lineThreshold` | `180` | Skills exceeding this line count are converted to micro-skill pipelines |
| `transform.stageMaxLines` | `40` | Maximum lines per micro-skill stage |

## Adjusting Skill Limits

To allow more or fewer skill recommendations per session:

```json
{
  "resolver": {
    "maxSkills": 20
  }
}
```

Higher values increase context budget usage. Lower values keep sessions leaner but may miss relevant skills.

## Tuning Intent Detection

The context monitor scores skills based on signals extracted from file edits. Adjust sensitivity:

```json
{
  "resolver": {
    "intentBoost": 8,
    "stalePenalty": -5
  }
}
```

- **Higher `intentBoost`**: More responsive to mid-session signals, may surface more skills
- **Lower `stalePenalty`**: More forgiving of infrequently used skills
- **Higher `stalePenalty`**: Aggressively deprioritizes unused skills

## Micro-Skill Pipeline Thresholds

Large skills (180+ lines by default) are split into 5-stage gated pipelines for incremental context loading. Adjust the thresholds:

```json
{
  "transform": {
    "lineThreshold": 250,
    "stageMaxLines": 60
  }
}
```

- **Higher `lineThreshold`**: Fewer skills get split into pipelines
- **Higher `stageMaxLines`**: Fewer stages per pipeline, larger context chunks

## Adding Custom Skill Directories

ctx discovers skills from multiple sources. To register additional skill directories:

```bash
python3 ~/.ctx/src/skill_add.py /path/to/skills/directory
```

This scans the directory recursively for `SKILL.md` files, indexes them into the registry, and generates entity pages in the knowledge graph.

## Rebuilding the Knowledge Graph

After adding new skills or updating the source repository, rebuild the graph:

```bash
cd ~/.ctx && bash install.sh
```

The installer is idempotent — it regenerates the wiki, registry, and graph from the current state.

## Hook Configuration

ctx injects hooks into `~/.claude/settings.json`. To review or modify the injected hooks:

```bash
cat ~/.claude/settings.json
```

The hooks reference Python scripts under `~/.ctx/src/`. If you moved the ctx installation directory, update the hook paths in `settings.json` accordingly.

## Staleness Tracking

To manually check skill usage statistics and stale skills:

```bash
python3 ~/.ctx/src/usage-tracker.py
```

To adjust the staleness window, modify `usage.staleSessions` in `config.json`.
