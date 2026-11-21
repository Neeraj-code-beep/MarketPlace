export default {
  // Run tests in Node.js rather than a browser environment
  testEnvironment: 'node',

  // Only discover test files inside the tests directory
  testMatch: ['<rootDir>/tests/**/*.test.js'],

  // Run this setup file before executing test suites
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],

  // Clear mock calls between tests
  clearMocks: true,

  // Restore mocked implementations after each test
  restoreMocks: true,
};
