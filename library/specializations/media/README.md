# media

Generative media point tasks — one per modality and operation — plus one end-to-end
production pipeline that carries a brief through to published assets and post-publish
metrics.

## Point tasks

- `image-generation.js` (`@process specializations/media/image-generation`)
  — Image-generation persona. Parse creative brief -> select optimal model (Imagen 3/4,
  Flux, DALL-E, Stable Diffusion) -> generate variants in parallel -> validate technical +
  creative quality -> organise outputs with metadata.
- `image-editing.js` (`@process specializations/media/image-editing`)
  — Image-editing persona. Analyse source + operation request -> select tool (Imagen Edit,
  DALL-E Edit, Stability Edit, Photoshop AI, Upscaler) -> apply operation (inpaint |
  outpaint | object-removal | background-replace | style-transfer | upscale) -> validate
  edge quality / color consistency / artifact absence.
- `video-generation.js` (`@process specializations/media/video-generation`)
  — Video-generation persona. Parse request (text-to-video | image-to-video |
  video-to-video) -> select optimal model (Veo 2/3, Luma, RunwayML, Stable Video, Minimax)
  -> generate via MCP GenMedia with camera/lighting/composition parameters -> validate
  technical + content quality -> retry with fallback model on low-quality outputs.
- `video-editing.js` (`@process specializations/media/video-editing`)
  — Video-editing persona. Analyse source + request -> select tool (Veo Edit, FFmpeg AI,
  DaVinci Resolve, RunwayML Edit, Video Enhance) -> run per-op pipeline (temporal-inpaint |
  stabilise | color-grade | upscale | transitions | scene-cut | audio-sync) -> validate
  frame consistency + audio sync.
- `speech-generation.js` (`@process specializations/media/speech-generation`)
  — Speech-generation persona. Analyse text + voice requirements (language, style, emotion,
  SSML) -> select model (Chirp 3, Azure Speech, ElevenLabs, OpenAI TTS, AWS Polly) ->
  synthesise via MCP GenMedia -> validate naturalness / pronunciation / audio specs.
- `music-generation.js` (`@process specializations/media/music-generation`)
  — Music-generation persona. Parse composition brief (genre/mood/duration/instruments) ->
  select optimal model (Lyria, MusicLM, AIVA, Mubert, Amper) -> generate via MCP GenMedia
  -> apply mastering + stem separation if requested -> validate musical coherence +
  technical audio.

## Pipeline

`media-production-pipeline.js` (`@process specializations/media/media-production-pipeline`)
— End-to-end media production: brief -> research -> script -> produce -> review gates
(editorial, legal, brand) -> publish -> measure.

Its task ids, in execution order:

| Task id | Kind | Role |
|---|---|---|
| `media.research` | agent | Research the brief |
| `media.script` | agent | Script/outline from the research |
| `media.produce` | agent | Produce the asset |
| `media.review-gate` | breakpoint | One pass per gate (`editorial`, `legal`, `brand`), up to 3 attempts each |
| `media.publish` | agent | Publish to each entry in `publishTargets` (in parallel) |
| `media.measure` | agent | Collect 24h post-publish metrics |

## Known gap (OPEN)

The pipeline's review gates are plain `ctx.breakpoint` calls, **not** `routedBreakpoint`
policy gates: there is no `policy-gated` tag, no actionId, and no `gatedActions` audit
record of the decision. Worse, each gate is skipped outright when the matching
`reviewers[gate]` input is absent, and `media.publish` carries no approval gate of its own
— so a run with no `reviewers` publishes with zero human review. This is stated here as an
**open gap, not a fixed behaviour**; adding routed policy gates is a separate change and is
not done in this pass.

## Assets

- Skill: [`skills/generative-media-prompting/SKILL.md`](./skills/generative-media-prompting/SKILL.md)
  — the brief-to-prompt convention shared by the six point tasks.
- There are no agents in this specialization.

---

Descriptions in this README are transcribed from the files' own `@description` headers,
not invented.
