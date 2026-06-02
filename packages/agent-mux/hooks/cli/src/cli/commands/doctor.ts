/**
 * doctor command — Report adapter capability profile, integration warnings,
 * session store health, and stale session detection.
 *
 * Spec section 18.6 (Phase 5 enhancement).
 */

import type { CommandModule } from 'yargs';
import type { AdapterCapabilities, PhaseMapping } from '@a5c-ai/agent-mux-hooks-core';
import { CANONICAL_PHASES, getDefaultSessionDir } from '@a5c-ai/agent-mux-hooks-core';
import { loadAdapter, KNOWN_ADAPTERS } from '../adapter-loader';
import * as fs from 'fs';
import * as path from 'path';

interface DoctorArgs {
  adapter?: string;
  json?: boolean;
  'session-dir'?: string;
  'stale-threshold'?: number;
}

interface AdapterReport {
  name: string;
  available: boolean;
  packageName: string;
  capabilities?: AdapterCapabilities;
  phaseMappings?: PhaseMappingSummary[];
  capabilityProfile?: CapabilityProfile;
  warnings: string[];
  error?: string;
}

interface PhaseMappingSummary {
  canonicalPhase: string;
  nativeHook: string;
  supportLevel: string;
  blockCapability: boolean;
  mutationCapability: boolean;
}

interface CapabilityProfile {
  supportedPhases: string[];
  unsupportedPhases: string[];
  blockablePhases: string[];
  mutablePhases: string[];
  lossyPhases: string[];
  emulatedPhases: string[];
}

interface SessionHealthReport {
  sessionDir: string;
  dirExists: boolean;
  sessionCount: number;
  staleSessions: StaleSessionInfo[];
  corruptSessions: string[];
  totalSizeBytes: number;
  errors: string[];
}

interface StaleSessionInfo {
  sessionId: string;
  lastUpdated: string;
  ageHours: number;
  adapter: string;
  fileSizeBytes: number;
}

interface DoctorReport {
  timestamp: string;
  adapters: AdapterReport[];
  sessionHealth: SessionHealthReport;
}

const ALL_CANONICAL_PHASES = [...CANONICAL_PHASES];

function buildCapabilityProfile(mappings: PhaseMapping[]): CapabilityProfile {
  const supported = new Set<string>();
  const blockable = new Set<string>();
  const mutable = new Set<string>();
  const lossy = new Set<string>();
  const emulated = new Set<string>();

  for (const m of mappings) {
    supported.add(m.canonicalPhase);
    if (m.blockCapability) blockable.add(m.canonicalPhase);
    if (m.mutationCapability) mutable.add(m.canonicalPhase);
    if (m.supportLevel === 'lossy') lossy.add(m.canonicalPhase);
    if (m.supportLevel === 'emulated') emulated.add(m.canonicalPhase);
  }

  const unsupported = ALL_CANONICAL_PHASES.filter((p) => !supported.has(p));

  return {
    supportedPhases: [...supported],
    unsupportedPhases: unsupported,
    blockablePhases: [...blockable],
    mutablePhases: [...mutable],
    lossyPhases: [...lossy],
    emulatedPhases: [...emulated],
  };
}

