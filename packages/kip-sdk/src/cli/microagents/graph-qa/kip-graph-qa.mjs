#!/usr/bin/env node
/**
 * graph-QA microagent entrypoint (spec kip-graph-qa.md §2/§3). The genty `MicroagentRunner` spawns
 * this executable: it reads a `MicroagentInvocation` from stdin (`{ question, asOf?, k?, repoDir }`),
 * performs READ-ONLY kip retrieval (recall/query/asOf/getNode) over the resolved lens, synthesizes an
 * answer with `runtime.model`, and writes a `{ answer, abstained, citations, usedFacts }` object to
 * stdout (INV-A1: it authors NOTHING; N5: it abstains rather than fabricates).
 *
 * This is the bundled, standalone-binary carrier of the QA manifest (spec §5.1 `discoveryDirs`). The
 * actual retrieval+synthesis wiring binds the read-only kip tool surface over the repo named by
 * `repoDir`; that integration is provided by the deploying host's genty runtime and is out of scope
 * for the CLI acceptance suite (which injects a scripted dispatcher). Absent that host wiring this
 * entrypoint abstains rather than guessing (N5).
 */
import { readFileSync } from "node:fs";

function main() {
  let invocation = {};
  try {
    invocation = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.stderr.write("graph-qa: could not read invocation from stdin\n");
    process.exit(1);
  }
  const input = invocation.input ?? invocation;
  if (!input || typeof input.question !== "string" || input.question.length === 0) {
    process.stderr.write("graph-qa: missing required `question`\n");
    process.exit(1);
  }
  // No host-provided read-only tool surface is bound in this standalone context; abstain (N5) rather
  // than answer from parametric knowledge. A deploying host replaces this with the real
  // retrieval→synthesis pipeline (spec §3).
  const output = {
    answer: "No supporting facts in the knowledge graph.",
    abstained: true,
    citations: [],
    usedFacts: [],
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main();
