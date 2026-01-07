const CSI = /\x1b\[[0-?]*[ -/]*[@-~]/g; // Control Sequence Introducer
const OSC = /\x1b\][^\x07]*(?:\x07|\x1b\\)/g; // Operating System Command
const DCS_PM_APC = /\x1b[PX^_].*?\x1b\\/gs; // DCS, PM, APC

// Keep common whitespace; strip other control chars (incl. DEL + C1 controls).
const OTHER_CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

export function sanitizeTerminalOutput(text: string): string {
  if (!text) return '';
  return (
    text
      // Normalize newlines early to avoid leaving stray CR characters behind.
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Strip common ANSI/terminal escape sequences.
      .replace(OSC, '')
      .replace(DCS_PM_APC, '')
      .replace(CSI, '')
      // Strip remaining control characters that can corrupt VS Code output rendering.
      .replace(OTHER_CONTROLS, '')
  );
}

