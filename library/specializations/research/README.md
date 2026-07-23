# Research Specialization

Processes for systematic research analysis, standards comparison auditing, and extraction verification, plus a flagship end-to-end research-publication pipeline that composes the scanner point-tasks below.

## Processes

- **research-publication-workflow.js** — Flagship end-to-end research pipeline: question framing -> plan -> parallel source gathering (composing the five scanner point-tasks below as lane playbooks) -> adversarial claim verification with re-fetched citations -> cited synthesis -> policy-gated publication. Deepest kip-librarian integration (kind `research`).
- **standards-gap-audit.js** — Generic gap audit process for standards research documents. Audits research/comparison documentation against source extraction text using configurable failure pattern categories.
- **evangelist.js** — Evangelist persona point-task: scans recent project activity (commits, PRs, docs, releases, benchmarks), filters for marketable novelties, and opens an evangelist report issue per item.
- **novelties-scanner.js** — Novelties Scanner persona point-task: detects, analyzes, and reports on novel innovations, emerging trends, and breakthrough developments.
- **patentable-novelties.js** — Patentable Novelties persona point-task: extends the novelties scanner with patent-potential assessment and structured invention disclosures.
- **vendor-researcher.js** — Vendor-researcher persona point-task: discovers candidate vendors, analyses them in parallel against criteria, and produces a comparison and recommendation report.

## Usage

```js
import { process } from './standards-gap-audit.js';

const result = await process({
  documents: [
    { name: 'Comparison Doc', path: '/path/to/comparison.md' },
    { name: 'Engineering Changes', path: '/path/to/changes.md' }
  ],
  extractionFile: '/path/to/extraction.txt',
  extractionDir: '/path/to/extraction/',
  // Optional: custom gap patterns and fix instructions
  gapPatterns: [...],
  fixInstructions: {...},
  domainContext: 'Steel design standard comparison'
}, ctx);
```
