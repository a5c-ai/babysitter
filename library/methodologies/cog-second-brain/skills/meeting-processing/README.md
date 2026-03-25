# COG Meeting Processing Skill

Process meeting transcripts into structured intelligence.

## Quick Start

```bash
babysitter run:create --process methodologies/cog-second-brain/cog-knowledge-capture \
  --input '{"vaultPath":"./cog-vault","captureType":"meeting-transcript","transcriptPath":"./meeting.txt","meetingTitle":"Sprint Planning"}'
```

## Outputs

- **Decisions** - What was decided, with context and rationale
- **Action Items** - Who does what, by when, at what priority
- **Team Dynamics** - Engagement levels, alignment, collaboration quality
- **Executive Summary** - High-level meeting overview
- **Topic Segments** - Transcript broken into discussion threads

## Examples

- [Meeting transcript processing](../../examples/meeting-transcript.json)
