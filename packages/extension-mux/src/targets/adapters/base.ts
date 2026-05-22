// Base adapter class with default no-op implementations

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import type { HarnessOutputAdapter } from './interface.js';

export class BaseHarnessOutputAdapter implements HarnessOutputAdapter {
  readonly targetName: string;

  constructor(targetName: string) {
    this.targetName = targetName;
  }

  generateHookRegistration(
    _manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    return null;
  }

  generateManifestFiles(
    _sourceDir: string,
    _manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[],
    _rawManifest?: A5cPluginManifest
  ): TransformedFile[] {
    return [];
  }

  generateExtraTargetFiles(
    _sourceDir: string,
    _manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    return [];
  }
}
