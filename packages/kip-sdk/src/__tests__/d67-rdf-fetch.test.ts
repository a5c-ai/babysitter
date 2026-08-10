/**
 * D-67 (REMOTE half) - SAFE, GATED, HTTPS-only, host-ALLOWLISTED RDF (N-Triples) fetch that feeds the
 * fetched bytes VERBATIM through the EXISTING D-67 `rdfToAcquisition` parse + guard + `runAcquisition`
 * pipeline (ADR-B14). The fetch only ACQUIRES bytes safely; every integrity guard (reserved-channel /
 * forge refusal, malformed strict-fail, INV-A1) is inherited from the unchanged local-file path.
 *
 * SAFETY-BY-DESIGN, proven here with an INJECTED mock fetch (the whole suite makes NO real network call):
 *   - opt-in host allowlist gate (`KIP_RDF_FETCH`); UNSET/empty ⇒ remote fetch DISABLED (the default);
 *   - exact, case-insensitive hostname allowlist (no suffix/substring match — `evil-dbpedia.org` ≠ `dbpedia.org`);
 *   - HTTPS ONLY; embedded credentials refused; a non-URL refused;
 *   - GET only, fixed Accept, no credentials/cookies/added query params; redirects REFUSED (manual, not followed);
 *   - hard caps: a STREAMED byte-count size cap (not Content-Length trust) and an AbortController timeout;
 *   - the fetched body is UNTRUSTED and inherits every D-67 guard (a reserved-channel forge / malformed ⇒ refused);
 *   - INV-A1: only `runAcquisition` writes; a fetch failure / cap / forge authors NOTHING (N5).
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { MicroagentManifest, OpenOptions, Repo } from "../index";
import { KipRepo, open } from "../index";
import { runCli } from "../cli";
import { OWL_SAME_AS_IRI, rdfIngestDispatch, rdfToAcquisition } from "../rdf/ntriples";
import { FIXED_AS_OF, freshReplicaId, registerAcquisitionManifest } from "./conformance/fixtures-m7";
import {
  DEFAULT_RDF_FETCH_MAX_BYTES,
  DEFAULT_RDF_FETCH_TIMEOUT_MS,
  RDF_FETCH_ACCEPT,
  RDF_FETCH_ENV,
  RdfFetchError,
  fetchRdfDocument,
  rdfFetchExitCode,
  resolveRdfFetchGate,
  type RdfFetchImpl,
  type RdfFetchInit,
  type RdfFetchResponseLike,
} from "../rdf/fetch";

// ================================================================================================
// helpers — an INJECTABLE mock fetch. It records every call so a test can assert NO network was hit.
// ================================================================================================

const enc = new TextEncoder();

/** A ReadableStream that emits the given byte chunks then closes (mirrors a real Response.body). */
function streamOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

interface MockOpts {
  status?: number;
  type?: string;
  location?: string;
  body?: ReadableStream<Uint8Array> | null;
  bodyText?: string;
}

interface MockFetch {
  impl: RdfFetchImpl;
  calls: Array<{ url: string; init: RdfFetchInit }>;
}

/** A mock that returns a canned response and records its calls. NO real network is ever touched. */
function mockFetch(opts: MockOpts = {}): MockFetch {
  const calls: Array<{ url: string; init: RdfFetchInit }> = [];
  const status = opts.status ?? 200;
  const impl: RdfFetchImpl = (url, init) => {
    calls.push({ url, init });
    const headers = new Map<string, string>();
    if (opts.location !== undefined) headers.set("location", opts.location);
    const body = opts.body !== undefined ? opts.body : opts.bodyText !== undefined ? streamOf(enc.encode(opts.bodyText)) : null;
    const res: RdfFetchResponseLike = {
      ok: status >= 200 && status < 300,
      status,
      type: opts.type,
      headers: { get: (n: string) => headers.get(n.toLowerCase()) ?? null },
      body,
    };
    return Promise.resolve(res);
  };
  return { impl, calls };
}