function analyzeAdapter(name: string): AdapterReport {
  const warnings: string[] = [];
  const packageName = `@a5c-ai/agent-mux-hooks-adapter-${name}`;

  try {
    const loaded = loadAdapter(name);
    const caps = loaded.capabilities;
    const profile = buildCapabilityProfile(loaded.phaseMappings);

    // Generate warnings based on capability gaps
    if (!caps.supportsBlock) {
      warnings.push('Adapter does not support blocking decisions (deny/ask will be downgraded to noop)');
    }
    if (!caps.supportsNativeAdditionalContext) {
      warnings.push('Adapter does not support native additionalContext injection');
    }
    if (caps.envPersistenceMode === 'none') {
      warnings.push('No env persistence -- session context will not propagate to downstream tools');
    }
    if (caps.sessionIdQuality === 'synthetic' || caps.sessionIdQuality === 'none') {
      warnings.push('Session ID is synthetic or unavailable -- cross-hook state may be unreliable');
    }
    if (caps.toolInterceptionScope === 'none') {
      warnings.push('No tool interception -- tool.before/tool.after phases will be unsupported');
    }
    if (loaded.phaseMappings.length === 0) {
      warnings.push('No phase mappings found -- all events will map to "unknown" phase');
    }

    // Capability gap warnings
    if (profile.unsupportedPhases.length > 0) {
      warnings.push(
        `${profile.unsupportedPhases.length} canonical phases are unsupported: ${profile.unsupportedPhases.slice(0, 5).join(', ')}${profile.unsupportedPhases.length > 5 ? '...' : ''}`,
      );
    }
    if (profile.lossyPhases.length > 0) {
      warnings.push(
        `${profile.lossyPhases.length} phases have lossy mapping: ${profile.lossyPhases.join(', ')}`,
      );
    }
    if (!caps.supportsAsk && caps.supportsBlock) {
      warnings.push('Adapter supports block but not ask -- interactive approval flows will not work');
    }
    if (!caps.supportsToolInputMutation && !caps.supportsToolResultMutation) {
      warnings.push('No tool mutation support -- toolMutation results will be ignored');
    }

    if (caps.notes) {
      for (const note of caps.notes) {
        warnings.push(`Note: ${note}`);
      }
    }

    const phaseSummaries: PhaseMappingSummary[] = loaded.phaseMappings.map((m) => ({
      canonicalPhase: m.canonicalPhase,
      nativeHook: m.nativeHook,
      supportLevel: m.supportLevel,
      blockCapability: m.blockCapability,
      mutationCapability: m.mutationCapability,
    }));

    return {
      name,
      available: true,
      packageName,
      capabilities: caps,
      phaseMappings: phaseSummaries,
      capabilityProfile: profile,
      warnings,
    };
  } catch (err) {
    return {
      name,
      available: false,
      packageName,
      warnings: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkSessionHealth(
  sessionDir: string,
  staleThresholdHours: number,
): Promise<SessionHealthReport> {
  const report: SessionHealthReport = {
    sessionDir,
    dirExists: false,
    sessionCount: 0,
    staleSessions: [],
    corruptSessions: [],
    totalSizeBytes: 0,
    errors: [],
  };

  try {
    await fs.promises.access(sessionDir);
    report.dirExists = true;
  } catch {
    return report;
  }

  let entries: string[];
  try {
    entries = await fs.promises.readdir(sessionDir);
  } catch (err) {
    report.errors.push(`Failed to read session directory: ${err instanceof Error ? err.message : String(err)}`);
    return report;
  }

  const jsonFiles = entries.filter((e) => e.endsWith('.json') && !e.includes('.corrupt.') && !e.endsWith('.lock'));
  report.sessionCount = jsonFiles.length;
  const now = Date.now();

  for (const file of jsonFiles) {
    const filePath = path.join(sessionDir, file);
    try {
      const stat = await fs.promises.stat(filePath);
      report.totalSizeBytes += stat.size;

      const raw = await fs.promises.readFile(filePath, 'utf-8');
      const envelope = JSON.parse(raw) as { session?: { updatedAt?: string; adapter?: string; sessionId?: string } };
      const session = envelope.session;

      if (!session || !session.updatedAt || !session.sessionId) {
        report.corruptSessions.push(file);
        continue;
      }

      const updatedAt = new Date(session.updatedAt).getTime();
      const ageHours = (now - updatedAt) / (1000 * 60 * 60);

      if (ageHours > staleThresholdHours) {
        report.staleSessions.push({
          sessionId: session.sessionId,
          lastUpdated: session.updatedAt,
          ageHours: Math.round(ageHours * 10) / 10,
          adapter: session.adapter ?? 'unknown',
          fileSizeBytes: stat.size,
        });
      }
    } catch {
      report.corruptSessions.push(file);
    }
  }

  // Check for corrupt backup files
  const corruptBackups = entries.filter((e) => e.includes('.corrupt.'));
  if (corruptBackups.length > 0) {
    report.errors.push(`${corruptBackups.length} corrupt backup file(s) found in session directory`);
  }

  return report;
}

export const doctorCommand: CommandModule<object, DoctorArgs> = {
  command: 'doctor',
  describe: 'Report adapter capability profile, session health, and integration warnings',
  builder: (yargs) =>
    yargs
      .option('adapter', {
        type: 'string',
        describe: 'Specific adapter to check (omit for all known adapters)',
      })
      .option('json', {
        type: 'boolean',
        default: false,
        describe: 'Output JSON format',
      })
      .option('session-dir', {
        type: 'string',
        describe: 'Session store directory to check (defaults to platform default)',
      })
      .option('stale-threshold', {
        type: 'number',
        default: 24,
        describe: 'Hours after which a session is considered stale',
      }),
  handler: async (args) => {
    const adapterNames = args.adapter ? [args.adapter] : [...KNOWN_ADAPTERS];
    const adapterReports: AdapterReport[] = adapterNames.map(analyzeAdapter);

    const sessionDir = args['session-dir'] ?? getDefaultSessionDir();
    const sessionHealth = await checkSessionHealth(sessionDir, args['stale-threshold'] ?? 24);

    const report: DoctorReport = {
      timestamp: new Date().toISOString(),
      adapters: adapterReports,
      sessionHealth,
    };

    if (args.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      return;
    }

    // Human-readable output
    console.log('=== Hooks Proxy Doctor ===');
    console.log('');

    // Adapter reports
    console.log('--- Adapters ---');
    for (const r of adapterReports) {
      if (!r.available) {
        console.log(`[x] ${r.name} (${r.packageName}): not available`);
        if (r.error) {
          console.log(`    ${r.error}`);
        }
        console.log('');
        continue;
      }

      const caps = r.capabilities!;
      const profile = r.capabilityProfile!;
      console.log(`[ok] ${r.name} (${r.packageName})`);
      console.log(`  Family:           ${caps.family}`);
      console.log(`  Session ID:       ${caps.sessionIdQuality}`);
      console.log(`  Env persistence:  ${caps.envPersistenceMode}`);
      console.log(`  Blocking:         ${caps.supportsBlock ? 'yes' : 'no'}`);
      console.log(`  Ask:              ${caps.supportsAsk ? 'yes' : 'no'}`);
      console.log(`  Tool scope:       ${caps.toolInterceptionScope}`);
      console.log(`  Tool mutation:    input=${caps.supportsToolInputMutation ? 'yes' : 'no'} result=${caps.supportsToolResultMutation ? 'yes' : 'no'}`);
      console.log(`  Phases:           ${profile.supportedPhases.length} supported, ${profile.unsupportedPhases.length} unsupported`);
      if (profile.lossyPhases.length > 0) {
        console.log(`  Lossy phases:     ${profile.lossyPhases.join(', ')}`);
      }
      if (profile.emulatedPhases.length > 0) {
        console.log(`  Emulated phases:  ${profile.emulatedPhases.join(', ')}`);
      }

      if (r.warnings.length > 0) {
        console.log('  Warnings:');
        for (const w of r.warnings) {
          console.log(`    - ${w}`);
        }
      }
      console.log('');
    }

    // Session health
    console.log('--- Session Store ---');
    console.log(`  Directory:    ${sessionHealth.sessionDir}`);
    console.log(`  Exists:       ${sessionHealth.dirExists ? 'yes' : 'no'}`);

    if (sessionHealth.dirExists) {
      console.log(`  Sessions:     ${sessionHealth.sessionCount}`);
      console.log(`  Total size:   ${formatBytes(sessionHealth.totalSizeBytes)}`);

      if (sessionHealth.staleSessions.length > 0) {
        console.log(`  Stale (>${args['stale-threshold'] ?? 24}h): ${sessionHealth.staleSessions.length}`);
        for (const s of sessionHealth.staleSessions) {
          console.log(`    - ${s.sessionId} (${s.adapter}, ${s.ageHours}h old, ${formatBytes(s.fileSizeBytes)})`);
        }
      }

      if (sessionHealth.corruptSessions.length > 0) {
        console.log(`  Corrupt:      ${sessionHealth.corruptSessions.length}`);
        for (const c of sessionHealth.corruptSessions) {
          console.log(`    - ${c}`);
        }
      }

      if (sessionHealth.errors.length > 0) {
        console.log('  Errors:');
        for (const e of sessionHealth.errors) {
          console.log(`    - ${e}`);
        }
      }
    }
    console.log('');
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
