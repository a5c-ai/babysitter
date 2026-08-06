import { BabysitterRuntimeError, ErrorCategory } from "../exceptions";

export class ConvergentRunError extends BabysitterRuntimeError {
  constructor(code: string, message: string) {
    super(code, message, { category: ErrorCategory.Runtime });
  }
}
