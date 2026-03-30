# Film & TV Production Specialization

**Specialization ID:** `film-tv-production`
**Domain:** `social-sciences-humanities/arts-culture`
**Version:** 1.0.0
**Created:** 2026-01-27

## Overview

A comprehensive specialization for creating complete film and television productions from initial concept through production-ready deliverables. Designed for AI-assisted filmmaking with outputs optimized for generative AI video platforms.

### Supported Formats

| Format | Duration | Structure |
|--------|----------|-----------|
| Feature Film | 90-180 min | Three-act structure, full screenplay |
| TV Pilot | 22-60 min | Teaser + acts, series bible |
| TV Episode | 22-60 min | Cold open, acts, tag |
| Limited Series | 4-10 episodes | Complete arc, episode breakdowns |
| Short Film | 5-40 min | Condensed structure |
| Commercial | 15-60 sec | Hook, message, CTA |
| Music Video | 3-5 min | Visual concept, shot list |

## Core Capabilities

### 1. Story Development
- **Logline Creation** - High-concept single-sentence pitch
- **Treatment Writing** - 2-10 page narrative synopsis
- **Beat Sheet** - Scene-by-scene story structure
- **Outline Development** - Detailed scene breakdown

### 2. Screenplay Writing
- **Industry-Standard Format** - Proper sluglines, action, dialogue
- **Shooting Script** - Scene numbers, camera directions
- **Production Script** - Technical notes, VFX breakdown
- **Dialogue with Direction** - Parentheticals, tone, delivery notes

### 3. Character Creation
- **Character Bible** - Complete backstory, psychology, arc
- **Character Relationships** - Dynamics, conflicts, evolution
- **Voice Profiles** - Speech patterns, vocabulary, quirks
- **Visual Design** - Physical description, wardrobe, props

### 4. World Building
- **Location Design** - Settings, geography, atmosphere
- **Production Design** - Props, vehicles, technology
- **Costume Design** - Wardrobe breakdowns by character/scene
- **VFX Planning** - Visual effects requirements and notes

### 5. Visual Production
- **Storyboard Prompts** - Key frame descriptions for AI image generation
- **Shot Lists** - Complete camera coverage per scene
- **Video Generation Prompts** - Platform-agnostic prompts for AI video
- **Lookbook Creation** - Visual tone and style reference

### 6. Audio Design
- **Music Direction** - Score cues, mood, temp track references
- **Sound Design Notes** - SFX, Foley, ambience per scene
- **Original Score Integration** - Compose with music-album-creation specialization

## Output Artifacts

### Script Files

```
output/
├── development/
│   ├── logline.md
│   ├── treatment.md
│   ├── beat-sheet.md
│   └── outline.md
├── screenplay/
│   ├── [title]-screenplay.fountain
│   ├── [title]-shooting-script.fountain
│   └── scenes/
│       ├── scene-001.md
│       ├── scene-002.md
│       └── ...
├── characters/
│   ├── character-bible.md
│   ├── [character-name]/
│   │   ├── profile.md
│   │   ├── arc.md
│   │   └── visual-reference.md
│   └── ...
├── world/
│   ├── world-bible.md
│   ├── locations/
│   │   ├── [location-name].md
│   │   └── ...
│   ├── props/
│   │   └── props-master-list.md
│   └── costumes/
│       └── wardrobe-breakdown.md
├── visual/
│   ├── lookbook.md
│   ├── storyboards/
│   │   ├── act-1/
│   │   │   ├── frame-001.md (image prompt)
│   │   │   └── ...
│   │   └── ...
│   ├── shot-lists/
│   │   ├── scene-001-shots.md
│   │   └── ...
│   └── video-prompts/
│       ├── scene-001-video.md
│       └── ...
├── audio/
│   ├── music-cues.md
│   ├── sound-design.md
│   └── score/ (if using music-album-creation)
│       └── ...
└── production/
    ├── production-bible.md
    ├── breakdown-sheets/
    │   ├── scene-001-breakdown.md
    │   └── ...
    ├── cast-list.md
    ├── props-list.md
    └── vfx-breakdown.md
```

### Screenplay Format (Fountain)

```fountain
Title: [TITLE]
Credit: Written by
Author: [AUTHOR]
Draft date: [DATE]
Contact: [CONTACT]

====

FADE IN:

INT. LOCATION - DAY

Description of the scene, setting, and initial action. Keep action paragraphs to 3-4 lines maximum.

CHARACTER NAME
(parenthetical)
Dialogue goes here. Natural speech with subtext.

Another character responds with action woven into dialogue.

SMASH CUT TO:

EXT. NEW LOCATION - NIGHT

> INTERCUT - LOCATION A/LOCATION B

Intercut between two locations for simultaneous action.

FADE OUT.

THE END
```

### Video Generation Prompt Structure

