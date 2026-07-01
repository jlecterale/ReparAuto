import type { Config } from 'jest';
import nextJest from 'next/jest.js';

// next/jest wires up the SWC transform, the `@/` path alias (from tsconfig),
// CSS/asset stubs and `.env` loading so tests run the same way the app builds.
const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Only run our own tests — never the separate mobile/ app or node_modules.
  // functions/src pure logic (matching, prefs) IS covered by this suite;
  // its build output and deps are not.
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/mobile/',
    '<rootDir>/functions/node_modules/',
    '<rootDir>/functions/lib/',
    '<rootDir>/.next/',
  ],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    // Mirror the tsconfig "@/*" alias for tests that import app modules.
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.d.ts',
  ],
};

export default createJestConfig(config);
