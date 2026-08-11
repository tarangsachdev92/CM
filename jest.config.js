module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy',
        '\\.(svg|png|jpg|jpeg|gif|webp|ico)$': '<rootDir>/__mocks__/fileMock.js',
    },
    transformIgnorePatterns: ['node_modules'],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
    // TypeScript and JavaScript file (.ts, .tsx, .js and .jsx) will be handled by ts-jest.
    preset: 'ts-jest/presets/js-with-ts',
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.tsx',
        '!src/bootstrap.tsx',
        '!src/reportWebVitals.ts',
        '!src/**/*.stories.{ts,tsx}',
    ],
};
