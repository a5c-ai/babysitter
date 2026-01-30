/**
 * Indexer service for scanning and populating the process library catalog database
 * Supports incremental updates based on file modification times
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CatalogDatabase, initializeDatabase } from './client';
import { rebuildCatalogSearch } from './schema';
import type {
  IndexerOptions,
  IndexResult,
  IndexProgress,
} from './types';

import {
  parseAgentFile,
  parseSkillFile,
  parseProcessFile,
  parseDirectoryStructure,
  type FileSystem,
  type DomainInfo,
  type SpecializationInfo,
  type ParsedAgent,
  type ParsedSkill,
  type ParsedProcess,
} from '../parsers';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_LIBRARY_PATHS = [
  'plugins/babysitter/skills/babysit/process/specializations',
  'plugins/babysitter/skills/babysit/process/methodologies',
];

const DEFAULT_BATCH_SIZE = 100;

// =============================================================================
// FILE SYSTEM ADAPTER
// =============================================================================

/**
 * Create a Node.js file system adapter for the parsers
 */
function createFileSystemAdapter(): FileSystem {
  return {
    readdir: (dirPath: string) => fs.readdir(dirPath),
    stat: async (filePath: string) => {
      const stats = await fs.stat(filePath);
      return { isDirectory: () => stats.isDirectory() };
    },
    exists: async (filePath: string) => {
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    },
    readFile: (filePath: string) => fs.readFile(filePath, 'utf-8'),
  };
}

// =============================================================================
// PARSED DATA TYPES
// =============================================================================

interface ParsedAgentData {
  filePath: string;
  mtime: number;
  agent: ParsedAgent;
}

interface ParsedSkillData {
  filePath: string;
  mtime: number;
  skill: ParsedSkill;
}

interface ParsedProcessData {
  filePath: string;
  mtime: number;
  process: ParsedProcess;
}

// =============================================================================
// INDEXER CLASS
// =============================================================================

/**
 * Indexer service for the process library catalog
 */
export class CatalogIndexer {
  private db: CatalogDatabase;
  private baseDir: string;
  private options: Required<IndexerOptions>;
  private fsAdapter: FileSystem;
  private errors: Array<{ file: string; error: string }> = [];

  constructor(baseDir: string, options: IndexerOptions = {}) {
    this.baseDir = baseDir;
    this.options = {
      forceReindex: options.forceReindex ?? false,
      onProgress: options.onProgress ?? (() => {}),
      batchSize: options.batchSize ?? DEFAULT_BATCH_SIZE,
      libraryPaths: options.libraryPaths ?? DEFAULT_LIBRARY_PATHS,
    };
    this.db = initializeDatabase();
    this.fsAdapter = createFileSystemAdapter();
  }

