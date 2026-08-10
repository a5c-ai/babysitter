/**
 * D-67 (REMOTE half, ADR-B14) — SAFE acquisition of RDF (N-Triples) bytes from an explicit, user-named
 * ALLOWLIST of trusted HTTPS endpoints, for ingestion through the EXISTING D-67 pipeline.
 *
 * WHY THIS IS SAFE BY DESIGN: this module ONLY acquires bytes safely. The fetched body is handed VERBATIM
 * to the unchanged `rdfToAcquisition(text, …)` parse + guard path (`src/rdf/ntriples.ts`), so every D-67
 * untrusted-data guard (reserved-channel forge refusal for `same_as`/`not_same_as`/`documents`/`kip:*`,
 * space-predicate refusal, malformed strict-fail, INV-A1: only `runAcquisition` writes) ALREADY applies to
 * fetched content — a fetched forge / malformed line is refused exactly as a local file's would be. Nothing
 * here ever executes the body; it is only ever PARSED as N-Triples text downstream.
 *
 * The SAFETY DESIGN (all enforced here, and unit-tested with an INJECTED mock fetch — no real network):
 *   1. OPT-IN gate: `KIP_RDF_FETCH` = a comma-separated list of allowed HOSTNAMES. UNSET/empty ⇒ remote
 *      fetch is DISABLED (the default — the CLI and the whole test suite make NO network call unless a host
 *      is explicitly allowed). `resolveRdfFetchGate` is PURE (mirrors `resolveResolveLiveGate`).
 *   2. EXACT, case-insensitive hostname allowlist — NO suffix/substring matching (`evil-dbpedia.org` does
 *      NOT match `dbpedia.org`; a subdomain does not match either). A host not in the list ⇒ refused, no fetch.
 *   3. HTTPS ONLY: `http:` / any non-`https:` scheme refused; embedded credentials (`user:pass@host`) refused.
 *   4. GET only; NO credentials, cookies, auth headers, or added query params; a FIXED
 *      `Accept: application/n-triples, text/plain`. Redirects are NOT followed — `redirect: "manual"` and any
 *      3xx / opaque-redirect response is REFUSED (a redirect could bounce to a non-allowlisted / non-https
 *      host; refusing outright is the safest policy and needs no re-validation of an attacker-chosen target).
 *   5. HARD CAPS: a response SIZE cap enforced by a running byte count over the STREAMED body (Content-Length
 *      is attacker-controlled and NOT trusted), and an AbortController TIMEOUT. Exceeding either ⇒ a typed
 *      `RdfFetchError`; nothing is returned, so nothing is authored (N5).
 *   6. INJECTABLE fetch: an optional `fetchImpl` (default: the Node global `fetch`) so the deterministic test
 *      suite injects a mock that returns canned bytes and asserts NO real network is ever hit. ZERO new deps.
 */

/** The opt-in host-allowlist env var. Comma-separated HOSTNAMES; UNSET/empty ⇒ remote fetch DISABLED. */
export const RDF_FETCH_ENV = "KIP_RDF_FETCH";

/** The fixed request `Accept` — N-Triples first, then plain text. No content negotiation beyond this. */
export const RDF_FETCH_ACCEPT = "application/n-triples, text/plain";

/** Default response SIZE cap (5 MiB), enforced by a STREAMED running byte count (not Content-Length). */
export const DEFAULT_RDF_FETCH_MAX_BYTES = 5 * 1024 * 1024;

/** Default request TIMEOUT (30s) via an AbortController. */
export const DEFAULT_RDF_FETCH_TIMEOUT_MS = 30_000;

/** The result of the `KIP_RDF_FETCH` opt-in gate (mirrors `resolveResolveLiveGate`/`resolveLearnLiveGate`). */
export interface RdfFetchGate {
  enabled: boolean;
  /** The parsed, trimmed, lower-cased allowlist of exact hostnames (empty when disabled). */
  allowHosts: string[];
  reason?: string;
}

/**
 * PURE gate: when `KIP_RDF_FETCH` is unset/empty (or parses to no hostnames) it returns
 * `{enabled:false, allowHosts:[], reason}` — the default, so no `kip ingest-rdf --url` and no test ever
 * touches the network unless a host is EXPLICITLY allowed. Hostnames are trimmed and lower-cased so the
 * exact-match check is case-insensitive.
 */
