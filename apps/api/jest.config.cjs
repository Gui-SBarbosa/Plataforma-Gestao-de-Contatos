module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
  moduleFileExtensions: ["cjs", "js", "json"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.cjs"],
};
