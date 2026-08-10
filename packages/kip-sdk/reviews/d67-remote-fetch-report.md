# D-67 (remote half): gated, allowlisted HTTPS RDF fetch — build report

**Item:** `d67-rdf-remote-fetch` · **Closes:** the remote half of D-67 (allowlist scope) · **ADR:** B14 addendum · **Branch:** `staging`
**Status:** shipped, security-reviewed (found + fixed a disclosure gap + added SSRF defense-in-depth).

## What shipped

`kip ingest-rdf --url <https-url>` fetches N-Triples from an explicit, user-named host allowlist and feeds the
bytes **verbatim** to the existing D-67 `rdfToAcquisition` → `runAcquisition` path — so every untrusted-data
guard (reserved-channel forge refusal, malformed strict-fail, INV-A1) already applies to fetched content. The
fetch layer only *acquires bytes*; it never parses or authors.

**Safe by design:**
- **Opt-in gate** `KIP_RDF_FETCH` = comma-separated allowed hostnames; unset ⇒ fetch DISABLED (the default —
  the CLI and the whole test suite make no network call). Gate-off / non-allowlisted host ⇒ exit 7, before any
  network call.
- **Exact, case-insensitive hostname match** — no suffix/subdomain (`evil-dbpedia.org`, `x.dbpedia.org` ≠
  `dbpedia.org`); fails closed on trailing-dot / IDN-homograph.
- **HTTPS only**; embedded credentials (`user:pass@host`) refused pre-network.
- **GET only**, no cookies/auth/added-query, fixed `Accept`; **redirects refused outright** (`redirect:"manual"`).
- **Hard caps**: 5 MiB streamed byte-count cap (Content-Length not trusted) + AbortController timeout.
- **SSRF defense-in-depth**: loopback / link-local / cloud-metadata IP **literals** (`127/8`,
  `169.254/16` incl. `169.254.169.254`, `0/8`, IPv6 `::1`, `fe80::/10`) refused **before** the allowlist — so
  even an operator who allowlists that literal cannot reach the metadata endpoint.
- **Injectable `fetchImpl`** — the suite injects a mock; no real network anywhere. Zero new deps (Node global
  `fetch`).

## Security review — score 85 → fixed → shippable

The critic confirmed every bypass fails closed (userinfo-SSRF caught by the credentials check first; redirect
refusal covers 3xx + undici opaqueredirect before the body read; cap is a genuine streamed count with reader
cancel; credentials/data never leak). I independently reproduced the allowlist refusals (userinfo, http,
`evil-dbpedia.org`, subdomain, trailing-dot — all refused).

The one substantive finding was an **honesty gap**: the private-IP/metadata SSRF residual was real but
**undisclosed** in the otherwise-exhaustive out-of-scope lists — a major-class gap under this session's
anti-overclaim discipline. **Fixed two ways:**
1. **Defense-in-depth (added):** the IP-literal block above — the metadata/loopback/link-local literals are now
   refused outright, even when allowlisted (independently verified: `169.254.169.254`, `127.0.0.1`, `[::1]`,
   `[fe80::1]` all refused with no network hit; a normal public IP `8.8.8.8` still fetches).
2. **Honest disclosure (added to ADR-B14 + DEBTS):** the **residual** — an allowlisted *hostname* that
   *resolves* to an internal IP IS fetched (only IP-*literals* are blocked, not hostnames-that-resolve). Blast
   radius is bounded (the fetch does the only DNS resolution → no rebinding TOCTOU; the body is only parsed
   locally, never returned to a caller → an internal-probe/data-poison vector, not exfiltration), behind
   explicit per-host opt-in + https + no-redirect. A private-range/DNS-resolution block is deferred.

## Honest scope (still deferred)

Open/arbitrary-URL fetch; SPARQL / public-graph querying; non-N-Triples (Turtle/JSON-LD); auth'd endpoints; the
hostname→internal-IP SSRF residual above.

## Suite / hygiene

`1010 passed | 8 skipped` (+36 fetch tests incl. the 4 IP-literal cases). Build clean; lockfile untouched; LF;
zero new deps; only `packages/kip-sdk` changed; local-file ingest byte-identical.

## Files

- `src/rdf/fetch.ts` — `resolveRdfFetchGate` + `fetchRdfDocument` + `isBlockedIpLiteral` + `rdfFetchExitCode`.
- `src/cli/index.ts` (`cmdIngestRdf --url` branch, `RunCliOptions.fetchImpl`), `src/cli/args.ts` (`--url`).
- `src/__tests__/d67-rdf-fetch.test.ts` (36, all injected — no real network).
- `docs/70-decision-records-adr.md` (ADR-B14 addendum + SSRF residual) · `docs/DEBTS.md` (D-67 remote half + residual).
