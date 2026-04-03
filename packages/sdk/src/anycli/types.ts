/**
 * AnyCLI Types
 *
 * Minimal type definitions for the AnyCLI service cache.
 * The agent handles all service discovery, auth resolution, and code
 * generation at runtime -- these types are just persistence infrastructure.
 */

/**
 * Transport type for MCP server communication.
 */
export type AnycliTransport = "stdio" | "http-sse";

/**
 * Cache entry for a service's agent-generated artifacts.
 */
export interface AnycliServiceCache {
  /** Service identifier (e.g. "github", "stripe") */
  service: string;
  /** Agent-defined service definition -- no rigid schema */
  definition: Record<string, unknown>;
  /** Generated module files: filename -> content */
  modules: Record<string, string>;
  /** Cache metadata */
  metadata: {
    /** ISO timestamp when the cache entry was created */
    createdAt: string;
    /** SDK version that generated this cache entry */
    sdkVersion: string;
    /** Hash of the definition for change detection */
    definitionHash: string;
  };
}
