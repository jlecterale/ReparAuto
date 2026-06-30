import type { Config } from 'jest';
import nextJest from 'next/jest.js';

// next/jest wires up the SWC transform, the `@/` path alias (from tsconfig),
// CSS/asset stubs and `.env` loading so tests run the same way the app builds.
const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Only run our own tests — never the separate mobile/ app or node_modules.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/mobile/', '<rootDir>/functions/', '<rootDir>/.next/'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.d.ts',
  ],
};

export default createJestConfig(config);
