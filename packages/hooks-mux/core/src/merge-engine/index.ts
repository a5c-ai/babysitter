export {
  mergeResults,
  MergeConflictError,
  type MergeOptions,
  type MergedExecutionResult,
  type DecisionVerb,
} from './merge';

export {
  type MergeDiagnostics,
  type MergeConflict,
  type DegradedField,
  type HandlerTiming,
  type UnsupportedOutputField,
  type NativeRenderingLoss,
  createDiagnostics,
  recordConflict,
  recordDegradedField,
  recordUnsupportedOutputField,
  recordNativeRenderingLoss,
} from './diagnostics';
