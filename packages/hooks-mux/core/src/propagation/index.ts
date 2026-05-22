export { materializeExecContext } from './materialize';
export {
  buildExportEnvFileLines,
  generateTempEnvFile,
  escapeShellValue,
  getTrackedTempFiles,
  cleanupTempFiles,
} from './env-file';
export { adaptOutput } from './adapt-output';
export { propagateEnv } from './propagation-backends';

export type {
  MaterializeOptions,
  ExecMaterialization,
  AdaptOutputOptions,
  AdaptedOutput,
  PropagationBackend,
  PropagationOptions,
  SessionStore,
} from './types';
