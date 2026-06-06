/**
 * Command discovery — a registry for slash commands and interactive
 * actions with category-based listing and fuzzy search (UX-011).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommandDefinition {
  name: string;
  description: string;
  category: string;
  aliases?: string[];
  hidden?: boolean;
}

export interface CommandSuggestion {
  command: CommandDefinition;
  score: number;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();

  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------

  /** Register a command. Replaces any existing command with the same name. */
  register(command: CommandDefinition): void {
    this.commands.set(command.name, command);
  }

  /** Unregister a command by name. Returns true if it existed. */
  unregister(name: string): boolean {
    return this.commands.delete(name);
  }

  /** Get a command by exact name or alias. */
  get(name: string): CommandDefinition | undefined {
    const direct = this.commands.get(name);
    if (direct) return direct;

    // Check aliases
    for (const cmd of this.commands.values()) {
      if (cmd.aliases?.includes(name)) return cmd;
    }
    return undefined;
  }

  // -----------------------------------------------------------------------
  // Querying
  // -----------------------------------------------------------------------

  /** List all visible commands, optionally filtered by category. */
  listByCategory(category?: string): CommandDefinition[] {
    const all = [...this.commands.values()].filter((c) => !c.hidden);
    if (category) {
      return all.filter((c) => c.category === category);
    }
    return all;
  }

  /** Return all distinct categories across registered commands. */
  getCategories(): string[] {
    const cats = new Set<string>();
    for (const cmd of this.commands.values()) {
      cats.add(cmd.category);
    }
    return [...cats].sort();
  }

  /** Search commands by a query string matching name, aliases, or description. */
  search(query: string): CommandDefinition[] {
    const lowerQuery = query.toLowerCase();
    return [...this.commands.values()].filter((cmd) => {
      if (cmd.name.toLowerCase().includes(lowerQuery)) return true;
      if (cmd.description.toLowerCase().includes(lowerQuery)) return true;
      if (cmd.aliases?.some((a) => a.toLowerCase().includes(lowerQuery))) return true;
      return false;
    });
  }

  /**
   * Get ranked suggestions for a partial query. Hidden commands are excluded.
   * Results are sorted by descending score.
   */
  getSuggestions(partial: string, limit = 5): CommandSuggestion[] {
    const lowerPartial = partial.toLowerCase();
    const scored: CommandSuggestion[] = [];

    for (const cmd of this.commands.values()) {
      if (cmd.hidden) continue;

      let score = 0;

      // Exact prefix match on name scores highest
      if (cmd.name.toLowerCase().startsWith(lowerPartial)) {
        score += 100;
      } else if (cmd.name.toLowerCase().includes(lowerPartial)) {
        score += 50;
      }

      // Alias match
      if (cmd.aliases?.some((a) => a.toLowerCase().startsWith(lowerPartial))) {
        score += 80;
      }

      // Description match
      if (cmd.description.toLowerCase().includes(lowerPartial)) {
        score += 20;
      }

      if (score > 0) {
        scored.push({ command: cmd, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /** Total number of registered commands. */
  get size(): number {
    return this.commands.size;
  }
}
