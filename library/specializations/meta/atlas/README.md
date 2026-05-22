# `.a5c/processes` graph-completion contract

These process definitions enrich the catalog graph by authoring current graph facts when evidence is sufficient. The active graph must not contain placeholder nodes for incomplete future work.

## Carry-over handoff

When a process cannot safely author a concrete node, edge, or attribute, it records unresolved work in the run/process result rather than writing placeholder graph data.

Carry-over tasks should include:

- `targetNodeKind` or target edge family when known
- `targetIdHint` or `graphPathHint` when known
- `requiredInformation`: missing facts, evidence, or decisions
- `searchedSources`: local paths, commands, URLs, or docs already checked
- `nextAction`: the specific research or modeling step needed

Source, TODO, placeholder, confirm, and verify comments in graph YAML are information-bearing. Do not delete them for cleanliness: either convert them into real graph facts backed by EvidenceSource/Claim records, or preserve the comment and list it as carry-over in the process result.

Run the graph-gap resolution process when carry-over exists. It scans active graph comments and run/process carry-over, researches the missing facts, authors concrete graph subsets in the correct domain directories, and validates. Resolved carry-over is not copied into `graph/` as history.
