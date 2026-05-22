export {
  SESSION_SCHEMA_VERSION,
  getSessionDir,
  loadSession,
  saveSession,
  deleteSession,
  updateSession,
  addContextFragment,
} from './store';

export { acquireLock, releaseLock } from './lock';

export { getDefaultSessionDir, getSessionFilePath } from './paths';

export {
  SESSION_PID_MARKER_ENV_VAR,
  isSessionPidMarkerEnabled,
  findHarnessAncestorPid,
  writeSessionMarker,
  readSessionMarker,
  cleanupSessionMarker,
  getSessionMarkerPath,
  __setAncestorResolverForTests,
  __resetCacheForTests,
} from './markers';
