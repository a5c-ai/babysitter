// Stage 4: EMIT - Write transformed files to output directory

import * as fs from 'fs';
import * as path from 'path';
import type { TransformedFile, EmitResult, Diagnostic } from './types.js';

export function emit(
  outputDir: string,
  files: TransformedFile[],
  dryRun = false
): EmitResult {
  const diagnostics: Diagnostic[] = [];
  const emittedFiles: string[] = [];

  if (!dryRun) {
    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const file of files) {
    const fullPath = path.join(outputDir, file.path);
    const dir = path.dirname(fullPath);

    if (!dryRun) {
      // Create parent directories
      fs.mkdirSync(dir, { recursive: true });

      // Write file
      if (file.binaryContent) {
        fs.writeFileSync(fullPath, file.binaryContent);
      } else {
        fs.writeFileSync(fullPath, file.content, 'utf-8');
      }

      // Make executable if needed
      if (file.executable) {
        try {
          fs.chmodSync(fullPath, 0o755);
        } catch (error) {
          diagnostics.push({
            level: 'warning',
            category: 'compilation',
            message: `Failed to make file executable: ${file.path}`,
            source: fullPath,
          });
        }
      }
    }

    emittedFiles.push(file.path);
  }

  return { emittedFiles, diagnostics };
}
