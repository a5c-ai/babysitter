# ai-cli — image + video gen via CLI

> **Status:** Assimilation research note (no code change beyond the atlas record).
> **Date:** 2026-06-23.
> **Tagline (requester):** "Image + video gen via CLI."
> **Method:** single-source pass over the vendor homepage <https://ai-cli.dev>. Claims below are vendor-stated and not independently verified.
> **Atlas record:** `tool:ai-cli` — `packages/atlas/graph/domain/tools/ai-cli.yaml` (evidence `evidence:ai-cli-homepage-2026-06`).

---

## 0. Bottom line

A terminal CLI for generating **text, images, and video** from prompts, routed through the **Vercel AI Gateway** to models from OpenAI, Anthropic, Google, Black Forest Labs, and ByteDance. Built for piping and automation: multi-model comparison, stdin/stdout chaining, inline terminal previews, JSON metadata.

## 1. What it does

`ai image/video/text "prompt"` → generated output, with live model discovery and the ability to run the same prompt across multiple providers for comparison.

## 2. How it works

- Routes to providers via the **Vercel AI Gateway**; short model names auto-resolve (e.g. `flux-2-pro`, `gpt-image-2`).
- **Live model discovery** — no hardcoded model list (`ai models`).
- **Multi-model comparison** — same prompt across providers simultaneously.
- **Pipeable**: stdin/stdout chaining (e.g. `ai image | ai video`), inline terminal image preview via graphics protocols, JSON metadata output for automation.
- Minimal setup; configured via environment variables.

## 3. Install & usage

```bash
npm install -g ai-cli
ai image "prompt"
ai video "prompt"
ai text  "prompt"
ai models            # list available models
```

## 4. Relevance to babysitter / agent workflows

- A scriptable media-generation primitive an orchestrated agent could call for asset generation steps (e.g. producing diagrams/thumbnails/video in a pipeline), with JSON output suited to automation.
- The multi-provider gateway model overlaps conceptually with the repo's own provider/transport-adapter layer — useful as a reference point, not a dependency.
- Recorded as catalog awareness (`used_for: skill-area:video-processing`); not wired into babysitter.

## 5. Comparison (atlas edges)

No direct `alternative_to` recorded — no equivalently-scoped multi-provider media-gen CLI currently in the catalog. Conceptually adjacent to the LLM-gateway tools (`tool:openrouter`, `tool:litellm`) but those are text/inference proxies, not media-gen CLIs.

## 6. Caveats / open questions

- Single source (vendor homepage); provider/model list, pricing, auth model (env vars → which keys / Vercel AI Gateway billing), and video-gen latency/quality are vendor claims.
