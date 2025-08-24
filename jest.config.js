/**
 * @file jest.config.js
 * @description Jest configuration file for the project's test environment
 * @version 1.0.0
 */

module.exports = {
  // Basic Configuration
  verbose: true,
  testEnvironment: 'node',
  rootDir: '.',

  // Code Coverage Configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test Pattern Configuration
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.git/',
  ],

  // Module Resolution Configuration
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  moduleNameMapper: {
    // Add module name mappings for aliases or static assets if needed
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Transform Configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Setup and Teardown Configuration
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',

  // Performance and Runtime Configuration
  maxWorkers: '50%',
  timers: 'modern',
  testTimeout: 10000,

  // Reporting Configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './reports/junit',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // Error Handling and Debugging
  bail: 1,
  detectOpenHandles: true,
  errorOnDeprecated: true,

  // Watch Configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Custom Environment Variables
  globals: {
    __DEV__: true,
    NODE_ENV: 'test',
  },

  // Snapshot Configuration
  snapshotSerializers: ['jest-serializer-path'],
  snapshotFormat: {
    printBasicPrototype: false,
    escapeString: true,
  },
};