/**
 * Typed error for malformed or invalid hooks-mux output.
 */
export class HookOutputParseError extends Error {
  public readonly code: string;
  public readonly rawInput: string;

  constructor(message: string, rawInput: string, code?: string) {
    super(message);
    this.name = 'HookOutputParseError';
    this.code = code ?? 'HOOK_OUTPUT_PARSE_ERROR';
    this.rawInput = rawInput;
  }
}
