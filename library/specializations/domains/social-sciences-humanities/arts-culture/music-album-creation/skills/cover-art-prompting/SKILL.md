---
name: cover-art-prompting
description: Create detailed text-to-image prompts for album and song cover artwork optimized for Midjourney, DALL-E, and other AI image generators
allowed-tools: Read, Write, Edit, WebSearch
id: SK-MAC-003
---

# Cover Art Prompting

Create compelling text-to-image prompts for album and song cover artwork optimized for AI image generators.

## Overview

This skill provides comprehensive frameworks for translating musical concepts into visual prompts that AI image generators can interpret effectively. It covers prompt structure, art style specification, composition guidelines, and platform-specific optimization.

## Capabilities

### Visual Concept Development
- Translate sonic mood to visual language
- Create metaphorical visual representations
- Design genre-appropriate imagery
- Develop artist-consistent aesthetics
- Balance abstract and representational elements

### Prompt Structure
- Write clear subject descriptions
- Specify art styles and techniques
- Define lighting and atmosphere
- Describe composition and framing
- Add technical modifiers

### Platform Optimization
- Optimize for Midjourney parameters
- Structure for DALL-E interpretation
- Adapt for Stable Diffusion models
- Handle platform-specific syntax

### Style Direction
- Reference art movements
- Specify artistic techniques
- Define color palettes
- Describe textures and materials
- Note photographic vs illustrated approaches

### Technical Specification
- Set aspect ratios (1:1 for album covers)
- Add quality modifiers
- Include negative prompts
- Specify rendering styles

## Usage Guidelines

### Prompt Structure Template
```
[Subject/Scene], [Art Style] art, [Art Movement] inspired,
[Lighting Type] lighting, [Color Palette] colors,
[Composition Type], [Atmosphere/Mood] atmosphere,
[Technical Modifiers] --ar 1:1 --v 6
```

### Full Prompt Format
```markdown
# [Song/Album Title] - Cover Art Prompt

## Concept
[Brief description connecting visual to music]

## Primary Prompt
```
[Full optimized prompt]
```

## Style Elements
- **Art Style**: [Style]
- **Art Movement**: [Movement]
- **Color Palette**: [Colors]
- **Lighting**: [Description]
- **Mood**: [Atmosphere]

## Composition
- **Subject**: [Main focus]
- **Background**: [Setting]
- **Framing**: [Type]
- **Perspective**: [Angle]

## Technical
- **Aspect Ratio**: 1:1
- **Quality**: [Modifiers]
- **Negative Prompt**: [What to avoid]

## Variations
1. [Alternative 1]
2. [Alternative 2]
```

### Art Style Keywords
| Style | Keywords |
|-------|----------|
| Photorealistic | photorealistic, 8k, detailed, sharp focus |
| Painterly | oil painting, brushstrokes, impasto |
| Digital Art | digital art, concept art, artstation |
| Minimalist | minimal, clean, geometric, simple |
| Surreal | surrealist, dreamlike, ethereal |
| Vintage | retro, vintage, film grain, nostalgic |
| Cyberpunk | neon, cyberpunk, futuristic, holographic |
| Gothic | dark, gothic, ornate, dramatic |

### Lighting Keywords
- Golden hour, blue hour, harsh midday
- Dramatic lighting, soft diffused, rim light
- Neon glow, candlelight, moonlit
- Studio lighting, natural light, backlit
- Volumetric lighting, god rays, lens flare

### Quality Checklist
- [ ] Subject is clearly described
- [ ] Art style is specified
- [ ] Lighting creates mood
- [ ] Colors align with sonic palette
- [ ] Composition is defined
- [ ] Technical modifiers included
- [ ] Negative prompts prevent issues
- [ ] Variations offer alternatives

## Integration Points

### Related Skills
- SK-MAC-002 (style-specification) - Sonic context to visualize
- SK-MAC-004 (persona-development) - Artist visual aesthetic
- SK-MAC-005 (album-conceptualization) - Album visual direction

### Related Agents
- AG-MAC-003 (visual-director-agent) - Primary executor
- AG-MAC-004 (persona-designer-agent) - Aesthetic context

## Genre-Visual Mappings

| Genre | Visual Tendencies |
|-------|-------------------|
| Electronic | Abstract, geometric, neon, futuristic |
| Rock | Raw, gritty, photographic, bold |
| Hip-Hop | Urban, stylized, bold typography |
| Folk/Acoustic | Natural, warm, pastoral, organic |
| Metal | Dark, detailed, dramatic, symbolic |
| Pop | Bright, polished, portrait-focused |
| Jazz | Sophisticated, minimal, vintage |
| Ambient | Abstract, atmospheric, ethereal |

## References

- Midjourney documentation and parameters
- DALL-E prompting best practices
- Album cover design history and trends
- Art movement characteristics
