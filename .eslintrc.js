// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: "expo",
  ignorePatterns: ["dist/", ".expo/", "node_modules/", "src/data/bundled/", "__fixtures__/"],
  overrides: [
    {
      // Build-time Node scripts and config — `Buffer`, `__dirname`, `require`.
      files: ["metro.config.js", "babel.config.js", "scripts/**/*.js"],
      env: { node: true },
    },
    {
      files: ["jest.setup.js", "**/*.test.ts", "**/*.test.tsx"],
      env: { jest: true },
    },
    {
      // The service worker runs in a Worker context, not the page: `self`
      // and the Cache Storage API live there, not on `window`.
      files: ["public/sw.js"],
      env: { serviceworker: true },
    },
  ],
};