export function resolveRdfFetchGate(args: { env: Record<string, string | undefined> }): RdfFetchGate {
  const raw = args.env[RDF_FETCH_ENV];
  if (raw === undefined || raw.trim().length === 0) {
    return {
      enabled: false,
      allowHosts: [],
      reason:
        `remote RDF fetch is opt-in and DISABLED by default: set ${RDF_FETCH_ENV} to a comma-separated ` +
        `allowlist of trusted HTTPS hostnames (e.g. ${RDF_FETCH_ENV}="dbpedia.org,query.wikidata.org") to ` +
        `allow this run to fetch. No network call is made otherwise.`,
    };
  }
  const allowHosts = raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0);
  if (allowHosts.length === 0) {
    return {
      enabled: false,
      allowHosts: [],
      reason: `${RDF_FETCH_ENV} is set but names no hostname — remote RDF fetch stays DISABLED.`,
    };
  }
  return { enabled: true, allowHosts };
}

// ------------------------------------------------------------------------------------------------
// typed errors — a fetch failure / cap / refusal is a typed `RdfFetchError`, never a silent partial.
// ------------------------------------------------------------------------------------------------

export type RdfFetchErrorCode =
  // PRE-network refusals (the gate/allowlist class — no network call was made). CLI maps these to exit 7.
  | "ERR_RDF_FETCH_DISABLED"
  | "ERR_RDF_FETCH_HOST_DENIED"
  | "ERR_RDF_FETCH_SCHEME"
  | "ERR_RDF_FETCH_CREDENTIALS"
  | "ERR_RDF_FETCH_BLOCKED_IP"
  | "ERR_RDF_FETCH_URL"
  // RUNTIME refusals (a real dispatch happened, or the response was rejected). CLI maps these to exit 1 (N5).
  | "ERR_RDF_FETCH_REDIRECT"
  | "ERR_RDF_FETCH_TOO_LARGE"
  | "ERR_RDF_FETCH_TIMEOUT"
  | "ERR_RDF_FETCH_HTTP"
  | "ERR_RDF_FETCH_NETWORK";

/** A typed refusal from the safe fetch path. Carries a `code` so the CLI maps it to a stable exit code. */
export class RdfFetchError extends Error {
  readonly code: RdfFetchErrorCode;
  constructor(code: RdfFetchErrorCode, message: string) {
    super(message);
    this.name = "RdfFetchError";
    this.code = code;
  }
}

/**
 * The exit code for a given `RdfFetchErrorCode`. PRE-network refusals (gate disabled, host not allowed,
 * bad scheme/credentials/url) map to the distinct gate exit 7 (matching the other kip live gates — nothing
 * was fetched). RUNTIME refusals (redirect, size cap, timeout, HTTP error, network error) map to exit 1 —
 * the N5 "authors nothing" class, identical to the malformed strict-fail the local-file path already uses.
 */
export function rdfFetchExitCode(code: RdfFetchErrorCode): number {
  switch (code) {
    case "ERR_RDF_FETCH_DISABLED":
    case "ERR_RDF_FETCH_HOST_DENIED":
    case "ERR_RDF_FETCH_SCHEME":
    case "ERR_RDF_FETCH_CREDENTIALS":
    case "ERR_RDF_FETCH_BLOCKED_IP":
    case "ERR_RDF_FETCH_URL":
      return 7;
    case "ERR_RDF_FETCH_REDIRECT":
    case "ERR_RDF_FETCH_TOO_LARGE":
    case "ERR_RDF_FETCH_TIMEOUT":
    case "ERR_RDF_FETCH_HTTP":
    case "ERR_RDF_FETCH_NETWORK":
      return 1;
  }
}

// ------------------------------------------------------------------------------------------------
// the injectable fetch seam (a minimal structural subset of the WHATWG `fetch`/`Response`).
// ------------------------------------------------------------------------------------------------

/** The request init this module builds — GET, fixed Accept, manual redirect, an abort signal. */
export interface RdfFetchInit {
  method: "GET";
  headers: Record<string, string>;
  redirect: "manual";
  signal: AbortSignal;
}

/** The minimal `Response` shape this module reads (the global `Response` is structurally compatible). */
export interface RdfFetchResponseLike {
  ok: boolean;
  status: number;
  type?: string;
  headers: { get(name: string): string | null };
  body: ReadableStream<Uint8Array> | null;
}

/** The injectable fetch. Defaults to the Node global `fetch`; tests inject a canned-bytes mock. */
export type RdfFetchImpl = (url: string, init: RdfFetchInit) => Promise<RdfFetchResponseLike>;

/** The safe-fetch outcome: the validated URL, the decoded body text, and the STREAMED byte count. */
export interface RdfFetchResult {
  url: string;
  text: string;
  bytes: number;
}

