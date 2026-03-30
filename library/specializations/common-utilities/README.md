# Common Utilities

Reusable task definitions and utility functions for composing babysitter processes.

## Modules

### docx-conversion

A shared HTML-to-DOCX conversion task using pandoc with graceful fallback.

**Usage:**
```javascript
import { convertToDocxTask } from '../common-utilities/index.js';

// In your process:
const result = await ctx.task(convertToDocxTask, {
  htmlPath: '/path/to/input.html',
  docxPath: '/path/to/output.docx'
});
// result: { success: true, path: '...', converter: 'pandoc' }
// or:     { success: false, path: '...', reason: 'pandoc not installed', converter: 'none' }
```

### parallel-combinator

Utility functions for parallel task execution with fan-out/fan-in patterns.

**fanOutFanIn** - Run multiple tasks in parallel with shared input:
```javascript
import { fanOutFanIn } from '../common-utilities/index.js';

const [strengths, weaknesses] = await fanOutFanIn(ctx, { essay, analysis }, [
  { task: evaluateStrengthsTask },
  { task: evaluateWeaknessesTask }
]);
```

**pipeline** - Sequential phases with optional parallel steps:
```javascript
import { pipeline } from '../common-utilities/index.js';

const result = await pipeline(ctx, { essay }, [
  { task: analyzeTask, key: 'analysis' },
  [
    { task: strengthsTask, key: 'strengths' },
    { task: weaknessesTask, key: 'weaknesses' }
  ],
  { task: synthesizeTask, key: 'document' }
]);
```

## Origin

These utilities were extracted from a retrospective analysis of essay-critique, extract-oral-prep, and essay-grading processes where identical patterns were duplicated across multiple files.