  /**
   * Run the indexer
   */
  public async index(): Promise<IndexResult> {
    const startTime = Date.now();
    this.errors = [];

    const stats = {
      domainsIndexed: 0,
      specializationsIndexed: 0,
      agentsIndexed: 0,
      skillsIndexed: 0,
      processesIndexed: 0,
      filesProcessed: 0,
      errors: 0,
      duration: 0,
    };

    try {
      // Phase 1: Scan directory structure
      this.reportProgress({
        phase: 'scanning',
        current: 0,
        total: 0,
        message: 'Scanning directory structure...',
      });

      const scanResults = await this.scanDirectories();

      // Clear existing data if force reindex
      if (this.options.forceReindex) {
        this.db.reset();
      }

      // Phase 2: Index domains and specializations (synchronous)
      this.reportProgress({
        phase: 'indexing',
        current: 0,
        total: scanResults.totalFiles,
        message: 'Indexing domains and specializations...',
      });

      this.db.transaction(() => {
        stats.domainsIndexed = this.indexDomains(scanResults.domains);
        stats.specializationsIndexed = this.indexSpecializations(
          scanResults.specializations,
          scanResults.domains
        );
      });

      // Phase 3: Parse and index agents
      this.reportProgress({
        phase: 'parsing',
        current: 0,
        total: scanResults.agentFiles.length,
        message: 'Parsing agent files...',
      });

      const parsedAgents = await this.parseAgentFiles(scanResults.agentFiles);
      stats.agentsIndexed = this.insertAgents(parsedAgents);
      stats.filesProcessed += scanResults.agentFiles.length;

      // Phase 4: Parse and index skills
      this.reportProgress({
        phase: 'parsing',
        current: stats.filesProcessed,
        total: scanResults.totalFiles,
        message: 'Parsing skill files...',
      });

      const parsedSkills = await this.parseSkillFiles(scanResults.skillFiles);
      stats.skillsIndexed = this.insertSkills(parsedSkills);
      stats.filesProcessed += scanResults.skillFiles.length;

      // Phase 5: Parse and index processes
      this.reportProgress({
        phase: 'parsing',
        current: stats.filesProcessed,
        total: scanResults.totalFiles,
        message: 'Parsing process files...',
      });

      const parsedProcesses = await this.parseProcessFiles(scanResults.processFiles);
      stats.processesIndexed = this.insertProcesses(parsedProcesses);
      stats.filesProcessed += scanResults.processFiles.length;

      // Phase 6: Rebuild unified search index
      this.reportProgress({
        phase: 'indexing',
        current: stats.filesProcessed,
        total: scanResults.totalFiles,
        message: 'Building search indexes...',
      });

      rebuildCatalogSearch(this.db.getDb());

      // Update index metadata
      this.updateIndexMetadata(stats.filesProcessed, Date.now() - startTime);

      stats.errors = this.errors.length;
      stats.duration = Date.now() - startTime;

      this.reportProgress({
        phase: 'complete',
        current: stats.filesProcessed,
        total: scanResults.totalFiles,
        message: `Indexing complete. ${stats.filesProcessed} files processed.`,
      });

      return {
        success: true,
        statistics: stats,
        errors: this.errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errors.push({ file: 'indexer', error: errorMessage });

      return {
        success: false,
        statistics: { ...stats, duration: Date.now() - startTime },
        errors: this.errors,
      };
    }
  }

  /**
   * Scan directories and collect file information
   */
  private async scanDirectories(): Promise<{
    domains: DomainInfo[];
    specializations: SpecializationInfo[];
    agentFiles: string[];
    skillFiles: string[];
    processFiles: string[];
    totalFiles: number;
  }> {
    const domains: DomainInfo[] = [];
    const specializations: SpecializationInfo[] = [];
    const agentFiles: string[] = [];
    const skillFiles: string[] = [];
    const processFiles: string[] = [];

    for (const libraryPath of this.options.libraryPaths) {
      const fullPath = path.resolve(this.baseDir, libraryPath);

      try {
        await fs.access(fullPath);
      } catch {
        // Path doesn't exist, skip
        continue;
      }

      // Use the directory parser to scan structure
      const basePath = path.resolve(this.baseDir, 'plugins/babysitter/skills/babysit/process');
      const result = await parseDirectoryStructure(basePath, this.fsAdapter);

      if (result.success && result.data) {
        domains.push(...result.data.domains);
        specializations.push(...result.data.specializations);

        // Collect files from domains
        for (const domain of result.data.domains) {
          agentFiles.push(...domain.agents);
          skillFiles.push(...domain.skills);

          for (const spec of domain.specializations) {
            agentFiles.push(...spec.agents);
            skillFiles.push(...spec.skills);
            if (spec.processes) {
              processFiles.push(...spec.processes);
            }
          }
        }

        // Collect files from top-level specializations
        for (const spec of result.data.specializations) {
          agentFiles.push(...spec.agents);
          skillFiles.push(...spec.skills);
          if (spec.processes) {
            processFiles.push(...spec.processes);
          }
        }

        // Add methodologies
        processFiles.push(...result.data.methodologies);
      }
    }

    return {
      domains,
      specializations,
      agentFiles: [...new Set(agentFiles)], // Remove duplicates
      skillFiles: [...new Set(skillFiles)],
      processFiles: [...new Set(processFiles)],
      totalFiles: agentFiles.length + skillFiles.length + processFiles.length,
    };
  }

  /**
   * Index domains
   */
  private indexDomains(domains: DomainInfo[]): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO domains (name, path, category, readme_path, references_path, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    let count = 0;
    for (const domain of domains) {
      try {
        // Extract category from path if available
        const pathParts = domain.path.split('/');
        const domainsIdx = pathParts.indexOf('domains');
        const category = domainsIdx >= 0 && domainsIdx < pathParts.length - 2
          ? pathParts[domainsIdx + 1]
          : null;

        stmt.run(
          domain.name,
          domain.path,
          category,
          domain.readme ?? null,
          domain.references ?? null
        );
        count++;
      } catch (error) {
        this.errors.push({
          file: domain.path,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return count;
  }

  /**
   * Index specializations
   * Indexes both top-level specializations and domain-nested specializations
   */
  private indexSpecializations(
    topLevelSpecializations: SpecializationInfo[],
    domains: DomainInfo[]
  ): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO specializations (name, path, domain_id, readme_path, references_path, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    const getDomainId = this.db.prepare('SELECT id FROM domains WHERE name = ?');

    let count = 0;

    // Helper function to index a single specialization
    const indexSpec = (spec: SpecializationInfo) => {
      try {
        let domainId: number | null = null;
        if (spec.domain) {
          const domainRow = getDomainId.get(spec.domain) as { id: number } | undefined;
          domainId = domainRow?.id ?? null;
        }

        stmt.run(
          spec.name,
          spec.path,
          domainId,
          spec.readme ?? null,
          spec.references ?? null
        );
        count++;
      } catch (error) {
        this.errors.push({
          file: spec.path,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Index top-level specializations (those not under a domain)
    for (const spec of topLevelSpecializations) {
      indexSpec(spec);
    }

    // Index domain-nested specializations
    for (const domain of domains) {
      for (const spec of domain.specializations) {
        indexSpec(spec);
      }
    }

    return count;
  }

  /**
   * Parse agent files asynchronously
   */
  private async parseAgentFiles(agentFiles: string[]): Promise<ParsedAgentData[]> {
    const results: ParsedAgentData[] = [];
    const getFileMtime = this.db.prepare('SELECT mtime FROM file_tracking WHERE file_path = ?');

    for (let i = 0; i < agentFiles.length; i++) {
      const filePath = agentFiles[i]!;

      this.reportProgress({
        phase: 'parsing',
        current: i + 1,
        total: agentFiles.length,
        currentFile: filePath,
      });

      try {
        // Check if file needs reindexing
        const mtime = await this.getFileMtime(filePath);
        if (!this.options.forceReindex) {
          const tracking = getFileMtime.get(filePath) as { mtime: number } | undefined;
          if (tracking && tracking.mtime >= mtime) {
            continue; // Skip, file hasn't changed
          }
        }

        // Parse the agent file
        const result = await parseAgentFile(
          filePath,
          (p) => fs.readFile(p, 'utf-8'),
          { parseMarkdownSections: true }
        );

        if (!result.success || !result.data) {
          this.errors.push({
            file: filePath,
            error: result.error?.message ?? 'Parse failed',
          });
          continue;
        }

        results.push({
          filePath,
          mtime,
          agent: result.data,
        });
      } catch (error) {
        this.errors.push({
          file: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Insert parsed agents into database (synchronous)
   */
  private insertAgents(parsedAgents: ParsedAgentData[]): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agents (
        name, description, file_path, directory, role, expertise,
        specialization_id, domain_id, frontmatter, content, file_mtime, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const getSpecId = this.db.prepare('SELECT id FROM specializations WHERE name = ?');
    const getDomainId = this.db.prepare('SELECT id FROM domains WHERE name = ?');
    const updateTracking = this.db.prepare(`
      INSERT OR REPLACE INTO file_tracking (file_path, file_type, mtime, indexed_at)
      VALUES (?, 'agent', ?, datetime('now'))
    `);

    let indexed = 0;

    // Insert in batches within transactions
    for (let i = 0; i < parsedAgents.length; i += this.options.batchSize) {
      const batch = parsedAgents.slice(i, i + this.options.batchSize);

      this.db.transaction(() => {
        for (const { filePath, mtime, agent } of batch) {
          try {
            // Get foreign keys
            let specId: number | null = null;
            let domainId: number | null = null;

            if (agent.metadata.specialization) {
              const specRow = getSpecId.get(agent.metadata.specialization) as { id: number } | undefined;
              specId = specRow?.id ?? null;
            }

            if (agent.metadata.domain) {
              const domainRow = getDomainId.get(agent.metadata.domain) as { id: number } | undefined;
              domainId = domainRow?.id ?? null;
            }

            // Extract content from sections
            const content = agent.sections.map((s) => s.content).join('\n');

            stmt.run(
              agent.name,
              agent.description,
              filePath,
              agent.source.directory,
              agent.role ?? null,
              JSON.stringify(agent.expertise),
              specId,
              domainId,
              JSON.stringify(agent.metadata),
              content,
              mtime
            );

            updateTracking.run(filePath, mtime);
            indexed++;
          } catch (error) {
            this.errors.push({
              file: filePath,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    return indexed;
  }

  /**
   * Parse skill files asynchronously
   */
  private async parseSkillFiles(skillFiles: string[]): Promise<ParsedSkillData[]> {
    const results: ParsedSkillData[] = [];
    const getFileMtime = this.db.prepare('SELECT mtime FROM file_tracking WHERE file_path = ?');

    for (let i = 0; i < skillFiles.length; i++) {
      const filePath = skillFiles[i]!;

      this.reportProgress({
        phase: 'parsing',
        current: i + 1,
        total: skillFiles.length,
        currentFile: filePath,
      });

      try {
        // Check if file needs reindexing
        const mtime = await this.getFileMtime(filePath);
        if (!this.options.forceReindex) {
          const tracking = getFileMtime.get(filePath) as { mtime: number } | undefined;
          if (tracking && tracking.mtime >= mtime) {
            continue; // Skip, file hasn't changed
          }
        }

        // Parse the skill file
        const result = await parseSkillFile(
          filePath,
          (p) => fs.readFile(p, 'utf-8'),
          { parseMarkdownSections: true }
        );

        if (!result.success || !result.data) {
          this.errors.push({
            file: filePath,
            error: result.error?.message ?? 'Parse failed',
          });
          continue;
        }

        results.push({
          filePath,
          mtime,
          skill: result.data,
        });
      } catch (error) {
        this.errors.push({
          file: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Insert parsed skills into database (synchronous)
   */
  private insertSkills(parsedSkills: ParsedSkillData[]): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO skills (
        name, description, file_path, directory, allowed_tools,
        specialization_id, domain_id, frontmatter, content, file_mtime, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const getSpecId = this.db.prepare('SELECT id FROM specializations WHERE name = ?');
    const getDomainId = this.db.prepare('SELECT id FROM domains WHERE name = ?');
    const updateTracking = this.db.prepare(`
      INSERT OR REPLACE INTO file_tracking (file_path, file_type, mtime, indexed_at)
      VALUES (?, 'skill', ?, datetime('now'))
    `);

    let indexed = 0;

    // Insert in batches within transactions
    for (let i = 0; i < parsedSkills.length; i += this.options.batchSize) {
      const batch = parsedSkills.slice(i, i + this.options.batchSize);

      this.db.transaction(() => {
        for (const { filePath, mtime, skill } of batch) {
          try {
            // Get foreign keys
            let specId: number | null = null;
            let domainId: number | null = null;

            if (skill.metadata.specialization) {
              const specRow = getSpecId.get(skill.metadata.specialization) as { id: number } | undefined;
              specId = specRow?.id ?? null;
            }

            if (skill.metadata.domain) {
              const domainRow = getDomainId.get(skill.metadata.domain) as { id: number } | undefined;
              domainId = domainRow?.id ?? null;
            }

            // Extract content from sections
            const content = skill.sections.map((s) => s.content).join('\n');

            stmt.run(
              skill.name,
              skill.description,
              filePath,
              skill.source.directory,
              JSON.stringify(skill.allowedTools),
              specId,
              domainId,
              JSON.stringify(skill.metadata),
              content,
              mtime
            );

            updateTracking.run(filePath, mtime);
            indexed++;
          } catch (error) {
            this.errors.push({
              file: filePath,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    return indexed;
  }

  /**
   * Parse process files asynchronously
   */
  private async parseProcessFiles(processFiles: string[]): Promise<ParsedProcessData[]> {
    const results: ParsedProcessData[] = [];
    const getFileMtime = this.db.prepare('SELECT mtime FROM file_tracking WHERE file_path = ?');

    for (let i = 0; i < processFiles.length; i++) {
      const filePath = processFiles[i]!;

      this.reportProgress({
        phase: 'parsing',
        current: i + 1,
        total: processFiles.length,
        currentFile: filePath,
      });

      try {
        // Check if file needs reindexing
        const mtime = await this.getFileMtime(filePath);
        if (!this.options.forceReindex) {
          const tracking = getFileMtime.get(filePath) as { mtime: number } | undefined;
          if (tracking && tracking.mtime >= mtime) {
            continue; // Skip, file hasn't changed
          }
        }

        // Parse the process file
        const result = await parseProcessFile(
          filePath,
          (p) => fs.readFile(p, 'utf-8'),
          { extractAST: true }
        );

        if (!result.success || !result.data) {
          this.errors.push({
            file: filePath,
            error: result.error?.message ?? 'Parse failed',
          });
          continue;
        }

        results.push({
          filePath,
          mtime,
          process: result.data,
        });
      } catch (error) {
        this.errors.push({
          file: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Insert parsed processes into database (synchronous)
   */
  private insertProcesses(parsedProcesses: ParsedProcessData[]): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO processes (
        process_id, description, file_path, directory, category,
        inputs, outputs, tasks, frontmatter, file_mtime, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const updateTracking = this.db.prepare(`
      INSERT OR REPLACE INTO file_tracking (file_path, file_type, mtime, indexed_at)
      VALUES (?, 'process', ?, datetime('now'))
    `);

    let indexed = 0;

    // Insert in batches within transactions
    for (let i = 0; i < parsedProcesses.length; i += this.options.batchSize) {
      const batch = parsedProcesses.slice(i, i + this.options.batchSize);

      this.db.transaction(() => {
        for (const { filePath, mtime, process: proc } of batch) {
          try {
            stmt.run(
              proc.id,
              proc.description,
              filePath,
              proc.source.directory,
              proc.category ?? null,
              JSON.stringify(proc.inputs),
              JSON.stringify(proc.outputs),
              JSON.stringify(proc.tasks),
              '{}', // No frontmatter for JS files
              mtime
            );

            updateTracking.run(filePath, mtime);
            indexed++;
          } catch (error) {
            this.errors.push({
              file: filePath,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    }

    return indexed;
  }

  /**
   * Get file modification time
   */
  private async getFileMtime(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtimeMs;
    } catch {
      return 0;
    }
  }

  /**
   * Update index metadata
   */
  private updateIndexMetadata(filesProcessed: number, durationMs: number): void {
    this.db.prepare(`
      UPDATE index_metadata
      SET last_full_index = datetime('now'),
          total_files_indexed = ?,
          index_duration_ms = ?
      WHERE id = 1
    `).run(filesProcessed, durationMs);
  }

  /**
   * Report progress
   */
  private reportProgress(progress: IndexProgress): void {
    this.options.onProgress(progress);
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Run a full index of the process library
 */
export async function runFullIndex(
  baseDir: string,
  options?: IndexerOptions
): Promise<IndexResult> {
  const indexer = new CatalogIndexer(baseDir, { ...options, forceReindex: true });
  return indexer.index();
}

/**
 * Run an incremental index (only changed files)
 */
export async function runIncrementalIndex(
  baseDir: string,
  options?: IndexerOptions
): Promise<IndexResult> {
  const indexer = new CatalogIndexer(baseDir, { ...options, forceReindex: false });
  return indexer.index();
}

/**
 * Check if the database needs to be rebuilt
 */
export function needsRebuild(): boolean {
  try {
    const db = initializeDatabase();
    const stats = db.getStats();

    // Consider rebuild needed if no items indexed
    return (
      stats.agentsCount === 0 &&
      stats.skillsCount === 0 &&
      stats.processesCount === 0
    );
  } catch {
    return true;
  }
}
