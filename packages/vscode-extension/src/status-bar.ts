import * as vscode from 'vscode';
import { RunCache } from './lib/run-cache';

export class StatusBarController implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private cache: RunCache) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = 'babysitter-runs.focus';
    this.update();
    this.statusBarItem.show();
  }

  update(): void {
    const summary = this.cache.getSummary();
    if (summary.active === 0 && summary.total === 0) {
      this.statusBarItem.hide();
      return;
    }

    let text = '$(beaker) ';
    if (summary.breakpoints > 0) {
      text = '$(warning) ';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else if (summary.active > 0) {
      text = '$(sync~spin) ';
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.backgroundColor = undefined;
    }

    text += `Babysitter: ${summary.active} active`;
    if (summary.breakpoints > 0) { text += ` | ${summary.breakpoints} BP`; }
    if (summary.failed > 0) { text += ` | ${summary.failed} failed`; }

    this.statusBarItem.text = text;
    this.statusBarItem.tooltip = `Babysitter Observer\n${summary.total} total | ${summary.active} active | ${summary.completed} done | ${summary.failed} failed`;
    this.statusBarItem.show();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
