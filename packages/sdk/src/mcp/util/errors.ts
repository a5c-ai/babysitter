export function toolError(message: string): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
}

export function toolResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
