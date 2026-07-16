import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for use in Vitest (Node environment).
 *
 * Usage in tests:
 *
 *   import { server } from '@/test/mocks/server';
 *
 *   beforeAll(() => server.listen());
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 *
 * Or import the setup in vitest.config.ts setupFiles for global availability.
 */
export const server = setupServer(...handlers);
