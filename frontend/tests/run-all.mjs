// frontend/tests/run-all.mjs
// Single entry point runner for E2E responsive test suite

import { runE2eTests } from './e2e-responsive.test.mjs';

console.log('Starting SkillRock Ambassador Portal E2E Responsive Test Runner...');
const startTime = Date.now();

runE2eTests()
  .then((summary) => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`E2E Test Run Completed in ${elapsedSec}s with ${summary.passed}/${summary.total} tests passing.`);
    if (summary.failed > 0) {
      console.error(`FAILED: ${summary.failed} test(s) failed.`);
      process.exit(1);
    } else {
      console.log('SUCCESS: All tests passed!');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
