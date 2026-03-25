# Film & TV Production - Skills and Agents References

## Skills and Agents Index

### Skills Summary

| ID | Name | Description |
|----|------|-------------|
| SK-FTV-001 | logline-writing | Craft compelling one-sentence story hooks for pitches |
| SK-FTV-002 | treatment-writing | Develop narrative synopses and sales documents |
| SK-FTV-003 | scene-writing | Write individual scenes with proper formatting |
| SK-FTV-004 | dialogue-crafting | Create character-specific dialogue with subtext |
| SK-FTV-005 | storyboard-prompting | Generate AI image prompts for storyboard frames |
| SK-FTV-006 | video-prompt-engineering | Optimize prompts for AI video platforms |
| SK-FTV-007 | character-development | Build complete character profiles and arcs |
| SK-FTV-008 | world-building | Design locations, props, costumes, production elements |
| SK-FTV-009 | shot-composition | Plan camera angles, movements, and visual design |
| SK-FTV-010 | sound-design-direction | Create music cues, SFX, and audio direction |
| SK-FTV-011 | screenplay-formatting | Format scripts to industry standard (Fountain) |
| SK-FTV-012 | genre-analysis-film | Analyze and apply genre conventions |

### Agents Summary

| ID | Name | Required Skills |
|----|------|-----------------|
| AG-FTV-001 | screenwriter-agent | SK-FTV-003, SK-FTV-004, SK-FTV-011 |
| AG-FTV-002 | visual-director-agent | SK-FTV-005, SK-FTV-006, SK-FTV-009 |
| AG-FTV-003 | character-designer-agent | SK-FTV-004, SK-FTV-007, SK-FTV-012 |
| AG-FTV-004 | world-builder-agent | SK-FTV-008, SK-FTV-009, SK-FTV-012 |
| AG-FTV-005 | story-developer-agent | SK-FTV-001, SK-FTV-002, SK-FTV-012 |
| AG-FTV-006 | production-coordinator-agent | All skills (SK-FTV-001 through SK-FTV-012) |

---

## Process to Skills/Agents Mapping

| Process | Primary Skills | Primary Agents |
|---------|----------------|----------------|
| story-development | SK-FTV-001, SK-FTV-002, SK-FTV-012 | AG-FTV-005 |
| character-creation | SK-FTV-004, SK-FTV-007, SK-FTV-012 | AG-FTV-003 |
| world-building | SK-FTV-008, SK-FTV-009, SK-FTV-012 | AG-FTV-004 |
| screenplay-writing | SK-FTV-003, SK-FTV-004, SK-FTV-011 | AG-FTV-001 |
| visual-production | SK-FTV-005, SK-FTV-006, SK-FTV-009 | AG-FTV-002 |
| audio-design | SK-FTV-010 | AG-FTV-006 |
| full-production | All skills | All agents |

---

## Agent Collaboration Matrix

| Agent | Provides To | Receives From |
|-------|-------------|---------------|
| AG-FTV-005 (story-developer) | Story structure to all | Initial concept |
| AG-FTV-003 (character-designer) | Characters to AG-FTV-001, AG-FTV-004 | Story from AG-FTV-005 |
| AG-FTV-004 (world-builder) | World to AG-FTV-001, AG-FTV-002 | Characters from AG-FTV-003 |
| AG-FTV-001 (screenwriter) | Screenplay to AG-FTV-002, AG-FTV-006 | All previous phases |
| AG-FTV-002 (visual-director) | Visuals to AG-FTV-006 | Screenplay from AG-FTV-001 |
| AG-FTV-006 (production-coordinator) | Final package | All previous phases |

---

## Skills Detail

### SK-FTV-001: logline-writing
**Purpose:** Create compelling one-sentence story hooks

**Key Elements:**
- Protagonist + inciting incident + goal + stakes
- Ironic/unique hook
- Genre signaling
- 25-50 words maximum

**Output:** Logline package with variations

---

### SK-FTV-002: treatment-writing
**Purpose:** Develop narrative synopses

**Key Elements:**
- Present tense, cinematic writing
- Complete story in prose
- Act structure
- Key setpieces

**Output:** 2-15 page narrative treatment

---

### SK-FTV-003: scene-writing
**Purpose:** Write individual screenplay scenes

**Key Elements:**
- Fountain format
- Visual action lines
- Proper dialogue formatting
- Scene structure (mini three-act)

**Output:** Complete scenes in Fountain

---

### SK-FTV-004: dialogue-crafting
**Purpose:** Create authentic character dialogue

