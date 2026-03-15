/**
 * Live E2E process: real work through babysitter orchestration.
 *
 * Uses metadata (which IS serialized to task.json) to carry work instructions.
 * Three tasks that do actual filesystem work:
 * 1. Agent task: scan SDK source tree
 * 2. Node task: write a report file
 * 3. Agent task: verify the report
 */
const { defineTask } = require('@a5c-ai/babysitter-sdk');

const scanModules = defineTask('scan-modules', (args) => ({
  kind: 'agent',
  title: 'Scan SDK source tree and inventory all top-level modules',
  metadata: {
    work: 'scan-filesystem',
    targetDir: '/app/packages/sdk/src',
    instructions: [
      'List all subdirectories under /app/packages/sdk/src',
      'Count .ts files in each subdirectory',
      'Return JSON: { modules: { dirName: fileCount } }',
    ],
  },
}));

const writeReport = defineTask('write-report', (args) => ({
  kind: 'node',
  title: 'Write module inventory report to disk',
  node: {
    entry: '-e',
    args: [
      `const fs=require('fs'),path=require('path');` +
      `const srcDir='/app/packages/sdk/src';` +
      `const dirs=fs.readdirSync(srcDir,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);` +
      `const inv={};for(const d of dirs){inv[d]=fs.readdirSync(path.join(srcDir,d)).filter(f=>f.endsWith('.ts')).length}` +
      `const report={generatedAt:new Date().toISOString(),sdkPath:srcDir,totalModules:dirs.length,modules:inv,totalFiles:Object.values(inv).reduce((a,b)=>a+b,0)};` +
      `fs.writeFileSync('/tmp/live-e2e/module-report.json',JSON.stringify(report,null,2));` +
      `console.log(JSON.stringify({reportPath:'/tmp/live-e2e/module-report.json',totalModules:report.totalModules,totalFiles:report.totalFiles}))`
    ],
  },
  metadata: {
    work: 'write-file',
    outputPath: '/tmp/live-e2e/module-report.json',
  },
}));

const verifyReport = defineTask('verify-report', (args) => ({
  kind: 'agent',
  title: 'Verify the module report exists, is valid JSON, and has expected fields',
  metadata: {
    work: 'verify-file',
    filePath: '/tmp/live-e2e/module-report.json',
    requiredFields: ['generatedAt', 'sdkPath', 'totalModules', 'modules', 'totalFiles'],
    checks: ['totalModules > 0', 'totalFiles > 0'],
  },
}));

exports.process = async function(inputs, ctx) {
  const inp = inputs || {};
  const scan = await ctx.task(scanModules, {});
  const report = await ctx.task(writeReport, { scan });
  const verification = await ctx.task(verifyReport, { report });
  return { scan, report, verification, allDone: true };
};
