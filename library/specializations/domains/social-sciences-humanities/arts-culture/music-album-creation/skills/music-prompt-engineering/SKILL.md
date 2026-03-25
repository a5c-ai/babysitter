---
name: music-prompt-engineering
description: Optimize and format prompts specifically for AI music generation platforms like Suno and Udio, including platform-specific syntax and tag optimization
allowed-tools: Read, Write, Edit, WebSearch, WebFetch
id: SK-MAC-010
---

# Music Prompt Engineering

Optimize and format prompts for AI music generation platforms.

## Overview

This skill provides platform-specific optimization for AI music generation prompts. It covers prompt structure, tag selection, platform syntax, iteration strategies, and quality assessment for Suno, Udio, and similar platforms.

## Capabilities

### Platform Understanding
- Know Suno prompt structure and limits
- Understand Udio interpretation patterns
- Adapt to platform updates
- Leverage platform-specific features

### Prompt Structuring
- Order elements for best interpretation
- Balance specificity and flexibility
- Layer genre, style, and mood
- Include key descriptors efficiently

### Tag Optimization
- Use effective genre tags
- Apply vocal style tags
- Include era/production tags
- Add mood and atmosphere tags

### Iteration Strategy
- Design prompt variations
- Test and refine approaches
- Document successful patterns
- Build prompt libraries

### Quality Assessment
- Evaluate output match to intent
- Identify interpretation issues
- Refine problematic prompts
- Track platform behavior changes

## Platform-Specific Guidelines

### Suno Prompts

**Structure:**
```
[Genre Tags], [Era/Style], [Tempo/Energy], [Vocal Description], [Instrumentation], [Mood/Atmosphere], [Production Quality]
```

**Effective Tags:**
| Category | Examples |
|----------|----------|
| Genre | indie rock, synth-pop, trap, lo-fi hip-hop |
| Era | 80s, 90s alternative, modern pop |
| Tempo | uptempo, slow burn, driving beat |
| Vocal | female vocalist, raspy male vocals, ethereal |
| Mood | melancholic, euphoric, dark, dreamy |
| Production | polished, raw, lo-fi, bedroom pop |

**Example Prompt:**
```
indie rock, 90s alternative, driving guitars, female vocalist with
breathy delivery, jangly guitars, distorted bass, melancholic but
catchy, influenced by Mazzy Star and Alvvays, reverb-drenched
```

### Udio Prompts

**Structure:**
```
[Detailed Genre Description], [Specific Artist Influences], [Production Details], [Vocal Specifics], [Mood and Atmosphere]
```

**Best Practices:**
- More detailed descriptions work well
- Artist references are effective
- Production specifics matter
- Vocal descriptions should be clear

**Example Prompt:**
```
A dreamy electronic track blending trip-hop with ambient textures,
reminiscent of Portishead meets Boards of Canada. Features a
smoky female vocal with subtle processing, over deep sub-bass,
sparse breakbeats, and lush synthesizer pads. Moody, introspective
atmosphere with vinyl warmth and tape saturation. 85 BPM, minor key.
```

## Prompt Templates

### Genre-Focused Template
```
[Primary Genre], [Subgenre], [Era Reference], [Key Characteristics],
[Mood], [Production Style]
```

### Artist-Focused Template
```
In the style of [Artist 1] meets [Artist 2], [Genre], [Key Elements],
[Vocal Description], [Mood]
```

### Production-Focused Template
```
[Genre], [Instrumentation Details], [Drum/Rhythm Type], [Bass Type],
[Synth/Keys], [Effects], [Mix Character], [Era Production Style]
```

### Vocal-Focused Template
```
[Genre], [Vocal Style and Quality], [Vocal Range], [Emotional Delivery],
[Influenced by Vocalists], [Production Context]
```

### Mood-Focused Template
```
[Mood/Atmosphere], [Genre], [Tempo Feel], [Energy Level],
[Visual/Emotional Imagery], [Production Aesthetic]
```

## Tag Reference Library

### Genre Tags (High Effectiveness)
```
indie rock, synth-pop, trap, lo-fi hip-hop, dream pop,
shoegaze, post-punk, neo-soul, trip-hop, ambient,
drum and bass, house, techno, R&B, jazz, folk,
country, metal, punk, grunge, alternative
```

### Era Tags
```
60s, 70s, 80s, 90s, 2000s, modern, retro, vintage,
futuristic, timeless, classic
```

### Vocal Tags
```
male vocalist, female vocalist, raspy, breathy, clear,
powerful, soft, ethereal, soulful, operatic, spoken word,
rap, singing, harmonies, choir, whispered
```

### Mood Tags
```
melancholic, euphoric, dark, bright, dreamy, aggressive,
peaceful, anxious, nostalgic, hopeful, angry, romantic,
mysterious, playful, intense, relaxed
```

### Production Tags
```
lo-fi, polished, raw, clean, distorted, reverb-heavy,
minimal, lush, sparse, dense, vintage, modern,
analog, digital, warm, crisp
```

## Usage Guidelines

### Prompt Creation Process
1. Identify core musical vision
2. Select primary genre tags
3. Add era/style context
4. Describe vocal requirements
5. Specify key instrumentation
6. Add mood/atmosphere
7. Include production notes
8. Add reference artists (sparingly)
9. Review for clarity and length
10. Create 2-3 variations

### Prompt Optimization Tips
- Be specific but not over-constrained
- Use well-known genre terms
- Artist references should be recognizable
- Balance tags across categories
- Avoid contradictory descriptors
- Test and iterate based on results

### Quality Checklist
- [ ] Genre is clearly specified
- [ ] Era/style provides context
- [ ] Vocal description is actionable
- [ ] Instrumentation is genre-appropriate
- [ ] Mood is clearly conveyed
- [ ] Production style is defined
- [ ] Prompt is not too long
- [ ] No contradictory elements

## Integration Points

### Related Skills
- SK-MAC-002 (style-specification) - Source specifications
- SK-MAC-006 (genre-analysis) - Genre accuracy
- SK-MAC-007 (vocal-direction) - Vocal tags
- SK-MAC-008 (production-guidance) - Production tags

### Related Agents
- AG-MAC-002 (music-producer-agent) - Prompt creation

## Common Issues and Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Wrong genre output | Vague genre tags | Be more specific with subgenres |
| Wrong vocal | Unclear vocal description | Add specific vocal style tags |
| Wrong tempo | Missing tempo indication | Add BPM or tempo feel |
| Generic sound | Too few details | Add production specifics |
| Inconsistent | Contradictory tags | Remove conflicting descriptors |
| Over-constrained | Too many tags | Simplify, focus on essentials |

## References

- Suno community prompt guides
- Udio prompt best practices
- AI music generation forums
- Platform update documentation
