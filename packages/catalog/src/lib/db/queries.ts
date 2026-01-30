/**
 * Query builder with filter, sort, and pagination support
 * for the process library catalog database
 */

import type Database from 'better-sqlite3';
import { CatalogDatabase, initializeDatabase } from './client';
import type {
  QueryOptions,
  FilterCondition,
  FilterOperator,
  SortSpec,
  PaginationOptions,
  PaginatedResult,
  SearchResult,
  AgentRow,
  SkillRow,
  ProcessRow,
  DomainRow,
  SpecializationRow,
  CatalogEntryView,
  CatalogEntryType,
} from './types';

// =============================================================================
// QUERY BUILDER
// =============================================================================

/**
 * Query builder for flexible database queries
 */
export class QueryBuilder<T> {
  private db: Database.Database;
  private tableName: string;
  private selectColumns: string[] = ['*'];
  private joins: string[] = [];
  private whereConditions: string[] = [];
  private whereParams: unknown[] = [];
  private orderByClause: string[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;

  constructor(db: Database.Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Select specific columns
   */
  select(...columns: string[]): this {
    this.selectColumns = columns;
    return this;
  }

  /**
   * Add a join clause
   */
  join(table: string, condition: string): this {
    this.joins.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  /**
   * Add a filter condition
   */
  where(field: string, operator: FilterOperator, value: unknown): this {
    const { sql, params } = this.buildCondition(field, operator, value);
    this.whereConditions.push(sql);
    this.whereParams.push(...params);
    return this;
  }

  /**
   * Add multiple filter conditions
   */
  whereAll(conditions: FilterCondition[]): this {
    for (const condition of conditions) {
      this.where(condition.field, condition.operator, condition.value);
    }
    return this;
  }

  /**
   * Add an OR condition group
   */
  orWhere(conditions: FilterCondition[]): this {
    const parts: string[] = [];
    for (const condition of conditions) {
      const { sql, params } = this.buildCondition(
        condition.field,
        condition.operator,
        condition.value
      );
      parts.push(sql);
      this.whereParams.push(...params);
    }
    if (parts.length > 0) {
      this.whereConditions.push(`(${parts.join(' OR ')})`);
    }
    return this;
  }

  /**
   * Add order by clause
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByClause.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * Add multiple order by clauses
   */
  orderByAll(specs: SortSpec[]): this {
    for (const spec of specs) {
      this.orderBy(spec.field, spec.direction);
    }
    return this;
  }

  /**
   * Add limit clause
   */
  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  /**
   * Add offset clause
   */
  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  /**
   * Apply pagination
   */
  paginate(options: PaginationOptions): this {
    const { page, pageSize } = options;
    this.limitValue = pageSize;
    this.offsetValue = (page - 1) * pageSize;
    return this;
  }

  /**
   * Build the SQL query
   */
  toSQL(): { sql: string; params: unknown[] } {
    let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.tableName}`;

    if (this.joins.length > 0) {
      sql += ' ' + this.joins.join(' ');
    }

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.join(' AND ');
    }

    if (this.orderByClause.length > 0) {
      sql += ' ORDER BY ' + this.orderByClause.join(', ');
    }

    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params: this.whereParams };
  }

  /**
   * Execute the query and return all results
   */
  all(): T[] {
    const { sql, params } = this.toSQL();
    return this.db.prepare(sql).all(...params) as T[];
  }

  /**
   * Execute the query and return first result
   */
  first(): T | undefined {
    const { sql, params } = this.toSQL();
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Get count of matching records
   */
  count(): number {
    const originalSelect = this.selectColumns;
    this.selectColumns = ['COUNT(*) as count'];
    const originalLimit = this.limitValue;
    const originalOffset = this.offsetValue;
    this.limitValue = null;
    this.offsetValue = null;

    const { sql, params } = this.toSQL();
    const result = this.db.prepare(sql).get(...params) as { count: number };

    // Restore original values
    this.selectColumns = originalSelect;
    this.limitValue = originalLimit;
    this.offsetValue = originalOffset;

    return result.count;
  }

  /**
   * Execute with pagination and return paginated result
   */
  paginatedResult(options: PaginationOptions): PaginatedResult<T> {
    const totalItems = this.count();
    const totalPages = Math.ceil(totalItems / options.pageSize);

    this.paginate(options);
    const data = this.all();

    return {
      data,
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        totalItems,
        totalPages,
        hasNextPage: options.page < totalPages,
        hasPrevPage: options.page > 1,
      },
    };
  }

  /**
   * Build a single condition
   */
  private buildCondition(
    field: string,
    operator: FilterOperator,
    value: unknown
  ): { sql: string; params: unknown[] } {
    switch (operator) {
      case 'eq':
        return { sql: `${field} = ?`, params: [value] };
      case 'ne':
        return { sql: `${field} != ?`, params: [value] };
      case 'gt':
        return { sql: `${field} > ?`, params: [value] };
      case 'gte':
        return { sql: `${field} >= ?`, params: [value] };
      case 'lt':
        return { sql: `${field} < ?`, params: [value] };
      case 'lte':
        return { sql: `${field} <= ?`, params: [value] };
      case 'like':
        return { sql: `${field} LIKE ?`, params: [`%${value}%`] };
      case 'in':
        const inValues = value as unknown[];
        const placeholders = inValues.map(() => '?').join(', ');
        return { sql: `${field} IN (${placeholders})`, params: inValues };
      case 'not_in':
        const notInValues = value as unknown[];
        const notInPlaceholders = notInValues.map(() => '?').join(', ');
        return { sql: `${field} NOT IN (${notInPlaceholders})`, params: notInValues };
      case 'is_null':
        return { sql: `${field} IS NULL`, params: [] };
      case 'is_not_null':
        return { sql: `${field} IS NOT NULL`, params: [] };
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
}

// =============================================================================
// CATALOG QUERIES
// =============================================================================

/**
 * Catalog query interface for common operations
 */
export class CatalogQueries {
  private db: CatalogDatabase;

  constructor(db?: CatalogDatabase) {
    this.db = db ?? initializeDatabase();
  }

  // ---------------------------------------------------------------------------
  // Agent Queries
  // ---------------------------------------------------------------------------

  /**
   * Get all agents
   */
  getAgents(options?: QueryOptions): AgentRow[] | PaginatedResult<AgentRow> {
    const builder = new QueryBuilder<AgentRow>(this.db.getDb(), 'agents');

    if (options?.filters) {
      builder.whereAll(options.filters);
    }

    if (options?.sort) {
      builder.orderByAll(options.sort);
    } else {
      builder.orderBy('name', 'asc');
    }

    if (options?.pagination) {
      return builder.paginatedResult(options.pagination);
    }

    return builder.all();
  }

  /**
   * Get agent by ID
   */
  getAgentById(id: number): AgentRow | undefined {
    return new QueryBuilder<AgentRow>(this.db.getDb(), 'agents')
      .where('id', 'eq', id)
      .first();
  }

  /**
   * Get agent by name
   */
  getAgentByName(name: string): AgentRow | undefined {
    return new QueryBuilder<AgentRow>(this.db.getDb(), 'agents')
      .where('name', 'eq', name)
      .first();
  }

  /**
   * Get agents by specialization
   */
  getAgentsBySpecialization(specializationId: number): AgentRow[] {
    return new QueryBuilder<AgentRow>(this.db.getDb(), 'agents')
      .where('specialization_id', 'eq', specializationId)
      .orderBy('name', 'asc')
      .all();
  }

  /**
   * Get agents by domain
   */
  getAgentsByDomain(domainId: number): AgentRow[] {
    return new QueryBuilder<AgentRow>(this.db.getDb(), 'agents')
      .where('domain_id', 'eq', domainId)
      .orderBy('name', 'asc')
      .all();
  }

  // ---------------------------------------------------------------------------
  // Skill Queries
  // ---------------------------------------------------------------------------

  /**
   * Get all skills
   */
  getSkills(options?: QueryOptions): SkillRow[] | PaginatedResult<SkillRow> {
    const builder = new QueryBuilder<SkillRow>(this.db.getDb(), 'skills');

    if (options?.filters) {
      builder.whereAll(options.filters);
    }

    if (options?.sort) {
      builder.orderByAll(options.sort);
    } else {
      builder.orderBy('name', 'asc');
    }

    if (options?.pagination) {
      return builder.paginatedResult(options.pagination);
    }

    return builder.all();
  }

  /**
   * Get skill by ID
   */
  getSkillById(id: number): SkillRow | undefined {
    return new QueryBuilder<SkillRow>(this.db.getDb(), 'skills')
      .where('id', 'eq', id)
      .first();
  }

  /**
   * Get skill by name
   */
  getSkillByName(name: string): SkillRow | undefined {
    return new QueryBuilder<SkillRow>(this.db.getDb(), 'skills')
      .where('name', 'eq', name)
      .first();
  }

  /**
   * Get skills by specialization
   */
  getSkillsBySpecialization(specializationId: number): SkillRow[] {
    return new QueryBuilder<SkillRow>(this.db.getDb(), 'skills')
      .where('specialization_id', 'eq', specializationId)
      .orderBy('name', 'asc')
      .all();
  }

  // ---------------------------------------------------------------------------
  // Process Queries
  // ---------------------------------------------------------------------------

  /**
   * Get all processes
   */
  getProcesses(options?: QueryOptions): ProcessRow[] | PaginatedResult<ProcessRow> {
    const builder = new QueryBuilder<ProcessRow>(this.db.getDb(), 'processes');

    if (options?.filters) {
      builder.whereAll(options.filters);
    }

    if (options?.sort) {
      builder.orderByAll(options.sort);
    } else {
      builder.orderBy('process_id', 'asc');
    }

    if (options?.pagination) {
      return builder.paginatedResult(options.pagination);
    }

    return builder.all();
  }

  /**
   * Get process by ID
   */
  getProcessById(id: number): ProcessRow | undefined {
    return new QueryBuilder<ProcessRow>(this.db.getDb(), 'processes')
      .where('id', 'eq', id)
      .first();
  }

  /**
   * Get process by process_id
   */
  getProcessByProcessId(processId: string): ProcessRow | undefined {
    return new QueryBuilder<ProcessRow>(this.db.getDb(), 'processes')
      .where('process_id', 'eq', processId)
      .first();
  }

  // ---------------------------------------------------------------------------
  // Domain Queries
  // ---------------------------------------------------------------------------

  /**
   * Get all domains
   */
  getDomains(): DomainRow[] {
    return new QueryBuilder<DomainRow>(this.db.getDb(), 'domains')
      .orderBy('name', 'asc')
      .all();
  }

  /**
   * Get domain by ID
   */
  getDomainById(id: number): DomainRow | undefined {
    return new QueryBuilder<DomainRow>(this.db.getDb(), 'domains')
      .where('id', 'eq', id)
      .first();
  }

  // ---------------------------------------------------------------------------
  // Specialization Queries
  // ---------------------------------------------------------------------------

  /**
   * Get all specializations
   */
  getSpecializations(): SpecializationRow[] {
    return new QueryBuilder<SpecializationRow>(this.db.getDb(), 'specializations')
      .orderBy('name', 'asc')
      .all();
  }

  /**
   * Get specializations by domain
   */
  getSpecializationsByDomain(domainId: number): SpecializationRow[] {
    return new QueryBuilder<SpecializationRow>(this.db.getDb(), 'specializations')
      .where('domain_id', 'eq', domainId)
      .orderBy('name', 'asc')
      .all();
  }

  // ---------------------------------------------------------------------------
  // Full-Text Search
  // ---------------------------------------------------------------------------

  /**
   * Search across all catalog items
   */
  search(query: string, options?: { limit?: number; types?: CatalogEntryType[] }): SearchResult[] {
    const limit = options?.limit ?? 50;
    const types = options?.types ?? ['agent', 'skill', 'process'];

    // Build type filter
    const typeFilter = types.map(() => '?').join(', ');

    const sql = `
      SELECT
        item_type,
        item_id,
        name,
        description,
        snippet(catalog_search, 4, '<mark>', '</mark>', '...', 32) as content_snippet,
        rank
      FROM catalog_search
      WHERE catalog_search MATCH ?
        AND item_type IN (${typeFilter})
      ORDER BY rank
      LIMIT ?
    `;

    const rows = this.db.getDb().prepare(sql).all(query, ...types, limit) as Array<{
      item_type: string;
      item_id: number;
      name: string;
      description: string;
      content_snippet: string;
      rank: number;
    }>;

    return rows.map((row) => ({
      type: row.item_type as CatalogEntryType,
      id: row.item_id,
      name: row.name,
      description: row.description,
      path: '', // Will be populated by caller if needed
      score: -row.rank, // FTS5 rank is negative
      highlights: {
        content: row.content_snippet,
      },
    }));
  }

  /**
   * Search agents
   */
  searchAgents(query: string, limit: number = 20): SearchResult[] {
    const sql = `
      SELECT
        a.id,
        a.name,
        a.description,
        a.file_path,
        snippet(agents_fts, 4, '<mark>', '</mark>', '...', 32) as content_snippet,
        agents_fts.rank
      FROM agents_fts
      JOIN agents a ON a.id = agents_fts.rowid
      WHERE agents_fts MATCH ?
      ORDER BY agents_fts.rank
      LIMIT ?
    `;

    const rows = this.db.getDb().prepare(sql).all(query, limit) as Array<{
      id: number;
      name: string;
      description: string;
      file_path: string;
      content_snippet: string;
      rank: number;
    }>;

    return rows.map((row) => ({
      type: 'agent' as CatalogEntryType,
      id: row.id,
      name: row.name,
      description: row.description,
      path: row.file_path,
      score: -row.rank,
      highlights: {
        content: row.content_snippet,
      },
    }));
  }

  /**
   * Search skills
   */
  searchSkills(query: string, limit: number = 20): SearchResult[] {
    const sql = `
      SELECT
        s.id,
        s.name,
        s.description,
        s.file_path,
        snippet(skills_fts, 3, '<mark>', '</mark>', '...', 32) as content_snippet,
        skills_fts.rank
      FROM skills_fts
      JOIN skills s ON s.id = skills_fts.rowid
      WHERE skills_fts MATCH ?
      ORDER BY skills_fts.rank
      LIMIT ?
    `;

    const rows = this.db.getDb().prepare(sql).all(query, limit) as Array<{
      id: number;
      name: string;
      description: string;
      file_path: string;
      content_snippet: string;
      rank: number;
    }>;

    return rows.map((row) => ({
      type: 'skill' as CatalogEntryType,
      id: row.id,
      name: row.name,
      description: row.description,
      path: row.file_path,
      score: -row.rank,
      highlights: {
        content: row.content_snippet,
      },
    }));
  }

  /**
   * Search processes
   */
  searchProcesses(query: string, limit: number = 20): SearchResult[] {
    const sql = `
      SELECT
        p.id,
        p.process_id,
        p.description,
        p.file_path,
        processes_fts.rank
      FROM processes_fts
      JOIN processes p ON p.id = processes_fts.rowid
      WHERE processes_fts MATCH ?
      ORDER BY processes_fts.rank
      LIMIT ?
    `;

    const rows = this.db.getDb().prepare(sql).all(query, limit) as Array<{
      id: number;
      process_id: string;
      description: string;
      file_path: string;
      rank: number;
    }>;

    return rows.map((row) => ({
      type: 'process' as CatalogEntryType,
      id: row.id,
      name: row.process_id,
      description: row.description,
      path: row.file_path,
      score: -row.rank,
    }));
  }

  // ---------------------------------------------------------------------------
  // Catalog View
  // ---------------------------------------------------------------------------

  /**
   * Get unified catalog entries
   */
  getCatalogEntries(options?: QueryOptions): CatalogEntryView[] | PaginatedResult<CatalogEntryView> {
    // Build the union query
    const sql = `
      SELECT
        'agent' as type,
        a.id,
        a.name,
        a.description,
        a.file_path as path,
        d.name as domain_name,
        s.name as specialization_name,
        a.expertise as tags,
        a.frontmatter as metadata,
        a.created_at,
        a.updated_at
      FROM agents a
      LEFT JOIN domains d ON a.domain_id = d.id
      LEFT JOIN specializations s ON a.specialization_id = s.id

      UNION ALL

      SELECT
        'skill' as type,
        sk.id,
        sk.name,
        sk.description,
        sk.file_path as path,
        d.name as domain_name,
        s.name as specialization_name,
        sk.allowed_tools as tags,
        sk.frontmatter as metadata,
        sk.created_at,
        sk.updated_at
      FROM skills sk
      LEFT JOIN domains d ON sk.domain_id = d.id
      LEFT JOIN specializations s ON sk.specialization_id = s.id

      UNION ALL

      SELECT
        'process' as type,
        p.id,
        p.process_id as name,
        p.description,
        p.file_path as path,
        NULL as domain_name,
        NULL as specialization_name,
        '[]' as tags,
        p.frontmatter as metadata,
        p.created_at,
        p.updated_at
      FROM processes p

      ORDER BY name ASC
    `;

    const rows = this.db.getDb().prepare(sql).all() as Array<{
      type: CatalogEntryType;
      id: number;
      name: string;
      description: string;
      path: string;
      domain_name: string | null;
      specialization_name: string | null;
      tags: string;
      metadata: string;
      created_at: string;
      updated_at: string;
    }>;

    const entries: CatalogEntryView[] = rows.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.description,
      path: row.path,
      domainName: row.domain_name,
      specializationName: row.specialization_name,
      tags: JSON.parse(row.tags || '[]'),
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Apply filtering
    let filtered = entries;
    if (options?.filters) {
      for (const filter of options.filters) {
        filtered = filtered.filter((entry) => {
          const value = (entry as unknown as Record<string, unknown>)[filter.field];
          return applyFilter(value, filter.operator, filter.value);
        });
      }
    }

    // Apply search
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.name.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (options?.sort && options.sort.length > 0) {
      filtered.sort((a, b) => {
        for (const spec of options.sort!) {
          const aVal = (a as unknown as Record<string, unknown>)[spec.field];
          const bVal = (b as unknown as Record<string, unknown>)[spec.field];
          const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
          if (cmp !== 0) {
            return spec.direction === 'desc' ? -cmp : cmp;
          }
        }
        return 0;
      });
    }

    // Apply pagination
    if (options?.pagination) {
      const { page, pageSize } = options.pagination;
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const start = (page - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);

      return {
        data,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    return filtered;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Apply a filter condition to a value
 */
function applyFilter(value: unknown, operator: FilterOperator, filterValue: unknown): boolean {
  switch (operator) {
    case 'eq':
      return value === filterValue;
    case 'ne':
      return value !== filterValue;
    case 'gt':
      return (value as number) > (filterValue as number);
    case 'gte':
      return (value as number) >= (filterValue as number);
    case 'lt':
      return (value as number) < (filterValue as number);
    case 'lte':
      return (value as number) <= (filterValue as number);
    case 'like':
      return String(value ?? '')
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    case 'in':
      return (filterValue as unknown[]).includes(value);
    case 'not_in':
      return !(filterValue as unknown[]).includes(value);
    case 'is_null':
      return value === null || value === undefined;
    case 'is_not_null':
      return value !== null && value !== undefined;
    default:
      return true;
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Create a new CatalogQueries instance
 */
export function createCatalogQueries(db?: CatalogDatabase): CatalogQueries {
  return new CatalogQueries(db);
}

/**
 * Create a new QueryBuilder for a table
 */
export function createQueryBuilder<T>(tableName: string, db?: CatalogDatabase): QueryBuilder<T> {
  const database = db ?? initializeDatabase();
  return new QueryBuilder<T>(database.getDb(), tableName);
}
