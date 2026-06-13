/**
 * Backend mode + config resolution (SPEC-LIVE-BACKEND §5).
 *
 * `resolveBackendConfig(env, search)` is a PURE function: it reads the Vite
 * `import.meta.env` and the URL query string and produces a `BackendConfig`.
 * URL params win over env (§5.2) so a deploy can default to real while a
 * `?backend=mock` debug URL forces the mock (and vice-versa).
 *
 * DEFAULT mode is `'mock'` (AC1/AC10). A real mode that is missing its
 * `gatewayUrl`/`token` fails safe back to mock rather than booting a dead
 * socket — the deterministic mock is always the safe default.
 *
 * SPEC-KRADLE-CONTROLPLANE §4.1 (AC16) extends this with the kradle control-plane
 * knobs (`kradle{ApiUrl,Token,Org,Repo}` ← `VITE_KRADLE_*` / `?kradle=&ktoken=&korg=&krepo=`).
 * The kradle fields are resolved INDEPENDENTLY of `mode`, and the real fail-safe
 * is relaxed: a real mode is valid with `(gatewayUrl && token)` OR `kradleApiUrl`
 * (kradle-only real mode). The default stays `'mock'`; kradle never flips it.
 */

import { DEFAULT_SEED } from './mock/mockBackend';
import { seedFromSearch } from './mock/prng';

export type BackendMode = 'mock' | 'real';

export interface BackendConfig {
  mode: BackendMode;
  /** Mock-only: PRNG seed (default 42). Ignored when mode === 'real'. */
  seed: number;
  /** Real-only: ws/wss gateway URL. Required when mode === 'real'. */
  gatewayUrl?: string;
  /** Real-only: bearer/auth token. Required when mode === 'real'. */
  token?: string;
  /** Real-only keepalive/backoff knobs (all optional; defaults in §2). */
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxReconnectAttempts?: number;
  /**
   * Kradle control-plane knobs (SPEC-KRADLE-CONTROLPLANE §4.1, AC16). Resolved
   * independently of `mode`; the kradle client is constructed only on the real
   * boot path and only when `kradleApiUrl` is set (§4.2, AC18).
   */
  /** Base origin of the kradle web app. ← `VITE_KRADLE_API_URL` / `?kradle=`. */
  kradleApiUrl?: string;
  /** Bearer token for the kradle BFF. ← `VITE_KRADLE_TOKEN` / `?ktoken=`. */
  kradleToken?: string;
  /** Org slug (default `'default'`). ← `VITE_KRADLE_ORG` / `?korg=`. */
  kradleOrg?: string;
  /** Default dispatch repository (default `'default'`). ← `VITE_KRADLE_REPO` / `?krepo=`. */
  kradleRepo?: string;
}

/**
 * Minimal structural view of `import.meta.env` for resolution. Mirrors the
 * `ImportMetaEnv` shape declared in `src/vite-env.d.ts` (§5.4); typed locally
 * as `Readonly<...>` so callers may pass `import.meta.env` directly and tests
 * may pass a plain object — neither needs `any`.
 */
export interface BackendEnv {
  readonly VITE_BACKEND?: string;
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_GATEWAY_TOKEN?: string;
  readonly VITE_KRADLE_API_URL?: string;
  readonly VITE_KRADLE_TOKEN?: string;
  readonly VITE_KRADLE_ORG?: string;
  readonly VITE_KRADLE_REPO?: string;
}

function normalizeMode(raw: string | null | undefined): BackendMode | null {
  if (raw === 'mock' || raw === 'real') return raw;
  return null;
}

function nonEmpty(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolve a `BackendConfig` from Vite env + URL params (§5.2). Pure; no I/O.
 */
export function resolveBackendConfig(env: BackendEnv, search: string): BackendConfig {
  const params = new URLSearchParams(search);

  // Seed is always resolved so the mock branch has it regardless of mode
  // (reuse the canonical parser — never re-implement seed parsing).
  const seed = seedFromSearch(search, DEFAULT_SEED);

  // URL params win over env for every overlapping key.
  const requestedMode =
    normalizeMode(params.get('backend')) ?? normalizeMode(env.VITE_BACKEND) ?? 'mock';
  const gatewayUrl = nonEmpty(params.get('gateway')) ?? nonEmpty(env.VITE_GATEWAY_URL);
  const token = nonEmpty(params.get('token')) ?? nonEmpty(env.VITE_GATEWAY_TOKEN);

  // Kradle control-plane fields (§4.1, AC16). Resolved independently of `mode`;
  // URL params win over env. `kradleApiUrl` is the gate — it is set iff a
  // non-empty `?kradle=`/`VITE_KRADLE_API_URL` is present.
  const kradleApiUrl = nonEmpty(params.get('kradle')) ?? nonEmpty(env.VITE_KRADLE_API_URL);
  const kradleToken = nonEmpty(params.get('ktoken')) ?? nonEmpty(env.VITE_KRADLE_TOKEN);
  const kradleOrg = nonEmpty(params.get('korg')) ?? nonEmpty(env.VITE_KRADLE_ORG);
  const kradleRepo = nonEmpty(params.get('krepo')) ?? nonEmpty(env.VITE_KRADLE_REPO);

  // Only attach kradle fields when a kradle URL is present, so the mock-branch
  // output is byte-unchanged for every input that does not set kradle (AC15).
  const kradleFields: Partial<BackendConfig> = kradleApiUrl
    ? {
        kradleApiUrl,
        ...(kradleToken !== undefined ? { kradleToken } : {}),
        kradleOrg: kradleOrg ?? 'default',
        kradleRepo: kradleRepo ?? 'default',
      }
    : {};

  // Fail-safe (relaxed for kradle, §4.1/AC16): a real mode is valid with a
  // gateway (url && token) OR a kradle URL (kradle-only real mode). Otherwise a
  // misconfigured real degrades to the deterministic mock, not a dead socket.
  const gatewayReady = gatewayUrl !== undefined && token !== undefined;
  if (requestedMode === 'real' && (gatewayReady || kradleApiUrl !== undefined)) {
    return {
      mode: 'real',
      seed,
      ...(gatewayUrl !== undefined ? { gatewayUrl } : {}),
      ...(token !== undefined ? { token } : {}),
      ...kradleFields,
    };
  }

  // Mock default. Kradle fields are carried (inert under mock, §4.1) only when a
  // kradle URL was supplied; inputs without kradle keep the exact prior shape.
  return { mode: 'mock', seed, ...kradleFields };
}
