import { defineConfig } from 'vitest/config';

// Tests run in UTC so date-dependent tests mean the same on every machine.
// Tests that need a player's timezone set process.env.TZ themselves.
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env: { TZ: 'UTC' },
  },
});
