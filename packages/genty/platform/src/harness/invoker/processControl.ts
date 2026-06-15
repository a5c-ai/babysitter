interface ChildHandle {
  pid?: number;
  kill: (signal?: NodeJS.Signals | number) => boolean;
}

const activeChildren = new Map<number, ChildHandle>();

export function trackChild(child: ChildHandle): void {
  if (child.pid != null) {
    activeChildren.set(child.pid, child);
  }
}

export function untrackChild(pid: number | undefined): void {
  if (pid != null) {
    activeChildren.delete(pid);
  }
}

export function cancelRunningProcess(
  pid: number,
  options?: { gracePeriodMs?: number },
): Promise<boolean> {
  const gracePeriodMs = options?.gracePeriodMs ?? 5000;
  const child = activeChildren.get(pid);

  if (!child) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      return Promise.resolve(false);
    }
    setTimeout(() => {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Process already exited.
      }
    }, gracePeriodMs);
    return Promise.resolve(true);
  }

  const result = child.kill("SIGTERM");
  if (!result) {
    return Promise.resolve(false);
  }

  setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {
      // Process already exited.
    }
  }, gracePeriodMs);

  return Promise.resolve(true);
}
