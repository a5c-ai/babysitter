---
name: storyboard-prompting
id: SK-FTV-005
version: 1.0.0
description: Generate detailed image prompts for storyboard frames optimized for Midjourney, DALL-E, and Stable Diffusion
specialization: film-tv-production
---

# Storyboard Prompting Skill

## Purpose

Create detailed, production-ready image generation prompts for storyboard frames. These prompts should produce consistent, cinematic images that communicate composition, lighting, mood, and action for pre-visualization.

## Prompt Architecture

### Core Structure

```
[SUBJECT] + [COMPOSITION] + [LIGHTING] + [MOOD/ATMOSPHERE] + [STYLE] + [TECHNICAL]
```

### Component Breakdown

| Component | Description | Examples |
|-----------|-------------|----------|
| Subject | Who/what is in frame | "detective in trench coat" |
| Composition | Framing and arrangement | "medium close-up, rule of thirds" |
| Lighting | Light sources and quality | "rim lighting, high contrast" |
| Mood | Emotional atmosphere | "tense, ominous" |
| Style | Visual reference | "noir, cinematic" |
| Technical | Camera/image specs | "35mm, shallow DOF" |

## Platform-Specific Optimization

### Midjourney

```
Midjourney v6 parameters:
--ar [aspect ratio] (16:9, 2.39:1, 4:3)
--s [stylize] (0-1000, default 100)
--c [chaos] (0-100, for variation)
--q [quality] (0.25, 0.5, 1, 2)
--style raw (less Midjourney aesthetic)

Structure:
[Subject and action], [composition], [lighting], [mood], [style reference],
cinematic still, film photography --ar 16:9 --s 150
```

### DALL-E

```
DALL-E 3 optimization:
- Natural language descriptions work well
- Be specific about what you want
- Include negative instructions when needed
- Reference artistic styles by description, not artist name

Structure:
A cinematic film still of [subject], [composition description].
The scene has [lighting description] creating a [mood] atmosphere.
Shot on [camera/lens], [style description].
```

### Stable Diffusion

```
Positive prompt:
(cinematic:1.3), (film still:1.2), [subject], [composition], [lighting],
[mood], [style], detailed, high quality, 8k

Negative prompt:
cartoon, anime, illustration, drawing, painting, blurry, low quality,
watermark, text, deformed, ugly, bad anatomy

Settings:
- CFG Scale: 7-12
- Steps: 30-50
- Sampler: DPM++ 2M Karras or Euler a
```

## Shot Type Prompts

### Extreme Wide Shot (EWS)
```
vast landscape with tiny silhouetted figure, establishing shot,
epic scale, environmental storytelling, cinematic composition,
golden hour lighting, anamorphic lens flare --ar 2.39:1
```

### Wide Shot (WS)
```
full body shot of [character] standing in [environment],
environmental context visible, subject in lower third,
motivated practical lighting, cinematic atmosphere --ar 16:9
```

### Medium Shot (MS)
```
medium shot of [character] from waist up, [action/pose],
[background environment], shallow depth of field,
three-point lighting setup, film grain --ar 16:9
```

### Close-Up (CU)
```
close-up portrait of [character], [expression],
face fills frame, soft key light, dramatic shadows,
intimate composition, emotional intensity, 85mm lens --ar 16:9
```

### Extreme Close-Up (ECU)
```
extreme close-up of [detail/feature], macro detail,
selective focus, dramatic lighting, texture emphasis,
cinematic tension, tight framing --ar 16:9
```

## Lighting Prompts

### Natural Light
```
golden hour sunlight, warm tones, long shadows,
natural window light, overcast diffusion,
magic hour, practical sun
```

### Studio/Artificial
```
three-point lighting, rim light, motivated light,
practical lamps, neon glow, fluorescent overhead,
spotlight, volumetric light
```

### Mood Lighting
```
chiaroscuro, high contrast, low key, high key,
silhouette, backlit, lens flare, god rays,
atmospheric haze, dusty light beams
```

## Composition Prompts

### Framing
```
rule of thirds, centered composition, symmetrical frame,
off-center subject, negative space, frame within frame,
leading lines, diagonal composition, Dutch angle
```

### Depth
```
foreground elements, layered composition, deep focus,
shallow depth of field, background blur bokeh,
environmental depth, atmospheric perspective
```

## Storyboard Frame Template

```markdown
## Frame [ID]: [Beat Description]

### Scene Context
- **Scene:** [Number and title]
- **Shot:** [Size and angle]
- **Action:** [What's happening]

### Visual Specifications
- **Composition:** [Framing details]
- **Lighting:** [Light sources and mood]
- **Characters:** [Who's in frame, expressions]
- **Environment:** [Setting details]

### Image Prompts

**Midjourney:**
```
[Full prompt with parameters]
```

**DALL-E:**
```
[Natural language prompt]
```

**Stable Diffusion:**
```
Positive: [prompt]
Negative: [negative prompt]
```

### Frame Notes
- **Dialogue:** "[Any dialogue]"
- **Duration:** [Estimated seconds]
- **Movement:** [Camera or subject movement]
```

## Style Reference Library

### Film Noir
```
high contrast black and white, dramatic shadows,
venetian blind shadows, rain-slicked streets,
cigarette smoke, fedoras, low-key lighting
```

### Sci-Fi
```
neon lights, holographic displays, lens flares,
futuristic architecture, chrome surfaces,
volumetric lighting, blue and orange color grade
```

### Horror
```
underexposed, deep shadows, obscured faces,
practical effects, desaturated colors, fog,
dutch angles, motivated darkness
```

### Romance
```
soft focus, warm lighting, golden hour,
lens flare, shallow depth of field,
intimate framing, natural expressions
```

## Quality Checklist

- [ ] Shot size and angle specified
- [ ] Lighting direction and quality described
- [ ] Mood/atmosphere conveyed
- [ ] Character positioning clear
- [ ] Environment context included
- [ ] Style reference appropriate
- [ ] Technical specs match project
- [ ] Aspect ratio specified
- [ ] Platform optimized
