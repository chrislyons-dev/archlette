export default {
  test: {
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    environment: 'node',
    setupFiles: [],
    // Increased timeout for ts-morph integration tests (parser initialization is slow)
    testTimeout: 20000,
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
};
