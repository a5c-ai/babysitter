#!/usr/bin/env npx tsx
/**
 * CLI script for rebuilding the process library catalog index
 *
 * Usage:
 *   npx tsx scripts/reindex.ts [options]
 *
 * Options:
 *   --force, -f     Force full reindex (ignore file modification times)
 *   --verbose, -v   Enable verbose logging
 *   --reset, -r     Reset database before indexing
 *   --stats, -s     Show database statistics after indexing
 *   --help, -h      Show help message
 *
 * Examples:
 *   npx tsx scripts/reindex.ts              # Incremental index
 *   npx tsx scripts/reindex.ts --force      # Full reindex
 *   npx tsx scripts/reindex.ts --reset      # Reset and reindex
 */

import * as path from 'path';
import {
  CatalogIndexer,
  initializeDatabase,
  resetCatalogDatabase,
  getDatabasePath,
  databaseExists,
  type IndexProgress,
} from '../src/lib/db';

// =============================================================================
// CLI CONFIGURATION
// =============================================================================

interface CLIOptions {
  force: boolean;
  verbose: boolean;
  reset: boolean;
  stats: boolean;
  help: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    force: false,
    verbose: false,
    reset: false,
    stats: false,
    help: false,
  };

  for (const arg of args) {
    switch (arg) {
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--reset':
      case '-r':
        options.reset = true;
        break;
      case '--stats':
      case '-s':
        options.stats = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Process Library Catalog Reindex Tool

Usage:
  npx tsx scripts/reindex.ts [options]

Options:
  --force, -f     Force full reindex (ignore file modification times)
  --verbose, -v   Enable verbose logging
  --reset, -r     Reset database before indexing
  --stats, -s     Show database statistics after indexing
  --help, -h      Show this help message

Examples:
  npx tsx scripts/reindex.ts              # Incremental index
  npx tsx scripts/reindex.ts --force      # Full reindex
  npx tsx scripts/reindex.ts --reset      # Reset and reindex
  npx tsx scripts/reindex.ts -f -s        # Force reindex and show stats
`);
}

// =============================================================================
// PROGRESS DISPLAY
// =============================================================================

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerIndex = 0;

function getSpinner(): string {
  spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
  return spinnerFrames[spinnerIndex] ?? '⠋';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createProgressCallback(verbose: boolean): (progress: IndexProgress) => void {
  let lastPhase = '';

  return (progress: IndexProgress) => {
    const { phase, current, total, currentFile, message } = progress;

    if (phase !== lastPhase) {
      lastPhase = phase;
      if (phase === 'scanning') {
        console.log('\n📁 Scanning directories...');
      } else if (phase === 'parsing') {
        console.log('\n📄 Parsing files...');
      } else if (phase === 'indexing') {
        console.log('\n🔍 Building search indexes...');
      } else if (phase === 'complete') {
        console.log('\n✅ Indexing complete!');
      }
    }

    if (verbose && currentFile) {
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      const fileName = path.basename(path.dirname(currentFile));
      process.stdout.write(`\r  ${getSpinner()} [${percent}%] ${fileName.padEnd(40)}`);
    } else if (total > 0) {
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
      process.stdout.write(`\r  ${getSpinner()} [${bar}] ${percent}% (${current}/${total})`);
    }

    if (message && phase === 'complete') {
      console.log(`  ${message}`);
    }
  };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Process Library Catalog Reindex Tool                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const dbPath = getDatabasePath();
  const exists = databaseExists();

  console.log(`\nDatabase: ${dbPath}`);
  console.log(`Status: ${exists ? 'Exists' : 'Will be created'}`);

  // Reset if requested
  if (options.reset) {
    console.log('\n⚠️  Resetting database...');
    resetCatalogDatabase({ verbose: options.verbose });
    console.log('   Database reset complete.');
  }

  // Determine base directory (project root)
  const baseDir = path.resolve(__dirname, '..', '..', '..');
  console.log(`\nBase directory: ${baseDir}`);

  // Create indexer
  const indexer = new CatalogIndexer(baseDir, {
    forceReindex: options.force || options.reset,
    onProgress: createProgressCallback(options.verbose),
  });

  console.log(`\nMode: ${options.force ? 'Full reindex' : 'Incremental update'}`);

  // Run indexing
  const startTime = Date.now();
  const result = await indexer.index();
  const duration = Date.now() - startTime;

  // Clear progress line
  process.stdout.write('\r' + ' '.repeat(80) + '\r');

  // Display results
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Indexing Results                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  if (result.success) {
    console.log(`\n✅ Success! Indexed in ${formatDuration(duration)}`);
  } else {
    console.log(`\n❌ Indexing failed after ${formatDuration(duration)}`);
  }

  console.log('\nStatistics:');
  console.log(`  Domains indexed:         ${result.statistics.domainsIndexed}`);
  console.log(`  Specializations indexed: ${result.statistics.specializationsIndexed}`);
  console.log(`  Agents indexed:          ${result.statistics.agentsIndexed}`);
  console.log(`  Skills indexed:          ${result.statistics.skillsIndexed}`);
  console.log(`  Processes indexed:       ${result.statistics.processesIndexed}`);
  console.log(`  Total files processed:   ${result.statistics.filesProcessed}`);
  console.log(`  Errors:                  ${result.statistics.errors}`);

  // Show errors if any
  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    const maxErrors = 10;
    for (let i = 0; i < Math.min(result.errors.length, maxErrors); i++) {
      const error = result.errors[i]!;
      console.log(`  - ${path.basename(error.file)}: ${error.error}`);
    }
    if (result.errors.length > maxErrors) {
      console.log(`  ... and ${result.errors.length - maxErrors} more errors`);
    }
  }

  // Show database stats if requested
  if (options.stats) {
    const db = initializeDatabase();
    const stats = db.getStats();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   Database Statistics                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log(`\n  Database size:           ${formatBytes(stats.databaseSize)}`);
    console.log(`  Total domains:           ${stats.domainsCount}`);
    console.log(`  Total specializations:   ${stats.specializationsCount}`);
    console.log(`  Total agents:            ${stats.agentsCount}`);
    console.log(`  Total skills:            ${stats.skillsCount}`);
    console.log(`  Total processes:         ${stats.processesCount}`);
    console.log(`  Last indexed:            ${stats.lastIndexedAt ?? 'Never'}`);
    console.log(`  Schema version:          ${db.getSchemaVersion()}`);

    db.close();
  }

  console.log('\n');

  process.exit(result.success ? 0 : 1);
}

// Run main function
main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
