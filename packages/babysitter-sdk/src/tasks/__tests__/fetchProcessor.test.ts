import { describe, it, expect } from 'vitest';
import {
  processHtmlContent,
  truncateContent,
} from '../fetchProcessor';

describe('fetchProcessor', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Page</title>
      <style>body { color: red; }</style>
    </head>
    <body>
      <h1>Hello World</h1>
      <p>This is a <a href="https://example.com">link</a> paragraph.</p>
      <img src="logo.png" alt="Logo">
      <script>console.log('evil');</script>
      <p>Another paragraph with an <a href="/about">about page</a>.</p>
    </body>
    </html>
  `;

  // -------------------------------------------------------------------------
  // processHtmlContent
  // -------------------------------------------------------------------------

  describe('processHtmlContent', () => {
    it('extracts text content', () => {
      const result = processHtmlContent(sampleHtml);
      expect(result.text).toContain('Hello World');
      expect(result.text).toContain('This is a');
      expect(result.text).toContain('paragraph');
    });

    it('extracts title', () => {
      const result = processHtmlContent(sampleHtml);
      expect(result.title).toBe('Test Page');
    });

    it('extracts links', () => {
      const result = processHtmlContent(sampleHtml);
      expect(result.links).toHaveLength(2);
      expect(result.links[0]).toEqual({ href: 'https://example.com', text: 'link' });
      expect(result.links[1]).toEqual({ href: '/about', text: 'about page' });
    });

    it('extracts images', () => {
      const result = processHtmlContent(sampleHtml);
      expect(result.images).toHaveLength(1);
      expect(result.images[0]).toEqual({ src: 'logo.png', alt: 'Logo' });
    });

    it('removes script content by default', () => {
      const result = processHtmlContent(sampleHtml);
      expect(result.text).not.toContain('evil');
    });

    it('removes style content by default', () => {
      const result = processHtmlContent(sampleHtml);
      expect(result.text).not.toContain('color: red');
    });

    it('preserves scripts when removeScripts is false', () => {
      const result = processHtmlContent(sampleHtml, { removeScripts: false });
      expect(result.text).toContain('evil');
    });

    it('truncates when maxLength is set', () => {
      const result = processHtmlContent(sampleHtml, { maxLength: 20 });
      expect(result.text.length).toBeLessThanOrEqual(30); // includes " [...]"
    });

    it('includes metadata', () => {
      const result = processHtmlContent(sampleHtml);
      expect(result.metadata.title).toBe('Test Page');
      expect(result.metadata.originalLength).toBeTruthy();
      expect(result.metadata.processedLength).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // truncateContent
  // -------------------------------------------------------------------------

  describe('truncateContent', () => {
    it('returns text as-is when under maxLength', () => {
      expect(truncateContent('short text', 100)).toBe('short text');
    });

    it('truncates at sentence boundary', () => {
      const text = 'First sentence. Second sentence. Third sentence is much longer.';
      const result = truncateContent(text, 40);
      expect(result).toContain('First sentence.');
      expect(result).toContain('[...]');
      expect(result).not.toContain('Third');
    });

    it('falls back to word boundary', () => {
      const text = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10';
      const result = truncateContent(text, 25);
      expect(result).toContain('[...]');
      // Should end at a space boundary
      expect(result).toMatch(/ \[\.\.\.]/);
    });

    it('hard truncates when no good boundary found', () => {
      const text = 'a'.repeat(100);
      const result = truncateContent(text, 30);
      expect(result).toContain('[...]');
    });
  });
});
