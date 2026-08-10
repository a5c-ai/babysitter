---
name: generative-media-prompting
description: The shared brief-to-prompt convention behind the media point tasks — parse the brief, select the model or tool, construct the prompt, then QA the output against the brief. Use when prompting for image, video, speech, or music generation or editing.
allowed-tools:
  - Read
  - Glob
  - Grep
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:media]
  skillAreas: [skill-area:prompt-engineering, skill-area:video-processing, skill-area:audio-processing]
  roles: [role:media-engineer]
---

# Generative Media Prompting

All six media point tasks open with the same four-step shape, visible verbatim in their
`@description` headers. Writing it down once removes six copies of the same tacit
convention.

## The four steps

1. **Parse the brief.** Extract what the request actually asks for — the creative intent
   for a generation task, or the source asset plus the requested operation for an editing
   task.
2. **Select the model or tool.** Choose the model (generation) or tool (editing) that fits
   the parsed brief. Each point task names the candidates it selects among; the selection
   is part of the task, not a caller input.
3. **Construct the prompt.** Turn the parsed brief into the prompt (and, where the task
   supports them, the structured parameters that accompany it).
4. **QA the output against the brief.** Validate the result before returning it. Every
   point task ends in a validation step, and what it validates is modality-specific.

## Per-modality notes

Limited to what the existing files already state:

- `image-generation.js` — generates variants in parallel; validates technical **and**
  creative quality; organises outputs with metadata.
- `image-editing.js` — selects among named editing tools; validates edge quality, color
  consistency, and artifact absence.
- `video-generation.js` — the parsed brief includes the request mode (text-to-video,
  image-to-video, video-to-video); prompt construction carries camera, lighting, and
  composition parameters; a low-quality output is retried with a fallback model.
- `video-editing.js` — selects among named editing tools and runs a per-operation
  pipeline; validates frame consistency and audio sync.
- `speech-generation.js` — the brief includes language, style, emotion, and SSML;
  validates naturalness, pronunciation, and audio specs.
- `music-generation.js` — the brief includes genre, mood, duration, and instruments;
  mastering and stem separation are applied only if requested; validates musical coherence
  and technical audio.

## Scope

This skill describes **prompt construction only**. Publication, review, and licensing
decisions are out of scope and belong to
[`../../media-production-pipeline.js`](../../media-production-pipeline.js). No model lists
or vendor guidance beyond what the point-task files themselves name.
