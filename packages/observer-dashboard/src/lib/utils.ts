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
  return `${hours}h ${remainingMinutes}m`;
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

export function formatShortId(id: string, chars: number = 4): string {
  if (!id) return '—';
  if (id.length <= chars) return id;
  return '...' + id.slice(-chars);
}

export function friendlyProcessName(processId: string): string {
  if (!processId) return '';
  return processId
    .split(/[-/]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
