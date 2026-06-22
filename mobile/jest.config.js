/** @type {import('jest').Config} */
module.exports = {
  // jest-expo wires the React Native / Expo transform, asset mocks and
  // transformIgnorePatterns for the Expo SDK.
  preset: 'jest-expo',
  moduleNameMapper: {
    // Mirror the tsconfig `@/*` path alias.
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
