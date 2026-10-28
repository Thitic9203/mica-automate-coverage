// Visual regression (spec docs/sdd/live-qase-tabs R14). Run: npm-less — see tests/visual/README in the spec.
module.exports = {
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{ext}',
  fullyParallel: false,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', reducedMotion: 'reduce', colorScheme: 'light', deviceScaleFactor: 1 },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0, animations: 'disabled', caret: 'hide' } },
  webServer: { command: 'node tests/visual/serve.cjs', url: 'http://127.0.0.1:4173/', reuseExistingServer: false },
}
