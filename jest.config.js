module.exports = {
    testEnvironment: 'node',
    reporters: ['default', 'jest-junit'],
    moduleFileExtensions: ['js', 'ts', 'tsx', 'jsx'],
    testMatch: ['**/*.(test|spec).(ts|tsx)'],
    globals: {
        'ts-jest': {
            tsconfig: 'jest.tsconfig.json',
            babelConfig: true,
        },
    },
    modulePathIgnorePatterns: ['/node_modules/'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/config/',
        'health-checker.ts',
        'error.ts',
        '/routes/v1/src',
    ],
    coverageReporters: ['text', 'cobertura'],
    setupFilesAfterEnv: [],
    coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/mocks.js',
        '\\.(css|less|scss)$': '<rootDir>/__mocks__/mocks.js',
    },
    preset: 'ts-jest/presets/js-with-babel',
};
