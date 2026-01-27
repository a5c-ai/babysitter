---
name: video-prompt-engineering
id: SK-FTV-006
version: 1.0.0
description: Optimize prompts for AI video generation platforms including Sora, Runway, Pika, and Kling
specialization: film-tv-production
---

# Video Prompt Engineering Skill

## Purpose

Create optimized prompts for AI video generation platforms that produce cinematic, production-quality footage. These prompts must communicate action, camera movement, timing, and style in a format that translates across different AI platforms.

## Universal Prompt Structure

```
[SCENE SETUP] + [CHARACTER/SUBJECT] + [ACTION SEQUENCE] +
[CAMERA MOVEMENT] + [LIGHTING/ATMOSPHERE] + [STYLE/AESTHETIC]
```

### Component Details

| Component | Content | Example |
|-----------|---------|---------|
| Scene Setup | Location, time, environment | "A rain-soaked Tokyo street at night" |
| Subject | Who/what appears | "A woman in a red coat" |
| Action | What happens (sequential) | "walks forward, stops, turns to look back" |
| Camera | Movement and framing | "slow tracking shot, eye level" |
| Lighting | Light sources, mood | "neon signs reflecting on wet pavement" |
| Style | Visual aesthetic | "cinematic, blade runner aesthetic" |

## Platform-Specific Optimization

### Sora (OpenAI)

**Strengths:**
- Complex scenes
- Multiple subjects
- Consistent physics
- Long duration

**Prompt Style:**
```
Natural language, paragraph format.
Describe the scene as if telling a story.
Include subtle details about atmosphere.
Mention specific camera movements by name.

Example:
"A close-up tracking shot follows a single snowflake as it falls
through the air, passing snow-covered pine branches and eventually
landing on a red mitten. The camera holds on the crystalline
structure of the snowflake for a beat before it begins to melt.
Soft, diffused winter light. Shallow depth of field with gentle
bokeh in the background."
```

### Runway Gen-3

**Strengths:**
- Motion control
- Style transfer
- Consistent aesthetics
- Subject coherence

**Prompt Style:**
```
Structured, detailed prompts.
Specify motion types explicitly.
Reference camera movements precisely.
Include duration indicators.

Example:
"Cinematic shot, slow motion. A detective in a trench coat walks
through a crowded train station. Camera dollies backward maintaining
medium shot. People blur past in the foreground. Harsh overhead
lighting creates deep shadows. 1940s noir aesthetic. 4 seconds."
```

### Pika

**Strengths:**
- Quick generation
- Image-to-video
- Style consistency
- Character animation

**Prompt Style:**
```
Concise, focused prompts.
One primary action per prompt.
Strong style keywords.
Clear motion direction.

Example:
"Close-up of woman's face, wind blowing through hair,
looking off camera left, soft golden hour lighting,
cinematic film grain, subtle movement"
```

### Kling

**Strengths:**
- Longer duration
- Complex action
- Multiple subjects
- Realistic motion

**Prompt Style:**
```
Detailed action sequences.
Step-by-step motion description.
Clear spatial relationships.
Timing indications.

Example:
"A chef in a professional kitchen. Wide shot. He tosses
vegetables in a wok, flames rise dramatically (2 sec),
plates the dish with precise movements (3 sec),
wipes his brow and smiles at camera (2 sec).
Warm kitchen lighting, steam rising, professional quality."
```

## Camera Movement Vocabulary

### Static Shots
```
locked off, tripod, stable, still camera
```

### Movement Types
```
- PAN: horizontal pivot (pan left, pan right)
- TILT: vertical pivot (tilt up, tilt down)
- DOLLY: camera moves (dolly in, dolly out, dolly alongside)
- TRACKING: follows subject (tracking shot, follow shot)
- CRANE: vertical lift (crane up, crane down)
- STEADICAM: smooth handheld (steadicam walk, floating camera)
- HANDHELD: naturalistic shake
- ZOOM: lens change (slow zoom, crash zoom)
- ORBIT: circles subject (360 orbit, arc shot)
```

### Speed Modifiers
```
slow, gentle, smooth, quick, whip, crash, gradual
```

## Action Description

### Effective Action Verbs
```
walks → strides, shuffles, marches, stumbles
runs → sprints, jogs, dashes, bolts
looks → glances, stares, gazes, peers
turns → spins, pivots, rotates, wheels around
picks up → grabs, snatches, lifts, retrieves
```

### Timing Language
```
slowly, gradually, suddenly, immediately,
after a beat, in one motion, over X seconds
```

## Scene Prompt Template

```markdown
## Scene [Number]: [Title]

### Setup
- **Location:** [Specific environment description]
- **Time:** [Time of day, lighting conditions]
- **Atmosphere:** [Weather, mood, ambience]

### Subject
- **Character(s):** [Who appears, wardrobe, positioning]
- **Key Props:** [Important objects in scene]

### Action Sequence
1. [First action with timing]
2. [Second action with timing]
3. [Third action with timing]

### Camera
- **Shot Type:** [Size and angle]
- **Movement:** [Specific movement description]
- **Speed:** [Movement speed]

### Technical
- **Duration:** [Total seconds]
- **Aspect Ratio:** [16:9, 2.39:1, etc.]
- **Style:** [Visual aesthetic reference]

### Platform Prompts

**Universal/Sora:**
[Paragraph-form natural language prompt]

**Runway:**
[Structured prompt with style keywords]

**Pika:**
[Concise action-focused prompt]

### Negative Prompt
[What to avoid: jittery motion, morphing, artifacts, etc.]
```

## Style Keywords

### Cinematic Quality
```
cinematic, film grain, anamorphic, 35mm film,
professional quality, movie scene, theatrical
```

### Lighting
```
golden hour, blue hour, harsh shadows, soft light,
rim lighting, volumetric, neon glow, practical lighting
```

### Motion
```
smooth motion, fluid movement, realistic physics,
natural motion, consistent speed, seamless
```

### Atmosphere
```
atmospheric, moody, dramatic, serene, tense,
energetic, contemplative, mysterious
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Subject morphing | Describe subject consistently throughout |
| Jittery motion | Add "smooth" and "fluid" keywords |
| Wrong timing | Specify durations explicitly |
| Inconsistent style | Use strong style anchors |
| Background issues | Describe environment in detail |
| Physics problems | Describe motion realistically |

## Quality Checklist

- [ ] Scene environment clearly described
- [ ] Subject/character specified in detail
- [ ] Action sequence is logical and timed
- [ ] Camera movement explicitly stated
- [ ] Duration specified
- [ ] Style/aesthetic defined
- [ ] Platform-optimized version created
- [ ] Negative prompts included where needed
