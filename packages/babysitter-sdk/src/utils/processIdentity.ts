import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** A process identity that changes when the OS reuses a PID. */
export function getProcessStartIdentity(pid: number): string | undefined {
  if (!Number.isInteger(pid) || pid <= 0) return undefined;
  try {
    if (process.platform === "linux") {
      const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
      const endOfName = stat.lastIndexOf(")");
      if (endOfName < 0) return undefined;
      // Fields after comm start with state (field 3); starttime is field 22.
      const startTicks = stat.slice(endOfName + 2).trim().split(/\s+/)[19];
      const bootId = readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim();
      return startTicks && bootId ? `linux:${bootId}:${startTicks}` : undefined;
    }
    if (process.platform === "win32") {
      const output = execFileSync("powershell", ["-NoProfile", "-Command", `(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CreationDate`], { encoding: "utf8", timeout: 3000 }).trim();
      return output ? `windows:${output}` : undefined;
    }
    const output = execFileSync("ps", ["-p", String(pid), "-o", "lstart="], { encoding: "utf8", timeout: 3000 }).trim();
    return output ? `posix:${output}` : undefined;
  } catch {
    return undefined;
  }
}
