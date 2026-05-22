import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import ts from 'typescript';

const root = process.cwd();
const gatewayProtocolPath = path.join(root, 'packages', 'gateway', 'src', 'protocol', 'v1.ts');
const uiProtocolPath = path.join(root, 'packages', 'ui', 'src', 'protocol', 'v1.ts');

function normalizedAst(sourceText: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const printer = ts.createPrinter({ removeComments: true });
  return printer.printFile(sourceFile).replace(/\s+/g, ' ').trim();
}

async function main(): Promise<void> {
  const [gatewaySource, uiSource] = await Promise.all([
    fs.readFile(gatewayProtocolPath, 'utf8'),
    fs.readFile(uiProtocolPath, 'utf8'),
  ]);

  if (normalizedAst(gatewaySource, gatewayProtocolPath) !== normalizedAst(uiSource, uiProtocolPath)) {
    process.stderr.write('Protocol drift detected between gateway and ui copies.\n');
    process.exitCode = 1;
    return;
  }

  process.stdout.write('Protocol copies are in sync.\n');
}

void main();
