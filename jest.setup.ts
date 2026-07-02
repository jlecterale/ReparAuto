import '@testing-library/jest-dom';
import * as v8 from 'node:v8';

// jest-environment-jsdom doesn't expose structuredClone (needed by
// fake-indexeddb); node:v8 serialization covers the same value types.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(value: T): T => v8.deserialize(v8.serialize(value));
}

// jsdom provides localStorage, but reset it between tests so persistence-backed
// modules (favorites, onboarding, offline queue, LQIP cache) start clean.
beforeEach(() => {
  localStorage.clear();
});
