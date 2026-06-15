import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { deserializeTree } from '@a5c-ai/genty-runtime/session/tree';
import { exportToHtml, exportToMarkdown } from '@a5c-ai/genty-runtime/session/export';

export interface SessionExportArgs {
  treePath: string;
  format: 'html' | 'markdown';
  branchId?: string;
  output?: string;
  json: boolean;
}

export async function handleSessionExport(args: SessionExportArgs): Promise<number> {
  if (!existsSync(args.treePath)) {
    const msg = `Session tree not found: ${args.treePath}`;
    if (args.json) {
      console.log(JSON.stringify({ error: msg }));
    } else {
      process.stderr.write(`Error: ${msg}\n`);
    }
    return 1;
  }

  const treeJson = readFileSync(args.treePath, 'utf8');
  const tree = deserializeTree(treeJson);

  const content = args.format === 'html'
    ? exportToHtml(tree, args.branchId)
    : exportToMarkdown(tree, args.branchId);

  if (args.output) {
    writeFileSync(args.output, content, 'utf8');
    if (args.json) {
      console.log(JSON.stringify({ ok: true, outputPath: args.output, format: args.format }));
    } else {
      process.stderr.write(`Exported to ${args.output}\n`);
    }
  } else {
    process.stdout.write(content);
  }

  return 0;
}