/**
 * DEFENSE-IN-DEPTH (D-67 security review): is `hostname` an unambiguously-dangerous IP LITERAL — loopback,
 * link-local, or the cloud-metadata endpoint — that must be refused even if the operator allowlisted it?
 * `new URL().hostname` returns an IPv4 literal verbatim (`169.254.169.254`) and an IPv6 literal WITH brackets
 * (`[::1]`), both lower-cased here. This blocks the clear literals cheaply, WITHOUT a DNS lookup; it does NOT
 * (and cannot, without resolving) block a HOSTNAME that resolves to a private/internal IP — that stays a
 * per-host TRUST decision the operator makes via the allowlist (disclosed in ADR-B14 / DEBTS D-67). RFC-1918
 * ranges (10/8, 172.16/12, 192.168/16) are deliberately NOT blocked: an operator legitimately allowlisting an
 * internal RDF store by IP literal is a real use, whereas loopback / link-local / metadata literals are
 * effectively never a legitimate RDF endpoint and are the classic SSRF targets.
 */
function isBlockedIpLiteral(hostname: string): boolean {
  const h = hostname.toLowerCase();
  // IPv6 literal: `new URL` wraps it in brackets. Block loopback (::1) and link-local fe80::/10 (fe80..febf).
  if (h.startsWith("[") && h.endsWith("]")) {
    const v6 = h.slice(1, -1).replace(/%.*$/, ""); // strip a zone id if present
    if (v6 === "::1" || v6 === "0:0:0:0:0:0:0:1") return true; // loopback
    if (/^fe[89ab][0-9a-f]:/.test(v6)) return true; // fe80::/10 link-local
    if (/^::ffff:(7f|a9fe)/.test(v6)) return true; // IPv4-mapped loopback / link-local
    return false;
  }
  // IPv4 dotted literal (exactly four 0-255 octets).
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return false;
  const o = m.slice(1).map(Number);
  if (o.some((n) => n > 255)) return false; // not a real IPv4 → not a literal we block here (host-denied handles it)
  if (o[0] === 127) return true; // 127.0.0.0/8 loopback
  if (o[0] === 169 && o[1] === 254) return true; // 169.254.0.0/16 link-local (incl. 169.254.169.254 metadata)
  if (o[0] === 0) return true; // 0.0.0.0/8 "this host"
  return false;
}

/** Is a response a redirect we refuse to follow? Covers both a plain 3xx (mock/test shape) AND undici's
 *  `redirect: "manual"` opaque-redirect (status 0, type "opaqueredirect"). */
function isRedirect(res: RdfFetchResponseLike): boolean {
  if (res.type === "opaqueredirect") return true;
  return res.status >= 300 && res.status < 400;
}

/**
 * Read a response body stream, enforcing the SIZE cap by a running byte count (NOT Content-Length, which is
 * attacker-controlled). Aborts the stream the instant the cap is exceeded. Decodes as UTF-8.
 */
async function readCapped(body: ReadableStream<Uint8Array>, maxBytes: number, url: string): Promise<{ text: string; bytes: number }> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined) continue;
      total += value.byteLength;
      // The check trips after at most ONE transport-sized chunk over the cap (undici reads ~64 KiB at a
      // time), so the buffered overshoot is bounded by the stream's chunk size — never by an
      // attacker-controlled Content-Length or by `maxBytes` itself.
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new RdfFetchError(
          "ERR_RDF_FETCH_TOO_LARGE",
          `${url}: response exceeded the ${maxBytes}-byte size cap (enforced by streamed byte count) — refused, nothing ingested`,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.byteLength;
  }
  return { text: new TextDecoder("utf-8").decode(buf), bytes: total };
}

/**
 * Safely fetch RDF (N-Triples) bytes from an explicit, allowlisted HTTPS endpoint. Performs, IN ORDER and
 * BEFORE any network call, the gate + allowlist + scheme + credential + URL validation (each a typed
 * `RdfFetchError`), then a GET with no credentials, a fixed Accept, and `redirect: "manual"`, refusing any
 * redirect, non-2xx status, over-cap body, or timeout. Returns the decoded body VERBATIM for the caller to
 * hand to the unchanged `rdfToAcquisition` — it never parses or authors anything itself.
 */
