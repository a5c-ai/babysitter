---
name: sound-design-direction
id: SK-FTV-010
version: 1.0.0
description: Create comprehensive audio design including music cues, sound effects, Foley, and score direction
specialization: film-tv-production
---

# Sound Design Direction Skill

## Purpose

Design comprehensive audio landscapes that enhance storytelling. Sound is 50% of the film experience—music, effects, dialogue, and silence all shape emotion and meaning.

## Audio Categories

### The Sound Stack

```
DIALOGUE
├── Production dialogue
├── ADR (additional dialogue)
├── Voice-over
└── Walla (crowd murmur)

SOUND EFFECTS
├── Hard effects (impacts, doors)
├── Backgrounds (ambience)
├── Foley (character movement)
└── Designed sounds (stylized)

MUSIC
├── Score (composed)
├── Source (diegetic)
└── Songs (licensed)
```

## Sound Design Approach

### Design Philosophy

| Approach | Description | Films |
|----------|-------------|-------|
| Naturalistic | Realistic, grounded | Drama, indie |
| Hyperreal | Enhanced reality | Action, thriller |
| Stylized | Artistic, expressive | Sci-fi, horror |
| Minimal | Sparse, impactful | Art house |

### Diegetic vs. Non-Diegetic

```
DIEGETIC (source in story world):
- Characters can hear it
- Radio, TV, live music
- Environmental sounds
- Dialogue

NON-DIEGETIC (outside story world):
- Characters can't hear it
- Score
- Voice-over (sometimes)
- Sound design elements
```

## Music Spotting

### Music Cue Sheet Template

```markdown
## Music Cue [M##]

### Identification
- **Scene:** [Number]
- **Cue Name:** [Descriptive title]
- **Timecode In:** [HH:MM:SS:FF]
- **Timecode Out:** [HH:MM:SS:FF]
- **Duration:** [MM:SS]

### Type
- [ ] Score
- [ ] Source music
- [ ] Song/Licensed

### Direction
- **Mood:** [Emotional direction]
- **Tempo:** [BPM or feel]
- **Instrumentation:** [Key instruments]
- **Dynamic Arc:** [How it builds/changes]

### Sync Points
- [Timecode]: [What happens musically]
- [Timecode]: [What happens musically]

### Transitions
- **In:** [How music enters]
- **Out:** [How music exits]

### Reference
- **Temp Track:** [If applicable]
- **Similar To:** [Reference tracks]

### AI Music Prompt (Suno/Udio)
[Prompt for AI generation]
```

### When to Use Music

**Start Music:**
- Emotional shift
- Scene transition
- Building tension
- Montage
- Establishing mood

**End Music:**
- Before important dialogue
- For impact through silence
- Scene completion
- Emotional peak hit

## Sound Effects Design

### Scene Sound Design Template

```markdown
## Scene [##] Sound Design

### Ambience/Backgrounds
- **Primary Bed:** [Main environmental sound]
- **Layers:**
  - [Additional ambient element]
  - [Additional ambient element]
- **Intensity:** [1-10]

### Hard Effects
| Timecode | Effect | Description | Priority |
|----------|--------|-------------|----------|
| 00:00:00 | [SFX] | [Details]   | [Hi/Med/Lo] |

### Foley Requirements
- **Footsteps:** [Surface type]
- **Cloth:** [Material, intensity]
- **Props:** [Items handled]

### Designed Sounds
| Timecode | Sound | Description | Style |
|----------|-------|-------------|-------|
| 00:00:00 | [Name] | [What it is] | [Realistic/Stylized] |

### Silence
- [Timecode]: [Purpose of silence]

### Special Treatment
- [ ] Slow motion audio
- [ ] POV/Subjective sound
- [ ] Flashback treatment
- [ ] Underwater/muffled
```

## Emotional Sound Design

### Sound and Emotion

| Emotion | Sound Approach |
|---------|----------------|
| Fear | Low frequency rumble, unexpected stingers |
| Tension | High-pitched tone, silence, breath |
| Joy | Bright, clear, musical |
| Sadness | Sparse, echo, minor keys |
| Anger | Hard impacts, distortion, chaos |
| Love | Warmth, softness, intimacy |

### Signature Sounds

Create recurring audio motifs:
```
Character themes (musical)
Location sounds (environmental)
Object sounds (associated with items)
Emotional triggers (sound = feeling)
```

## Score Direction

### Theme Development

```markdown
## Musical Themes

### Main Theme
- **Association:** [Character/concept]
- **Mood:** [Emotional quality]
- **Instrumentation:** [Core instruments]
- **Motif:** [Melodic description]
- **Usage:** [When it appears]

### Secondary Themes
[Same structure for each theme]

### Theme Transformations
- [Context]: [How theme changes]
- [Context]: [How theme changes]
```

### Score Style Guide

```markdown
## Score Direction

### Overall Approach
- **Genre:** [Orchestral, electronic, hybrid]
- **Era Feel:** [Contemporary, classical, retro]
- **Emotional Range:** [Intimate to epic]

### Instrumentation Palette
- Primary: [Main instruments]
- Secondary: [Supporting instruments]
- Special: [Unique elements]

### References
- [Film score reference 1]
- [Film score reference 2]
- [Non-film reference]

### Avoid
- [What doesn't fit]
```

## Mix Priorities

### Dialogue Intelligibility
Dialogue is almost always priority:
```
Dialogue first
Music ducks for important lines
Effects support, don't compete
```

### Dynamic Range
```
Quiet moments → space for intimacy
Loud moments → impact through contrast
Build gradually → sustain anticipation
Sudden change → shock and surprise
```

## Output Templates

### Music Cue Sheet Summary
```markdown
| Cue | Scene | In | Out | Duration | Type | Notes |
|-----|-------|-----|-----|----------|------|-------|
| M1  | 1     | ... | ... | 0:45     | Score| Opening |
```

### Sound Design Summary
```markdown
| Scene | Ambience | Key SFX | Foley | Special |
|-------|----------|---------|-------|---------|
| 1     | City     | Cars    | Walk  | None    |
```

## Quality Checklist

- [ ] Every scene has ambience
- [ ] Dialogue is prioritized
- [ ] Music cues are spotted
- [ ] Transitions are smooth
- [ ] Silence is intentional
- [ ] Emotional arc supported
- [ ] Themes are consistent
- [ ] Mix priorities clear
