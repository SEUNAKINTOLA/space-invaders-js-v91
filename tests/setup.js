/**
 * @file tests/setup.js
 * @description Global test setup and configuration file for the testing environment
 * @version 1.0.0
 */

import { configure } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import 'jest-extended';
import { TextEncoder, TextDecoder } from 'util';
import { setLogger } from '../src/utils/logger';

/**
 * Environment configuration constants
 * @constant {Object}
 */
const TEST_CONFIG = {
  testTimeout: 10000,
  setupTimeout: 5000,
  cleanupTimeout: 3000,
};

/**
 * Mock implementation of window.matchMedia
 * Required for components using media queries in tests
 */
const setupMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Mock implementation of window.IntersectionObserver
 * Required for components using intersection observer in tests
 */
const setupIntersectionObserver = () => {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })),
  });
};

/**
 * Setup global test environment
 * @throws {Error} If setup fails
 */
try {
  // Configure testing library
  configure({
    testIdAttribute: 'data-testid',
    asyncUtilTimeout: TEST_CONFIG.testTimeout,
  });

  // Setup global mocks
  setupMatchMedia();
  setupIntersectionObserver();

  // Setup TextEncoder/TextDecoder for Node environment
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }

  // Configure custom test environment settings
  beforeAll(async () => {
    // Suppress console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Setup test logger
    setLogger({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    });

    // Set default timeout for all tests
    jest.setTimeout(TEST_CONFIG.testTimeout);
  });

  // Cleanup after all tests
  afterAll(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // Reset mocks between each test
  afterEach(() => {
    jest.clearAllTimers();
  });

} catch (error) {
  console.error('Failed to setup test environment:', error);
  throw new Error(`Test setup failed: ${error.message}`);
}

/**
 * Custom test helpers
 */
export const testUtils = {
  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a mock response object
   * @param {Object} data - Response data
   * @param {number} status - HTTP status code
   * @returns {Object} Mock response object
   */
  createMockResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  }),
};

/**
 * Custom test matchers
 */
expect.extend({
  /**
   * Custom matcher to check if a value is a valid date
   * @param {*} received - Value to check
   * @returns {Object} Matcher result
   */
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received);
    return {
      pass,
      message: () => 
        pass
          ? `Expected ${received} not to be a valid date`
          : `Expected ${received} to be a valid date`,
    };
  },
});

export default testUtils;