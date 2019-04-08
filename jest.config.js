module.exports = {
    rootDir: "test",
    testMatch: ["**/test/**/*.test.(ts|tsx|js|jsx)"],
    verbose: false,
    clearMocks: true,
    resetModules: true,
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/__fixtures__/",
        "/test/",
        "/(__)?mock(s__)?/",
        "/__jest__/",
        ".?.min.js"
    ],
    moduleDirectories: ["node_modules", "src"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    moduleFileExtensions: ["js", "jsx", "json", "ts"]
};
