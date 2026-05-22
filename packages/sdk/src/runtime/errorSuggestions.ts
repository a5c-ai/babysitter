const COMMAND_TYPOS: Record<string, string[]> = {
  "run:create": ["run:creat", "run:craete", "runcreate", "create:run", "run-create"],
  "run:status": ["run:stat", "run:staus", "runstatus", "status:run", "run-status"],
  "run:iterate": ["run:iter", "run:itterate", "runiterate", "iterate:run", "run-iterate"],
  "run:events": ["run:event", "runevents", "events:run", "run-events"],
  "run:rebuild-state": ["run:rebuild", "run:rebuildstate", "rebuild-state", "run-rebuild-state"],
  "run:repair-journal": ["run:repair", "run:repairjournal", "repair-journal", "run-repair-journal"],
  "task:post": ["task:pst", "taskpost", "post:task", "task-post"],
  "task:list": ["task:lst", "tasklist", "list:task", "task-list", "tasks:list"],
  "task:show": ["task:shw", "taskshow", "show:task", "task-show"],
};

const FLAG_TYPOS: Record<string, string[]> = {
  "--runs-dir": ["--runsdir", "--run-dir", "--rundir", "-runs-dir"],
  "--process-id": ["--processid", "--process_id", "-process-id"],
  "--entry": ["--enrty", "--entyr", "-entry"],
  "--inputs": ["--input", "--inpust", "-inputs"],
  "--json": ["--JSON", "-json", "--jsn"],
  "--dry-run": ["--dryrun", "--dry_run", "-dry-run"],
  "--verbose": ["--verbos", "-verbose", "--vebrose"],
  "--status": ["--staus", "--stats", "-status"],
  "--pending": ["--peding", "-pending"],
};

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function suggestCommand(input: string): string | undefined {
  const normalizedInput = input.toLowerCase().trim();

  for (const [correct, typos] of Object.entries(COMMAND_TYPOS)) {
    if (typos.includes(normalizedInput)) {
      return correct;
    }
  }

  const commands = Object.keys(COMMAND_TYPOS);
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const command of commands) {
    const distance = levenshteinDistance(normalizedInput, command);
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = command;
    }
  }

  return bestMatch;
}

export function suggestFlag(input: string): string | undefined {
  const normalizedInput = input.toLowerCase().trim();

  for (const [correct, typos] of Object.entries(FLAG_TYPOS)) {
    if (typos.includes(normalizedInput)) {
      return correct;
    }
  }

  const flags = Object.keys(FLAG_TYPOS);
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const flag of flags) {
    const distance = levenshteinDistance(normalizedInput, flag);
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = flag;
    }
  }

  return bestMatch;
}

export function suggestFix(input: string, validOptions: string[], maxDistance = 3): string | undefined {
  const normalizedInput = input.toLowerCase().trim();
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const option of validOptions) {
    const distance = levenshteinDistance(normalizedInput, option.toLowerCase());
    if (distance < bestDistance && distance <= maxDistance) {
      bestDistance = distance;
      bestMatch = option;
    }
  }

  return bestMatch;
}