/** A mock that NEVER resolves on its own — it rejects only when the AbortController fires (timeout). */
function neverResolvesMock(): MockFetch {
  const calls: Array<{ url: string; init: RdfFetchInit }> = [];
  const impl: RdfFetchImpl = (url, init) => {
    calls.push({ url, init });
    return new Promise<RdfFetchResponseLike>((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  };
  return { impl, calls };
}

const dbSameAs = [`<http://ex/a> <${OWL_SAME_AS_IRI}> <http://ex/b> .`, '<http://ex/a> <http://ex/name> "A" .', ""].join("\n");

// ================================================================================================
// (1) the gate — `KIP_RDF_FETCH` opt-in host allowlist (PURE, mirrors resolveResolveLiveGate)
// ================================================================================================

describe("D-67 fetch gate: resolveRdfFetchGate (opt-in allowlist)", () => {
  it("UNSET ⇒ disabled, no allowHosts", () => {
    const g = resolveRdfFetchGate({ env: {} });
    expect(g.enabled).toBe(false);
    expect(g.allowHosts).toEqual([]);
    expect(g.reason).toBeTruthy();
  });

  it("empty / whitespace-only ⇒ disabled", () => {
    expect(resolveRdfFetchGate({ env: { [RDF_FETCH_ENV]: "" } }).enabled).toBe(false);
    expect(resolveRdfFetchGate({ env: { [RDF_FETCH_ENV]: "   " } }).enabled).toBe(false);
    expect(resolveRdfFetchGate({ env: { [RDF_FETCH_ENV]: " , , " } }).enabled).toBe(false);
  });

  it("set ⇒ enabled with parsed, trimmed, lower-cased allowHosts", () => {
    const g = resolveRdfFetchGate({ env: { [RDF_FETCH_ENV]: " dbpedia.org , query.wikidata.org " } });
    expect(g.enabled).toBe(true);
    expect(g.allowHosts).toEqual(["dbpedia.org", "query.wikidata.org"]);
  });

  it("host list is case-insensitive (stored lower-cased)", () => {
    const g = resolveRdfFetchGate({ env: { [RDF_FETCH_ENV]: "DBpedia.ORG" } });
    expect(g.allowHosts).toEqual(["dbpedia.org"]);
  });
});

// ================================================================================================
// (2) fetchRdfDocument — allowlist / scheme / credential validation (PRE-network refusals)
// ================================================================================================

describe("D-67 fetch: allowlist + scheme + credential validation (no network on refusal)", () => {
  const env = { [RDF_FETCH_ENV]: "dbpedia.org,query.wikidata.org" };

  it("gate disabled ⇒ ERR_RDF_FETCH_DISABLED and the mock is NEVER called", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    await expect(fetchRdfDocument("https://dbpedia.org/g.nt", { env: {}, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_DISABLED",
    });
    expect(m.calls.length).toBe(0);
  });

  it("host in the allowlist ⇒ fetched (mock called with GET, fixed Accept, redirect:manual, no creds)", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    const r = await fetchRdfDocument("https://dbpedia.org/g.nt", { env, fetchImpl: m.impl });
    expect(r.url).toBe("https://dbpedia.org/g.nt");
    expect(r.text).toContain(OWL_SAME_AS_IRI);
    expect(r.bytes).toBe(enc.encode(dbSameAs).byteLength);
    expect(m.calls.length).toBe(1);
    const init = m.calls[0]!.init;
    expect(init.method).toBe("GET");
    expect(init.redirect).toBe("manual");
    expect(init.headers.Accept).toBe(RDF_FETCH_ACCEPT);
    // No credential / cookie / auth headers are ever added.
    const headerNames = Object.keys(init.headers).map((h) => h.toLowerCase());
    expect(headerNames).not.toContain("authorization");
    expect(headerNames).not.toContain("cookie");
  });

  it("host NOT in the allowlist ⇒ ERR_RDF_FETCH_HOST_DENIED, no network", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    await expect(fetchRdfDocument("https://example.com/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_HOST_DENIED",
    });
    expect(m.calls.length).toBe(0);
  });

  it("a suffix look-alike (evil-dbpedia.org) does NOT match dbpedia.org (exact match only)", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    await expect(fetchRdfDocument("https://evil-dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_HOST_DENIED",
    });
    // and a subdomain is also NOT a match (no suffix matching)
    await expect(fetchRdfDocument("https://x.dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_HOST_DENIED",
    });
    expect(m.calls.length).toBe(0);
  });

  it("host match is case-insensitive (URL host DBPEDIA.ORG vs allow dbpedia.org)", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    const r = await fetchRdfDocument("https://DBPEDIA.ORG/g.nt", { env, fetchImpl: m.impl });
    expect(r.bytes).toBeGreaterThan(0);
    expect(m.calls.length).toBe(1);
  });

  it("http:// (any non-https scheme) ⇒ ERR_RDF_FETCH_SCHEME, no network", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    await expect(fetchRdfDocument("http://dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_SCHEME",
    });
    await expect(fetchRdfDocument("ftp://dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_SCHEME",
    });
    expect(m.calls.length).toBe(0);
  });

  it("embedded credentials (https://user:pass@host) ⇒ ERR_RDF_FETCH_CREDENTIALS, no network", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    await expect(fetchRdfDocument("https://user:pass@dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_CREDENTIALS",
    });
    await expect(fetchRdfDocument("https://user@dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_CREDENTIALS",
    });
    expect(m.calls.length).toBe(0);
  });

  it("a non-URL string ⇒ ERR_RDF_FETCH_URL, no network", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    await expect(fetchRdfDocument("not a url", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_URL",
    });
    expect(m.calls.length).toBe(0);
  });

  // SSRF defense-in-depth (D-67 security review): a loopback/link-local/metadata IP LITERAL is refused BEFORE
  // the allowlist — even when the operator explicitly allowlists that literal — so the cloud-metadata endpoint
  // can never be reached. A HOSTNAME resolving to an internal IP is NOT blocked (per-host trust; disclosed).
  it("a dangerous IP literal is refused EVEN WHEN ALLOWLISTED (metadata/loopback/link-local, no network)", async () => {
    for (const ip of ["169.254.169.254", "127.0.0.1", "0.0.0.0"]) {
      const m = mockFetch({ bodyText: dbSameAs });
      await expect(
        fetchRdfDocument(`https://${ip}/g.nt`, { env: { [RDF_FETCH_ENV]: ip }, fetchImpl: m.impl }),
      ).rejects.toMatchObject({ code: "ERR_RDF_FETCH_BLOCKED_IP" });
      expect(m.calls.length).toBe(0);
    }
  });

  it("IPv6 loopback [::1] and link-local [fe80::…] literals are refused even when allowlisted (no network)", async () => {
    for (const ip of ["[::1]", "[fe80::1]"]) {
      const m = mockFetch({ bodyText: dbSameAs });
      await expect(
        fetchRdfDocument(`https://${ip}/g.nt`, { env: { [RDF_FETCH_ENV]: ip }, fetchImpl: m.impl }),
      ).rejects.toMatchObject({ code: "ERR_RDF_FETCH_BLOCKED_IP" });
      expect(m.calls.length).toBe(0);
    }
  });

  it("a NORMAL public IP literal is NOT over-blocked (8.8.8.8 allowlisted ⇒ fetched)", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    const r = await fetchRdfDocument("https://8.8.8.8/g.nt", { env: { [RDF_FETCH_ENV]: "8.8.8.8" }, fetchImpl: m.impl });
    expect(r.bytes).toBeGreaterThan(0);
    expect(m.calls.length).toBe(1);
  });

  it("the ERR_RDF_FETCH_BLOCKED_IP code maps to the pre-network gate exit 7", () => {
    expect(rdfFetchExitCode("ERR_RDF_FETCH_BLOCKED_IP")).toBe(7);
  });
});

