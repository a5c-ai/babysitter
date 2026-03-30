---
name: style-specification
description: Create ultra-detailed musical style specifications including genres, BPM, instrumentation, vocal direction, production aesthetics, and reference tracks for AI music generation
allowed-tools: Read, Write, Edit, WebSearch, WebFetch
id: SK-MAC-002
---

# Style Specification

Create comprehensive musical style specifications optimized for AI music generation platforms like Suno and Udio.

## Overview

This skill provides the framework for translating artistic vision into detailed technical specifications that AI music generators can interpret. It covers genre classification, tempo, instrumentation, vocal direction, production aesthetics, and reference track selection.

## Capabilities

### Genre Classification
- Identify primary and secondary genres
- Specify subgenres and micro-genres
- Define genre fusion approaches
- Map genre evolution and influences
- Understand platform-specific genre tags

### Technical Specifications
- Define BPM and tempo feel
- Suggest key and mode
- Specify time signatures
- Set target duration
- Note dynamic range requirements

### Instrumentation Design
- Detail drum and percussion elements
- Specify bass characteristics
- Define keyboard and synth sounds
- Describe guitar tones and techniques
- List additional instruments
- Note electronic vs organic balance

### Vocal Direction
- Specify vocal style (breathy, raspy, clear)
- Define register (bass to soprano)
- List techniques (vibrato, runs, growls)
- Describe emotional quality
- Provide influence references

### Production Aesthetics
- Define era reference (decades, movements)
- Describe mix character (wet/dry, wide/narrow)
- List effects (reverb, delay, distortion)
- Specify overall sound (lo-fi, polished, raw)
- Note spatial characteristics

### Reference Tracks
- Select songs that exemplify specific elements
- Match references to genres and eras
- Identify what element each reference provides
- Balance obscure and recognizable references

## Usage Guidelines

### Specification Structure
```markdown
## Genre Classification
- **Primary Genre**: [Genre]
- **Secondary Genres**: [List]
- **Subgenres**: [Specific subgenres]

## Technical Specifications
- **BPM**: [Number or range]
- **Key**: [If relevant]
- **Time Signature**: [4/4, 3/4, etc.]

## Instrumentation
- **Drums**: [Detailed description]
- **Bass**: [Type and character]
- **Keys/Synths**: [Sounds and patches]
- **Guitars**: [Types and tones]
- **Additional**: [Other instruments]

## Vocal Direction
- **Style**: [Descriptors]
- **Register**: [Range]
- **Techniques**: [List]
- **Emotion**: [Quality]
- **Influences**: [Artists]

## Production Aesthetics
- **Era**: [Decade/period]
- **Mix**: [Character]
- **Effects**: [List]
- **Sound**: [Overall quality]

## Reference Tracks
1. "[Song]" by [Artist] - for [element]
2. "[Song]" by [Artist] - for [element]
3. "[Song]" by [Artist] - for [element]

## AI Platform Prompt
[Condensed single paragraph for Suno/Udio]
```

### Quality Checklist
- [ ] Genre classification is specific and accurate
- [ ] BPM matches genre expectations
- [ ] Instrumentation is detailed and coherent
- [ ] Vocal direction is actionable
- [ ] Era and production aesthetic align
- [ ] Reference tracks are relevant and available
- [ ] AI prompt is condensed but complete

## Integration Points

### Related Skills
- SK-MAC-001 (lyric-writing) - Lyrics this style accompanies
- SK-MAC-006 (genre-analysis) - Deep genre knowledge
- SK-MAC-007 (vocal-direction) - Extended vocal specs
- SK-MAC-008 (production-guidance) - Production details
- SK-MAC-010 (music-prompt-engineering) - Platform optimization

### Related Agents
- AG-MAC-002 (music-producer-agent) - Primary executor
- AG-MAC-005 (album-curator-agent) - Sonic palette context

## BPM Reference Guide

| Genre | Typical BPM |
|-------|-------------|
| Ballad | 60-80 |
| R&B | 60-90 |
| Hip-Hop | 80-115 |
| Pop | 100-130 |
| Rock | 110-140 |
| House | 120-130 |
| Techno | 130-150 |
| Drum & Bass | 160-180 |

## References

- Genre taxonomy databases (AllMusic, Discogs)
- AI music platform documentation
- Music production terminology guides