```markdown
## Scene [Number]: [Scene Title]

### Visual Setup
- **Setting**: [Location description with atmosphere]
- **Time**: [Time of day, lighting conditions]
- **Weather/Atmosphere**: [Environmental details]
- **Camera Position**: [Initial framing]

### Action Sequence
1. [Shot 1 description - character action, camera movement]
2. [Shot 2 description - reaction, environmental detail]
3. [Shot 3 description - key story beat]

### Technical Specifications
- **Duration**: [Estimated seconds]
- **Aspect Ratio**: [16:9, 2.39:1, etc.]
- **Style Reference**: [Visual tone, film references]
- **Color Palette**: [Dominant colors, mood]

### Platform Prompt
**Sora/Runway/Pika Compatible:**
[Single-paragraph prompt optimized for AI video generation,
including character description, action, camera movement,
lighting, and style in natural language]

### VFX Notes
- [Any visual effects requirements]
- [Compositing needs]
- [Post-processing suggestions]
```

### Storyboard Frame Prompt Structure

```markdown
## Frame [Number]: [Beat Description]

### Composition
- **Shot Type**: [Wide/Medium/Close-up/Extreme CU]
- **Angle**: [Eye-level/Low/High/Dutch/Bird's eye]
- **Movement**: [Static/Pan/Tilt/Dolly/Crane]

### Visual Elements
- **Foreground**: [Elements closest to camera]
- **Midground**: [Primary subject/action]
- **Background**: [Environmental context]

### Lighting
- **Key Light**: [Direction, quality, intensity]
- **Fill**: [Ratio, color]
- **Practical/Motivated**: [In-frame light sources]
- **Mood**: [Overall lighting atmosphere]

### Image Generation Prompt
[Detailed prompt for Midjourney/DALL-E/Stable Diffusion
optimized for the specific visual style and composition]

### Frame Notes
- **Dialogue**: "[Any dialogue during this frame]"
- **SFX**: [Sound effects]
- **Music**: [Score cue if applicable]
- **Duration**: [How long this shot holds]
```

## Frameworks

### STORY Framework (Story Development)

| Component | Description |
|-----------|-------------|
| **S**ituation | Opening status quo, world and character introduction |
| **T**rigger | Inciting incident that disrupts equilibrium |
| **O**bjective | What the protagonist must achieve |
| **R**esistance | Obstacles, antagonist, internal/external conflict |
| **Y**ield | Resolution, transformation, new equilibrium |

### SCENE Framework (Scene Construction)

| Element | Description |
|---------|-------------|
| **S**pacing | Where/when - establish geography and time |
| **C**haracter | Who - establish POV and participants |
| **E**motion | Why - emotional stakes and subtext |
| **N**arrative | What - story information delivered |
| **E**xit | How - transition to next scene |

### VISUAL Framework (Shot Design)

| Principle | Application |
|-----------|-------------|
| **V**antage | Camera position and angle choice |
| **I**llumination | Lighting design and mood |
| **S**cale | Shot size and framing |
| **U**nity | Visual coherence and style |
| **A**ction | Movement (camera and subject) |
| **L**ayers | Depth and composition planes |

### CHARACTER Framework (Character Development)

| Dimension | Elements |
|-----------|----------|
| **C**ore | Fundamental nature, values, beliefs |
| **H**istory | Backstory, formative experiences |
| **A**mbition | Goals, desires, what they want |
| **R**elationships | Connections, dynamics, conflicts |
| **A**rc | Transformation through the story |
| **C**ontradiction | Internal conflicts, flaws, complexity |
| **T**alk | Voice, speech patterns, verbal quirks |
| **E**xterior | Physical appearance, mannerisms |
| **R**esonance | Theme they embody, universal truth |

## Process Architecture

### Modular Processes

| Process | Purpose | Output |
|---------|---------|--------|
| `story-development` | Ideation to outline | Logline, treatment, beat sheet, outline |
| `character-creation` | Character design | Character bibles, relationship maps |
| `world-building` | Production design | Locations, props, costumes, VFX notes |
| `screenplay-writing` | Script creation | Full screenplay with dialogue |
| `visual-production` | Visual planning | Storyboards, shots, video prompts |
| `audio-design` | Sound planning | Music cues, SFX, score direction |

### Composite Process

| Process | Components | Output |
|---------|------------|--------|
| `full-production` | All modular processes | Complete production package |

### Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     FULL PRODUCTION WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     Phase 1     │  │     Phase 2     │  │     Phase 3     │
│ Story Development│  │Character Creation│  │  World Building │
│                 │  │                 │  │                 │
│ • Logline       │  │ • Character     │  │ • Locations     │
│ • Treatment     │  │   bibles        │  │ • Props         │
│ • Beat sheet    │  │ • Relationships │  │ • Costumes      │
│ • Outline       │  │ • Voice profiles│  │ • VFX planning  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │     Phase 4       │
                    │ Screenplay Writing│
                    │                   │
                    │ • Scene writing   │
                    │ • Dialogue        │
                    │ • Action          │
                    │ • Transitions     │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    │                    ▼