**Key Elements:**
- Distinct character voices
- Subtext over on-the-nose
- Naturalistic speech patterns
- Economy of words

**Output:** Polished dialogue with voice consistency

---

### SK-FTV-005: storyboard-prompting
**Purpose:** Generate AI image prompts for frames

**Key Elements:**
- Composition specification
- Lighting direction
- Platform optimization (Midjourney/DALL-E/SD)
- Style consistency

**Output:** Production-ready image prompts

---

### SK-FTV-006: video-prompt-engineering
**Purpose:** Optimize for AI video platforms

**Key Elements:**
- Scene setup, action, camera
- Platform-specific optimization (Sora/Runway/Pika/Kling)
- Duration and timing
- Style anchors

**Output:** Multi-platform video prompts

---

### SK-FTV-007: character-development
**Purpose:** Build complete character profiles

**Key Elements:**
- CHARACTER framework (9 dimensions)
- Psychology: want, need, flaw, lie, truth
- Arc design
- Voice profile

**Output:** Comprehensive character bible

---

### SK-FTV-008: world-building
**Purpose:** Design production elements

**Key Elements:**
- World parameters and rules
- Location profiles
- Props and costumes
- VFX planning

**Output:** World bible and production design

---

### SK-FTV-009: shot-composition
**Purpose:** Plan visual storytelling

**Key Elements:**
- Shot sizes and angles
- Camera movements
- Composition principles
- Coverage strategy

**Output:** Detailed shot lists

---

### SK-FTV-010: sound-design-direction
**Purpose:** Create audio design

**Key Elements:**
- Music spotting and cues
- Sound effects design
- Score direction
- AI music prompts (Suno/Udio)

**Output:** Complete audio design package

---

### SK-FTV-011: screenplay-formatting
**Purpose:** Format to industry standard

**Key Elements:**
- Fountain markup syntax
- Proper margins and spacing
- Element formatting
- Format variations by project type

**Output:** Industry-standard formatted scripts

---

### SK-FTV-012: genre-analysis-film
**Purpose:** Apply genre conventions

**Key Elements:**
- Genre expectations and tropes
- Audience contract
- Tone markers
- Subversion strategies

**Output:** Genre-informed creative decisions

---

## Cross-Specialization Integration

### From music-album-creation

| Skill/Process | Application to Film/TV |
|---------------|----------------------|
| style-specification | Score style direction |
| music-prompt-engineering | AI score generation |
| genre-analysis | Musical genre for scenes |
| album-conceptualization | Thematic score design |

### Integration Points

```javascript
// Score request formatted for music-album-creation
const scoreRequest = {
  seedIdea: "Orchestral score for noir thriller",
  genreDirection: "Thomas Newman meets Jonny Greenwood",
  trackCount: musicCues.length,
  existingPersona: {
    name: "Film Score",
    style: "Modern orchestral with electronic textures"
  }
};
```

---

## Implementation Priority

### Skills Priority Order
1. **story-developer skills** (SK-FTV-001, 002) - Foundation
2. **character-development** (SK-FTV-007) - Character depth
3. **scene-writing + dialogue** (SK-FTV-003, 004) - Core screenplay
4. **screenplay-formatting** (SK-FTV-011) - Industry standard
5. **visual skills** (SK-FTV-005, 006, 009) - Visual production
6. **world-building** (SK-FTV-008) - Production design
7. **sound-design** (SK-FTV-010) - Audio package
8. **genre-analysis** (SK-FTV-012) - Throughout process

### Agent Deployment Order
1. **story-developer-agent** - Creates story foundation
2. **character-designer-agent** - Creates character bible
3. **world-builder-agent** - Creates production design
4. **screenwriter-agent** - Writes screenplay
5. **visual-director-agent** - Creates visual package
6. **production-coordinator-agent** - Compiles final package

---

## Quality Gate Integration

| Phase | Quality Gate | Review Focus |
|-------|--------------|--------------|
| After story | story-quality-gate | Structure, conflict, theme |
| After characters | character-quality-gate | Depth, voice, arc |
| After world | world-quality-gate | Consistency, feasibility |
| After screenplay | screenplay-quality-gate | Format, dialogue, pacing |
| After visual | visual-quality-gate | Shots, prompts, style |
| After audio | audio-quality-gate | Music, sound, direction |
| Final | final-quality-gate | Complete package review |

---

**Created:** 2026-01-27
**Version:** 1.0.0
**Specialization:** Film & TV Production (`film-tv-production`)
