/**
 * Platform utility barrel.
 */

export {
  GentyRuntimeError,
  BabysitterRuntimeError,
  ErrorCategory,
  ERROR_CATEGORY_DESCRIPTIONS,
  isGentyError,
  isBabysitterError,
  type GentyErrorDetails,
  type GentyErrorOptions,
} from "./errors";

export { writeFileAtomic } from "./atomic";

export {
  parsePattern,
  matchPattern,
  type BreakpointPattern,
  type AttributePredicate,
  type PredicateOp,
} from "./patterns";
