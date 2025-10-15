export default {
  test: {
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    environment: 'node',
    setupFiles: [],
    // Either remove coverage entirely, or keep it as an object:
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
};
