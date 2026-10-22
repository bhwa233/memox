import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  modulePathIgnorePatterns: ['<rootDir>/.open-next/', '<rootDir>/.wrangler/'],
};

export default createJestConfig(config);
