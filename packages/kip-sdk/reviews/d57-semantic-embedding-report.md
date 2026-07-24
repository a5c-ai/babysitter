# D-57 (semantic half): lift the "never embeds the query" stance — build report

**Item:** `d57-semantic-embedding` · **Addresses:** the semantic half of D-57 · **ADR:** B17 · **Branch:** `staging`
**Status:** shipped — the owner-approved N2/N5 stance lift + a dep-free fuzzy default + a real-embedder seam. Honestly scoped: true synonymy needs an injected model.

## The decision (owner-approved)

kip's deliberate **"never embeds the query" (N2/N5) stance is lifted**: kip now embeds the query itself and
drives the existing vector half of recall. The stance was the *only* thing blocking semantic retrieval — the
vector-matching machinery (cosine scan + RRF fusion) and the corpus-embedding seam (`dispatchEmbedding`)
already existed.

## What shipped

1. **`defaultEmbed` (dep-free, `src/embed/default-embedder.ts`):** a fixed-dim (1024) L2-normalized,
   signed-feature-hashed vector over stemmed tokens + char-3-grams. Its cosine measures **character/token
   OVERLAP** — typos, morphology, compounds, substrings. **It is NOT learned semantics** (the header says so
   verbatim; the tests name the property `fuzzy-not-semantic`).
2. **kip embeds the query (the stance lift):** when `q.semantic === true` and no `q.embedding` is supplied,
   `computeRecall` embeds `q.text` — via the **injected** embedding microagent if one is wired, **else**
   `defaultEmbed` — and runs the vector half. Query and corpus are embedded **symmetrically by the same
   embedder** (never mixed). The choice branches on **availability** (`hasInjectedDispatch`), **not** a
   try/catch — a genuinely-failed injected embedder throws loud (N5), never silently substituted ("fallbacks
   are evil").
3. **Opt-in (`RecallQuery.semantic`):** threaded from `kip ask --semantic` / `kip recall --semantic` /
   `KIP_ASK_EMBED`. **Default recall is byte-identical** — the pre-existing m4 "kip NEVER embeds the query text"
   test stays green and now guards the opt-in-off path. `q.semantic` is read only inside the pure
   `computeRecall`; the env is resolved outside, so `computeRecall` stays a pure function of (fact set, query).

## Honesty (the crux — verified, adversarially reviewed 93/100)

The dep-free default is **fuzzy overlap, not synonymy** — pinned by a genuine boundary test and my own
empirical check: `defaultEmbed("revenue recognition")` vs `defaultEmbed("booking settlement")` → **cosine
0.0000** (no shared characters → orthogonal), while morphological/overlap pairs score high. So the canonical
`revenue recognition ≡ booking settlement` case is **still not matched** by the dep-free default — and nothing
in the code/docs/tests calls it "semantic". **True synonymy requires injecting a real embedding model** through
the §5.3 seam (which embeds query *and* corpus) — proven by a test with a scripted synonym-aware dispatch where
a lexically-disjoint synonym query retrieves the node. kip stays zero-dep by shipping only the fuzzy default +
the seam (the `claude` CLI has no embeddings API; bundling a model would break the zero-dep rule).

## Invariants

N5 / cite-or-abstain intact — the vector half only *adds* candidates; graph-QA §6.1b subject-anchoring still
governs answers (a semantically-retrieved-but-subject-absent node still abstains, tested). §5.3 accelerator
boundary intact — embeddings are computed outside proj; recall authors nothing (INV-A1) and never touches
byte-identity. Deterministic with the dep-free default (FNV-1a hash, no clock/random/locale;
permutation-invariance pinned). Zero new runtime deps; `package-lock.json` untouched; LF.

## Adversarial review

Critic **93/100 — shippable**: no overclaim (the crux), no regression when off, not a fallback, injected
embedder delivers true synonymy, N5/anchoring preserved, deterministic, honest-boundary genuine. Two **nits**,
both disclosed in DEBTS (non-blocking): the `--semantic` mode-gate name could momentarily read as a synonymy
promise without an injected model (clarified at its call site + docs); and the `sim > 0` fuzzy admission can add
a low-ranked trigram-collision noise candidate to the RRF fusion (harmless — anchoring governs the answer — a
cosine floor is a possible follow-on).

## Suite / hygiene

`1021 passed | 8 skipped` (+11 D-57 semantic tests); build clean; lockfile untouched; LF; zero new deps; only
`packages/kip-sdk` changed; opt-in-off path byte-identical.

## Files

- `src/embed/default-embedder.ts` (new) — `defaultEmbed`.
- `src/kip-repo.ts` (computeRecall query-embedding + `hasInjectedDispatch`), `src/types.ts` (`RecallQuery.semantic`),
  `src/graph-qa/index.ts` + `src/cli/index.ts` + `src/cli/ask.ts` (opt-in wiring).
- `src/__tests__/d57-semantic-embedding.test.ts` (11).
- `docs/70-decision-records-adr.md` (ADR-B17) · `docs/DEBTS.md` (D-57 semantic half + residuals).
