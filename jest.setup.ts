import '@testing-library/jest-dom';

// jsdom provides localStorage, but reset it between tests so persistence-backed
// modules (favorites, onboarding, offline queue, LQIP cache) start clean.
beforeEach(() => {
  localStorage.clear();
});
