import { describe, it, expect } from 'vitest';
import { createSessionTree, addMessage, bookmarkNode } from './tree.js';
import { exportToHtml, exportToMarkdown } from './export.js';

describe('session/export', () => {
  it('exports to HTML with messages', () => {
    const tree = createSessionTree();
    addMessage(tree, 'user', 'What is 2+2?');
    addMessage(tree, 'assistant', 'The answer is 4.');
    const html = exportToHtml(tree);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('What is 2+2?');
    expect(html).toContain('The answer is 4.');
    expect(html).toContain('class="message user"');
    expect(html).toContain('class="message assistant"');
  });

  it('escapes HTML in content', () => {
    const tree = createSessionTree();
    addMessage(tree, 'user', '<script>alert("xss")</script>');
    const html = exportToHtml(tree);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes bookmarks in HTML export', () => {
    const tree = createSessionTree();
    const m = addMessage(tree, 'user', 'Key moment');
    bookmarkNode(tree, m.id, 'important');
    const html = exportToHtml(tree);
    expect(html).toContain('important');
  });

  it('exports to markdown', () => {
    const tree = createSessionTree();
    addMessage(tree, 'user', 'Hello');
    addMessage(tree, 'assistant', 'World');
    const md = exportToMarkdown(tree);
    expect(md).toContain('### USER');
    expect(md).toContain('### ASSISTANT');
    expect(md).toContain('Hello');
    expect(md).toContain('World');
  });
});
