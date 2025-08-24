/**
 * @file .eslintrc.js
 * @description ESLint configuration for production-grade JavaScript/TypeScript projects
 * @version 1.0.0
 * 
 * This configuration:
 * - Enforces strict TypeScript rules
 * - Implements security best practices
 * - Ensures consistent code style
 * - Prevents common errors
 * - Optimizes for modern JavaScript features
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2024: true, // Latest ECMAScript features
    jest: true,    // Jest testing environment
  },
  
  // Parser configuration for modern JavaScript and TypeScript
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },

  // Essential plugin extensions
  plugins: [
    '@typescript-eslint',
    'security',
    'jest',
    'import',
    'prettier',
    'sonarjs',
  ],

  // Extended configurations
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:security/recommended',
    'plugin:jest/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:sonarjs/recommended',
    'plugin:prettier/recommended',
  ],

  // Custom rules configuration
  rules: {
    // Error Prevention
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Using TypeScript's checker instead
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],

    // Code Quality
    'complexity': ['error', { max: 10 }],
    'max-lines-per-function': ['error', { max: 50 }],
    'sonarjs/cognitive-complexity': ['error', 15],
    'max-depth': ['error', 4],

    // Modern JavaScript Features
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',

    // TypeScript Specific
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',

    // Import Rules
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc' }
    }],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',

    // Security
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',

    // Testing
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/valid-expect': 'error',
    'jest/prefer-expect-assertions': 'error',
  },

  // Override configurations for specific file patterns
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off',
      },
    },
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],

  // Settings for various plugins
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
    jest: {
      version: 'detect',
    },
  },
};