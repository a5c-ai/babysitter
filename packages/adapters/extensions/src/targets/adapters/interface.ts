// Unified adapter interface for per-harness output generation

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';

export interface HarnessOutputAdapter {
  readonly targetName: string;
  generateHookRegistration(manifest: A5cPluginManifest, targetProfile: TargetProfile, diagnostics: Diagnostic[]): TransformedFile | null;
  generateManifestFiles(sourceDir: string, manifest: A5cPluginManifest, targetProfile: TargetProfile, diagnostics: Diagnostic[], rawManifest?: A5cPluginManifest): TransformedFile[];
  generateExtraTargetFiles(sourceDir: string, manifest: A5cPluginManifest, targetProfile: TargetProfile, diagnostics: Diagnostic[]): TransformedFile[];
  // Emit the harness-native MCP config file from manifest.mcpServers, or null
  // when no MCP servers are declared.
  generateMcpConfig(manifest: A5cPluginManifest, targetProfile: TargetProfile): TransformedFile | null;
}
