# Portless — no port conflicts, worktree-friendly

> **Status:** Assimilation research note (no code change beyond the atlas record).
> **Date:** 2026-06-23.
> **Tagline (requester):** "No port conflicts. Worktree-friendly."
> **Method:** single-source pass over the vendor homepage <https://portless.sh>. Claims below are vendor-stated and not independently verified.
> **Atlas record:** `tool:portless` — `packages/atlas/graph/domain/tools/portless.yaml` (evidence `evidence:portless-homepage-2026-06`).

---

## 0. Bottom line

Replaces local-dev port numbers with stable, named **`.localhost`** HTTPS URLs. Instead of `http://localhost:3000` you get `https://myapp.localhost`, and parallel git worktrees get their own branch-prefixed subdomains automatically — so concurrent checkouts never fight over ports.

## 1. What it does

Gives each local app a stable named HTTPS hostname and proxies it to whatever port the app actually bound, eliminating hardcoded-port collisions across projects and worktrees.

## 2. How it works

- Runs an **HTTPS reverse proxy on port 443** by default.
- Each app registers a route mapping its hostname → an assigned port (randomly picked in **4000–4999**).
- Requests to the named URL are proxied to the running app.
- **HTTPS/HTTP-2 by default** with an auto-generated, auto-trusted local CA.
- **Framework auto-detection** — respects `PORT` and injects the right flags for Vite, Astro, React Router, etc.
- **Git worktree support** — the branch name is auto-prepended as a subdomain (`fix-ui.myapp.localhost`) with zero config.
- Auto-syncs `/etc/hosts`; custom TLD (e.g. `.test`) via `--tld`.

## 3. Install & usage

```bash
npm install -g portless          # requires Node.js 24+
portless                          # runs package.json "dev" through the proxy
portless myapp next dev           # proxy a command explicitly
portless api.myapp pnpm start     # subdomains for multiple services
```

## 4. Why it's worktree-friendly (relevant to babysitter)

This repo runs heavily in **git worktrees** (agent isolation, parallel runs). Port collisions between concurrent worktrees are a real friction point for any dev-server / live test. Portless's automatic branch-subdomain routing means N worktrees can each run a dev server without manual port juggling — a clean fit for parallel orchestrated runs. Recorded as catalog awareness; not wired into babysitter tooling.

## 5. Comparison (atlas edges)

`alternative_to`: `tool:ngrok` — ngrok exposes local servers via **public** tunnels; Portless provides stable **local** named HTTPS routes with worktree-aware subdomains.

## 6. Caveats / open questions

- Single source (vendor homepage); OSS/licensing, Windows `hosts`/CA behavior, and the Node 24+ floor unverified against real use.
- Port-443 binding may need elevated privileges on some platforms (not stated).
