import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'v8',
      exclude: [
        ...coverageConfigDefaults.exclude,
        'lib/utils/**',
        'lib/react/**',
      ],
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        perFile: true,
      },
      watermarks: {
        lines: [50, 80],
        functions: [50, 80],
        branches: [50, 80],
        statements: [50, 80],
      },
    },
  },
});
