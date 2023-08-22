module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    modulePathIgnorePatterns: [
        "<rootDir>/build"
    ],
    moduleNameMapper: {
        "^uuid$": require.resolve('uuid'),
    },
};