// ================================================================================================
// (3) fetchRdfDocument — hard caps (streamed size cap; AbortController timeout) and HTTP/redirect
// ================================================================================================

describe("D-67 fetch: hard caps + redirect refusal (N5 typed refusal, nothing returned)", () => {
  const env = { [RDF_FETCH_ENV]: "dbpedia.org" };

  it("a body exceeding the size cap ⇒ ERR_RDF_FETCH_TOO_LARGE (enforced by STREAMED byte count, not Content-Length)", async () => {
    // two 4-byte chunks with maxBytes=6 ⇒ the running count trips at chunk 2, mid-stream.
    const m = mockFetch({ body: streamOf(enc.encode("AAAA"), enc.encode("BBBB")) });
    await expect(fetchRdfDocument("https://dbpedia.org/big.nt", { env, fetchImpl: m.impl, maxBytes: 6 })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_TOO_LARGE",
    });
  });

  it("a response that never resolves ⇒ ERR_RDF_FETCH_TIMEOUT (AbortController fires)", async () => {
    const m = neverResolvesMock();
    await expect(
      fetchRdfDocument("https://dbpedia.org/slow.nt", { env, fetchImpl: m.impl, timeoutMs: 20 }),
    ).rejects.toMatchObject({ code: "ERR_RDF_FETCH_TIMEOUT" });
    expect(m.calls.length).toBe(1); // it WAS dispatched, then aborted
  });

  it("a 3xx redirect ⇒ ERR_RDF_FETCH_REDIRECT (manual, not followed) even to another allowlisted host", async () => {
    const m = mockFetch({ status: 302, location: "https://dbpedia.org/elsewhere.nt" });
    await expect(fetchRdfDocument("https://dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_REDIRECT",
    });
  });

  it("an opaqueredirect response (real undici manual-redirect shape) ⇒ ERR_RDF_FETCH_REDIRECT", async () => {
    const m = mockFetch({ status: 0, type: "opaqueredirect" });
    await expect(fetchRdfDocument("https://dbpedia.org/g.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_REDIRECT",
    });
  });

  it("a non-2xx status ⇒ ERR_RDF_FETCH_HTTP", async () => {
    const m = mockFetch({ status: 404 });
    await expect(fetchRdfDocument("https://dbpedia.org/missing.nt", { env, fetchImpl: m.impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_HTTP",
    });
  });

  it("the injected impl throwing (network failure) ⇒ ERR_RDF_FETCH_NETWORK", async () => {
    const impl: RdfFetchImpl = () => Promise.reject(new Error("ECONNREFUSED"));
    await expect(fetchRdfDocument("https://dbpedia.org/g.nt", { env, fetchImpl: impl })).rejects.toMatchObject({
      code: "ERR_RDF_FETCH_NETWORK",
    });
  });

  it("RdfFetchError is a typed error; rdfFetchExitCode maps pre-network refusals ⇒ 7, runtime ⇒ 1", () => {
    expect(rdfFetchExitCode("ERR_RDF_FETCH_DISABLED")).toBe(7);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_HOST_DENIED")).toBe(7);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_SCHEME")).toBe(7);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_CREDENTIALS")).toBe(7);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_URL")).toBe(7);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_TOO_LARGE")).toBe(1);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_TIMEOUT")).toBe(1);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_REDIRECT")).toBe(1);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_HTTP")).toBe(1);
    expect(rdfFetchExitCode("ERR_RDF_FETCH_NETWORK")).toBe(1);
    expect(new RdfFetchError("ERR_RDF_FETCH_URL", "x")).toBeInstanceOf(Error);
  });

  it("the documented defaults are 5 MB and 30s", () => {
    expect(DEFAULT_RDF_FETCH_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(DEFAULT_RDF_FETCH_TIMEOUT_MS).toBe(30_000);
  });
});

