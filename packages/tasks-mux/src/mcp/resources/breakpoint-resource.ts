import type { BreakpointBackend } from "../../backend.js";

export const breakpointResourceTemplate = "breakpoint://{id}";

export async function readBreakpointResource(
  uri: URL,
  backend: BreakpointBackend,
) {
  const id = uri.hostname || uri.pathname.replace(/^\/+/, "");
  if (!id) {
    throw new Error("Missing breakpoint id in resource URI");
  }

  const breakpoint = await backend.getBreakpoint(id);
  return {
    contents: [
      {
        uri: `breakpoint://${breakpoint.id}`,
        mimeType: "application/json",
        text: JSON.stringify(breakpoint, null, 2),
      },
    ],
  };
}