export async function fetchRdfDocument(
  url: string,
  opts: {
    env: Record<string, string | undefined>;
    fetchImpl?: RdfFetchImpl;
    maxBytes?: number;
    timeoutMs?: number;
  },
): Promise<RdfFetchResult> {
  const gate = resolveRdfFetchGate({ env: opts.env });
  if (!gate.enabled) {
    throw new RdfFetchError("ERR_RDF_FETCH_DISABLED", gate.reason ?? "remote RDF fetch is disabled");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new RdfFetchError("ERR_RDF_FETCH_URL", `not a valid absolute URL: ${JSON.stringify(url)} — refused`);
  }
  if (parsed.protocol !== "https:") {
    throw new RdfFetchError(
      "ERR_RDF_FETCH_SCHEME",
      `only https:// is allowed for remote RDF fetch (got ${parsed.protocol}//) — refused, no network call`,
    );
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    throw new RdfFetchError(
      "ERR_RDF_FETCH_CREDENTIALS",
      `URL carries embedded credentials (user:pass@host) — refused, no network call (credentials are never sent)`,
    );
  }
  const host = parsed.hostname.toLowerCase();
  // Defense-in-depth: refuse loopback/link-local/metadata IP LITERALS BEFORE the allowlist check — so even
  // an operator who allowlists `169.254.169.254` cannot reach the metadata endpoint. A HOSTNAME resolving to
  // an internal IP is NOT blocked here (would need a DNS lookup) and stays a per-host trust decision.
  if (isBlockedIpLiteral(host)) {
    throw new RdfFetchError(
      "ERR_RDF_FETCH_BLOCKED_IP",
      `host "${host}" is a loopback / link-local / cloud-metadata IP literal — refused, no network call ` +
        `(these are never a legitimate RDF endpoint; SSRF defense-in-depth)`,
    );
  }
  if (!gate.allowHosts.includes(host)) {
    throw new RdfFetchError(
      "ERR_RDF_FETCH_HOST_DENIED",
      `host "${host}" is not in the ${RDF_FETCH_ENV} allowlist [${gate.allowHosts.join(", ")}] — refused, no network call ` +
        `(exact hostname match only; no suffix/subdomain matching)`,
    );
  }

  const fetchImpl: RdfFetchImpl = opts.fetchImpl ?? ((u, init) => (fetch as unknown as RdfFetchImpl)(u, init));
  const maxBytes = opts.maxBytes ?? DEFAULT_RDF_FETCH_MAX_BYTES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_RDF_FETCH_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // A dedicated flag so a body-read that outlives a fired timer is still reported as a timeout, not a
  // generic network error.
  let timedOut = false;
  controller.signal.addEventListener("abort", () => {
    timedOut = true;
  });

  try {
    // Only the SAFE, fixed request shape: GET, a fixed Accept, NO cookies/auth/added query params, and a
    // MANUAL redirect (we never follow — a redirect target is attacker-chosen and would need re-validation).
    const init: RdfFetchInit = {
      method: "GET",
      headers: { Accept: RDF_FETCH_ACCEPT },
      redirect: "manual",
      signal: controller.signal,
    };

    let res: RdfFetchResponseLike;
    try {
      res = await fetchImpl(url, init);
    } catch (e) {
      if (timedOut || (e instanceof Error && e.name === "AbortError")) {
        throw new RdfFetchError("ERR_RDF_FETCH_TIMEOUT", `${url}: request timed out after ${timeoutMs}ms — refused, nothing ingested`);
      }
      throw new RdfFetchError("ERR_RDF_FETCH_NETWORK", `${url}: fetch failed — ${e instanceof Error ? e.message : String(e)}`);
    }

    if (isRedirect(res)) {
      const loc = res.headers.get("location");
      throw new RdfFetchError(
        "ERR_RDF_FETCH_REDIRECT",
        `${url}: refused to follow a redirect${loc ? ` to ${loc}` : ""} — redirects are not followed (target host/scheme is unverified)`,
      );
    }
    if (!res.ok) {
      throw new RdfFetchError("ERR_RDF_FETCH_HTTP", `${url}: HTTP ${res.status} — refused, nothing ingested`);
    }
    if (res.body === null) {
      throw new RdfFetchError("ERR_RDF_FETCH_NETWORK", `${url}: empty response body — nothing to ingest`);
    }

    try {
      const { text, bytes } = await readCapped(res.body, maxBytes, url);
      return { url, text, bytes };
    } catch (e) {
      if (e instanceof RdfFetchError) throw e;
      if (timedOut || (e instanceof Error && e.name === "AbortError")) {
        throw new RdfFetchError("ERR_RDF_FETCH_TIMEOUT", `${url}: request timed out after ${timeoutMs}ms — refused, nothing ingested`);
      }
      throw new RdfFetchError("ERR_RDF_FETCH_NETWORK", `${url}: reading the response body failed — ${e instanceof Error ? e.message : String(e)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
