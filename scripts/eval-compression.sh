#!/usr/bin/env bash
# eval-compression.sh — Evaluate token compression against Claude session logs
#
# Usage:
#   bash scripts/eval-compression.sh [--input <path>] [--discover] [--out <file>]
#
# Runs open-thetokenco eval:logs tooling (scripts/eval-conversation-jsonl.mjs)
# against ~/.claude/projects/ session logs, writes results to
# .a5c/token-evals/eval-<timestamp>.json, and prints summary stats.
#
# Environment overrides:
#   TOKEN_EVAL_INPUT      Override scan roots (colon-separated paths)
#   TOKEN_EVAL_OUT        Override output file path
#   TOKENCO_REPO          Path to open-thetokenco repo (default: sibling dir)

set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve paths
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# open-thetokenco repo — look for sibling directory by default
TOKENCO_REPO="${TOKENCO_REPO:-$(cd "$REPO_ROOT/../open-thetokenco" 2>/dev/null && pwd || true)}"

EVAL_SCRIPT=""
if [[ -n "$TOKENCO_REPO" && -f "$TOKENCO_REPO/scripts/eval-conversation-jsonl.mjs" ]]; then
  EVAL_SCRIPT="$TOKENCO_REPO/scripts/eval-conversation-jsonl.mjs"
elif [[ -f "$REPO_ROOT/../open-thetokenco/scripts/eval-conversation-jsonl.mjs" ]]; then
  EVAL_SCRIPT="$REPO_ROOT/../open-thetokenco/scripts/eval-conversation-jsonl.mjs"
fi

# Output directory
EVALS_DIR="$REPO_ROOT/.a5c/token-evals"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEFAULT_OUT="$EVALS_DIR/eval-$TIMESTAMP.json"
OUT_FILE="${TOKEN_EVAL_OUT:-$DEFAULT_OUT}"

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------

EXTRA_ARGS=()
DISCOVER_FLAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      EXTRA_ARGS+=(--input "$2")
      shift 2
      ;;
    --discover)
      DISCOVER_FLAG="--discover"
      shift
      ;;
    --out)
      OUT_FILE="$2"
      shift 2
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Determine scan roots
# ---------------------------------------------------------------------------

# Default: ~/.claude/projects (Claude Code session storage)
DEFAULT_INPUT="$HOME/.claude/projects"

if [[ -n "${TOKEN_EVAL_INPUT:-}" ]]; then
  # Colon-separated paths from env
  IFS=':' read -ra INPUT_PATHS <<< "$TOKEN_EVAL_INPUT"
  for p in "${INPUT_PATHS[@]}"; do
    EXTRA_ARGS+=(--input "$p")
  done
