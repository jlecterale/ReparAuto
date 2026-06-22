const nextJest = require('next/jest');

// Loads next.config + .env files and wires the SWC transform for the web app.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Mirror the tsconfig `@/*` path alias.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // The mobile app and Cloud Functions have their own Jest projects.
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/mobile/',
    '<rootDir>/functions/',
  ],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    // Boundary modules (Firebase SDK init / I/O) are integration-tested, not unit-covered.
    '!src/lib/firebase*.ts',
    '!src/lib/db*.ts',
    '!src/lib/fcm.ts',
    '!**/*.d.ts',
  ],
};

module.exports = createJestConfig(config);