// ================================================================================================
// (4) CLI wiring — `kip ingest-rdf --url` (gate exit 7, mutual exclusion, fetched-data guards, author)
// ================================================================================================

async function runIngest(
  argv: string[],
  opts: { cwd: string; env?: Record<string, string | undefined>; openRepo?: (o: OpenOptions) => Promise<Repo>; fetchImpl?: RdfFetchImpl },
): Promise<{ code: number; stdout: string; stderr: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const code = await runCli(argv, {
    cwd: opts.cwd,
    env: opts.env ?? {},
    stdout: (c) => out.push(c),
    stderr: (c) => err.push(c),
    openRepo: opts.openRepo,
    fetchImpl: opts.fetchImpl,
  });
  return { code, stdout: out.join(""), stderr: err.join("") };
}

describe("D-67 CLI: `kip ingest-rdf --url` (gated, allowlisted, HTTPS-only remote fetch)", () => {
  const dirs: string[] = [];
  function mkTmp(label: string): string {
    const d = mkdtempSync(join(tmpdir(), `kip-rdf-fetch-${label}-`));
    dirs.push(d);
    return d;
  }
  async function initRepoDir(label: string): Promise<string> {
    const dir = mkTmp(label);
    const repo = await open({ dir, replicaId: `rdf-fetch-${label}-${Date.now()}`, keyring: {}, createIfMissing: true });
    repo.close();
    writeFileSync(join(dir, "keyring.json"), JSON.stringify({ note: "test keyring" }));
    return dir;
  }

  it("--url with the gate DISABLED ⇒ exit 7 BEFORE any network (mock never called, repo never opened)", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    let opened = false;
    const r = await runIngest(["ingest-rdf", "--url", "https://dbpedia.org/g.nt"], {
      cwd: mkTmp("gateoff"),
      env: {},
      fetchImpl: m.impl,
      openRepo: async () => {
        opened = true;
        throw new Error("repo must not open when the fetch gate is disabled");
      },
    });
    expect(r.code).toBe(7);
    expect(r.stderr).toMatch(/KIP_RDF_FETCH/);
    expect(m.calls.length).toBe(0);
    expect(opened).toBe(false);
  });

  it("--url to a host NOT in the allowlist ⇒ exit 7, no network", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    const r = await runIngest(["ingest-rdf", "--url", "https://example.com/g.nt"], {
      cwd: mkTmp("hostdenied"),
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
    });
    expect(r.code).toBe(7);
    expect(m.calls.length).toBe(0);
  });

  it("--url with http:// ⇒ exit 7 (https only), no network", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    const r = await runIngest(["ingest-rdf", "--url", "http://dbpedia.org/g.nt"], {
      cwd: mkTmp("scheme"),
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
    });
    expect(r.code).toBe(7);
    expect(m.calls.length).toBe(0);
  });

  it("--url + <file> ⇒ usage error (exit 2, mutually exclusive)", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    const r = await runIngest(["ingest-rdf", "some.nt", "--url", "https://dbpedia.org/g.nt"], {
      cwd: mkTmp("mutex"),
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
    });
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(/mutually exclusive|either a <file> or --url/i);
    expect(m.calls.length).toBe(0);
  });

  it("neither <file> nor --url ⇒ usage error (exit 2)", async () => {
    const r = await runIngest(["ingest-rdf"], { cwd: mkTmp("neither") });
    expect(r.code).toBe(2);
  });

  it("SUCCESS (CLI wiring): a mock over an allowlisted host authors via runAcquisition; --json reports source=URL + bytesFetched", async () => {
    const dir = await initRepoDir("author");
    const m = mockFetch({ bodyText: dbSameAs });
    const calls: Array<{ method: string; input?: unknown }> = [];
    const spy = {
      registerFunctionality: async (_id: string, _mf: MicroagentManifest) => {
        calls.push({ method: "registerFunctionality" });
      },
      runAcquisition: async (_mf: MicroagentManifest, input: unknown) => {
        calls.push({ method: "runAcquisition", input });
        return { facts: ["f1", "f2", "f3"] };
      },
      close: () => undefined,
    } as unknown as Repo;

    const r = await runIngest(["ingest-rdf", "--url", "https://dbpedia.org/g.nt", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
      openRepo: async () => spy,
    });
    expect(r.code).toBe(0);
    expect(m.calls.length).toBe(1);
    // the FETCHED bytes are handed VERBATIM to runAcquisition (the same input the file path builds)…
    const wiring = calls.find((c) => c.method === "runAcquisition")!;
    expect((wiring.input as { ntriples: string }).ntriples).toContain(OWL_SAME_AS_IRI);
    // …and the provenance source is the URL.
    expect((wiring.input as { source: string }).source).toBe("https://dbpedia.org/g.nt");
    const parsed = JSON.parse(r.stdout.trim()) as { facts: string[]; sameAs: number; props: number; source: string; bytesFetched: number };
    expect(parsed.facts).toEqual(["f1", "f2", "f3"]);
    expect(parsed.sameAs).toBe(1);
    expect(parsed.props).toBe(1);
    expect(parsed.source).toBe("https://dbpedia.org/g.nt");
    expect(parsed.bytesFetched).toBe(enc.encode(dbSameAs).byteLength);
  });

  it("SUCCESS (integration): fetched bytes author QUERYABLE facts through the REAL runAcquisition, provenance = the URL", async () => {
    const url = "https://dbpedia.org/g.nt";
    const m = mockFetch({ bodyText: dbSameAs });
    // acquire bytes via the SAFE fetch (injected mock — no network), then author through the REAL path.
    const fetched = await import("../rdf/fetch").then((mod) => mod.fetchRdfDocument(url, { env: { [RDF_FETCH_ENV]: "dbpedia.org" }, fetchImpl: m.impl }));
    expect(m.calls.length).toBe(1);

    // provenance source is stamped as the URL on the acquisition result.
    const acq = rdfToAcquisition(fetched.text, { source: url });
    expect(acq.result.source.source?.uri).toBe(url);

    const repo = new KipRepo({ replicaId: freshReplicaId("fetch-int"), dispatchMicroagent: rdfIngestDispatch });
    const manifest = await registerAcquisitionManifest(repo, "kip-rdf");
    await repo.runAcquisition(manifest, { ntriples: fetched.text, source: url }, { asOf: FIXED_AS_OF });

    // the fetched external IRIs are genuinely queryable and the owl:sameAs joined them.
    const a = await repo.getNode("http://ex/a");
    expect(a).not.toBeNull();
    const cls = await repo.sameAsClass("http://ex/a");
    expect(cls).toContain("http://ex/a");
    expect(cls).toContain("http://ex/b");
    repo.close();
  });

  it("UNTRUSTED content: a fetched reserved-channel forge is REFUSED by the inherited D-67 guards (exit 1, nothing authored)", async () => {
    const forge = "<http://ex/a> <same_as> <http://ex/b> .\n"; // predicate maps to the reserved `same_as` kind
    const m = mockFetch({ bodyText: forge });
    let opened = false;
    const r = await runIngest(["ingest-rdf", "--url", "https://dbpedia.org/forge.nt"], {
      cwd: mkTmp("forge"),
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
      openRepo: async () => {
        opened = true;
        throw new Error("a reserved-channel forge must never reach the repo write path");
      },
    });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/RESERVED|refus/i);
    expect(m.calls.length).toBe(1); // it WAS fetched…
    expect(opened).toBe(false); // …but strict-failed BEFORE any repo write (INV-A1 / N5)
  });

  it("UNTRUSTED content: fetched malformed N-Triples strict-fail (exit 1, nothing authored)", async () => {
    const m = mockFetch({ bodyText: "<http://ex/a> <http://ex/p> <http://ex/b>\n" }); // missing terminating '.'
    let opened = false;
    const r = await runIngest(["ingest-rdf", "--url", "https://dbpedia.org/bad.nt"], {
      cwd: mkTmp("malformed"),
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
      openRepo: async () => {
        opened = true;
        throw new Error("malformed fetched data must not reach the repo write path");
      },
    });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/line 1:/);
    expect(opened).toBe(false);
  });

  it("a redirect in the fetched response ⇒ exit 1, nothing authored", async () => {
    const m = mockFetch({ status: 302, location: "https://elsewhere.example/g.nt" });
    let opened = false;
    const r = await runIngest(["ingest-rdf", "--url", "https://dbpedia.org/g.nt"], {
      cwd: mkTmp("redirect"),
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
      openRepo: async () => {
        opened = true;
        throw new Error("a refused redirect must not reach the repo write path");
      },
    });
    expect(r.code).toBe(1);
    expect(opened).toBe(false);
  });

  it("--dry-run with --url STILL fetches (to report real would-be facts) but authors NOTHING (still requires the gate)", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    let opened = false;
    const r = await runIngest(["ingest-rdf", "--url", "https://dbpedia.org/g.nt", "--dry-run", "--json"], {
      cwd: mkTmp("dry"),
      env: { [RDF_FETCH_ENV]: "dbpedia.org" },
      fetchImpl: m.impl,
      openRepo: async () => {
        opened = true;
        throw new Error("dry-run must not open the repo");
      },
    });
    expect(r.code).toBe(0);
    expect(m.calls.length).toBe(1); // it DID fetch the real bytes
    expect(opened).toBe(false); // …but authored nothing
    const parsed = JSON.parse(r.stdout.trim()) as { facts: unknown[]; sameAs: number; dryRun: boolean; source: string; bytesFetched: number };
    expect(parsed.dryRun).toBe(true);
    expect(parsed.facts).toEqual([]);
    expect(parsed.sameAs).toBe(1);
    expect(parsed.source).toBe("https://dbpedia.org/g.nt");
    expect(parsed.bytesFetched).toBe(enc.encode(dbSameAs).byteLength);
  });

  it("--dry-run with --url and the gate OFF ⇒ exit 7 (dry-run still requires the gate), no network", async () => {
    const m = mockFetch({ bodyText: dbSameAs });
    const r = await runIngest(["ingest-rdf", "--url", "https://dbpedia.org/g.nt", "--dry-run"], {
      cwd: mkTmp("dryoff"),
      env: {},
      fetchImpl: m.impl,
    });
    expect(r.code).toBe(7);
    expect(m.calls.length).toBe(0);
  });

  afterEach(() => {
    // repos/tmp dirs are OS-tmp; left for the runner to reap (mirrors d67-rdf-ntriples.test.ts).
  });
});
