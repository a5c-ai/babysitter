import { describe, it, expect } from 'vitest';
import { createLogger } from '../src/logger.js';

describe('Pino Logger Wrapper', () => {
  it('should preserve enhanced methods in child loggers', () => {
    // Explicitly disable pretty to avoid worker thread issues in vitest
    const rootLogger = createLogger({ pretty: false });
    expect(rootLogger.runStart).toBeDefined();
    expect(typeof rootLogger.runStart).toBe('function');
    
    const childLogger = rootLogger.child({ component: 'test' });
    expect(childLogger.runStart).toBeDefined();
    expect(typeof childLogger.runStart).toBe('function');
    
    // Verify it's actually working
    expect(childLogger.info).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
  });
});
