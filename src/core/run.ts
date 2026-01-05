export type RunStatus = 'running' | 'completed' | 'failed' | 'paused' | 'canceled' | 'unknown';

export type RunTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type RunPaths = {
  runRoot: string;
  stateJson: string;
  journalJsonl: string;
  artifactsDir: string;
  promptsDir: string;
  workSummariesDir: string;
  codeDir: string;
  mainJs: string;
};

export type Run = {
  id: string;
  status: RunStatus;
  timestamps: RunTimestamps;
  paths: RunPaths;
};
