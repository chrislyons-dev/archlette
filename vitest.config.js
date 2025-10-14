export default {
  test: {
    include: ['tests/**/*.spec.js'],
    environment: 'node',
    setupFiles: [],
    // Either remove coverage entirely, or keep it as an object:
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
};