┌─────────────────┐           │           ┌─────────────────┐
│     Phase 5     │           │           │     Phase 6     │
│Visual Production│           │           │  Audio Design   │
│                 │           │           │                 │
│ • Storyboards   │           │           │ • Music cues    │
│ • Shot lists    │           │           │ • Sound design  │
│ • Video prompts │           │           │ • Score (opt)   │
│ • Lookbook      │           │           │                 │
└────────┬────────┘           │           └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │     Phase 7       │
                    │    Compilation    │
                    │                   │
                    │ • Production bible│
                    │ • Final package   │
                    │ • Quality review  │
                    └───────────────────┘
```

## Quality Standards

### Story Quality Gates

| Checkpoint | Criteria |
|------------|----------|
| Logline | Clear protagonist, goal, stakes, hook |
| Treatment | Emotional journey, escalation, resolution |
| Beat Sheet | Proper pacing, turning points, act structure |
| Outline | Scene necessity, causality, momentum |

### Screenplay Quality Gates

| Checkpoint | Criteria |
|------------|----------|
| Format | Industry standard, proper sluglines |
| Dialogue | Character voice, subtext, naturalism |
| Action | Visual storytelling, economy of words |
| Pacing | Scene length, rhythm, tension |

### Visual Quality Gates

| Checkpoint | Criteria |
|------------|----------|
| Storyboards | Clear composition, continuity, emotion |
| Shot Lists | Complete coverage, motivated choices |
| Video Prompts | Specific, achievable, style-consistent |

## Skills & Agents

### Skills (SK-FTV-001 through SK-FTV-012)

| ID | Skill | Purpose |
|----|-------|---------|
| SK-FTV-001 | logline-writing | Craft compelling one-sentence hooks |
| SK-FTV-002 | treatment-writing | Develop narrative synopses |
| SK-FTV-003 | scene-writing | Write individual scenes |
| SK-FTV-004 | dialogue-crafting | Create character-specific dialogue |
| SK-FTV-005 | storyboard-prompting | Generate image prompts for frames |
| SK-FTV-006 | video-prompt-engineering | Optimize for AI video platforms |
| SK-FTV-007 | character-development | Build complete character profiles |
| SK-FTV-008 | world-building | Design settings and production elements |
| SK-FTV-009 | shot-composition | Plan camera and visual design |
| SK-FTV-010 | sound-design-direction | Create audio/music direction |
| SK-FTV-011 | screenplay-formatting | Format scripts to industry standard |
| SK-FTV-012 | genre-analysis-film | Analyze and apply genre conventions |

### Agents (AG-FTV-001 through AG-FTV-006)

| ID | Agent | Required Skills |
|----|-------|-----------------|
| AG-FTV-001 | screenwriter-agent | SK-FTV-003, 004, 011 |
| AG-FTV-002 | visual-director-agent | SK-FTV-005, 006, 009 |
| AG-FTV-003 | character-designer-agent | SK-FTV-004, 007, 012 |
| AG-FTV-004 | world-builder-agent | SK-FTV-008, 009, 012 |
| AG-FTV-005 | story-developer-agent | SK-FTV-001, 002, 012 |
| AG-FTV-006 | production-coordinator-agent | All skills |

## Cross-Specialization Integration

### With music-album-creation

The `audio-design` process can invoke the music-album-creation specialization to:
- Create original score compositions
- Generate theme music with style specifications
- Produce character leitmotifs
- Design title sequences with music

```javascript
// Integration example
const scoreRequest = {
  seedIdea: "Orchestral score for sci-fi thriller",
  genreDirection: "Hans Zimmer meets Blade Runner",
  trackCount: filmScenes.length,
  existingPersona: {
    name: "Film Score",
    style: "Cinematic orchestral with electronic elements"
  }
};
```

## Usage Examples

### Feature Film Development

```javascript
// Full feature film production
await fullProduction({
  format: 'feature',
  genre: 'sci-fi thriller',
  concept: 'A detective in 2087 discovers the AI solving crimes is the perpetrator',
  targetDuration: 110,
  tone: 'noir, contemplative, tense',
  outputDir: './output/detective-ai'
});
```

### TV Series Pilot

```javascript
// TV pilot with series bible
await fullProduction({
  format: 'tv-pilot',
  genre: 'drama',
  concept: 'Found family of misfits run a failing restaurant',
  targetDuration: 45,
  episodesPlanned: 8,
  outputDir: './output/restaurant-show'
});
```

### Short Film

```javascript
// Short film production
await fullProduction({
  format: 'short',
  genre: 'horror',
  concept: 'A night shift worker realizes the building is alive',
  targetDuration: 15,
  outputDir: './output/night-shift'
});
```

### Commercial

```javascript
// Commercial/ad production
await fullProduction({
  format: 'commercial',
  product: 'Electric vehicle',
  duration: 30,
  message: 'The future is quiet',
  targetAudience: 'Urban professionals 30-45',
  outputDir: './output/ev-commercial'
});
```

---

**Specialization:** Film & TV Production (`film-tv-production`)
**Domain:** `social-sciences-humanities/arts-culture`
**Version:** 1.0.0
