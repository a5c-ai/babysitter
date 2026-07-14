export function formatDuration(ms: number | undefined | null): string {
  if (ms == null || ms < 0) return "\u2014";
  if (ms === 0) return "<1s";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 48) return `${hours}h ${remainingMinutes}m`;
  // QA F7: "388h 25m" is unreadable — past 48h, days carry the meaning.
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

export function formatTimestamp(iso: string | undefined): string {
  if (!iso) return "\u2014";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "\u2014";
  }
}

export function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 0) return "just now";
    if (diff < 5000) return "just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch {
    return "";
  }
}

/**
 * §15.1 AC-87 (owner gate 2026-07-06b, model A): the ONE explanatory line the
 * hide affordance shows — on the grid EyeOff control AND the settings-modal
 * hidden-projects section — so a user knows hiding is quiet-but-not-silent.
 * Verbatim intent; single source so both surfaces stay identical.
 */
export const HIDE_AFFORDANCE_MICROCOPY =
  "Hidden projects are removed from the grid but still alarm you for approvals and surface live/scheduled runs (shown with the 👁 marker and a '(N from hidden)' count).";

/**
 * §15.1 (AC-84/85): relative wake-time phrasing for a scheduled (sleeping)
 * forever-run. Returns whether the wake time has PASSED (overdue) and a short
 * magnitude string ("3h", "17h", "2d"). Pure — `now` is injectable for tests.
 */
export function formatWakeRelative(
  iso: string | undefined,
  now: number = Date.now()
): { overdue: boolean; text: string } {
  if (!iso) return { overdue: false, text: "" };
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return { overdue: false, text: "" };
  const diff = t - now; // > 0 future wake; <= 0 overdue
  const overdue = diff <= 0;
  const abs = Math.abs(diff);
  const magnitude =
    abs < 60000
      ? "<1m"
      : abs < 3600000
        ? `${Math.floor(abs / 60000)}m`
        : abs < 86400000
          ? `${Math.floor(abs / 3600000)}h`
          : `${Math.floor(abs / 86400000)}d`;
  return { overdue, text: overdue ? `${magnitude} ago` : `in ${magnitude}` };
}

export function truncateId(id: string, len: number = 12): string {
  if (!id) return "\u2014";
  if (id.length <= len) return id;
  return id.slice(0, len) + "...";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
    case "resolved":
    case "ok":
      return "text-success";
    case "failed":
    case "error":
      return "text-error";
    case "waiting":
    case "pending":
      return "text-pending";
    case "running":
    case "requested":
      return "text-info";
    default:
      return "text-foreground-muted";
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case "completed":
    case "resolved":
    case "ok":
      return "bg-success-muted";
    case "failed":
    case "error":
      return "bg-error-muted";
    case "waiting":
    case "pending":
      return "bg-pending-muted";
    case "running":
    case "requested":
      return "bg-info-muted";
    default:
      return "bg-muted";
  }
}

// Opaque machine-generated ids where any fragment is as good as any other:
// ULID (26-char Crockford base32), UUID, or a long hex hash.
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_RE = /^[0-9a-f]{16,}$/i;

export function formatShortId(id: string, chars: number = 4): string {
  if (!id) return 'N/A';
  if (id.length <= chars) return id;
  // Human-named ids (e.g. a run dir called "my-migration"): the head carries
  // the meaning — "...tion" would be useless. Show the name, head-truncated
  // only when genuinely long (QA F9 tail).
  if (!ULID_RE.test(id) && !UUID_RE.test(id) && !HEX_RE.test(id)) {
    return id.length <= 20 ? id : truncateId(id, 17);
  }
  return '...' + id.slice(-chars);
}

export function friendlyProcessName(processId: string): string {
  if (!processId) return '';
  // SESSIONS-CHIP-SPEC AC6: the bare-run label "Bare Run" reads as "Idle session".
  if (processId === 'bare-run') return 'Idle session';
  return processId
    .split(/[-/]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
