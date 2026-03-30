# Music Album Creation - Skills and Agents References

## Skills and Agents Index

### Skills Summary

| ID | Name | Description |
|----|------|-------------|
| SK-MAC-001 | lyric-writing | Write complete song lyrics with structural annotations and production notes |
| SK-MAC-002 | style-specification | Create ultra-detailed musical style specifications for AI platforms |
| SK-MAC-003 | cover-art-prompting | Create text-to-image prompts for album and song cover artwork |
| SK-MAC-004 | persona-development | Create comprehensive artist personas for consistent generation |
| SK-MAC-005 | album-conceptualization | Develop cohesive album concepts, themes, motifs, and arcs |
| SK-MAC-006 | genre-analysis | Analyze and classify music genres with deep characteristics knowledge |
| SK-MAC-007 | vocal-direction | Create detailed vocal specifications for AI music generation |
| SK-MAC-008 | production-guidance | Provide detailed production specifications and guidance |
| SK-MAC-009 | track-sequencing | Design optimal track order and album flow |
| SK-MAC-010 | music-prompt-engineering | Optimize prompts for Suno, Udio, and similar platforms |

### Agents Summary

| ID | Name | Required Skills |
|----|------|-----------------|
| AG-MAC-001 | lyricist-agent | SK-MAC-001, SK-MAC-004, SK-MAC-005 |
| AG-MAC-002 | music-producer-agent | SK-MAC-002, SK-MAC-006, SK-MAC-007, SK-MAC-008, SK-MAC-010 |
| AG-MAC-003 | visual-director-agent | SK-MAC-003, SK-MAC-004, SK-MAC-005 |
| AG-MAC-004 | persona-designer-agent | SK-MAC-004, SK-MAC-006, SK-MAC-005 |
| AG-MAC-005 | album-curator-agent | SK-MAC-005, SK-MAC-009, SK-MAC-004, SK-MAC-006 |

---

## External Resources

### AI Music Generation Platforms

