/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/application/validator.ts',
    'src/application/services/candidateService.ts',
    'src/domain/models/Candidate.ts',
    'src/domain/models/Education.ts',
    'src/domain/models/WorkExperience.ts',
    'src/domain/models/Resume.ts',
  ],
  coverageDirectory: 'coverage',
};
