# Research Specialization

Processes for systematic research analysis, standards comparison auditing, and extraction verification.

## Processes

- **standards-gap-audit.js** — Generic gap audit process for standards research documents. Audits research/comparison documentation against source extraction text using configurable failure pattern categories.

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