elif [[ ${#EXTRA_ARGS[@]} -eq 0 || ! " ${EXTRA_ARGS[*]} " =~ " --input " ]]; then
  # No --input provided; use default if it exists
  if [[ -d "$DEFAULT_INPUT" ]]; then
    EXTRA_ARGS+=(--input "$DEFAULT_INPUT")
  else
    echo "[eval-compression] WARNING: $DEFAULT_INPUT does not exist, using --discover mode" >&2
    DISCOVER_FLAG="--discover"
  fi
fi

# ---------------------------------------------------------------------------
# Ensure output directory exists
# ---------------------------------------------------------------------------

mkdir -p "$(dirname "$OUT_FILE")"

# ---------------------------------------------------------------------------
# Check for Node.js
# ---------------------------------------------------------------------------

if ! command -v node &>/dev/null; then
  echo "[eval-compression] ERROR: node is not in PATH" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Run evaluation
# ---------------------------------------------------------------------------

if [[ -n "$EVAL_SCRIPT" ]]; then
  echo "[eval-compression] Using eval script: $EVAL_SCRIPT" >&2
  echo "[eval-compression] Output: $OUT_FILE" >&2
  echo "[eval-compression] Running..." >&2

  node "$EVAL_SCRIPT" \
    ${DISCOVER_FLAG:+$DISCOVER_FLAG} \
    "${EXTRA_ARGS[@]}" \
    --out "$OUT_FILE"

else
  # Fallback: run token-compression.mjs directly as a benchmark
  COMPRESSION_MJS=""
  if [[ -n "$TOKENCO_REPO" && -f "$TOKENCO_REPO/src/token-compression.mjs" ]]; then
    COMPRESSION_MJS="$TOKENCO_REPO/src/token-compression.mjs"
  fi

  if [[ -z "$COMPRESSION_MJS" ]]; then
    echo "[eval-compression] ERROR: Could not find open-thetokenco eval tooling." >&2
    echo "  Expected: $REPO_ROOT/../open-thetokenco/scripts/eval-conversation-jsonl.mjs" >&2
    echo "  Set TOKENCO_REPO env var to point to the open-thetokenco repository." >&2
    echo "  e.g. TOKENCO_REPO=/path/to/open-thetokenco bash scripts/eval-compression.sh" >&2
    exit 1
  fi

  echo "[eval-compression] eval-conversation-jsonl.mjs not found; running inline benchmark via token-compression.mjs" >&2
  echo "[eval-compression] Output: $OUT_FILE" >&2

  # Find session log files to process
  SESSION_FILES=()
  for dir_arg in "${EXTRA_ARGS[@]}"; do
    [[ "$dir_arg" == "--input" ]] && continue
    if [[ -d "$dir_arg" ]]; then
      while IFS= read -r -d '' f; do
        SESSION_FILES+=("$f")
      done < <(find "$dir_arg" -maxdepth 4 \( -name "*.jsonl" -o -name "*.json" \) -print0 2>/dev/null | head -c 524288)
    fi
  done

  if [[ ${#SESSION_FILES[@]} -eq 0 ]]; then
    echo "[eval-compression] WARNING: No session files found. Writing empty result." >&2
    cat > "$OUT_FILE" <<JSON
{
  "evalTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mode": "fallback-inline",
  "scanRoots": [],
  "filesProcessed": 0,
  "results": [],
  "summary": {
    "totalFiles": 0,
    "totalOriginalTokens": 0,
    "totalCompressedTokens": 0,
    "totalTokensSaved": 0,
    "overallReductionPct": 0
  }
}
JSON
  else
    # Build a small inline Node script that imports token-compression.mjs and processes files
    node --input-type=module <<NODESCRIPT
import { readFile } from 'node:fs/promises';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { compressContext, estimateTokens } from '${COMPRESSION_MJS}';

const files = ${SESSION_FILES[@]+"$(printf '%s\n' "${SESSION_FILES[@]}" | head -30 | jq -R . | jq -s .)"};;
const results = [];
let totalOrig = 0, totalComp = 0;

for (const f of files.slice(0, 30)) {
  try {
    const text = await readFile(f, 'utf8');
    const orig = estimateTokens(text);
    if (orig < 80) continue;
    const compressed = compressContext(text, { targetReduction: 0.45 });
    const comp = estimateTokens(compressed);
    totalOrig += orig;
    totalComp += comp;
    results.push({ file: f, originalTokens: orig, compressedTokens: comp, tokensSaved: orig - comp, reductionPct: orig > 0 ? ((orig - comp) / orig * 100) : 0 });
  } catch {}
}

const saved = totalOrig - totalComp;
const reductionPct = totalOrig > 0 ? (saved / totalOrig * 100) : 0;
const out = {
  evalTimestamp: new Date().toISOString(),
  mode: 'fallback-inline',
  filesProcessed: results.length,
  results,
  summary: {
    totalFiles: results.length,
    totalOriginalTokens: totalOrig,
    totalCompressedTokens: totalComp,
    totalTokensSaved: saved,
    overallReductionPct: reductionPct,
  },
};

await mkdir(path.dirname('${OUT_FILE}'), { recursive: true });
await writeFile('${OUT_FILE}', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary));
NODESCRIPT
  fi
fi

# ---------------------------------------------------------------------------
# Print summary
# ---------------------------------------------------------------------------

echo "" >&2
echo "[eval-compression] Results written to: $OUT_FILE" >&2

if [[ -f "$OUT_FILE" ]]; then
  echo "" >&2
  echo "=== Summary ===" >&2

  # Use node to parse and print summary (avoids jq dependency)
  node --input-type=module <<SUMMARY
import { readFile } from 'node:fs/promises';
const raw = await readFile('${OUT_FILE}', 'utf8');
const data = JSON.parse(raw);
const s = data.summary ?? {};

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : '--');
const fmtPct = (n) => (typeof n === 'number' ? n.toFixed(1) + '%' : '--');

console.error('  Files processed:     ' + fmt(s.totalFiles ?? data.filesProcessed));
console.error('  Original tokens:     ' + fmt(s.totalOriginalTokens));
console.error('  Compressed tokens:   ' + fmt(s.totalCompressedTokens));
console.error('  Tokens saved:        ' + fmt(s.totalTokensSaved));
console.error('  Reduction:           ' + fmtPct(s.overallReductionPct));
if (data.evalTimestamp) {
  console.error('  Eval timestamp:      ' + data.evalTimestamp);
}
SUMMARY
fi

echo "" >&2
echo "[eval-compression] Done." >&2
