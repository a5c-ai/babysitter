import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

/**
 * Approve a pending breakpoint by writing an approval result and posting it via the CLI.
 *
 * 1. Writes an approval result.json into the task directory.
 * 2. Executes `babysitter task:post` to record the EFFECT_RESOLVED journal event.
 * 3. Returns true on success, false on failure.
 */
export async function approveBreakpoint(
  workspaceRoot: string,
  runId: string,
  effectId: string,
): Promise<boolean> {
  const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
  const taskDir = path.join(runsDir, runId, 'tasks', effectId);
  const outputPath = path.join(taskDir, 'output.json');

  try {
    // Ensure task directory exists
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    // Write the approval value
    const approvalPayload = {
      approved: true,
      message: 'Approved via Babysitter Observer (VSCode)',
      approvedAt: new Date().toISOString(),
    };
    fs.writeFileSync(outputPath, JSON.stringify(approvalPayload, null, 2), 'utf-8');

    // Build the relative value path for the CLI
    const relativeValuePath = path.join('tasks', effectId, 'output.json');
    const runDirRelative = path.join('.a5c', 'runs', runId);

    // Execute babysitter task:post
    const result = await new Promise<{ success: boolean; message: string }>((resolve) => {
      const args = [
        'task:post',
        runDirRelative,
        effectId,
        '--status', 'ok',
        '--value', relativeValuePath,
      ];

      const child = cp.spawn('babysitter', args, {
        cwd: workspaceRoot,
        shell: true,
        timeout: 30000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, message: stdout.trim() || 'Breakpoint approved successfully.' });
        } else {
          resolve({
            success: false,
            message: stderr.trim() || stdout.trim() || `Process exited with code ${code}`,
          });
        }
      });

      child.on('error', (err) => {
        resolve({ success: false, message: `Failed to spawn babysitter CLI: ${err.message}` });
      });
    });

    if (result.success) {
      void vscode.window.showInformationMessage(
        `Breakpoint approved: ${effectId.slice(0, 8)}... Run will continue on next iteration.`,
      );
      return true;
    } else {
      // CLI failed -- fall back: write result.json directly so the user can iterate manually
      const resultPath = path.join(taskDir, 'result.json');
      if (!fs.existsSync(resultPath)) {
        const fallbackResult = {
          schemaVersion: '2026.01.results-v1',
          effectId,
          status: 'approved',
          value: approvalPayload,
          resolvedAt: new Date().toISOString(),
        };
        fs.writeFileSync(resultPath, JSON.stringify(fallbackResult, null, 2), 'utf-8');
      }

      void vscode.window.showWarningMessage(
        `CLI post failed (${result.message}). Approval written to disk -- run "babysitter task:post" or iterate manually.`,
      );
      return false;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    void vscode.window.showErrorMessage(`Failed to approve breakpoint: ${msg}`);
    return false;
  }
}
