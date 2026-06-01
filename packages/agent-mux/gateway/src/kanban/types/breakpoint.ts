// Breakpoint-related types

export interface BreakpointFile {
  path: string;
  format: string;
  language?: string;
}

export interface BreakpointPayload {
  question: string;
  title: string;
  options?: string[];
  context?: {
    files?: BreakpointFile[];
  };
}

