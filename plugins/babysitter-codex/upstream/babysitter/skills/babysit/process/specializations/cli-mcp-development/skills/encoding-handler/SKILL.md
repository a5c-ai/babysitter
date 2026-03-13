---
name: encoding-handler
description: Handle text encoding across platforms including UTF-8, Windows codepages, and BOM handling.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Encoding Handler

Handle text encoding across platforms.

## Capabilities

- Detect file encoding
- Convert between encodings
- Handle BOM markers
- Configure Windows codepage support
- Normalize text encoding
- Handle encoding errors

## Generated Patterns

```typescript
import { Buffer } from 'buffer';
import iconv from 'iconv-lite';

export function detectBOM(buffer: Buffer): string | null {
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) return 'utf-8';
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) return 'utf-16le';
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) return 'utf-16be';
  return null;
}

export function stripBOM(content: string): string {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

export function decodeBuffer(buffer: Buffer, encoding = 'utf-8'): string {
  const bom = detectBOM(buffer);
  if (bom) {
    return stripBOM(iconv.decode(buffer, bom));
  }
  return iconv.decode(buffer, encoding);
}

export function encodeString(content: string, encoding = 'utf-8', addBOM = false): Buffer {
  const encoded = iconv.encode(content, encoding);
  if (addBOM && encoding.toLowerCase() === 'utf-8') {
    return Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), encoded]);
  }
  return encoded;
}
```

## Target Processes

- cross-platform-cli-compatibility
- cli-output-formatting
- configuration-management-system