| Platform | URL | Description |
|----------|-----|-------------|
| Suno | [suno.ai](https://suno.ai) | Text-to-music with lyrics, leading platform |
| Udio | [udio.com](https://udio.com) | High-quality AI music generation |
| Stable Audio | [stability.ai](https://stability.ai/stable-audio) | Open-source approach to AI music |
| MusicLM | Google Research | Research-stage text-to-music |

### AI Image Generation Platforms

| Platform | Description | Best For |
|----------|-------------|----------|
| Midjourney | Discord-based, artistic output | Album artwork, artistic styles |
| DALL-E 3 | OpenAI, natural language | Complex prompts, text in images |
| Stable Diffusion | Open source, customizable | Custom models, specific styles |
| Leonardo.AI | Fine-tuned models | Consistent character design |

### Prompt Engineering Resources

| Resource | URL | Focus |
|----------|-----|-------|
| Suno Wiki | Community resources | Suno prompting guides |
| r/SunoAI | Reddit community | Tips, examples, discussion |
| r/udiomusic | Reddit community | Udio-specific guidance |
| Midjourney Docs | Official documentation | Image prompt parameters |

---

## Music Industry Knowledge Resources

### Genre Reference Databases

| Resource | URL | Use Case |
|----------|-----|----------|
| AllMusic | [allmusic.com](https://allmusic.com) | Comprehensive genre taxonomy |
| Discogs | [discogs.com](https://discogs.com) | User-generated genre tags |
| Every Noise at Once | [everynoise.com](https://everynoise.com) | Genre visualization and exploration |
| Rate Your Music | [rateyourmusic.com](https://rateyourmusic.com) | Detailed subgenre system |
| MusicBrainz | [musicbrainz.org](https://musicbrainz.org) | Open music database |

### Music Theory and Production

| Resource | Description |
|----------|-------------|
| Hooktheory | Chord progression analysis and theory |
| Music Map | Genre relationships visualization |
| Splice | Sample library and production resources |
| Sound on Sound | Production tutorials and equipment |

### Lyric and Songwriting Resources

| Resource | Description |
|----------|-------------|
| Genius | Lyrics database with annotations |
| RhymeZone | Rhyme and synonym finding |
| Songwriter Universe | Songwriting education |
| ASCAP | Industry standards and licensing |

---

## Cross-Specialization References

### From Arts and Culture Specialization

| Skill/Agent | Application to Music |
|-------------|---------------------|
| curatorial-research | Research for concept albums, thematic development |
| interpretive-writing | Album liner notes, artist statements |
| exhibition-design | Music video visual design, stage design |
| grant-proposal-writing | Artist funding applications |
| audience-analytics | Fan engagement analysis |

### From Marketing Specialization

| Skill/Process | Application to Music |
|---------------|---------------------|
| Brand Positioning | Artist identity and positioning |
| Campaign Analytics | Release campaign analysis |
| Content Strategy | Album rollout planning |
| Social Media | Fan engagement strategy |

### From UX/Design Specialization

| Skill/Process | Application to Music |
|---------------|---------------------|
| Visual Design | Album artwork, merchandise |
| User Research | Audience preference research |
| Typography | Logo and branding design |

---

## API and Tool References

### Music Metadata APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| Spotify Web API | Track metadata, audio features | Reference track discovery |
| MusicBrainz API | Open music database | Artist and release data |
| Discogs API | Release and artist data | Genre classification |
| Last.fm API | Listening data, similar artists | Influence mapping |

### AI Platform APIs

| Platform | API Status | Notes |
|----------|------------|-------|
| Suno | Limited/No public API | Prompt via web interface |
| Udio | Limited/No public API | Prompt via web interface |
| Midjourney | No public API | Discord bot interface |
| DALL-E | OpenAI API available | Programmatic access |
| Stable Diffusion | Open source | Local/cloud deployment |

---

## Workflow Integration

### Process to Skills/Agents Mapping

| Process | Primary Skills | Primary Agents |
|---------|----------------|----------------|
| artist-persona-creation | SK-MAC-004 | AG-MAC-004 |
| album-conceptualization | SK-MAC-005, SK-MAC-009 | AG-MAC-005 |
| song-composition | SK-MAC-001, SK-MAC-002, SK-MAC-003 | AG-MAC-001, AG-MAC-002, AG-MAC-003 |
| full-album-production | All skills | All agents |

### Agent Collaboration Matrix

| Agent | Provides To | Receives From |
|-------|-------------|---------------|
| AG-MAC-001 (lyricist) | Lyrics to all | Concepts from AG-MAC-004, AG-MAC-005 |
| AG-MAC-002 (producer) | Style specs to AG-MAC-001 | Sonic direction from AG-MAC-005 |
| AG-MAC-003 (visual) | Cover prompts | Style from AG-MAC-002, themes from AG-MAC-005 |
| AG-MAC-004 (persona) | Persona to all | - |
| AG-MAC-005 (curator) | Concepts to all | Persona from AG-MAC-004 |

---

## Implementation Recommendations

### Skill Priority Order
1. **persona-development** (SK-MAC-004) - Foundation for all content
2. **album-conceptualization** (SK-MAC-005) - Album-level direction
3. **style-specification** (SK-MAC-002) - Core production specs
4. **lyric-writing** (SK-MAC-001) - Lyrics with proper annotations
5. **cover-art-prompting** (SK-MAC-003) - Visual content
6. **music-prompt-engineering** (SK-MAC-010) - Platform optimization

### Agent Deployment Order
1. **persona-designer-agent** - Creates artist identity
2. **album-curator-agent** - Creates album direction
3. **music-producer-agent** and **lyricist-agent** - Song creation (parallel)
4. **visual-director-agent** - Cover artwork

### Quality Gate Integration
- After persona: Review artist consistency
- After album concept: Review thematic coherence
- After each song: Review style/lyric alignment
- After covers: Review visual/sonic alignment

---

## Community Resources

### Forums and Communities

| Community | Platform | Focus |
|-----------|----------|-------|
| r/SunoAI | Reddit | Suno prompting and music |
| r/udiomusic | Reddit | Udio platform discussion |
| r/Midjourney | Reddit | AI image generation |
| AI Music Discord | Discord | General AI music discussion |
| Midjourney Discord | Discord | Image generation community |

### Learning Resources

| Resource | Type | Topics |
|----------|------|--------|
| YouTube AI Music | Videos | Platform tutorials |
| AI Music Academy | Course | Comprehensive AI music creation |
| Prompt Engineering Guide | Article | Text prompt optimization |

---

**Created**: 2026-01-26
**Version**: 1.0.0
**Specialization**: Music Album Creation (`music-album-creation`)
