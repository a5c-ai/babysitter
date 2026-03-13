# Knowledge Curation Skill

Knowledge lifecycle management adapted from [Metaswarm](https://github.com/dsifry/metaswarm) by David Sifry.

## Purpose

Prime context before work and extract learnings after completion for cross-session knowledge continuity.

## Process Flow

### Prime
1. Load knowledge base for work type
2. Surface critical rules and gotchas

### Reflect
1. Extract patterns, gotchas, decisions
2. Persist to JSONL knowledge files

## Integration

- **Input from:** Issue assignment (prime) or work completion (reflect)
- **Output to:** Agent context (prime) or knowledge base (reflect)
- **Process file:** `../../metaswarm-knowledge-cycle.js`
